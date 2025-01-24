ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'cashier' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;