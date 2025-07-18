import { Hono } from "hono";

const UserRoutes = new Hono();

// Get all users
UserRoutes.get("/", (c) => {
    return c.json({ message: "Welcome to the users homepage" });
});


// Get a user by id
UserRoutes.get("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Welcome to the user ${id} homepage` });
});


// Get a user by id and their posts
UserRoutes.get("/:id/posts", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Welcome to the user ${id} posts homepage` });
});


// Update a user by id
UserRoutes.put("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `User ${id} updated` });
});

// Delete a user by id
UserRoutes.delete("/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `User ${id} deleted` });
});


// Create a new user
UserRoutes.post("/", (c) => {
    return c.json({ message: "User created" });
});


// Search for users
UserRoutes.get("/search", (c) => {
    const query = c.req.query("q");
    return c.json({ message: `Search for users with query ${query}` });
});


export default UserRoutes;