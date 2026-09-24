CREATE TABLE `piloop_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`toy_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`toy_id`) REFERENCES `piloop_toys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `piloop_toys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`awakened_at` text,
	`genesis_id` text
);
