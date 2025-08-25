use axum::{
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use tracing::instrument;

pub fn router() -> Router<crate::AppState> {
    Router::new()
        .route("/healthz", get(liveness))
        .route("/readyz", get(readiness))
}

#[instrument]
async fn liveness() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "ok"})))
}

#[instrument]
async fn readiness() -> impl IntoResponse {
    // In a real implementation, you would check database connections,
    // external service availability, etc.
    (StatusCode::OK, Json(json!({"status": "ready"})))
}
