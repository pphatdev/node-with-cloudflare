CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`description` text,
	`image` text(255),
	`published` integer DEFAULT 1 NOT NULL,
	`tags` text,
	`source` text,
	`authors` text,
	`languages` text,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`status` integer DEFAULT 1 NOT NULL,
	`created_date` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_date` text DEFAULT 'CURRENT_TIMESTAMP'
);
