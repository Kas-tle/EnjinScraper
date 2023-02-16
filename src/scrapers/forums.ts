import axios from 'axios';
import { EnjinResponse } from '../util/interfaces';

async function getModuleForumIDs(domain: string, sessionID: string, forumModuleID: string): Promise<string[]> {
    const forumIDs: string[] = [];

    const { data } = await axios.post<EnjinResponse<{ pages: string; categories: Record<string, { [key: string]: { forum_id: string } }>, subforums: Record<string, { forum_id: string }[]> }>>(
        `https://${domain}/api/v1/api.php`,
        {
            jsonrpc: '2.0',
            id: '1',
            method: 'Forum.getCategoriesAndForums',
            params: { preset_id: forumModuleID, session_id: sessionID },
        },
        { headers: { 'Content-Type': 'application/json' } }
    );

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
        const { data } = await axios.post<EnjinResponse<{ pages: string; threads: { thread_id: string }[] }>>(
            `https://${domain}/api/v1/api.php`,
            {
                jsonrpc: '2.0',
                id: '1',
                method: 'Forum.getForum',
                params: { forum_id: forumID, session_id: sessionID, page: page.toString() },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (data.error) {
            console.log(`Error getting thread IDs for forum ${forumID}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const threads = data.result.threads;
        for (const thread of threads) {
            threadIDs.push(thread.thread_id);
        }

        totalPages = parseInt(data.result.pages);
        page++;
    } while (page <= totalPages);

    return threadIDs;
}

async function getThreadContent(domain: string, sessionID: string, threadID: string): Promise<Record<string, any>> {
    const threads: Record<string, any> = {};
    let page = 1;
    let totalPages = 1;

    do {
        console.log(`Getting thread ${threadID} page ${page}...`)
        const { data } = await axios.post<EnjinResponse<{
            pages: string; thread: Record<string, any>; posts: Record<string, any>[]
        }>>(
            `https://${domain}/api/v1/api.php`,
            {
                jsonrpc: '2.0',
                id: '1',
                method: 'Forum.getThread',
                params: { thread_id: threadID, session_id: sessionID, page: page.toString() },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (data.error) {
            console.log(`Error getting thread ${threadID} page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const { thread, posts } = data.result;

        threads[thread.thread_id] = { ...thread, posts };
        totalPages = parseInt(data.result.pages);
        page++;
    } while (page <= totalPages);

    console.log(`Finished getting all pages for thread ${threadID}.`)
    return threads;
}

interface Forum {
    [threadId: string]: any;
}

interface ForumContent {
    [forumModuleId: string]: {
        [forumId: string]: Forum;
    };
}

export async function getForums(domain: string, sessionID: string, forumModuleIDs: string[]): Promise<ForumContent> {
    console.log('Getting forum content...')
    const forumContent: ForumContent = {};
    const totalModules = forumModuleIDs.length;
    let moduleCount = 1;
    for (const forumModuleID of forumModuleIDs) {
        console.log(`Getting forum content for module ${forumModuleID}... (${moduleCount}/${totalModules})`)
        const forumIDs = await getModuleForumIDs(domain, sessionID, forumModuleID);
        console.log(`Found ${forumIDs.length} forums in module ${forumModuleID}.`)
        const forumModuleContent: { [forumId: string]: Forum } = {};
        const totalForums = forumIDs.length;
        let forumCount = 1;
        for (const forumID of forumIDs) {
            console.log(`Getting forum content for forum ${forumID}... (${forumCount}/${totalForums})`)
            const threadIDs = await getForumThreadIDs(domain, sessionID, forumID);
            console.log(`Found ${threadIDs.length} threads in forum ${forumID}.`)
            const threads: Forum = {};
            const totalThreads = threadIDs.length;
            let threadCount = 1;
            for (const threadID of threadIDs) {
                console.log(`Getting forum content for thread ${threadID}... (${threadCount++}/${totalThreads}) [Forum (${forumCount}/${totalForums})] [Module (${moduleCount}/${totalModules})]`)
                const threadContent = await getThreadContent(domain, sessionID, threadID);
                threads[threadID] = threadContent;
            }
            forumModuleContent[forumID] = threads;
            forumCount++;
        }
        forumContent[forumModuleID] = forumModuleContent;
        moduleCount++;
    }
    return forumContent;
}