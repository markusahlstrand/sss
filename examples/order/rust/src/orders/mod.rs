use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, patch, post},
    Router,
};
use tracing::instrument;
use utoipa::OpenApi;
use validator::Validate;

use crate::{
    auth::{RequireScopes, Scopes},
    common::errors::{AppError, Problem},
    AppState,
};

pub mod dto;
pub mod entities;
pub mod service;

pub use dto::*;
pub use entities::*;
pub use service::*;

#[derive(OpenApi)]
#[openapi(
    paths(
        create_order,
        get_order,
        update_order,
        list_orders
    ),
    components(
        schemas(Order, CreateOrderDto, UpdateOrderDto, OrderStatus, Problem)
    ),
    tags(
        (name = "orders", description = "Order management endpoints")
    ),
    info(
        title = "Orders API",
        version = "1.0.0",
        description = "API for managing customer orders"
    ),
    servers(
        (url = "/", description = "Local server")
    )
)]
pub struct OrdersApiDoc;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/orders", post(create_order))
        .route("/orders", get(list_orders))
        .route("/orders/:id", get(get_order))
        .route("/orders/:id", patch(update_order))
}

pub struct OrdersHandler;

impl OrdersHandler {
    #[instrument(skip(state, scopes))]
    pub async fn create_order(
        State(state): State<AppState>,
        scopes: Scopes,
        Json(dto): Json<CreateOrderDto>,
    ) -> Result<impl IntoResponse, AppError> {
        let write_scope_check = RequireScopes::new(["orders.write"]);
        write_scope_check.check(&scopes.0)?;

        dto.validate()?;

        let order = state.orders_service.create_order(dto).await?;
        Ok((StatusCode::CREATED, Json(order)))
    }

    #[instrument(skip(state, scopes))]
    pub async fn get_order(
        State(state): State<AppState>,
        scopes: Scopes,
        Path(id): Path<String>,
    ) -> Result<impl IntoResponse, AppError> {
        let read_scope_check = RequireScopes::new(["orders.read"]);
        read_scope_check.check(&scopes.0)?;

        let order = state.orders_service.get_order(&id).await?;
        Ok(Json(order))
    }

    #[instrument(skip(state, scopes))]
    pub async fn update_order(
        State(state): State<AppState>,
        scopes: Scopes,
        Path(id): Path<String>,
        Json(dto): Json<UpdateOrderDto>,
    ) -> Result<impl IntoResponse, AppError> {
        let write_scope_check = RequireScopes::new(["orders.write"]);
        write_scope_check.check(&scopes.0)?;

        dto.validate()?;

        let order = state.orders_service.update_order(&id, dto).await?;
        Ok(Json(order))
    }

    #[instrument(skip(state, scopes))]
    pub async fn list_orders(
        State(state): State<AppState>,
        scopes: Scopes,
        Query(params): Query<ListOrdersQuery>,
    ) -> Result<impl IntoResponse, AppError> {
        let read_scope_check = RequireScopes::new(["orders.read"]);
        read_scope_check.check(&scopes.0)?;

        let orders = state.orders_service.list_orders(params.limit, params.offset).await?;
        Ok(Json(orders))
    }
}

/// Create a new order
#[utoipa::path(
    post,
    path = "/orders",
    request_body = CreateOrderDto,
    responses(
        (status = 201, description = "Order created successfully", body = Order),
        (status = 400, description = "Invalid input", body = Problem),
        (status = 401, description = "Unauthorized", body = Problem),
        (status = 403, description = "Forbidden", body = Problem)
    ),
    security(
        ("bearerAuth" = ["orders.write"])
    ),
    tag = "orders"
)]
pub async fn create_order(
    state: State<AppState>,
    scopes: Scopes,
    dto: Json<CreateOrderDto>,
) -> Result<impl IntoResponse, AppError> {
    OrdersHandler::create_order(state, scopes, dto).await
}

/// Get an order by ID
#[utoipa::path(
    get,
    path = "/orders/{id}",
    params(
        ("id" = String, Path, description = "Order ID")
    ),
    responses(
        (status = 200, description = "Order found", body = Order),
        (status = 401, description = "Unauthorized", body = Problem),
        (status = 403, description = "Forbidden", body = Problem),
        (status = 404, description = "Order not found", body = Problem)
    ),
    security(
        ("bearerAuth" = ["orders.read"])
    ),
    tag = "orders"
)]
pub async fn get_order(
    state: State<AppState>,
    scopes: Scopes,
    id: Path<String>,
) -> Result<impl IntoResponse, AppError> {
    OrdersHandler::get_order(state, scopes, id).await
}

/// Update an order
#[utoipa::path(
    patch,
    path = "/orders/{id}",
    params(
        ("id" = String, Path, description = "Order ID")
    ),
    request_body = UpdateOrderDto,
    responses(
        (status = 200, description = "Order updated successfully", body = Order),
        (status = 400, description = "Invalid input", body = Problem),
        (status = 401, description = "Unauthorized", body = Problem),
        (status = 403, description = "Forbidden", body = Problem),
        (status = 404, description = "Order not found", body = Problem),
        (status = 409, description = "Conflict", body = Problem)
    ),
    security(
        ("bearerAuth" = ["orders.write"])
    ),
    tag = "orders"
)]
pub async fn update_order(
    state: State<AppState>,
    scopes: Scopes,
    id: Path<String>,
    dto: Json<UpdateOrderDto>,
) -> Result<impl IntoResponse, AppError> {
    OrdersHandler::update_order(state, scopes, id, dto).await
}

/// List orders with pagination
#[utoipa::path(
    get,
    path = "/orders",
    params(
        ("limit" = Option<u32>, Query, description = "Maximum number of orders to return"),
        ("offset" = Option<u32>, Query, description = "Number of orders to skip")
    ),
    responses(
        (status = 200, description = "Orders retrieved successfully", body = Vec<Order>),
        (status = 401, description = "Unauthorized", body = Problem),
        (status = 403, description = "Forbidden", body = Problem)
    ),
    security(
        ("bearerAuth" = ["orders.read"])
    ),
    tag = "orders"
)]
pub async fn list_orders(
    state: State<AppState>,
    scopes: Scopes,
    query: Query<ListOrdersQuery>,
) -> Result<impl IntoResponse, AppError> {
    OrdersHandler::list_orders(state, scopes, query).await
}

#[derive(serde::Deserialize, Debug)]
pub struct ListOrdersQuery {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}
