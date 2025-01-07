-- Add sync status fields to users table
ALTER TABLE users ADD COLUMN sync_status text CHECK(sync_status IN ('synced', 'pending', 'failed')) NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE users ADD COLUMN last_sync_attempt text;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN sync_error text; 