export namespace Gallery {
    export interface GetAlbums {
        [preset_id: string]: {
            [album_id: string]: string;
        };
    }
    export interface GetAlbum {
        images: {
            image_id: string;
            preset_id: string;
            title: string;
            description: string;
            created: string;
            user_id: string;
            views: string;
            album_id: string;
            have_original: string;
            ordering: string;
            number_comments: string;
            comment_cid: string;
            url: string;
            url_full: string;
            url_original: string;
            can_modify: boolean;
        }[];
        tags: {
            gallery_tagid: string;
            album_id: string;
            preset_id: string;
            image_id: string;
            user_id: string;
            note: string;
            ordering: string;
            px: string;
            py: string;
            width: string;
            height: string;
            taglist: string;
        }[];
        album: {
            album_id: string;
            preset_id: string;
            type: string;
            game_id: string;
            title: string;
            description: string;
            image_id: string;
            total_images: string;
            ordering: string;
        };
        can_comment: boolean;
        can_admin_album: boolean;
        can_modify_item: boolean;
        album_mode: string;
    }
}

type GalleryAlbumnsTuple = [
    string, string, string, string, string, string, string, string, string
]
export interface GalleryAlbumnsDB extends Array<GalleryAlbumnsTuple[number]> {}

type GalleryImagesTuple = [
    string, string, string, string, string, string, string, string, string, string,
    string, string, string, string, string, boolean
]
export interface GalleryImagesDB extends Array<GalleryImagesTuple[number]> {}

type GalleryTagsTuple = [
    string, string, string, string, string, string, string, string, string, string,
    string, string
]
export interface GalleryTagsDB extends Array<GalleryTagsTuple[number]> {}