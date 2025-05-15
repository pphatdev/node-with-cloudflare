import { Hono } from "hono";
const app = new Hono().basePath("/users");

// Get all users
app.get("/", (c) => {
    return c.json({ message: "Welcome to the users homepage" });
});


// Get a user by id
app.get("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Welcome to the user ${id} homepage` });
});


// Get a user by id and their posts
app.get("/:id/posts", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Welcome to the user ${id} posts homepage` });
});


// Update a user by id
app.put("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `User ${id} updated` });
});

// Delete a user by id
app.delete("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `User ${id} deleted` });
});


// Create a new user
app.post("/", (c) => {
    return c.json({ message: "User created" });
});


// Search for users
app.get("/search", (c) => {
    const query = c.req.query("q");
    return c.json({ message: `Search for users with query ${query}` });
});


export default app;