export namespace Profile {
    export interface GetCharacters {
        characters: {
            [key: string]: {
                character_id: string;
                name: string;
                gender: string;
                race: string;
                type: string | null;
                level: string;
                description: string;
                avatar: string;
                server_name: string | null;
                server_location: string | null;
                team_name: string | null;
                is_main: boolean;
            }[];
        };
        games: {
            [key: string]: {
                game_name: string;
                platform: string;
                image: string;
            }
        };
        sites: {
            [key: string]: {
                site_name: string;
            }
        };
        site_games: {}[];
    }
    export interface GetFullInfo {
        communities: {
            pager: {
                total: string;
                pages: number;
                page: number;
                next_page: boolean;
            };
            items: {
                site_id: string;
                name: string;
                plan_id: string;
                domain: string;
                welcome_message: string;
                logo: string;
                access: string;
                num_users: string;
            }[];
        }
        info: {
            location: string;
            gender: string;
            birthdate_day: string;
            birthdate_month: string;
            birthdate_year: string;
            about: string;
            age: number;
            location_name: string;
            forum_posts: string;
            number_views: string;
            friends: number;
            gamerid_steam: string;
            gamerid_psn: string;
            gamerid_xbox: string;
            gamerid_contact_skype: string;
            gamerid_twitter: string;
            gamerid_facebook: string;
            gamerid_instagram: string; 
            gamerid_youtube: string;
            gamerid_twitch: string;
            gamerid_origin: string;
            gamerid_uplay: string;
            gamerid_discord: string;
        }
        profile: {
            user_id: string;
            username: string;
            avatar: string;
            is_online: boolean;
            is_nsfw: boolean;
            cover: string;
            cover_timestamp: string;
            cover_ext: string;
            cover_premade: string;
            cover_image: string;
            quote: string;
            location: string;
            number_views: string;
            joined: string;
            last_login: string;
            last_activity: string;
            friend_type: boolean;
            favorite: boolean;
            badges: {
                [key: string]: boolean;
            }
        }
    }
    export interface GetWall {
        posts: {
            type: string;
            post_type: string;
            post_id: string;
            wall_user_id: string;
            user_id: string;
            message: string;
            message_html: string;
            message_clean: string;
            posted: string;
            access: string;
            wall_post_access: string;
            wall_like_access: string;
            comments: {
                comment_id: string;
                comment_user_id: string;
                comment_message: string;
                comment_posted: string;
                reply_to: null;
                displayname: string;
                avatar_timestamp: string;
                avatar_ext: string;
                likes_user_ids: string[];
                likes: {
                    user_id: string;
                    comment_id: string;
                    displayname: string;
                    avatar_timestamp: string;
                    avatar_ext: string;
                }[];
                likes_users: string | null;
                likes_users_full: string;
                replies: {
                    post_id: string;
                    comment_id: string;
                    comment_user_id: string;
                    comment_message: string;
                    comment_posted: string;
                    reply_to: string;
                    displayname: string;
                    avatar_timestamp: string;
                    avatar_ext: string;
                    likes_user_ids: string[];
                    likes: {
                        user_id: string;
                        comment_id: string;
                        displayname: string;
                        avatar_timestamp: string;
                        avatar_ext: string;
                    }[];
                    likes_users: string | null;
                    likes_users_full: string;
                    ajax_like: string;
                    can_comment: boolean;
                    can_admin: boolean;
                    can_remove: boolean;
                    can_like: boolean;
                    like_url: string;
                    delete_url: string;
                }[];
                can_comment: boolean;
                can_admin: boolean;
                can_remove: boolean;
                can_like: boolean;
                like_url: string;
                delete_url: string;
                avatar: string;
                username: string;
                comment_message_clean: string;
                is_online: boolean;
            }[];
            comments_total: string;
            likes: {
                user_id: string;
                avatar: string;
                username: string;
            }[];
            likes_total: number;
            embed_url: string;
            embed_title: string;
            embed_description: string;
            embed_thumbnail: string;
            embed_html: string;
            embed_video_title: string;
            embed_video_description: string;
            embed_width: string;
            embed_height: string;
            edited: string;
            comments_disabled: string;
            avatar: string;
            can_admin: boolean;
            can_comment: boolean;
            can_like: boolean;
            username: string;
            is_online: boolean;
        }[];
        sticky: {
            allowed: boolean;
            post_id: boolean;
        };
        next_page: boolean;
        can_post: boolean;
    }
    export interface GetGames {
        games: {
            rid: string;
            user_id: string;
            favorite: string;
            scount: string;
            ucount: string;
            metascore: string | null;
            name: string;
            game_id: string;
            platform_name: string;
            platform_id: string;
            abbreviation: string;
            avatar: string;
        }[];
    }
    export interface GetPhotos {
        albums: {
            album_id: string;
            user_id: string;
            type: string;
            game_id: string | null;
            title: string;
            description: string;
            image_id: string;
            total_images: string;
            total_views: string;
            total_likes: string;
            total_comments: string;
            ordering: string;
            acl_view: string;
            acl_comment: string;
        }[];
        stats: {
            total_images: number;
            total_views: number;
            total_likes: number;
            total_comments: number;
        };
        photos: {
            album_id: number;
            title: string;
            can_admin: boolean;
            total: string;
            images: {
                image_id: string;
                user_id: string;
                title: string;
                created: string;
                have_original: string;
                views: string;
                likes: string;
                comments: string;
                url: string;
                acl_comment: string;
                comments_disabled: string;
                album_id: string;
                is_liked: boolean | null;
                can_like: boolean;
                can_comment: boolean;
                url_small: string;
                url_medium: string;
                url_thumb: string;
                url_full: string;
                url_original: string;
                details_url: string;
                like_url: string;
            }[];
        };
    }
}

