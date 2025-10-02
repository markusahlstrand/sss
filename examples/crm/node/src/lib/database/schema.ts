import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// Vendor table
export const vendors = sqliteTable("vendors", {
  vendorId: text("vendor_id").primaryKey(),
  name: text("name").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, any>>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Product table
export const products = sqliteTable(
  "products",
  {
    vendorId: text("vendor_id").notNull(),
    productId: text("product_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type", {
      enum: ["pass", "article", "podcast", "bundle"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.vendorId, table.productId] }),
  })
);

// Product bundle items table
export const productBundleItems = sqliteTable(
  "product_bundle_items",
  {
    vendorId: text("vendor_id").notNull(),
    productId: text("product_id").notNull(), // The bundle product
    childProductId: text("child_product_id").notNull(), // The included product
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.vendorId, table.productId, table.childProductId],
    }),
  })
);

// Contract table
export const contracts = sqliteTable(
  "contracts",
  {
    vendorId: text("vendor_id").notNull(),
    contractId: text("contract_id").notNull(),
    productId: text("product_id").notNull(),
    terms: text("terms").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.vendorId, table.contractId] }),
  })
);

// Purchase option table
export const purchaseOptions = sqliteTable(
  "purchase_options",
  {
    vendorId: text("vendor_id").notNull(),
    purchaseOptionId: text("purchase_option_id").notNull(),
    productId: text("product_id").notNull(),
    price: real("price").notNull(),
    billingCycle: text("billing_cycle", {
      enum: ["monthly", "yearly", "one-time"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.vendorId, table.purchaseOptionId] }),
  })
);

// User table
export const users = sqliteTable(
  "users",
  {
    vendorId: text("vendor_id").notNull(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    profile: text("profile", { mode: "json" }).$type<Record<string, any>>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.vendorId, table.userId] }),
  })
);

// Entitlement table
export const entitlements = sqliteTable(
  "entitlements",
  {
    vendorId: text("vendor_id").notNull(),
    entitlementId: text("entitlement_id").notNull(),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    purchaseOptionId: text("purchase_option_id").notNull(),
    contractId: text("contract_id"), // nullable
    status: text("status", {
      enum: ["active", "expired", "revoked"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.vendorId, table.entitlementId] }),
  })
);

// Export types for TypeScript
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductBundleItem = typeof productBundleItems.$inferSelect;
export type NewProductBundleItem = typeof productBundleItems.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

export type PurchaseOption = typeof purchaseOptions.$inferSelect;
export type NewPurchaseOption = typeof purchaseOptions.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
