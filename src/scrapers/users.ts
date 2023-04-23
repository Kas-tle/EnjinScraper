import { Database } from 'sqlite3';
import { UserAdmin } from '../interfaces/useradmin';
import { enjinRequest, throttledGetRequest } from '../util/request';
import { insertRow, insertRows, updateRow } from '../util/database';
import { getAllUserTags } from './usertags';
import { UserIPs, UsersDB } from '../interfaces/user';
import { SiteAuth } from '../interfaces/generic';
import { fileExists, parseJsonFile } from '../util/files';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { MessageType, statusMessage } from '../util/console';
import { Config } from '../util/config';
import { Profile } from '../interfaces/profile';

export async function getAdditionalUserData(domain: string, sessionID: string, siteAuth: SiteAuth, database: Database, disabledUserModules: Config["disabledModules"]["users"]) {
    statusMessage(MessageType.Info, 'Getting additional user data...')

    let userCount = [0];

    const userIDs: string[] = await new Promise((resolve, reject) => {
        database.all('SELECT user_id FROM users',
            (err, rows: [{user_id: string}]) => {
                if (err) {
                    reject(err);
                } else {
                    const userIDs = rows.map(row => row.user_id);
                    resolve(userIDs);
                }
            });
    });

    if(fileExists('./target/recovery/user_data.json')) {
        statusMessage(MessageType.Info, 'Recovering user data progress previous session...')
        const progress = parseJsonFile('./target/recovery/user_data.json') as [number[]];
        userCount = progress[0];
    }

    addExitListeners(['./target/recovery/user_data.json'],[[userCount]])

    const totalUsers = userIDs.length;

    for (let i = userCount[0]; i < totalUsers; i++) {
        // User IPs
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.ips) : true) {
            const userIPsResponse = await throttledGetRequest(domain, `/ajax.php?s=admin_users&cmd=getUserAdditionalData&user_id=${userIDs[i]}`, {
                Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
                Referer: `Referer https://${domain}/admin/users`
            }, '/getAdditionalUserData');
    
            const userIPs: UserIPs = userIPsResponse.data;
            await updateRow(database, 'users', 'user_id', userIDs[i], ['ip_history'], [JSON.stringify(userIPs.ips_history)]);
            statusMessage(MessageType.Plain, `Found ${userIPs.ips_history.length} IPs for user ${userIDs[i]}`);
        }


        // Profile.getFullInfo
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.fullinfo) : true) {
            const fullInfoResponse = await enjinRequest<Profile.GetFullInfo>({session_id: sessionID, user_id: userIDs[i]}, 'Profile.getFullInfo', domain);
            if (fullInfoResponse.error) {
                statusMessage(MessageType.Error, `Error getting full info for user ${userIDs[i]}: ${fullInfoResponse.error.message}`);
                statusMessage(MessageType.Process, `Skipping user ${userIDs[i]} [(${++userCount[0]}/${totalUsers})]`);
                continue;
            }
            const { info, profile } = fullInfoResponse.result;
            await insertRow(database, 'user_profiles',
                profile.user_id,
                info.gender,
                info.birthdate_day,
                info.birthdate_month,
                info.birthdate_year,
                info.about,
                info.age,
                info.location_name,
                info.forum_posts,
                info.number_views,
                info.friends,
                info.gamerid_steam,
                info.gamerid_psn,
                info.gamerid_xbox,
                info.gamerid_contact_skype,
                info.gamerid_twitter,
                info.gamerid_facebook,
                info.gamerid_instagram,
                info.gamerid_youtube,
                info.gamerid_twitch,
                info.gamerid_origin,
                info.gamerid_uplay,
                info.gamerid_discord,
                profile.username,
                profile.avatar,
                profile.is_online,
                profile.is_nsfw,
                profile.cover,
                profile.cover_timestamp,
                profile.cover_ext,
                profile.cover_premade,
                profile.cover_image,
                profile.quote,
                profile.location,
                profile.joined,
                profile.last_login,
                profile.last_activity,
                profile.friend_type,
                profile.favorite,
                JSON.stringify(profile.badges),
            )
            statusMessage(MessageType.Plain, `Found full profile for user ${userIDs[i]}`);
        }

        // Profile.getCharacters
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.characters) : true) {
            const charactersResponse = await enjinRequest<Profile.GetCharacters>({session_id: sessionID, user_id: userIDs[i]}, 'Profile.getCharacters', domain);
            const { characters } = charactersResponse.result;
            const charactersDB = [];
            for (const gameRid of Object.keys(characters)) {
                for (const character of characters[gameRid]) {
                    charactersDB.push([
                        character.character_id,
                        gameRid,
                        character.name,
                        character.gender,
                        character.race,
                        character.type,
                        character.level,
                        character.description,
                        character.avatar,
                        character.server_name,
                        character.server_location,
                        character.team_name,
                        character.is_main,
                    ]);
                }
            }
            await insertRows(database, 'user_characters', charactersDB);
            statusMessage(MessageType.Plain, `Found ${charactersDB.length} characters for user ${userIDs[i]}`);
        }

        // Profile.getGames
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.games) : true) {
            const gamesResponse = await enjinRequest<Profile.GetGames>({session_id: sessionID, user_id: userIDs[i]}, 'Profile.getGames', domain);
            const gamesDB = [];
            for (const game of gamesResponse.result.games) {
                gamesDB.push([
                    game.rid,
                    game.user_id,
                    game.favorite,
                    game.scount,
                    game.ucount,
                    game.metascore ? JSON.stringify(game.metascore) : null,
                    game.name,
                    game.game_id,
                    game.platform_name,
                    game.platform_id,
                    game.abbreviation,
                    game.avatar,
                ]);
            }
            await insertRows(database, 'user_games', gamesDB);
            statusMessage(MessageType.Plain, `Found ${gamesDB.length} games for user ${userIDs[i]}`);
        }

        // Profile.getPhotos
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.photos) : true) {
            const photosResponse = await enjinRequest<Profile.GetPhotos>({session_id: sessionID, user_id: userIDs[i]}, 'Profile.getPhotos', domain);
            const { albums, photos } = photosResponse.result;

            const albumsDB = [];
            const imagesDB = [];

            for (const album of albums) {
                albumsDB.push([
                    album.album_id,
                    album.user_id,
                    album.type,
                    album.game_id,
                    album.title,
                    album.description,
                    album.image_id,
                    album.total_images,
                    album.total_views,
                    album.total_likes,
                    album.total_comments,
                    album.ordering,
                    album.acl_view,
                    album.acl_comment,
                ]);
            }
            await insertRows(database, 'user_albums', albumsDB);

            for (const photo of photos.images) {
                imagesDB.push([
                    photo.image_id,
                    photo.user_id,
                    photo.title,
                    photo.created,
                    photo.have_original,
                    photo.views,
                    photo.likes,
                    photo.comments,
                    photo.url,
                    photo.acl_comment,
                    photo.comments_disabled,
                    photo.album_id,
                    photo.is_liked ? JSON.stringify(photo.is_liked) : null,
                    photo.can_like,
                    photo.can_comment,
                    photo.url_small,
                    photo.url_medium,
                    photo.url_thumb,
                    photo.url_full,
                    photo.url_original,
                    photo.details_url,
                    photo.like_url,
                ]);
            }
            await insertRows(database, 'user_images', imagesDB);

            statusMessage(MessageType.Plain, `Found ${albumsDB.length} albums and ${imagesDB.length} images for user ${userIDs[i]}`);
        }

        // Profile.getWall
        if ((typeof disabledUserModules === 'object') ? !(disabledUserModules.wall) : true) {

            const wallPostsDB = [];
            const wallCommentsDB = [];
            const wallCommentLikesDB = [];
            const wallPostLikesDB = [];

            let next_page = true;
            let page = 0;
            let lastPostID = "0";
            while (next_page) {
                statusMessage(MessageType.Plain, `Getting wall page ${++page} for user ${userIDs[i]}`);
                const wallResponse = await enjinRequest<Profile.GetWall>({
                    session_id: sessionID, 
                    user_id: userIDs[i], 
                    last_post_id: lastPostID,
                    with_replies: true,
                    limit: 30,
                }, 'Profile.getWall', domain);
                const { posts } = wallResponse.result;
                next_page = wallResponse.result.next_page;
                if (wallResponse.result.posts && wallResponse.result.posts.length > 0) {
                    lastPostID = wallResponse.result.posts[wallResponse.result.posts.length - 1].post_id;
                }

                for (const post of posts) {
                    wallPostsDB.push([
                        post.type,
                        post.post_type,
                        post.post_id,
                        post.wall_user_id,
                        post.user_id,
                        post.message,
                        post.message_html,
                        post.message_clean,
                        post.posted,
                        post.access,
                        post.wall_post_access,
                        post.wall_like_access,
                        post.comments_total,
                        post.likes_total,
                        post.embed_url,
                        post.embed_title,
                        post.embed_description,
                        post.embed_thumbnail,
                        post.embed_html,
                        post.embed_video_title,
                        post.embed_video_description,
                        post.embed_width,
                        post.embed_height,
                        post.edited,
                        post.comments_disabled,
                        post.avatar,
                        post.can_admin,
                        post.can_comment,
                        post.can_like,
                        post.username,
                        post.is_online,
                    ]);
    
                    for (const comment of post.comments) {
                        wallCommentsDB.push([
                            comment.comment_id,
                            post.post_id,
                            comment.comment_user_id,
                            comment.comment_message,
                            comment.comment_posted,
                            comment.reply_to,
                            comment.displayname,
                            comment.avatar_timestamp,
                            comment.avatar_ext,
                            comment.likes_user_ids ? JSON.stringify(comment.likes_user_ids) : null,
                            comment.likes_users,
                            comment.likes_users_full,
                            comment.can_comment,
                            comment.can_admin,
                            comment.can_remove,
                            comment.can_like,
                            comment.like_url,
                            comment.delete_url,
                            comment.avatar,
                            comment.username,
                            comment.comment_message_clean,
                            comment.is_online,
                        ]);
    
                        for (const reply of comment.replies) {
                            wallCommentsDB.push([
                                reply.comment_id,
                                post.post_id,
                                reply.comment_user_id,
                                reply.comment_message,
                                reply.comment_posted,
                                reply.reply_to,
                                reply.displayname,
                                reply.avatar_timestamp,
                                reply.avatar_ext,
                                reply.likes_user_ids ? JSON.stringify(reply.likes_user_ids) : null,
                                reply.likes_users,
                                reply.likes_users_full,
                                reply.can_comment,
                                reply.can_admin,
                                reply.can_remove,
                                reply.can_like,
                                reply.like_url,
                                reply.delete_url,
                                null,
                                null,
                                null,
                                null,
                            ]);
    
                            for(const like of reply.likes) {
                                wallCommentLikesDB.push([
                                    like.user_id,
                                    reply.comment_id,
                                    like.displayname,
                                    like.avatar_timestamp,
                                    like.avatar_ext,
                                ]);
                            }
                        }
    
                        for(const like of comment.likes) {
                            wallCommentLikesDB.push([
                                like.user_id,
                                comment.comment_id,
                                like.displayname,
                                like.avatar_timestamp,
                                like.avatar_ext,
                            ]);
                        }
                    }
    
                    for(const like of post.likes) {
                        wallPostLikesDB.push([
                            like.user_id,
                            post.post_id,
                            like.avatar,
                            like.username,
                        ]);
                    }
                }
            }

            await insertRows(database, 'user_wall_posts', wallPostsDB);
            await insertRows(database, 'user_wall_comments', wallCommentsDB);
            await insertRows(database, 'user_wall_comment_likes', wallCommentLikesDB);
            await insertRows(database, 'user_wall_post_likes', wallPostLikesDB);

            statusMessage(MessageType.Plain, `Found ${wallPostsDB.length} wall posts, ${wallCommentsDB.length} wall comments, ${wallCommentLikesDB.length} wall comment likes, and ${wallPostLikesDB.length} wall post likes for user ${userIDs[i]}`);
        }

        statusMessage(MessageType.Process, `Found additional data for user ${userIDs[i]} [(${++userCount[0]}/${totalUsers})]`);
    }

    removeExitListeners();
}

export async function getUsers(database: Database, domain: string, apiKey: string, disabledUserModules: Config["disabledModules"]["users"]) {    
    if(!fileExists('./target/recovery/user_ips.json')) {
        const allUserTags = await getAllUserTags(domain, apiKey, (typeof disabledUserModules === 'object') ? disabledUserModules.tags : false);
        let result: UserAdmin.Get = {};
        const userDB: UsersDB[] = [];
    
        let page = 1;
    
        do {
            statusMessage(MessageType.Process, `Getting users page ${page}...`)
    
            const params = {
                api_key: apiKey,
                characters: 'true',
                mcplayers: 'true',
                page: page.toString(),
            }
            const data = await enjinRequest<UserAdmin.Get>(params, 'UserAdmin.get', domain);
    
            if (data.error) {
                statusMessage(MessageType.Error, `Error getting users page ${page}: ${data.error.code} ${data.error.message}`)
                break;
            }
    
            result = data.result;
    
            if (Object.keys(result).length > 0) {
                Object.keys(result).forEach((userID) => {
                    const user = result[userID];
                    userDB.push([
                        userID,
                        user.username,
                        user.forum_post_count,
                        user.forum_votes,
                        user.lastseen,
                        user.datejoined,
                        user.points_total,
                        user.points_day,
                        user.points_week,
                        user.points_month,
                        user.points_forum,
                        user.points_purchase,
                        user.points_other,
                        user.points_spent,
                        user.points_decayed,
                        userID in allUserTags ? JSON.stringify(allUserTags[userID]) : null,
                        user.points_adjusted,
                        null
                    ]);
                });
                page++;
            }
        } while (Object.keys(result).length > 0);
    
        await insertRows(database, 'users', userDB);
    }
}