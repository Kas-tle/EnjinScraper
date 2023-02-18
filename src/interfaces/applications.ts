export namespace Applications {
    export interface GetTypes {
        [key: string]: string;
    }
    export interface GetList {
        items: Application[];
        total: string;
    }
    export interface GetApplication extends Application {
        user_data: {
            [key: string]: string | number | boolean | string[] | number[] | boolean[]
        };
        is_archived: boolean;
        is_trashed: boolean;
        allow_app_comments: string;
        post_app_comments: boolean;
        allow_admin_comments: boolean;
    }
}

export interface Application {
    application_id: string;
    site_id: string;
    preset_id: string;
    title: string;
    user_ip: string;
    is_mine: boolean;
    can_manage: boolean;
    created: string;
    updated: string;
    read: string;
    comments: number;
    read_comments: string | null;
    app_comments: string;
    admin_comments: string;
    site_name: string;
    user_id: string;
    is_online: boolean;
    admin_online: boolean;
    username: string;
    avatar: string;
    admin_user_id: string;
    admin_username: string;
    admin_avatar: string;
    site_logo: string;
}