export namespace UserAdmin {
    export interface Get {
        [key: string]: UserAdminUser;
    }

    export interface GetUserTags {
        [key: string]: UserAdminTag;
    }
}

export interface UserAdminUser {
    username: string;
    forum_post_count: string;
    forum_votes: string;
    lastseen: string;
    datejoined: string;
    points_total: string;
    points_day: string;
    points_week: string;
    points_month: string;
    points_forum: string;
    points_purchase: string;
    points_other: string;
    points_spent: string;
    points_decayed: string;
    points_adjusted: string;
}

export interface UserAdminTag {
    tag_id: string;
    site_id: string;
    expiry_time: string;
    tagname: string;
    numusers: string;
    visible: string;
    have_image: string;
    ordering: string;
    show_area: string;
    tag_color: string;
    tag_color_username: string;
    tag_url: string;
    tag_url_newwindow: string;
    tag_background: string;
    tag_prefix: string;
    tag_prefix_color: string;
    tag_post_color: string;
    tag_post_opacity: string;
    tag_post_bg_color: string;
    tag_background_color: string;
    microtag_text: string;
    microtag_text_color: string;
    microtag_bg_color: string;
    microtag_bg_style: string;
    microtag_image: string;
    microtag_icon: string;
    tag_forum_title: string;
    category_id: string | null;
    award_status: string;
    award_name: string;
    award_group: string;
    award_large_image: string;
    award_small_image: string;
    award_large_bg: string;
    award_display: string;
    award_description: string;
    award_sort: string;
    award_wall_post: string;
    category_order: string | null;
    url: string;
}
