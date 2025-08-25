import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from cloudevents.http import CloudEvent
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)


class EventService:
    """Service for publishing CloudEvents."""
    
    def __init__(self):
        self.service_name = "orders"
        self.service_version = "1.0.0"
    
    def create_cloud_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        subject: Optional[str] = None
    ) -> CloudEvent:
        """Create a CloudEvent with standard headers."""
        
        attributes = {
            "type": event_type,
            "source": f"urn:service:{self.service_name}",
            "specversion": "1.0",
            "id": str(uuid.uuid4()),
            "time": datetime.now(timezone.utc).isoformat(),
            "datacontenttype": "application/json"
        }
        
        if subject:
            attributes["subject"] = subject
            
        return CloudEvent(attributes, data)
    
    def publish_event(self, event: CloudEvent) -> None:
        """Publish a CloudEvent. In production, this would send to a message broker."""
        
        # For development/testing, we'll log the event
        # In production, replace this with actual message broker publishing
        
        event_dict = {
            "specversion": event["specversion"],
            "type": event["type"], 
            "source": event["source"],
            "id": event["id"],
            "time": event["time"],
            "datacontenttype": event.get("datacontenttype"),
            "subject": event.get("subject"),
            "data": event.data
        }
        
        logger.info(
            "CloudEvent published",
            event_type=event["type"],
            event_id=event["id"],
            subject=event.get("subject"),
            event=json.dumps(event_dict, default=str)
        )
    
    def publish_order_created(self, order_id: str, customer_id: str, items: list, status: str = "pending") -> None:
        """Publish order.created event."""
        
        data = {
            "id": order_id,
            "customerId": customer_id,
            "items": items,
            "status": status
        }
        
        event = self.create_cloud_event(
            event_type="order.created",
            data=data,
            subject=f"orders/{order_id}"
        )
        
        self.publish_event(event)
        logger.info("Order created event published", order_id=order_id, customer_id=customer_id)
    
    def publish_order_updated(
        self, 
        order_id: str, 
        status: str, 
        previous_status: Optional[str] = None
    ) -> None:
        """Publish order.updated event."""
        
        data = {
            "id": order_id,
            "status": status
        }
        
        if previous_status:
            data["previousStatus"] = previous_status
            
        event = self.create_cloud_event(
            event_type="order.updated",
            data=data,
            subject=f"orders/{order_id}"
        )
        
        self.publish_event(event)
        logger.info("Order updated event published", order_id=order_id, status=status, previous_status=previous_status)


# Global event service instance
event_service = EventService()
