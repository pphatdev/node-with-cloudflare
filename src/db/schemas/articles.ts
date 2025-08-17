import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { categories } from './categories';

export const articles = sqliteTable('articles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text("content"),
    excerpt: text('excerpt'),
    author_id: integer('author_id').references(() => users.id),
    category_id: integer('category_id').references(() => categories.id),
    published: integer('published').notNull().default(1),
    published_date: text('published_date').$defaultFn(() => new Date().toISOString()),
    featured_image: text('featured_image'),
    meta_title: text('meta_title'),
    meta_description: text('meta_description'),
    meta_keywords: text('meta_keywords'),
    is_featured: integer('is_featured', { mode: 'boolean' }).default(false),
    view_count: integer('view_count').default(0),
    tags: text("tags"),
    is_deleted: integer("is_deleted").notNull().default(0),
    status: integer("status").notNull().default(1),
    created_date: text("created_date").notNull().$defaultFn(() => new Date().toISOString()),
    updated_date: text("updated_date").$defaultFn(() => new Date().toISOString()),
});


export const createArticlesTableQuery = `
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        author_id INTEGER REFERENCES users(id),
        category_id INTEGER REFERENCES categories(id),
        published INTEGER NOT NULL DEFAULT 1,
        published_date TEXT DEFAULT (datetime('now')),
        featured_image TEXT,
        meta_title TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        is_featured BOOLEAN DEFAULT FALSE,
        view_count INTEGER DEFAULT 0,
        tags TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1,
        created_date TEXT NOT NULL DEFAULT (datetime('now')),
        updated_date TEXT DEFAULT (datetime('now'))
    );
`

export const createArticlesTable = (db: any) => {
    return db.run(createArticlesTableQuery)
        .then(() => {
            console.log("Articles table created successfully.");
            return {
                table_name: "articles",
                columns: [
                    { name: "id", type: "INTEGER", nullable: false },
                    { name: "title", type: "TEXT", nullable: false },
                    { name: "slug", type: "TEXT", nullable: false },
                    { name: "content", type: "TEXT", nullable: false },
                    { name: "excerpt", type: "TEXT", nullable: true },
                    { name: "author_id", type: "INTEGER", nullable: false },
                    { name: "category_id", type: "INTEGER", nullable: false },
                    { name: "published", type: "INTEGER", nullable: false },
                    { name: "published_date", type: "TEXT", nullable: false },
                    { name: "featured_image", type: "TEXT", nullable: true },
                    { name: "meta_title", type: "TEXT", nullable: true },
                    { name: "meta_description", type: "TEXT", nullable: true },
                    { name: "meta_keywords", type: "TEXT", nullable: true },
                    { name: "is_featured", type: "INTEGER", nullable: false },
                    { name: "view_count", type: "INTEGER", nullable: false },
                    { name: "tags", type: "TEXT", nullable: true },
                    { name: "created_date", type: "TEXT", nullable: false },
                    { name: "updated_date", type: "TEXT", nullable: false },
                ]
            };
        })
        .catch((error: any) => {
            console.error("Error creating articles table:", error);
            throw new Error("Failed to create articles table");
        });
}