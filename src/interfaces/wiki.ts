export namespace Wiki {
    export interface GetPageList extends Array<PageListEntry> {};
    export interface GetPageHistory {
        page_id: string;
        page_title: string;
        page_title_display: string;
        page_namespace: string;
        page_latest: string;
        rev_user: string;
        rev_user_text: string;
        avatar: string;
        history: PageHistoryEntry[];
        edit_access: boolean;
        comment_access: boolean;
    }
    export interface GetPageTitle {
        preset_id: string;
        page_id: string;
        page_namespace: string;
        page_title: string;
        page_is_redirect: string;
        page_is_new: string;
        page_touched: string;
        page_links_updated: string;
        page_latest: string;
        page_len: string;
        page_content_model: null | string;
        page_lang: null | string;
        view_access_acl: string;
        edit_access_acl: string;
        comment_access_acl: string;
        rev_id: string;
        rev_timestamp: string;
        rev_user: string;
        rev_user_text: string;
        rev_comment: string;
        rev_parent_id: string;
        text_text: string;
        rd_title: null | string;
        page_title_display: string;
        current_timestamp: number;
        view_access: boolean;
        edit_access: boolean;
        comment_access: boolean;
        avatar: string;
        text_display: string;
    }
    export interface GetPageCommentData {
        page_id: string;
        page_title: string;
        page_title_display: string;
        page_namespace: string;
        rev_user: string;
        rev_user_text: string;
        avatar: string;
        cid: string;
        edit_access: boolean;
        comment_access: boolean;
    }
    export interface GetFiles extends Array<FileEntry> {};
    export interface GetCategories extends Array<CategoryEntry> {};
}

export interface PageHistoryEntry {
    page_namespace: string;
    page_title: string;
    page_id: string;
    page_latest: string;
    page_is_redirect: string;
    page_len: string;
    rev_id: string;
    rev_page: string;
    rev_text_id: string;
    rev_timestamp: string;
    rev_comment: string;
    rev_user_text: string;
    rev_user: string;
    rev_minor_edit: string;
    rev_deleted: string;
    rev_len: string;
    rev_parent_id: string;
    rev_sha1: string;
    rev_content_format: null | string;
    rev_content_model: null | string;
    avatar: string;
}

export interface PageListEntry {
    page_id: string;
    page_name: string;
    page_title: string;
    page_title_display: string;
}

export interface FileEntry {
    path: string;
    name: string;
}

export interface CategoryEntry {
    page_title: string;
    page_title_dbkey: string;
    page_title_display: string;
    category_thumbnail: string;
    category_thumbnail_path: string;
    cl_to: null | string;
    cl_type: null | string;
}