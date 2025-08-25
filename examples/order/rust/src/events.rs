use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::{info, instrument};
use uuid::Uuid;

use crate::orders::Order;

#[derive(Clone)]
pub struct EventService {
    // In a real implementation, this would publish to a message broker
    // For this example, we'll just log the events
}

impl EventService {
    pub fn new() -> Self {
        Self {}
    }

    #[instrument(skip(self))]
    pub async fn publish_order_created(&self, order: &Order) -> anyhow::Result<()> {
        let event = CloudEventPayload {
            specversion: "1.0".to_string(),
            event_type: "order.created".to_string(),
            source: "orders-service".to_string(),
            id: Uuid::new_v4().to_string(),
            time: Utc::now(),
            data: OrderCreatedPayload {
                id: order.id.clone(),
                customer_id: order.customer_id.clone(),
                items: order.items.clone(),
                status: order.status.to_string(),
                created_at: order.created_at,
            },
        };

        self.publish_event(event).await?;
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn publish_order_updated(&self, order: &Order) -> anyhow::Result<()> {
        let event = CloudEventPayload {
            specversion: "1.0".to_string(),
            event_type: "order.updated".to_string(),
            source: "orders-service".to_string(),
            id: Uuid::new_v4().to_string(),
            time: Utc::now(),
            data: OrderUpdatedPayload {
                id: order.id.clone(),
                customer_id: order.customer_id.clone(),
                status: order.status.to_string(),
                updated_at: order.updated_at,
            },
        };

        self.publish_event(event).await?;
        Ok(())
    }

    #[instrument(skip(self, event))]
    async fn publish_event<T: Serialize>(&self, event: CloudEventPayload<T>) -> anyhow::Result<()> {
        // In a production environment, this would publish to a message broker
        // For this example, we'll just log the event in CloudEvents format
        let json_event = serde_json::to_string_pretty(&event)?;
        info!(event_type = %event.event_type, event_id = %event.id, "Publishing event: {}", json_event);
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CloudEventPayload<T> {
    pub specversion: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub source: String,
    pub id: String,
    pub time: DateTime<Utc>,
    pub data: T,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderCreatedPayload {
    pub id: String,
    pub customer_id: String,
    pub items: Vec<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderUpdatedPayload {
    pub id: String,
    pub customer_id: String,
    pub status: String,
    pub updated_at: DateTime<Utc>,
}
