import { Forum, ThreadPosts } from '../interfaces/forum';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile, writeJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';

async function getModuleForumIDs(domain: string, sessionID: string, forumModuleID: string): Promise<string[]> {
    const forumIDs: string[] = [];

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
            forumIDs.push(category[forumId].forum_id);
        }
    }

    for (const forumId in subforums) {
        const subforum = subforums[forumId];
        for (const sforum of subforum) {
            forumIDs.push(sforum.forum_id);
        }
    }

    return forumIDs;
}

async function getForumThreadIDs(domain: string, sessionID: string, forumID: string): Promise<string[]> {
    const threadIDs: string[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const params = {
            forum_id: forumID,
            session_id: sessionID,
            page: page.toString(),
        }
        const data = await enjinRequest<Forum.GetForum>(params, 'Forum.getForum', domain);

        if (data.error) {
            console.log(`Error getting thread IDs for forum ${forumID}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const threads = data.result.threads;
        for (const thread of threads) {
            threadIDs.push(thread.thread_id);
        }

        totalPages = data.result.pages;
        page++;
    } while (page <= totalPages);

    return threadIDs;
}

async function getThreadContent(domain: string, sessionID: string, threadID: string): Promise<Record<string, ThreadPosts>> {
    const threads: Record<string, ThreadPosts> = {};
    let page = 1;
    let totalPages = 1;

    do {
        console.log(`Getting thread ${threadID} page ${page}...`)
        const params = {
            thread_id: threadID,
            session_id: sessionID,
            page: page.toString(),
        }
        const data = await enjinRequest<Forum.GetThread>(params, 'Forum.getThread', domain);

        if (data.error) {
            console.log(`Error getting thread ${threadID} page ${page}: ${data.error.code} ${data.error.message}`)
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

    console.log(`Finished getting all pages for thread ${threadID}.`)
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
    addExitListeners('./target/forums.json', forumContent);

    const totalModules = forumModuleIDs.length;
    let moduleCount = 1;
    let lastForumIDIndex = 0;
    let lastThreadIDIndex = 0;


    let forumRecoveryMode = false;
    let threadRecoveryMode = false;
    if (fileExists('./target/forums.json')) {
        forumRecoveryMode = true;
        threadRecoveryMode = true;
        const recoveredForumContent = parseJsonFile('./target/forums.json') as ForumContent;
        forumContent= recoveredForumContent;
        const forumModuleKeys = Object.keys(forumContent);
        const lastForumModuleIndex = forumModuleKeys.length - 1;
        const lastForumID = forumModuleKeys[lastForumModuleIndex];
        const forumIDKeys = Object.keys(forumContent[lastForumID]);
        lastForumIDIndex = forumIDKeys.length - 1;
        const lastThreadID = forumContent[lastForumID][forumIDKeys[lastForumIDIndex]];
        const threadIDKeys = Object.keys(lastThreadID);
        lastThreadIDIndex = threadIDKeys.length - 1;

        forumModuleIDs = forumModuleIDs.slice(lastForumModuleIndex);
        moduleCount = lastForumModuleIndex + 1;
    }

    for (const forumModuleID of forumModuleIDs) {
        console.log(`Getting forum content for module ${forumModuleID}... (${moduleCount}/${totalModules})`)

        let forumCount = 1;
        let forumIDs = await getModuleForumIDs(domain, sessionID, forumModuleID);
        const totalForums = forumIDs.length;

        if (forumRecoveryMode) {
            forumIDs = forumIDs.slice(lastForumIDIndex);
            forumCount = lastForumIDIndex + 1;
            forumRecoveryMode = false;
        }

        console.log(`Found ${forumIDs.length} forums in module ${forumModuleID}.`)
        const forumModuleContent: { 
            [forumId: string]: {
                [threadID: string]: ThreadPosts
            } 
        } = {};

        for (const forumID of forumIDs) {
            console.log(`Getting forum content for forum ${forumID}... (${forumCount}/${totalForums})`)
            let threadIDs = await getForumThreadIDs(domain, sessionID, forumID);

            console.log(`Found ${threadIDs.length} threads in forum ${forumID}.`)
            let threads: {
                [threadID: string]: ThreadPosts
            } = {};
            const totalThreads = threadIDs.length;
            let threadCount = 1;

            if (threadRecoveryMode) {
                threadIDs = threadIDs.slice(lastThreadIDIndex);
                threadCount = lastThreadIDIndex + 1;
                threadRecoveryMode = false;
            }

            for (const threadID of threadIDs) {
                console.log(`Getting forum content for thread ${threadID}... (${threadCount++}/${totalThreads}) [Forum (${forumCount}/${totalForums})] [Module (${moduleCount}/${totalModules})]`)
                const threadContent = await getThreadContent(domain, sessionID, threadID);
                threads = {...threads, ...threadContent};
                forumModuleContent[forumID] = threads;
                forumContent[forumModuleID] = forumModuleContent;
            }
            forumCount++;
        }
        moduleCount++;
    }

    removeExitListeners();
    return forumContent;
}