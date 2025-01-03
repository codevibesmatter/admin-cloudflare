ALTER TABLE users ADD COLUMN clerk_id text;
--> statement-breakpoint
CREATE UNIQUE INDEX users_clerk_id_unique ON users (clerk_id);