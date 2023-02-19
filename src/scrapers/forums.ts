import { Forum, ThreadPosts } from '../interfaces/forum';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';

async function getModuleForumIDs(domain: string, sessionID: string, forumModuleID: string): Promise<string[][]> {
    const forumIDs: string[][] = [];

    const params = {
        preset_id: forumModuleID,
        session_id: sessionID,
    }

    const data = await enjinRequest<Forum.GetCategoriesAndForums>(params, 'Forum.getCategoriesAndForums', domain);

    if (data.error) {
        console.log(`Error getting forum IDs for forum module ${forumModuleID}: ${data.error.code} ${data.error.message}`)
        return forumIDs;
    }

    const { categories, subforums } = data.result;
    for (const categoryId in categories) {
        const category = categories[categoryId];
        for (const forumId in category) {
            forumIDs.push([forumModuleID, category[forumId].forum_id]);
        }
    }

    for (const forumId in subforums) {
        const subforum = subforums[forumId];
        for (const sforum of subforum) {
            forumIDs.push([forumModuleID, sforum.forum_id]);
        }
    }

    return forumIDs;
}

async function getForumThreadIDs(domain: string, sessionID: string, forumID: string[]): Promise<string[][]> {
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
            console.log(`Error getting thread IDs for forum ${forumID[1]}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const threads = data.result.threads;
        for (const thread of threads) {
            threadIDs.push([forumID[0], forumID[1], thread.thread_id]);
        }

        totalPages = data.result.pages;
        page++;
    } while (page <= totalPages);

    return threadIDs;
}

async function getThreadContent(domain: string, sessionID: string, threadID: string[]): Promise<Record<string, ThreadPosts>> {
    const threads: Record<string, ThreadPosts> = {};
    let page = 1;
    let totalPages = 1;

    do {
        console.log(`Getting thread ${threadID[2]} page ${page}...`)
        const params = {
            thread_id: threadID[2],
            session_id: sessionID,
            page: page.toString(),
        }
        const data = await enjinRequest<Forum.GetThread>(params, 'Forum.getThread', domain);

        if (data.error) {
            console.log(`Error getting thread ${threadID[2]} page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const { thread, posts } = data.result;

        if (!threads[thread.thread_id]) {
            threads[thread.thread_id] = { ...thread, posts };
        } else {
            threads[thread.thread_id].posts = [...threads[thread.thread_id].posts, ...posts];
        }

        totalPages = data.result.pages;
        page++;
    } while (page <= totalPages);

    console.log(`Finished getting all pages for thread ${threadID[2]}.`)
    return threads;
}

interface ForumContent {
    [forumModuleID: string]: {
        [forumID: string]: {
            [threadID: string]: ThreadPosts
        }
    }
}

export async function getForums(domain: string, sessionID: string, forumModuleIDs: string[]): Promise<ForumContent> {
    console.log('Getting forum content...')
    let forumContent: ForumContent = {};
    let forumIDs: string[][] = [];
    let threadIDs: string[][] = [];
    let moduleCount = [0];
    let forumCount = [0];
    let threadCount = [0];

    if (fileExists('./target/recovery/forum_progress.json')) {
        console.log('Recovering from previous session...')
        const progress = parseJsonFile('./target/recovery/forum_progress.json') as (string | number)[][];

        forumModuleIDs = progress[0] as string[];
        moduleCount[0] = progress[3][0] as number;

        forumCount[0] = progress[4][0] as number;
        forumIDs = progress[1] as unknown as string[][];

        threadCount[0] = progress[5][0] as number;
        threadIDs = progress[2] as unknown as string[][];

        if (fileExists('./target/recovery/forums.json')) {
            console.log('Recovering forum content from previous session...')
            forumContent = parseJsonFile('./target/recovery/forums.json') as ForumContent;
        }
    }
    console.log(`Starting at... Module count: ${moduleCount[0]} Forum count: ${forumCount[0]} Thread count: ${threadCount[0]}`)

    addExitListeners(
        ['./target/recovery/forums.json', './target/recovery/forum_progress.json'],
        [forumContent, [forumModuleIDs, forumIDs, threadIDs, moduleCount, forumCount, threadCount]]
    );

    const totalModules = forumModuleIDs.length;

    for (let i = moduleCount[0]; i < totalModules; i++) {
        const moduleForumIDs = await getModuleForumIDs(domain, sessionID, forumModuleIDs[i]);
        forumIDs.push(...moduleForumIDs);

        console.log(`Found ${moduleForumIDs.length} forums in module ${forumModuleIDs[i]}... (${++moduleCount[0]}/${totalModules})`)
    }

    const totalForums = forumIDs.length;

    for (let i = forumCount[0]; i < totalForums; i++) {
        const moduleThreadIDs = await getForumThreadIDs(domain, sessionID, forumIDs[i]);
        threadIDs.push(...moduleThreadIDs);

        console.log(`Found ${moduleThreadIDs.length} threads in forum ${forumIDs[i][1]}... (${++forumCount[0]}/${totalForums})`)
    }

    let threads: {
        [threadID: string]: ThreadPosts
    } = {};
    const totalThreads = threadIDs.length;

    for (let i = threadCount[0]; i < totalThreads; i++) {
        const threadContent = await getThreadContent(domain, sessionID, threadIDs[i]);
        forumContent[threadIDs[i][0]] = {
            ...forumContent[threadIDs[i][0]],
            [threadIDs[i][1]]: {
                ...forumContent[threadIDs[i][0]][threadIDs[i][1]],
                ...threads,
                ...threadContent
            }
        };
        console.log(`Found all forum content for thread ${threadIDs[i][2]}... (${++threadCount[0]}/${totalThreads})`)
    }

    removeExitListeners();
    return forumContent;
}