export namespace Forum {
    export interface GetCategoriesAndForums {
        settings: {
            title_welcome: string;
        };
        subforums: {
            [key: string]: ForumStats[]
        };
        total_threads: number;
        total_posts: number;
        category_names: {
            [key: string]: string;
        };
        categories: {
            [key: string]: {
                [key: string]: ForumStats;
            }
        };
        notice: [];
    }
    export interface GetForum {
        forum: Forum;
        announcement_global: ThreadStats[];
        announcement_local: ThreadStats[];
        sticky: ThreadStats[];
        threads: ThreadStats[];
        subforums: Forum[]
        page: string;
        pages: number;
        moderation_access: boolean;
        post_access: boolean;
        new_thread_access: boolean;
        minimum_posts_limitation: boolean;
        notices: Notice | [];
    }

    export interface GetNotices extends Array<NoticeEntry> {};
    export interface GetThread {
        thread: Thread;
        posts: Post[];
        total_items: string;
        pages: number;
        voted: boolean;
        new_post_id: boolean;
        thread_labels: [];
        top_posters: {
            result: {
                post_user_id: string;
                posts: string;
                username: string;
                avatar: string;
            }[];
            num_users: string;
        };
        moderation_access: boolean;
        poll_post: string | null;
        post_access: boolean;
        new_thread_access: boolean;
        vote_types: {
            votetype_id: string;
            preset_id: string;
            vote_name: string;
            points: string;
            vote_icon: string;
            vote_order: string;
            allowed_forums: string;
            allowed_users: string;
            vote_icon_src: string;
        }[];
    }
}

export interface ForumStats {
    title_welcome: string;
    show_forum_viewers: string;
    preset_id: string;
    category_id: string;
    category_name: string;
    category_order: string;
    collapsed: string;
    forum_id: string;
    forum_name: string;
    forum_description: string;
    view_access: string;
    view_access_tag: string | null;
    post_access: string;
    post_access_tag: string | null;
    moderation_access: string;
    moderation_access_tag: string | null;
    forum_order: string;
    forum_threads: string;
    forum_posts: string;
    forum_lastthread_id: string;
    poll_enabled: string;
    email_notifications: string;
    parent_id: string;
    disable_signature: string;
    disable_user_post_count: string;
    disable_voting: string;
    fb_like_enabled: string;
    twitter_enabled: string;
    disable_sharing_links: string;
    remove_filters: string;
    users_see_own_threads: string;
    minimum_posts_to_post: string;
    minimum_posts_to_view: string;
    forum_type: string;
    redirect_url: string;
    redirect_type: string;
    bottom_breadcrumbs: string;
    unread_icon: string;
    read_icon: string;
    lock_own_threads: string;
    users_see_own_edit: string;
    character_game_rid: string;
    character_game_serverid: string;
    unlock_own_threads: string;
    disable_sharing_images: string;
    thread_id: string;
    thread_subject: string;
    thread_lastpost_time: string;
    thread_lastpost_user_id: string;
    thread_lastpost_username: string;
    thread_replies: string;
    user_id: string;
    username: string;
    displayname: string;
    subscription: string | null;
    read_time: string | null;
    category_collapsed_state: string | null;
    unread: boolean;
    is_collapsed: boolean;
}

export interface Forum {
    preset_id: string;
    category_id: string;
    forum_id: string;
    forum_name: string;
    forum_description: string;
    view_access: string;
    view_access_tag: string | null;
    post_access: boolean;
    post_access_tag: string | null;
    moderation_access: boolean;
    moderation_access_tag: string | null;
    forum_order: string;
    forum_threads: string;
    forum_posts: string;
    forum_lastthread_id: string;
    poll_enabled: string;
    email_notifications: string;
    parent_id: string | null;
    disable_signature: string;
    disable_user_post_count: string;
    disable_voting: string;
    fb_like_enabled: string;
    twitter_enabled: string;
    disable_sharing_links: string;
    remove_filters: string;
    users_see_own_threads: string;
    minimum_posts_to_post: string;
    minimum_posts_to_view: string;
    forum_type: string;
    redirect_url: string;
    redirect_type: string;
    bottom_breadcrumbs: string;
    unread_icon: string;
    read_icon: string;
    lock_own_threads: string;
    users_see_own_edit: string;
    character_game_rid: string;
    character_game_serverid: string;
    unlock_own_threads: string;
    disable_sharing_images: string;
    category_name: string;
    category_order: string;
    collapsed: string;
    parent_forum_name: string | null;
    parent_forum_name_2: string | null;
    parent_forum_id_2: string | null;
    require_game_character: boolean;
    logo_url: string;
    unread_threads: number;
}

export interface ThreadStats {
    thread_id: string;
    thread_subject: string;
    thread_replies: string;
    thread_views: string;
    thread_type: string;
    thread_status: string;
    thread_lastpost_time: string;
    forum_id: string;
    username: string;
    category_id: string;
    subscription: null | string;
    moved_forum_id: null | string;
    thread_hot: boolean;
    thread_new: boolean;
    replied_to: boolean;
    avatar: string;
    unread_posts: string;
    labels: null | string;
    moderation_access: boolean;
    post_access: boolean;
    new_thread_access: boolean;
}

export interface Notice {
    notice_id: string;
    preset_id: string;
    name: string;
    description: string;
    show: string;
    expires: string;
    show_days: string;
    expire_days: string;
    expire_date: string;
    page_location: string;
    user_id: string;
    viewed: string;
    deleted: string;
    notice: string;
    total: number;
    page: number;
}

export interface NoticeEntry {
    notice_id: string;
    preset_id: string;
    name: string;
    description: string;
    show: string;
    expires: string;
    show_days: string;
    expire_days: string;
    expire_date: string;
    page_location: string;
}

export interface Thread {
    preset_id: string;
    forum_id: string;
    thread_id: string;
    thread_subject: string;
    thread_replies: string;
    thread_views: string;
    thread_type: string;
    thread_status: string;
    thread_user_id: string;
    thread_username: string;
    thread_avatar: string;
    thread_lastpost_user_id: string;
    thread_lastpost_username: string;
    thread_lastpost_time: string;
    thread_moved_id: string;
    thread_post_time: string;
    url: string;
    post_count: string;
    category_id: string;
    forum_name: string;
    forum_description: string;
    disable_voting: string;
    show_signature: string;
    url_cms: string;
}

export interface ThreadPosts extends Thread {
    posts: Post[];
}

export interface Post {
    post_id: string;
    post_time: string;
    post_content: string;
    post_content_html: string;
    post_content_clean: string;
    post_user_id: string;
    show_signature: string;
    last_edit_time: string;
    post_votes: string;
    post_unhidden: string;
    post_admin_hidden: string;
    post_locked: string;
    last_edit_user: string;
    votes: {
        votetype_id: string;
        users: {
            user_id: string;
            avatar: string;
            username: string;
        }[];
        post_id: string;
        total: string;
        vote_name: string;
        vote_icon: string;
        vote_icon_src: string;
    }[] | null;
    post_username: string;
    avatar: string;
    user_online: boolean;
    user_votes: string;
    user_posts: string;
    url: string;
}
type ForumTuple = [
    string, string, string, string, string, string, string, string, string, string,
    string, string|null, string, string|null, string, string|null, string, string, string, string,
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string|null, string|null, string|null, boolean, boolean, string|null,
    string|null, string|null, boolean|null, string|null, number|null, string|null, string|null, string|null, string|null
]

export interface ForumsDB extends Array<ForumTuple[number]> {}

type ThreadTuple = [
    string, string, string, string, string, string, string, string, string|null, string|null,
    string|null, string|null, string|null, string, string, string|null, string|null, string|null, string|null, string,
    string, string, boolean, boolean, boolean, string, string, string, string|null, string|null,
    string|null, string|null, string|null
]

export interface ThreadsDB extends Array<ThreadTuple[number]> {}

type PostTuple = [
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string|null, string, string, boolean, string, string, string
]

export interface PostsDB extends Array<PostTuple[number]> {}