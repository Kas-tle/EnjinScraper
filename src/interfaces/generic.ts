export interface EnjinResponse<T> {
    id: string;
    jsonrpc: string;
    result: T;
    error?: {
        code: number;
        message: string;
    }
}

export interface Params {
    email? : string;
    password? : string;
    preset_id? : string;
    session_id? : string;
    forum_id? : string;
    page? : string;
    thread_id? : string;
    api_key? : string;
    ticket_code? : string;
    status? : string;
    application_id? : string;
    type? : string;
    site_id? : string;
    characters? : string;
    mcplayers? : string;
    user_id? : string;
    title? : string;
    prop? : string[];
    oldid? : string;
    domain? : string;
    album_id? : string;
    last_post_id? : string;
    with_replies?: boolean;
    limit?: number;
}

export interface Pagination {
    page: string;
    nr_pages: number;
    nr_results: string;
    first_page: number;
    last_page: number;
}

export interface SiteAuth {
    phpSessID: string;
    csrfToken: string;
}