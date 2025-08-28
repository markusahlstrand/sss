import { z } from "zod";

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().min(0.01),
});

// API OrderItem schema (for external API responses - no internal IDs)
export const ApiOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().min(0.01),
});

// Database OrderItem schema (includes id and orderId for internal use)
export const DatabaseOrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().min(0.01),
});

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(OrderItemSchema).min(1),
  totalAmount: z.number().min(0.01),
});

export const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered"]),
});

// API Order schema (for external API responses)
export const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(ApiOrderItemSchema),
  totalAmount: z.number(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Database Order schema (matches what we get from the database)
export const DatabaseOrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(DatabaseOrderItemSchema),
  totalAmount: z.number(),
  status: z.enum(["pending", "confirmed", "shipped", "delivered"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val: string) =>
      Math.max(1, Math.min(100, parseInt(val, 10) || 10))
    ),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((val: string) => Math.max(0, parseInt(val, 10) || 0)),
});

export const ServiceInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
});

export const HealthSchema = z.object({
  status: z.string(),
});

export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string(),
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
export type DatabaseOrder = z.infer<typeof DatabaseOrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type ApiOrderItem = z.infer<typeof ApiOrderItemSchema>;
export type DatabaseOrderItem = z.infer<typeof DatabaseOrderItemSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ServiceInfo = z.infer<typeof ServiceInfoSchema>;
export type Health = z.infer<typeof HealthSchema>;
export type Problem = z.infer<typeof ProblemSchema>;
