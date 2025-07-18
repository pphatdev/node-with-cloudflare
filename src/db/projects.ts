import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
    id: text().primaryKey().notNull(),
    name: text("name", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image", { length: 255 }),
    published: int("published").notNull().default(1),
    tags: text("tags"),
    source: text("source"),
    authors: text("authors"),
    languages: text("languages"),
    is_deleted: int("is_deleted").notNull().default(0),
    status: int("status").notNull().default(1),
    created_date: text("created_date").notNull().default("CURRENT_TIMESTAMP"),
    updated_date: text("updated_date").default("CURRENT_TIMESTAMP"),
});

// create new table if it does not exist
export const createProjectsTableQuery = `
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        published INTEGER NOT NULL DEFAULT 1,
        tags TEXT,
        source TEXT,
        authors TEXT,
        languages TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1,
        created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_date TEXT DEFAULT CURRENT_TIMESTAMP
    );
`;