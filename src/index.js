import { drizzle } from 'drizzle-orm/d1';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql, eq } from 'drizzle-orm';

// 1) Define the users table
const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
});

export default {
    async fetch(request, env) {
        const db = drizzle(env.DB);
        const url = new URL(request.url);
        const method = request.method;

        try {
            // Route to create the users table if it doesn't exist
            if (url.pathname === '/setup') {
                await db.run(sql`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL
                    )
                `);
                return new Response('Table created or already exists!');
            }

            // Route to add a test user
            if (url.pathname === '/add') {
                const newUser = await db.insert(users)
                    .values({ name: 'Test User' })
                    .returning()
                    .get();

                return Response.json(newUser);
            }

            // Route to get all users
            if (url.pathname === '/users' && method === 'GET') {
                const allUsers = await db.select().from(users).all();
                return Response.json(allUsers);
            }

            // Route to get a specific user by ID
            if (url.pathname.match(/^\/users\/\d+$/) && method === 'GET') {
                const userId = parseInt(url.pathname.split('/')[2]);
                const user = await db.select().from(users).where(eq(users.id, userId)).get();

                if (!user) {
                    return new Response(JSON.stringify({ error: 'User not found' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                return Response.json(user);
            }

            // Route to create a new user with custom name
            if (url.pathname === '/users' && method === 'POST') {
                const body = await request.json();

                if (!body.name || typeof body.name !== 'string') {
                    return new Response(JSON.stringify({ error: 'Name is required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const newUser = await db.insert(users)
                    .values({ name: body.name })
                    .returning()
                    .get();

                return new Response(JSON.stringify(newUser), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Route to update a user by ID
            if (url.pathname.match(/^\/users\/\d+$/) && method === 'PUT') {
                const userId = parseInt(url.pathname.split('/')[2]);
                const body = await request.json();

                if (!body.name || typeof body.name !== 'string') {
                    return new Response(JSON.stringify({ error: 'Name is required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const user = await db.select().from(users).where(eq(users.id, userId)).get();

                if (!user) {
                    return new Response(JSON.stringify({ error: 'User not found' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const updatedUser = await db.update(users)
                    .set({ name: body.name })
                    .where(eq(users.id, userId))
                    .returning()
                    .get();

                return Response.json(updatedUser);
            }

            // Route to delete a user by ID
            if (url.pathname.match(/^\/users\/\d+$/) && method === 'DELETE') {
                const userId = parseInt(url.pathname.split('/')[2]);

                const user = await db.select().from(users).where(eq(users.id, userId)).get();

                if (!user) {
                    return new Response(JSON.stringify({ error: 'User not found' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                await db.delete(users).where(eq(users.id, userId)).run();

                return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Default route
            return new Response('D1 Connected!');

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    },
};