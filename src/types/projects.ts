export type Project = {
    id: number;
    name: string;
    description: string;
    image: string;
    published: boolean;
    tags: string[];
    source: string;
    authors: string[];
    languages: string[];
    [key: string]: any;
}
