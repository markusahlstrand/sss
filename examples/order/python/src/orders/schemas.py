from typing import List, Optional
from pydantic import BaseModel, Field, validator
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"


class OrderCreate(BaseModel):
    """Schema for creating a new order."""
    customerId: str = Field(..., min_length=1, description="ID of the customer placing the order")
    items: List[str] = Field(..., min_items=1, description="List of item IDs in the order")

    @validator('customerId')
    def validate_customer_id(cls, v):
        if not v or not v.strip():
            raise ValueError('customerId should not be empty')
        return v.strip()

    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('items must contain at least 1 elements')
        # Filter out empty items
        filtered_items = [item.strip() for item in v if item and item.strip()]
        if not filtered_items:
            raise ValueError('items must contain at least 1 valid elements')
        return filtered_items


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    status: OrderStatus = Field(..., description="New status of the order")


class Order(BaseModel):
    """Schema for order response."""
    id: str = Field(..., description="Unique order identifier")
    status: OrderStatus = Field(..., description="Current status of the order")
    customerId: str = Field(..., description="ID of the customer who placed the order")
    items: List[str] = Field(..., description="List of item IDs in the order")


class OrderList(BaseModel):
    """Schema for paginated order list."""
    items: List[Order] = Field(..., description="List of orders")
    total: int = Field(..., description="Total number of orders")
    limit: int = Field(..., description="Number of items per page")
    offset: int = Field(..., description="Number of items skipped")
