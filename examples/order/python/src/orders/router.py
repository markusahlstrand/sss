from fastapi import APIRouter, Depends, Query
from typing import List
from .schemas import Order, OrderCreate, OrderUpdate, OrderList
from .service import order_service
from ..auth.auth import require_scopes, TokenData
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=Order, status_code=201)
async def create_order(
    order_data: OrderCreate,
    current_user: TokenData = Depends(require_scopes(["orders.write"]))
) -> Order:
    """Create a new order."""
    logger.info(
        "Creating order",
        customer_id=order_data.customerId,
        items_count=len(order_data.items),
        user=current_user.sub
    )
    
    return await order_service.create_order(order_data)


@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user: TokenData = Depends(require_scopes(["orders.read"]))
) -> Order:
    """Get an order by ID."""
    logger.info("Retrieving order", order_id=order_id, user=current_user.sub)
    
    return await order_service.get_order(order_id)


@router.patch("/{order_id}", response_model=Order)
async def update_order(
    order_id: str,
    update_data: OrderUpdate,
    current_user: TokenData = Depends(require_scopes(["orders.write"]))
) -> Order:
    """Update an order's status."""
    logger.info(
        "Updating order",
        order_id=order_id,
        new_status=update_data.status,
        user=current_user.sub
    )
    
    return await order_service.update_order(order_id, update_data)


@router.get("/", response_model=OrderList)
async def list_orders(
    limit: int = Query(default=10, ge=1, le=100, description="Number of orders to return"),
    offset: int = Query(default=0, ge=0, description="Number of orders to skip"),
    current_user: TokenData = Depends(require_scopes(["orders.read"]))
) -> OrderList:
    """List orders with pagination."""
    logger.info(
        "Listing orders",
        limit=limit,
        offset=offset,
        user=current_user.sub
    )
    
    orders, total = await order_service.list_orders(limit=limit, offset=offset)
    
    return OrderList(
        items=orders,
        total=total,
        limit=limit,
        offset=offset
    )
