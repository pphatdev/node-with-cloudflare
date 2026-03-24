export type Project = {
    id: number;
    name: string;
    description: string;
    image: string;
    published: boolean;
    tags: string[] | string;
    source: string[] | string;
    authors: string[] | string;
    languages: string[] | string;
    [key: string]: any;
};
