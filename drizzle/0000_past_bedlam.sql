CREATE TABLE `option` (
	`id` text PRIMARY KEY NOT NULL,
	`scrutin_id` text NOT NULL,
	`label` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`scrutin_id`) REFERENCES `scrutin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrutin` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`start_date` text,
	`end_date` text,
	`source_url` text,
	`source_ref` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vote_record` (
	`id` text PRIMARY KEY NOT NULL,
	`scrutin_id` text NOT NULL,
	`voter_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`scrutin_id`) REFERENCES `scrutin`(`id`) ON UPDATE no action ON DELETE no action
);
