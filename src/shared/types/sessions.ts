export type Session = {
    id: number;
    user_id: number;
    token: string;
    expires_date: string;
    devices?: string;
    ip_address?: string;
    is_deleted: boolean;
    status: number;
    created_date: string;
    updated_date: string;
};
