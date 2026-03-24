import { sql } from "drizzle-orm";
import { projects } from "../../db/schemas/projects";
import { getTotal, paginate } from "../../shared/helpers/db.helper";
import { toJSONParse } from "../../shared/utils/json";
import type { Project } from "../../shared/types/projects";

export type ProjectQueryParams = {
    search?: string;
    status?: boolean;
    is_deleted?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
};

export class ProjectsService {
    static async findAll(db: any, params: ProjectQueryParams): Promise<{ data: Project[]; total: number }> {
        const { search = "", status = true, is_deleted = false, page, limit, sort } = params;
        const { id, name, description, image, published, tags, source, authors, languages } = projects;

        const where = sql`${projects.status} = ${status ? 1 : 0} AND ${projects.is_deleted} = ${is_deleted ? 1 : 0} AND ${projects.name} LIKE ${`%${search}%`}`;

        const total = await getTotal(db, projects, where);
        const { results, success } = await paginate(db, {
            select: { id, name, description, image, published, tags, source, authors, languages },
            table: projects,
            where, page, limit, sort,
        });

        if (!success) throw new Error("Failed to fetch projects");

        const data: Project[] = results.map((row: any) => ({
            ...row,
            tags: toJSONParse(row.tags),
            source: toJSONParse(row.source),
            authors: toJSONParse(row.authors),
            languages: toJSONParse(row.languages),
        }));

        return { data, total };
    }

    static async findById(db: any, id: number): Promise<Project | null> {
        const { results } = await db
            .select()
            .from(projects)
            .where(sql`${projects.id} = ${id}`)
            .run();

        if (!results || results.length === 0) return null;

        return {
            ...results[0],
            tags: toJSONParse(results[0].tags),
            source: toJSONParse(results[0].source),
            authors: toJSONParse(results[0].authors),
            languages: toJSONParse(results[0].languages),
        };
    }

    static async create(db: any, params: any): Promise<void> {
        const { success } = await db.insert(projects).values(params).run();
        if (!success) throw new Error("Failed to create project");
    }

    static async update(db: any, id: number, params: any): Promise<void> {
        const updated = { ...params };
        delete updated.created_date;
        const { success } = await db.update(projects).set(updated).where(sql`${projects.id} = ${id}`).run();
        if (!success) throw new Error("Failed to update project");
    }

    static async softDelete(db: any, id: number): Promise<void> {
        const { success } = await db.update(projects).set({ status: 0, is_deleted: 1 }).where(sql`${projects.id} = ${id}`).run();
        if (!success) throw new Error("Failed to delete project");
    }
}
