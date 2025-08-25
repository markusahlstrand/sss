use chrono::Utc;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;
use tracing::{info, instrument};
use uuid::Uuid;

use crate::{
    common::errors::AppError,
    events::EventService,
};

use super::{CreateOrderDto, Order, OrderStatus, UpdateOrderDto};

#[derive(Clone)]
pub struct OrdersService {
    // In-memory storage for demo purposes
    // In production, this would be a database
    orders: Arc<RwLock<HashMap<String, Order>>>,
    event_service: Arc<EventService>,
}

impl OrdersService {
    pub fn new(event_service: Arc<EventService>) -> Self {
        Self {
            orders: Arc::new(RwLock::new(HashMap::new())),
            event_service,
        }
    }

    #[instrument(skip(self))]
    pub async fn create_order(&self, dto: CreateOrderDto) -> Result<Order, AppError> {
        let now = Utc::now();
        let order = Order {
            id: Uuid::new_v4().to_string(),
            customer_id: dto.customer_id,
            items: dto.items,
            status: OrderStatus::Pending,
            created_at: now,
            updated_at: now,
        };

        // Store the order
        {
            let mut orders = self.orders.write().await;
            orders.insert(order.id.clone(), order.clone());
        }

        // Publish event
        if let Err(e) = self.event_service.publish_order_created(&order).await {
            info!(error = %e, order_id = %order.id, "Failed to publish order created event");
        }

        info!(order_id = %order.id, customer_id = %order.customer_id, "Order created");
        Ok(order)
    }

    #[instrument(skip(self))]
    pub async fn get_order(&self, id: &str) -> Result<Order, AppError> {
        let orders = self.orders.read().await;
        orders
            .get(id)
            .cloned()
            .ok_or(AppError::OrderNotFound)
    }

    #[instrument(skip(self))]
    pub async fn update_order(&self, id: &str, dto: UpdateOrderDto) -> Result<Order, AppError> {
        let mut orders = self.orders.write().await;
        
        let order = orders
            .get_mut(id)
            .ok_or(AppError::OrderNotFound)?;

        let old_status = order.status.clone();
        
        // Update fields if provided
        if let Some(status) = dto.status {
            // Validate status transitions
            match (&order.status, &status) {
                (OrderStatus::Pending, OrderStatus::Paid) => {},
                (OrderStatus::Paid, OrderStatus::Shipped) => {},
                (OrderStatus::Shipped, OrderStatus::Delivered) => {},
                _ => {
                    return Err(AppError::OrderConflict(
                        format!("Invalid status transition from {} to {}", old_status, status)
                    ));
                }
            }
            
            order.status = status;
        }

        order.updated_at = Utc::now();
        let updated_order = order.clone();

        // Release the lock before publishing the event
        drop(orders);

        // Publish event if status changed
        if old_status.to_string() != updated_order.status.to_string() {
            if let Err(e) = self.event_service.publish_order_updated(&updated_order).await {
                info!(error = %e, order_id = %updated_order.id, "Failed to publish order updated event");
            }
        }

        info!(
            order_id = %updated_order.id,
            old_status = %old_status,
            new_status = %updated_order.status,
            "Order updated"
        );

        Ok(updated_order)
    }

    #[instrument(skip(self))]
    pub async fn list_orders(&self, limit: Option<u32>, offset: Option<u32>) -> Result<Vec<Order>, AppError> {
        let orders = self.orders.read().await;
        let mut order_list: Vec<Order> = orders.values().cloned().collect();
        
        // Sort by created_at descending (newest first)
        order_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        // Apply pagination
        let offset = offset.unwrap_or(0) as usize;
        let limit = limit.unwrap_or(10) as usize;

        let result = order_list
            .into_iter()
            .skip(offset)
            .take(limit)
            .collect();

        Ok(result)
    }
}
