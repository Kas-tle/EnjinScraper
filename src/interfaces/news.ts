export namespace News {
    export interface GetNews extends Array<NewsArticle> {};
}

export interface NewsArticle {
    preset_id: string;
    article_id: string;
    user_id: string;
    num_comments: string;
    timestamp: string;
    status: string;
    title: string;
    content: string;
    commenting_mode: string;
    ordering: string;
    sticky: string;
    last_updated: null | string;
    username: string;
    displayname: string;
}