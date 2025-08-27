PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	`created_date` text NOT NULL,
	`updated_date` text
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "name", "description", "image", "published", "tags", "source", "authors", "languages", "is_deleted", "status", "created_date", "updated_date") SELECT "id", "name", "description", "image", "published", "tags", "source", "authors", "languages", "is_deleted", "status", "created_date", "updated_date" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `sessions` ADD `token` text NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `devices` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `ip_address` text;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);