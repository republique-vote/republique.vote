PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_poll` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`source_url` text,
	`source_ref` text,
	`merkle_root` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_poll`("id", "title", "description", "type", "status", "start_date", "end_date", "source_url", "source_ref", "merkle_root", "created_at") SELECT "id", "title", "description", "type", "status", "start_date", "end_date", "source_url", "source_ref", "merkle_root", "created_at" FROM `poll`;--> statement-breakpoint
DROP TABLE `poll`;--> statement-breakpoint
ALTER TABLE `__new_poll` RENAME TO `poll`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `vote_record` ADD `sequence` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `vote_record` ADD `hash` text NOT NULL;--> statement-breakpoint
ALTER TABLE `vote_record` ADD `previous_hash` text;