import { Database } from "sqlite3";
import { Gallery, GalleryAlbumnsDB, GalleryImagesDB, GalleryTagsDB } from "../interfaces/galleries";
import { enjinRequest } from "../util/request";
import { insertRow, insertRows } from "../util/database";
import { MessageType, statusMessage } from "../util/console";

export async function getGalleries(domain: string, database: Database, sessionID: string) {
    const albumsData = await enjinRequest<Gallery.GetAlbums>({session_id: sessionID, domain}, 'Gallery.getAlbums', domain);
    
    if (albumsData.error) {
        statusMessage(MessageType.Error, `Error getting galleries: ${albumsData.error.message}`)
        return;
    }

    const presetIDs = Object.keys(albumsData.result);
    const totalPresets = presetIDs.length;

    for (let i = 0; i < totalPresets; i++) {
        const albums = Object.keys(albumsData.result[presetIDs[i]]);
        const totalAlbums = albums.length;

        statusMessage(MessageType.Process, `Getting albums for preset ${presetIDs[i]} [(${i+1}/${totalPresets})]`);

        for (let j = 0; j < totalAlbums; j++) {
            const albumData = await enjinRequest<Gallery.GetAlbum>({session_id: sessionID, preset_id: presetIDs[i], album_id: albums[j]}, 'Gallery.getAlbum', domain);
            if (albumData.error) {
                statusMessage(MessageType.Error, `Error getting album ${albums[j]}: ${albumData.error.message}`);
                continue;
            }

            statusMessage(MessageType.Process, `Getting images for album ${albums[j]} (${j+1}/${totalAlbums}) [(${i+1}/${totalPresets})]`);

            const album = albumData.result;
            const albumRow: GalleryAlbumnsDB = [
                album.album.album_id,
                album.album.preset_id,
                album.album.type,
                album.album.game_id,
                album.album.title,
                album.album.description,
                album.album.image_id,
                album.album.total_images,
                album.album.ordering
            ];
            await insertRow(database, 'gallery_albums', ...albumRow)

            const imageRows: GalleryImagesDB[] = [];
            for (const image of album.images) {
                imageRows.push([
                    image.image_id,
                    image.preset_id,
                    image.title,
                    image.description,
                    image.created,
                    image.user_id,
                    image.views,
                    image.album_id,
                    image.have_original,
                    image.ordering,
                    image.number_comments,
                    image.comment_cid,
                    image.url,
                    image.url_full,
                    image.url_original,
                    image.can_modify
                ]);
            }
            await insertRows(database, 'gallery_images', imageRows);

            const tagRows: GalleryTagsDB[] = [];
            for (const tag of album.tags) {
                tagRows.push([
                    tag.gallery_tagid,
                    tag.album_id,
                    tag.preset_id,
                    tag.image_id,
                    tag.user_id,
                    tag.note,
                    tag.ordering,
                    tag.px,
                    tag.py,
                    tag.width,
                    tag.height,
                    JSON.stringify(tag.taglist)
                ]);
            }
            await insertRows(database, 'gallery_tags', tagRows);
        }
    }
}