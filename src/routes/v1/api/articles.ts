import { Hono } from "hono";
import { Validation } from "../../../libs/utils/validation";
import { createArticle, deleteArticle, getArticles, updateArticle, validation } from "../../../controllers/articlesController";
import { getDetailCategory } from "../../../controllers/categoriesController";
const app = new Hono();

/**
 * Fetches a list of articles.
 * @route GET /api/articles
 * @param { page: number, limit: number, sort: string, search: string }
 */
app.get("/", Validation.list, getArticles);


/**
 * Fetches a Articles by ID.
 * @route GET /api/articles/:id
 * @param { id: number }
 */
app.get("/:id", Validation.get, getDetailCategory);



/**
 * Creates a new article.
 * @route POST /api/articles
 * @param { title: string, slug: string, content: string, excerpt: string, author_id: number, category_id: number, published: boolean, published_date: string, featured_image: string, meta_title: string, meta_description: string, meta_keywords: string[], is_featured: boolean, view_count: number, tags: string[] }
 */
app.post("/", validation, createArticle);


/**
 * Update an existing article.
 * @route PATCH /api/articles
 * @param { title: string, slug: string, content: string, excerpt: string, author_id: number, category_id: number, published: boolean, published_date: string, featured_image: string, meta_title: string, meta_description: string, meta_keywords: string[], is_featured: boolean, view_count: number, tags: string[] }
 */
app.patch("/:id", Validation.update, updateArticle);


/**
 * Deletes an article.
 * @route DELETE /api/articles/:id
 * @param { id: number }
 */
app.delete("/:id", Validation.delete, deleteArticle);


export default app;