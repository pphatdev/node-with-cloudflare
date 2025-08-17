export type User = {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    email_verified: boolean;
    role: 'user' | 'admin';
    is_deleted: boolean;
    status: number;
    created_date: string;
    updated_date: string;
};
