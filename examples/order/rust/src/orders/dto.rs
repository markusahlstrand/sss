use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

use super::OrderStatus;

#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct CreateOrderDto {
    #[validate(length(min = 1, message = "customerId should not be empty"))]
    #[schema(example = "customer-123")]
    pub customer_id: String,
    
    #[validate(length(min = 1, message = "items must contain at least 1 elements"))]
    #[schema(example = json!(["item-1", "item-2"]))]
    pub items: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Validate, ToSchema)]
pub struct UpdateOrderDto {
    #[schema(example = "paid")]
    pub status: Option<OrderStatus>,
}
