export namespace Friends {
    export interface GetList {
        differential_update: boolean;
        friends?: Friend[];
        pages: number;
        total: number;
    }
}

export interface Friend {
    friend_id: string;
    is_online: boolean;
    avatar: string;
    time: string;
    seen: string;
    username: string;
    sort_username: string;
    friendship: string;
    favorite: boolean;
    fav_position: number | null;
    network_id: string;
    quote: string;
}