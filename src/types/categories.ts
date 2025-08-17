export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string;
    parent_id?: number;
    image?: string;
    is_active: boolean;
    is_deleted: boolean;
    status: number;
    created_date: string;
    updated_date: string;
};
