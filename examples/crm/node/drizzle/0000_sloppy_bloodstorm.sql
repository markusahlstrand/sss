CREATE TABLE `contracts` (
	`vendor_id` text NOT NULL,
	`contract_id` text NOT NULL,
	`product_id` text NOT NULL,
	`terms` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`vendor_id` text NOT NULL,
	`entitlement_id` text NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`purchase_option_id` text NOT NULL,
	`contract_id` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_bundle_items` (
	`vendor_id` text NOT NULL,
	`product_id` text NOT NULL,
	`child_product_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`vendor_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purchase_options` (
	`vendor_id` text NOT NULL,
	`purchase_option_id` text NOT NULL,
	`product_id` text NOT NULL,
	`price` real NOT NULL,
	`billing_cycle` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`vendor_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`profile` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`vendor_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
