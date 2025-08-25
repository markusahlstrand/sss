import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseFilters,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { Order } from "./entities/order.entity";
import { ScopesGuard } from "../auth/scopes.guard";
import { Scopes } from "../auth/scopes.decorator";
import { GlobalExceptionFilter } from "../common/filters/global-exception.filter";

@ApiTags("Orders")
@Controller("orders")
@UseGuards(AuthGuard("jwt"), ScopesGuard)
@UseFilters(GlobalExceptionFilter)
@ApiBearerAuth()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Scopes("orders.write")
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({
    status: 201,
    description: "Order created successfully",
    type: Order,
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log(
      `Creating order for customer: ${createOrderDto.customerId}`,
      "OrdersController"
    );
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Scopes("orders.read")
  @ApiOperation({ summary: "List orders with pagination" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of orders to return (max 100)",
    example: 20,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Number of orders to skip",
    example: 0,
  })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    const limitValue = Math.min(limit || 20, 100);
    const offsetValue = offset || 0;

    this.logger.log(
      `Fetching orders with limit: ${limitValue}, offset: ${offsetValue}`,
      "OrdersController"
    );

    return this.ordersService.findAll(limitValue, offsetValue);
  }

  @Get(":id")
  @Scopes("orders.read")
  @ApiOperation({ summary: "Retrieve an order by ID" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Order retrieved successfully",
    type: Order,
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOne(@Param("id") id: string): Promise<Order> {
    this.logger.log(`Fetching order: ${id}`, "OrdersController");
    return this.ordersService.findOne(id);
  }

  @Patch(":id")
  @Scopes("orders.write")
  @ApiOperation({ summary: "Update order status" })
  @ApiParam({ name: "id", description: "Order ID" })
  @ApiResponse({
    status: 200,
    description: "Order updated successfully",
    type: Order,
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async update(
    @Param("id") id: string,
    @Body() updateOrderDto: UpdateOrderDto
  ): Promise<Order> {
    this.logger.log(
      `Updating order: ${id} to status: ${updateOrderDto.status}`,
      "OrdersController"
    );
    return this.ordersService.update(id, updateOrderDto);
  }
}
