import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';


export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    parent_id: integer('parent_id'),
    image: text('image'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    is_deleted: integer("is_deleted").notNull().default(0),
    status: integer("status").notNull().default(1),
    created_date: text("created_date").notNull().$defaultFn(() => new Date().toISOString()),
    updated_date: text("updated_date").$defaultFn(() => new Date().toISOString())
});


export const createCategoriesTableQuery = `
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id),
        image TEXT,
        is_active INTEGER DEFAULT 1,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1,
        created_date TEXT NOT NULL DEFAULT (datetime('now')),
        updated_date TEXT DEFAULT (datetime('now'))
    )
`

export const createCategoriesTable = (db: any) => {
    return db.run(createCategoriesTableQuery)
        .then(() => {
            console.log("Categories table created successfully");
            return {
                table_name: "categories",
                columns: [
                    { name: "id", type: "INTEGER", nullable: false },
                    { name: "name", type: "TEXT", nullable: false },
                    { name: "slug", type: "TEXT", nullable: false },
                    { name: "description", type: "TEXT", nullable: true },
                    { name: "parent_id", type: "INTEGER", nullable: true },
                    { name: "image", type: "TEXT", nullable: true },
                    { name: "is_active", type: "INTEGER", nullable: false },
                    { name: "is_deleted", type: "INTEGER", nullable: false },
                    { name: "status", type: "INTEGER", nullable: false },
                    { name: "created_date", type: "TEXT", nullable: false },
                    { name: "updated_date", type: "TEXT", nullable: false },
                ]
            }
        })
        .catch((error: any) => {
            console.error("Error creating categories table:", error);
        });
}