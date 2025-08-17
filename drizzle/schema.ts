import { sqliteTable, AnySQLiteColumn, integer, text } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const projects = sqliteTable("projects", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text({ length: 255 }).notNull(),
	description: text(),
	image: text({ length: 255 }),
	published: integer().default(1).notNull(),
	tags: text(),
	source: text(),
	authors: text(),
	languages: text(),
	isDeleted: integer("is_deleted").default(0).notNull(),
	status: integer().default(1).notNull(),
	createdDate: text("created_date").default("CURRENT_TIMESTAMP").notNull(),
	updatedDate: text("updated_date").default("CURRENT_TIMESTAMP"),
});

