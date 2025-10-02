import { z } from "zod";

// Common schemas
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const VendorIdSchema = z.object({
  vendorId: z.string().min(1),
});

// Vendor schemas
export const VendorSchema = z.object({
  vendorId: z.string(),
  name: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateVendorSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const ListVendorsResponseSchema = z.object({
  data: z.array(VendorSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// Product schemas
export const ProductTypeSchema = z.enum([
  "pass",
  "article",
  "podcast",
  "bundle",
]);

export const ProductSchema = z.object({
  vendorId: z.string(),
  productId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: ProductTypeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProductSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: ProductTypeSchema,
});

export const ProductParamsSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().min(1),
});

export const ListProductsResponseSchema = z.object({
  data: z.array(ProductSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// Product Bundle Item schemas
export const ProductBundleItemSchema = z.object({
  vendorId: z.string(),
  productId: z.string(),
  childProductId: z.string(),
  createdAt: z.date(),
});

export const CreateProductBundleItemSchema = z.object({
  childProductId: z.string().min(1),
});

// Contract schemas
export const ContractSchema = z.object({
  vendorId: z.string(),
  contractId: z.string(),
  productId: z.string(),
  terms: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateContractSchema = z.object({
  contractId: z.string().min(1),
  productId: z.string().min(1),
  terms: z.string().min(1),
});

export const ContractParamsSchema = z.object({
  vendorId: z.string().min(1),
  contractId: z.string().min(1),
});

// Purchase Option schemas
export const BillingCycleSchema = z.enum(["monthly", "yearly", "one-time"]);

export const PurchaseOptionSchema = z.object({
  vendorId: z.string(),
  purchaseOptionId: z.string(),
  productId: z.string(),
  price: z.number(),
  billingCycle: BillingCycleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreatePurchaseOptionSchema = z.object({
  purchaseOptionId: z.string().min(1),
  productId: z.string().min(1),
  price: z.number().positive(),
  billingCycle: BillingCycleSchema,
});

export const PurchaseOptionParamsSchema = z.object({
  vendorId: z.string().min(1),
  purchaseOptionId: z.string().min(1),
});

// User schemas
export const UserSchema = z.object({
  vendorId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  profile: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  profile: z.record(z.any()).optional(),
});

export const UserParamsSchema = z.object({
  vendorId: z.string().min(1),
  userId: z.string().min(1),
});

// Entitlement schemas
export const EntitlementStatusSchema = z.enum(["active", "expired", "revoked"]);

export const EntitlementSchema = z.object({
  vendorId: z.string(),
  entitlementId: z.string(),
  userId: z.string(),
  productId: z.string(),
  purchaseOptionId: z.string(),
  contractId: z.string().nullable(),
  status: EntitlementStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateEntitlementSchema = z.object({
  entitlementId: z.string().min(1),
  userId: z.string().min(1),
  productId: z.string().min(1),
  purchaseOptionId: z.string().min(1),
  contractId: z.string().optional(),
  status: EntitlementStatusSchema.default("active"),
});

export const EntitlementParamsSchema = z.object({
  vendorId: z.string().min(1),
  entitlementId: z.string().min(1),
});

export const ListEntitlementsResponseSchema = z.object({
  data: z.array(EntitlementSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

// Error schemas for RFC 7807 Problem+JSON
export const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  instance: z.string(),
});

// Service info schema
export const ServiceInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
});
