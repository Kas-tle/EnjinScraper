export namespace Tags {
    export interface Get {
        tags: TagsData;
        users: TagsUsers;
    }
    export interface GetTagTypes {
        [groupId: string]: {
            tag_id: string;
            tagname: string;
            numusers: string;
            visible: string;
        }
    }
}

export interface TagsData {
    [groupId: string]: {
        name: string;
        visible: string;
        users: string[];
    };
}

export interface TagsUsers {
    [userId: string]: {
        username: string;
        forum_post_count: string;
        forum_votes: string;
        lastseen: string;
        datejoined: string;
        expiry_time: string;
        characters?: {
            [characterId: string]: {
                name: string;
                type: string | null;
            }[];
        };
    };
}