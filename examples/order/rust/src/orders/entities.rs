use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Order {
    pub id: String,
    pub customer_id: String,
    pub items: Vec<String>,
    pub status: OrderStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Paid,
    Shipped,
    Delivered,
}

impl Default for OrderStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for OrderStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let status_str = match self {
            OrderStatus::Pending => "pending",
            OrderStatus::Paid => "paid",
            OrderStatus::Shipped => "shipped",
            OrderStatus::Delivered => "delivered",
        };
        write!(f, "{}", status_str)
    }
}
