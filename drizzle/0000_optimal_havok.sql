CREATE TABLE `blind_signature_request` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blind_signature_request_poll_id_user_id_unique` ON `blind_signature_request` (`poll_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `option` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`label` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `poll` (
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
CREATE TABLE `poll_key_pair` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `poll_key_pair_poll_id_unique` ON `poll_key_pair` (`poll_id`);--> statement-breakpoint
CREATE TABLE `vote_record` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`option_id` text NOT NULL,
	`blind_token` text NOT NULL,
	`blind_signature` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `poll`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`option_id`) REFERENCES `option`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vote_record_poll_id_blind_token_unique` ON `vote_record` (`poll_id`,`blind_token`);