import { Database } from 'sqlite3';
import { Forum, ForumStats, ForumsDB, Notice, NoticeEntry, PostsDB, ThreadPosts, ThreadsDB } from '../interfaces/forum';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';
import { insertRow, insertRows, updateRow } from '../util/database';
import { MessageType, statusMessage } from '../util/console';

async function getModuleForumIDs(database: Database, domain: string, sessionID: string, forumModuleID: string): Promise<string[][]> {
    // Write forum_modules table and forums table
    const forumIDs: string[][] = [];
    const forumsDB: ForumsDB[] = [];

    const params = {
        preset_id: forumModuleID,
        session_id: sessionID,
    }

    const data = await enjinRequest<Forum.GetCategoriesAndForums>(params, 'Forum.getCategoriesAndForums', domain);

    if (data.error) {
        statusMessage(MessageType.Error, `Error getting forum IDs for forum module ${forumModuleID}: ${data.error.code} ${data.error.message}`)
        return forumIDs;
    }

    const forumModule = data.result;
    for (const categoryId in forumModule.categories) {
        const category = forumModule.categories[categoryId];
        for (const forumId in category) {
            const forum = category[forumId];
            forumIDs.push([forumModuleID, forum.forum_id]);
            forumsDB.push(getForumsDBEntry(forum));
        }
    }

    for (const forumId in forumModule.subforums) {
        const subforum = forumModule.subforums[forumId];
        for (const sforum of subforum) {
            forumIDs.push([forumModuleID, sforum.forum_id]);
            forumsDB.push(getForumsDBEntry(sforum));
        }
    }

    await insertRow(
        database,
        'forum_modules',
        forumModuleID,
        forumModule.settings.title_welcome,
        JSON.stringify(
            Object.entries(forumModule.subforums).reduce((acc, [key, value]) => 
            ({ ...acc, [key]: value.map(forum => forum.forum_id) }), {})
        ),
        forumModule.total_threads,
        forumModule.total_posts,
        JSON.stringify(forumModule.category_names),
        JSON.stringify(forumModule.notice),
    )
    
    await insertRows(database, 'forums', forumsDB);

    return forumIDs;
}

function getForumsDBEntry(forum: ForumStats): ForumsDB {
    return [
        forum.title_welcome,
        forum.show_forum_viewers,
        forum.preset_id,
        forum.category_id,
        forum.forum_id,
        forum.category_name,
        forum.category_order,
        forum.collapsed,
        forum.forum_name,
        forum.forum_description,
        forum.view_access,
        forum.view_access_tag,
        forum.post_access,
        forum.post_access_tag,
        forum.moderation_access,
        forum.moderation_access_tag,
        forum.forum_order,
        forum.forum_threads,
        forum.forum_posts,
        forum.forum_lastthread_id,
        forum.poll_enabled,
        forum.email_notifications,
        forum.parent_id,
        forum.disable_signature,
        forum.disable_user_post_count,
        forum.disable_voting,
        forum.fb_like_enabled,
        forum.twitter_enabled,
        forum.disable_sharing_links,
        forum.remove_filters,
        forum.users_see_own_threads,
        forum.minimum_posts_to_post,
        forum.minimum_posts_to_view,
        forum.forum_type,
        forum.redirect_url,
        forum.redirect_type,
        forum.bottom_breadcrumbs,
        forum.unread_icon,
        forum.read_icon,
        forum.lock_own_threads,
        forum.users_see_own_edit,
        forum.character_game_rid,
        forum.character_game_serverid,
        forum.unlock_own_threads,
        forum.disable_sharing_images,
        forum.thread_id,
        forum.thread_subject,
        forum.thread_lastpost_time,
        forum.thread_lastpost_user_id,
        forum.thread_lastpost_username,
        forum.thread_replies,
        forum.user_id,
        forum.username,
        forum.displayname,
        forum.subscription,
        forum.read_time,
        forum.category_collapsed_state,
        forum.unread,
        forum.is_collapsed,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    ];
}

async function getForumThreadIDs(database: Database, domain: string, sessionID: string, forumID: string[]): Promise<string[][]> {
    // Create threads table and update forums table
    const threadIDs: string[][] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const params = {
            forum_id: forumID[1],
            session_id: sessionID,
            page: page.toString(),
        }
        const data = await enjinRequest<Forum.GetForum>(params, 'Forum.getForum', domain);

        if (data.error) {
            statusMessage(MessageType.Error, `Error getting thread IDs for forum ${forumID[1]}: ${data.error.code} ${data.error.message}`);
            break;
        }

        const threadsDB: ThreadsDB[] = [];

        const { announcement_global, announcement_local, sticky, threads } = data.result;

        const allThreads = [...announcement_global, ...announcement_local, ...sticky, ...threads];

        for (const thread of allThreads) {
            threadIDs.push([forumID[0], forumID[1], thread.thread_id]);
            threadsDB.push(
                    [
                        data.result.forum.forum_id,
                        data.result.forum.preset_id,
                        thread.thread_id,
                        thread.thread_subject,
                        thread.thread_replies,
                        thread.thread_views,
                        thread.thread_type,
                        thread.thread_status,
                        null,
                        null,
                        null,
                        null,
                        null,
                        thread.thread_lastpost_time,
                        thread.username,
                        null,
                        null,
                        null,
                        null,
                        thread.category_id,
                        thread.subscription,
                        thread.moved_forum_id,
                        thread.thread_hot,
                        thread.thread_new,
                        thread.replied_to,
                        thread.avatar,
                        thread.unread_posts,
                        thread.labels,
                        null,
                        null,
                        null,
                        null,
                        null
                    ]
                );
        }

        if (page === 1) {
            const { forum } = data.result;

            let notices: Notice | [] | NoticeEntry[] = data.result.notices;

            if (typeof data.result.notices === 'object' && !Array.isArray(data.result.notices)) {
                const noticesData = await enjinRequest<Forum.GetNotices>({ preset_id: forum.preset_id, session_id: sessionID }, 'Forum.getNotices', domain);
                notices = noticesData.result;
            }

            await updateRow(
                database,
                'forums',
                'forum_id',
                forum.forum_id,
                [
                    'parent_forum_name', 'parent_forum_name_2', 'parent_forum_id_2', 'require_game_character', 
                    'logo_url', 'unread_threads', 'announcement_global', 'announcement_local', 'sticky', 'notices'
                ],
                [
                    forum.parent_forum_name, 
                    forum.parent_forum_name_2, 
                    forum.parent_forum_id_2, 
                    forum.require_game_character,
                    forum.logo_url, 
                    forum.unread_threads, 
                    JSON.stringify(data.result.announcement_global.map(thread => thread.thread_id)), 
                    JSON.stringify(data.result.announcement_local.map(thread => thread.thread_id)), 
                    JSON.stringify(data.result.sticky.map(thread => thread.thread_id)),
                    JSON.stringify(notices),
                ]
            )
        }

        if (threadsDB && threadsDB.length > 0) {
            await insertRows(database, 'threads', threadsDB);
        }
        
        totalPages = data.result.pages;
        page++;
    } while (page <= totalPages);

    return threadIDs;
}

async function getThreadContent(database: Database, domain: string, sessionID: string, threadID: string[]) {
    // Create posts table and update threads table
    let page = 1;
    let totalPages = 1;

    do {
        statusMessage(MessageType.Process, `Getting thread ${threadID[2]} page ${page}...`)
        const params = {
            thread_id: threadID[2],
            session_id: sessionID,
            page: page.toString(),
        }
        const data = await enjinRequest<Forum.GetThread>(params, 'Forum.getThread', domain);

        if (data.error) {
            statusMessage(MessageType.Error, `Error getting thread ${threadID[2]} page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const { thread, posts } = data.result;

        if (page === 1) {
            await updateRow(
                database,
                'threads',
                'thread_id',
                thread.thread_id,
                [
                    'thread_user_id', 'thread_username', 'thread_avatar', 'thread_lastpost_user_id', 'thread_lastpost_username',
                    'thread_moved_id', 'thread_post_time', 'url', 'post_count', 'forum_name', 'forum_description',
                    'disable_voting', 'show_signature', 'url_cms'
                ],
                [
                    thread.thread_user_id, thread.thread_username, thread.thread_avatar, thread.thread_lastpost_user_id,
                    thread.thread_lastpost_username, thread.thread_moved_id, thread.thread_post_time, thread.url,
                    thread.post_count, thread.forum_name, thread.forum_description, thread.disable_voting,
                    thread.show_signature, thread.url_cms
                ]
            )
        }

        const postsDB: PostsDB[] = [];

        for (const post of posts) {
            postsDB.push(
                [
                    post.post_id,
                    post.post_time,
                    post.post_content,
                    post.post_content_html,
                    post.post_content_clean,
                    post.post_user_id,
                    post.show_signature,
                    post.last_edit_time,
                    post.post_votes,
                    post.post_unhidden,
                    post.post_admin_hidden,
                    post.post_locked,
                    post.last_edit_user,
                    post.votes ? JSON.stringify(post.votes) : null,
                    post.post_username,
                    post.avatar,
                    post.user_online,
                    post.user_votes,
                    post.user_posts,
                    post.url
                ]
            )
        }

        if (postsDB && postsDB.length > 0) {
            await insertRows(database, 'posts', postsDB);
        }

        totalPages = data.result.pages;
        page++;
    } while (page <= totalPages);

    statusMessage(MessageType.Process, `Finished getting all pages for thread ${threadID[2]}.`)
}

interface ForumContent {
    [forumModuleID: string]: {
        [forumID: string]: {
            [threadID: string]: ThreadPosts
        }
    }
}

export async function getForums(database: Database, domain: string, sessionID: string, forumModuleIDs: string[]): Promise<ForumContent> {
    let forumContent: ForumContent = {};
    let forumIDs: string[][] = [];
    let threadIDs: string[][] = [];
    let moduleCount = [0];
    let forumCount = [0];
    let threadCount = [0];

    if (fileExists('./target/recovery/forum_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering from previous session...')
        const progress = parseJsonFile('./target/recovery/forum_progress.json') as (string | number)[][];

        forumModuleIDs = progress[0] as string[];
        moduleCount[0] = progress[3][0] as number;

        forumCount[0] = progress[4][0] as number;
        forumIDs = progress[1] as unknown as string[][];

        threadCount[0] = progress[5][0] as number;
        threadIDs = progress[2] as unknown as string[][];
    }
    statusMessage(MessageType.Info, `Starting at... Module count: ${moduleCount[0]} Forum count: ${forumCount[0]} Thread count: ${threadCount[0]}`)

    addExitListeners(
        ['./target/recovery/forum_progress.json'],
        [[forumModuleIDs, forumIDs, threadIDs, moduleCount, forumCount, threadCount]]
    );

    const totalModules = forumModuleIDs.length;

    for (let i = moduleCount[0]; i < totalModules; i++) {
        const moduleForumIDs = await getModuleForumIDs(database, domain, sessionID, forumModuleIDs[i]);
        forumIDs.push(...moduleForumIDs);

        statusMessage(MessageType.Process, `Found ${moduleForumIDs.length} forums in module ${forumModuleIDs[i]}... [(${++moduleCount[0]}/${totalModules})]`)
    }

    const totalForums = forumIDs.length;

    for (let i = forumCount[0]; i < totalForums; i++) {
        const moduleThreadIDs = await getForumThreadIDs(database, domain, sessionID, forumIDs[i]);
        threadIDs.push(...moduleThreadIDs);

        statusMessage(MessageType.Process, `Found ${moduleThreadIDs.length} threads in forum ${forumIDs[i][1]}... [(${++forumCount[0]}/${totalForums})]`)
    }

    const totalThreads = threadIDs.length;

    for (let i = threadCount[0]; i < totalThreads; i++) {
        await getThreadContent(database, domain, sessionID, threadIDs[i]);
        statusMessage(MessageType.Process, `Found all forum content for thread ${threadIDs[i][2]}... [(${++threadCount[0]}/${totalThreads})]`)
    }

    removeExitListeners();
    return forumContent;
}