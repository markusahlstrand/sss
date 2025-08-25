use axum::{
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, request_id::{SetRequestIdLayer, MakeRequestUuid}, trace::TraceLayer};
use tracing::{info, instrument};
use utoipa::OpenApi;

mod auth;
mod common;
mod config;
mod events;
mod health;
mod orders;
mod telemetry;

use auth::AuthLayer;
use config::Config;
use events::EventService;
use orders::OrdersService;

#[derive(Clone)]
pub struct AppState {
    pub orders_service: Arc<OrdersService>,
    pub event_service: Arc<EventService>,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize telemetry
    telemetry::init()?;

    // Load configuration
    let config = Arc::new(Config::from_env()?);
    
    // Initialize services
    let event_service = Arc::new(EventService::new());
    let orders_service = Arc::new(OrdersService::new(event_service.clone()));

    let state = AppState {
        orders_service,
        event_service,
        config: config.clone(),
    };

    // Build OpenAPI spec
    let _api_doc = orders::OrdersApiDoc::openapi();

    // Build router
    let app = Router::new()
        // Service info endpoint
        .route("/", get(service_info))
        .route("/openapi.json", get(openapi_json))
        
        // Health endpoints
        .merge(health::router())
        
        // Orders endpoints
        .merge(orders::router())
        
        .layer(
            ServiceBuilder::new()
                .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive())
                .layer(AuthLayer::new(config.jwt_secret.clone()))
        )
        .with_state(state);

    let port = config.port;
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    
    info!(port = %port, "Starting orders service");
    axum::serve(listener, app).await?;

    Ok(())
}

#[instrument]
async fn service_info() -> impl IntoResponse {
    Json(serde_json::json!({
        "name": "orders",
        "version": "1.0.0"
    }))
}

#[instrument]
async fn openapi_json() -> impl IntoResponse {
    let api_doc = orders::OrdersApiDoc::openapi();
    Json(api_doc)
}
