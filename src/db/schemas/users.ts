import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    email_verified: integer('email_verified', { mode: 'boolean' }).default(false),
    role: text('role', { enum: ['user', 'admin'] }).default('user'),
    is_deleted: integer("is_deleted").notNull().default(0),
    status: integer("status").notNull().default(1),
    created_date: text("created_date").notNull().$defaultFn(() => new Date().toISOString()),
    updated_date: text("updated_date").$defaultFn(() => new Date().toISOString()),
});


export const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email_verified INTEGER NOT NULL DEFAULT 0,
        role TEXT NOT NULL DEFAULT 'user',
        is_deleted INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1,
        created_date TEXT NOT NULL DEFAULT (datetime('now')),
        updated_date TEXT DEFAULT (datetime('now'))
    );
`

export const createUsersTable = (db: any) => {
    return db.run(createUsersTableQuery)
        .then(() => {
            console.log("Users table created successfully");
            return {
                table_name: "users",
                columns: [
                    { name: "id", type: "INTEGER", nullable: false },
                    { name: "name", type: "TEXT", nullable: false },
                    { name: "email", type: "TEXT", nullable: false },
                    { name: "password_hash", type: "TEXT", nullable: false },
                    { name: "email_verified", type: "INTEGER", nullable: false },
                    { name: "role", type: "TEXT", nullable: false },
                    { name: "is_deleted", type: "INTEGER", nullable: false },
                    { name: "status", type: "INTEGER", nullable: false },
                    { name: "created_date", type: "TEXT", nullable: false },
                    { name: "updated_date", type: "TEXT", nullable: false },
                ]
            }
        })
        .catch((error: any) => {
            console.error("Error creating users table:", error);
        });
}