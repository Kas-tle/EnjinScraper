
export namespace User {
    export interface Login {
        session_id: string;
    }
}

type UsersTuple = [
    string, string, string, string, string, string, string, string, string, string, 
    string, string, string, string, string, string|null, string
]
export interface UsersDB extends Array<UsersTuple[number]> {}

export interface UserIPs {
    success: boolean;
    forum_posts: string;
    forum_likes: string;
    credit_points: number;
    ip_bans: {
        [key: string]: string;
    },
    ips_history: UserIPHistory[];
}

export interface UserIPHistory {
    ipaddress: string;
    last_seen: string;
    lastseen_string: string;
    users_by_ip: {
        user_id: string;
        displayname: string;
    }[]
}