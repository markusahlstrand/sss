import { z } from 'zod';

export const OrderItemSchema = z.object({
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
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered']),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(OrderItemSchema),
  totalAmount: z.number(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val: string) => Math.max(1, Math.min(100, parseInt(val, 10) || 10))),
  offset: z
    .string()
    .optional()
    .default('0')
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
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ServiceInfo = z.infer<typeof ServiceInfoSchema>;
export type Health = z.infer<typeof HealthSchema>;
export type Problem = z.infer<typeof ProblemSchema>;
