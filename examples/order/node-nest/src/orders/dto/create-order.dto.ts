import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({
    description: "The ID of the customer placing the order",
    example: "customer-123",
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: "List of item IDs in the order",
    example: ["item-1", "item-2"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  items: string[];
}
