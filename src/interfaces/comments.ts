export interface Comment {
    comment_cid: string;
    comment_id: string;
    user_id: string;
    guest_ip: string;
    guest_name: string;
    timestamp: string;
    content: string;
    status: string;
    category: string;
    parent_comment_id: string;
    likes_user_ids: string[];
    likes: string[];
    likes_users: null | string;
    likes_users_full: string;
    ajax_like: string;
    can_delete: boolean;
    can_reply: boolean;
    avatar: string;
    username: string;
    time: string;
    can_like: boolean;
    like_text: string;
    tag_post_color: boolean;
    comments: {
        total: string;
        comments: Comment[];
    };
}

export interface CommentResponse {
    total: string;
    comments: Comment[];
    myAvatar: string;
}

type CommentsTuple = [
    string, string, string, string, string, string, string, string, string, string, 
    string, string, string|null, string, string, boolean, boolean, string, string, string,
    boolean, string, boolean
]

export interface CommentsDB extends Array<CommentsTuple[number]> {}
