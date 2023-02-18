export interface EnjinResponse<T> {
    id: string;
    jsonrpc: string;
    result: T;
    error?: {
        code: number;
        message: string;
    }
}

export interface Pagination {
    page: string;
    nr_pages: number;
    nr_results: string;
    first_page: number;
    last_page: number;
}