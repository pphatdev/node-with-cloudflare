import { sqliteTable, text, int, integer } from "drizzle-orm/sqlite-core";

const projectColumns = {
    id: int("id").primaryKey({ autoIncrement: true }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image", { length: 255 }),
    published: int("published").notNull().default(1),
    tags: text("tags"),
    source: text("source"),
    authors: text("authors"),
    languages: text("languages"),
    is_deleted: integer("is_deleted").notNull().default(0),
    status: integer("status").notNull().default(1),
    created_date: text("created_date").notNull().$defaultFn(() => new Date().toISOString()),
    updated_date: text("updated_date").$defaultFn(() => new Date().toISOString()),
}

export const projects = sqliteTable("projects", projectColumns);

// create new table if it does not exist
export const createProjectsTableQuery = `
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
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
        created_date TEXT NOT NULL DEFAULT (datetime('now')),
        updated_date TEXT DEFAULT (datetime('now'))
    );
`;

export const createProjectsTable = (db: any) => {
    return db.run(createProjectsTableQuery)
        .then(() => {
            console.log("Projects table created successfully.");
            return {
                table_name: "projects",
                columns: [
                    { name: "id", type: "INTEGER", nullable: false },
                    { name: "name", type: "TEXT", nullable: false },
                    { name: "description", type: "TEXT", nullable: true },
                    { name: "image", type: "TEXT", nullable: true },
                    { name: "published", type: "INTEGER", nullable: false },
                    { name: "tags", type: "TEXT", nullable: true },
                    { name: "source", type: "TEXT", nullable: true },
                    { name: "authors", type: "TEXT", nullable: true },
                    { name: "languages", type: "TEXT", nullable: true },
                ],
            };
        })
        .catch((error: any) => {
            console.error("Error creating projects table:", error);
            throw new Error("Failed to create projects table");
        });
}