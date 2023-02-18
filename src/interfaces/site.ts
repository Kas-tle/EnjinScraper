export namespace Site {
    export interface GetStats {
        latest_user: {
            site_id: string;
            user_id: string;
            access: string;
            datejoined: string;
            lastseen: string;
            post_count: string;
            forum_votes: string;
            forum_up_votes: string;
            forum_down_votes: string;
            banned_date: string;
            banned_expiration: string;
            allow_issue_warnings: string | null;
            allow_issue_punishments: string | null;
            banned_by: string;
            banned_by_id: string;
            banned_reason: string;
        };
    }
}