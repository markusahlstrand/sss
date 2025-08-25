import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../dto/update-order.dto";

export class Order {
  @ApiProperty({
    description: "Unique identifier for the order",
    example: "order-123",
  })
  id: string;

  @ApiProperty({
    description: "Current status of the order",
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: "The ID of the customer who placed the order",
    example: "customer-123",
  })
  customerId: string;

  @ApiProperty({
    description: "List of item IDs in the order",
    example: ["item-1", "item-2"],
    type: [String],
  })
  items: string[];

  @ApiProperty({
    description: "Timestamp when the order was created",
    example: "2025-08-25T12:34:56Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Timestamp when the order was last updated",
    example: "2025-08-25T12:34:56Z",
  })
  updatedAt: Date;
}
