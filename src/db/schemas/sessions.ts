import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    user_id: integer('user_id').notNull().references(() => users.id),
    expires_date: text("expires_date").$defaultFn(() => new Date().toISOString()),

    is_deleted: integer("is_deleted").notNull().default(0),
    status: integer("status").notNull().default(1),
    created_date: text("created_date").notNull().$defaultFn(() => new Date().toISOString()),
    updated_date: text("updated_date").$defaultFn(() => new Date().toISOString()),
});


export const createSessionsTableQuery = `
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        expires_date TEXT DEFAULT (datetime('now')),
        is_deleted INTEGER NOT NULL DEFAULT 0,
        status INTEGER NOT NULL DEFAULT 1,
        created_date TEXT NOT NULL DEFAULT (datetime('now')),
        updated_date TEXT DEFAULT (datetime('now'))
    );
`

export const createSessionsTable = (db: any) => {
    return db.run(createSessionsTableQuery)
        .then(() => {
            console.log("Sessions table created successfully");
            return {
                table_name: "sessions",
                columns: [
                    { name: 'id', type: 'TEXT', nullable: false },
                    { name: 'user_id', type: 'INTEGER', nullable: false },
                    { name: 'expires_date', type: 'TEXT', nullable: false },
                    { name: 'is_deleted', type: 'INTEGER', nullable: false },
                    { name: 'status', type: 'INTEGER', nullable: false },
                    { name: 'created_date', type: 'TEXT', nullable: false },
                    { name: 'updated_date', type: 'TEXT', nullable: true }
                ]
            }
        })
        .catch((error: any) => {
            console.error("Error creating sessions table:", error);
        });
}