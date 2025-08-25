import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
}

export class UpdateOrderDto {
  @ApiProperty({
    description: "The new status of the order",
    enum: OrderStatus,
    example: OrderStatus.PAID,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
