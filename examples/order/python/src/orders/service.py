import uuid
from typing import Dict, List, Optional
from .schemas import Order, OrderCreate, OrderUpdate, OrderStatus
from ..common.errors import NotFoundError, ConflictError
from ..events.event_service import event_service
import structlog

logger = structlog.get_logger(__name__)


class OrderService:
    """Service for managing orders."""
    
    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would be a database
        self._orders: Dict[str, Order] = {}
        logger.info("OrderService initialized")
    
    async def create_order(self, order_data: OrderCreate) -> Order:
        """Create a new order."""
        order_id = str(uuid.uuid4())
        
        order = Order(
            id=order_id,
            status=OrderStatus.PENDING,
            customerId=order_data.customerId,
            items=order_data.items
        )
        
        self._orders[order_id] = order
        
        # Publish order created event
        event_service.publish_order_created(
            order_id=order.id,
            customer_id=order.customerId,
            items=order.items,
            status=order.status.value
        )
        
        logger.info(
            "Order created",
            order_id=order.id,
            customer_id=order.customerId,
            items_count=len(order.items),
            status=order.status
        )
        
        return order
    
    async def get_order(self, order_id: str) -> Order:
        """Get an order by ID."""
        order = self._orders.get(order_id)
        if not order:
            raise NotFoundError(f"Order with ID {order_id} not found")
        
        logger.debug("Order retrieved", order_id=order_id, status=order.status)
        return order
    
    async def update_order(self, order_id: str, update_data: OrderUpdate) -> Order:
        """Update an order's status."""
        order = self._orders.get(order_id)
        if not order:
            raise NotFoundError(f"Order with ID {order_id} not found")
        
        # Validate status transition
        self._validate_status_transition(order.status, update_data.status)
        
        previous_status = order.status
        order.status = update_data.status
        
        # Publish order updated event
        event_service.publish_order_updated(
            order_id=order.id,
            status=order.status.value,
            previous_status=previous_status.value
        )
        
        logger.info(
            "Order status updated",
            order_id=order.id,
            previous_status=previous_status,
            new_status=order.status
        )
        
        return order
    
    async def list_orders(self, limit: int = 10, offset: int = 0) -> tuple[List[Order], int]:
        """List orders with pagination."""
        all_orders = list(self._orders.values())
        total = len(all_orders)
        
        # Sort by creation order (in real app, you'd sort by creation timestamp)
        orders_page = all_orders[offset:offset + limit]
        
        logger.debug(
            "Orders listed",
            total=total,
            limit=limit,
            offset=offset,
            returned=len(orders_page)
        )
        
        return orders_page, total
    
    def _validate_status_transition(self, current_status: OrderStatus, new_status: OrderStatus) -> None:
        """Validate that the status transition is allowed."""
        # Define allowed transitions
        transitions = {
            OrderStatus.PENDING: [OrderStatus.PAID],
            OrderStatus.PAID: [OrderStatus.SHIPPED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: []  # Terminal state
        }
        
        allowed_statuses = transitions.get(current_status, [])
        
        if new_status not in allowed_statuses:
            raise ConflictError(
                f"Cannot update order status from {current_status.value} to {new_status.value}"
            )


# Global service instance
order_service = OrderService()
