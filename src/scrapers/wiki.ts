import { Database } from "sqlite3";
import { enjinRequest, getRequest } from "../util/request";
import { PageHistoryEntry, PageListEntry, Wiki, WikiCategoriesDB, WikiLikesDB, WikiPagesDB, WikiRevisionsDB, WikiUploadsDB } from "../interfaces/wiki";
import { addExitListeners, removeExitListeners } from "../util/exit";
import { fileExists, parseJsonFile } from "../util/files";
import { insertRow, insertRows } from "../util/database";
import { MessageType, statusMessage } from "../util/console";

async function getHistoricPageData(database: Database, domain: string, moduleID: string, page: PageHistoryEntry, cfbmToken: string, lastviewed: string) {
    const historicPageData = await enjinRequest<Wiki.GetPageTitle>({
        preset_id: moduleID,
        title: page.page_title,
        oldid: page.rev_id,
        prop: ["text","categories","likes","comments"]
    }, 'Wiki.getPageTitle', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (historicPageData.error) {
        statusMessage(MessageType.Error, `Error getting wiki page ${page.page_id} revision ${page.rev_id}: ${historicPageData.error.code} ${historicPageData.error.message}`)
        return [];
    }

    // Enter historic page data into wiki_revisions table
    const pageData = historicPageData.result;
    const pageRow: WikiRevisionsDB = [
        moduleID,
        pageData.page_id,
        pageData.page_namespace,
        pageData.page_title,
        pageData.page_is_redirect,
        pageData.page_is_new,
        pageData.page_touched,
        pageData.page_links_updated,
        pageData.page_latest,
        pageData.page_len,
        pageData.page_content_model ? pageData.page_content_model : null,
        pageData.page_lang ? pageData.page_lang : null,
        pageData.view_access_acl,
        pageData.edit_access_acl,
        pageData.comment_access_acl,
        pageData.rev_id,
        pageData.rev_timestamp,
        pageData.rev_user,
        pageData.rev_user_text,
        pageData.rev_comment,
        pageData.rev_parent_id,
        page.rev_minor_edit,
        page.rev_deleted,
        page.rev_len,
        page.rev_sha1,
        page.rev_content_format,
        page.rev_content_model,
        pageData.avatar,
        pageData.text_text,
        pageData.rd_title ? pageData.rd_title : null,
        pageData.page_title_display,
        pageData.current_timestamp,
        pageData.view_access,
        pageData.edit_access,
        pageData.comment_access,
        pageData.text_display,
        JSON.stringify(pageData.categories)
    ];
    await insertRow(database, 'wiki_revisions', ...pageRow);
}

async function getPageData(database: Database, domain: string, moduleID: string, page: string, cfbmToken: string, lastviewed: string): Promise<PageHistoryEntry[]> {
    const currentPageData = await enjinRequest<Wiki.GetPageTitle>({
        preset_id: moduleID,
        title: page,
        prop: ["text","categories","likes","comments"]
    }, 'Wiki.getPageTitle', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (currentPageData.error) {
        statusMessage(MessageType.Error, `Error getting wiki page ${page}: ${currentPageData.error.code} ${currentPageData.error.message}`)
        return [];
    }

    const pageData = currentPageData.result;
    const pageRow: WikiPagesDB = [
        moduleID,
        pageData.page_id,
        pageData.page_namespace,
        pageData.page_title,
        pageData.page_is_redirect,
        pageData.page_is_new,
        pageData.page_touched,
        pageData.page_links_updated,
        pageData.page_latest,
        pageData.page_len,
        pageData.page_content_model ? pageData.page_content_model : null,
        pageData.page_lang ? pageData.page_lang : null,
        pageData.view_access_acl,
        pageData.edit_access_acl,
        pageData.comment_access_acl,
        pageData.rev_id,
        pageData.rev_timestamp,
        pageData.rev_user,
        pageData.rev_user_text,
        pageData.rev_comment,
        pageData.rev_parent_id,
        pageData.text_text,
        pageData.rd_title ? pageData.rd_title : null,
        pageData.page_title_display,
        pageData.current_timestamp,
        pageData.view_access,
        pageData.edit_access,
        pageData.comment_access,
        pageData.avatar,
        pageData.text_display,
        JSON.stringify(pageData.categories),
        pageData.comments_total,
        pageData.comment_cid,
        pageData.likes.total
    ]
    await insertRow(database, 'wiki_pages', ...pageRow);

    const wikiLikesDB: WikiLikesDB[] = [];
    for (const like of pageData.likes.users) {
        wikiLikesDB.push([
            moduleID,
            pageData.page_id,
            like.user_id,
            like.username,
            like.avatar,
        ]);
    }
    if (wikiLikesDB.length > 0) {
        await insertRows(database, 'wiki_likes', wikiLikesDB);
    }

    const pageHistory = await enjinRequest<Wiki.GetPageHistory>({
        preset_id: moduleID,
        title: page
    }, 'Wiki.getPageHistory', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (pageHistory.error) {
        statusMessage(MessageType.Error, `Error getting wiki page ${page} history: ${pageHistory.error.code} ${pageHistory.error.message}`)
        return [];
    }

    return pageHistory.result.history;
}

async function getPagesByModule(domain: string, moduleID: string, cfbmToken: string, lastviewed: string): Promise<string[]> {
    const data = await enjinRequest<Wiki.GetPageList>({ preset_id: moduleID }, 'Wiki.getPageList', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (data.error) {
        statusMessage(MessageType.Error, `Error getting wiki module ${moduleID}: ${data.error.code} ${data.error.message}`)
        return [];
    }

    return data.result.map((entry: PageListEntry) => entry.page_title);
}

async function getModuleCategories(database: Database, domain: string, moduleID: string, cfbmToken: string, lastviewed: string) {
    const data = await enjinRequest<Wiki.GetCategories>({ preset_id: moduleID }, 'Wiki.getCategories', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (data.error) {
        statusMessage(MessageType.Error, `Error getting wiki module ${moduleID} categories: ${data.error.code} ${data.error.message}`)
        return [];
    }

    // Enter data into wiki_categories table
    const wikiCategoriesDB: WikiCategoriesDB[] = [];
    for (const category of data.result) {
        wikiCategoriesDB.push([
            moduleID,
            category.page_title,
            category.page_title_dbkey,
            category.page_title_display,
            category.category_thumbnail,
            category.category_thumbnail_path,
            category.cl_to,
            category.cl_type,
        ]);
    }
    if (wikiCategoriesDB.length > 0) {
        await insertRows(database, 'wiki_categories', wikiCategoriesDB);
    }
    statusMessage(MessageType.Process, `Found ${wikiCategoriesDB.length} wiki categories for module ${moduleID}`);
}

async function getModuleUploads(database: Database, domain: string, moduleID: string, cfbmToken: string, lastviewed: string) {
    const data = await enjinRequest<Wiki.GetFiles>({ preset_id: moduleID }, 'Wiki.getFiles', domain, {
        Cookie: `${lastviewed}; enjin_browsertype=web; ${cfbmToken}`,
    });

    if (data.error) {
        statusMessage(MessageType.Error, `Error getting wiki module ${moduleID} uploads: ${data.error.code} ${data.error.message}`)
        return [];
    }

    const wikiUploadsDB: WikiUploadsDB[] = [];
    for (const upload of data.result) {
        wikiUploadsDB.push([
            moduleID,
            upload.path,
            upload.name
        ]);
    }
    if (wikiUploadsDB.length > 0) {
        await insertRows(database, 'wiki_uploads', wikiUploadsDB);
    }
}

export async function getWikis(domain: string, database: Database, wikiModuleIDs: string[]) {
    // We'll just get a temp token for this
    const cfbmTokenResponse = await getRequest(domain, `/wiki/m/${wikiModuleIDs[0]}`, {}, '/getWikis')
    const setCookie = cfbmTokenResponse.headers['set-cookie'];
    const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];
    const lastviewed = setCookie!.find((cookie: string) => cookie.includes('lastviewed'))!.split(';')[0];

    let pages: string[][] = [];
    let pageHistory: PageHistoryEntry[][] = [];
    let moduleCount = [0];
    let pageCount = [0];
    let historicPageCount = [0];
    let recovery = false;

    if (fileExists('./target/recovery/wiki_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering wiki progress from previous session...');
        const progress = parseJsonFile('./target/recovery/wiki_progress.json') as [string[], string[][], PageHistoryEntry[][], number[], number[], number[]];

        wikiModuleIDs = progress[0];
        pages[0] = progress[1][0];
        pageHistory[0] = progress[2][0];
        moduleCount[0] = progress[3][0];
        pageCount[0] = progress[4][0];
        historicPageCount[0] = progress[5][0];
        recovery = true;
    }

    addExitListeners(
        ['./target/recovery/wiki_progress.json'],
        [[wikiModuleIDs, pages, pageHistory, moduleCount, pageCount, historicPageCount]]
    );

    const totalModules = wikiModuleIDs.length;

    for (let i = moduleCount[0]; i < totalModules; i++) {
        pages[0] = recovery ? pages[0] : await getPagesByModule(domain, wikiModuleIDs[i], cfbmToken, lastviewed);
        !recovery ? statusMessage(MessageType.Process, `Found ${pages[0].length} pages in module ${wikiModuleIDs[i]} [(${moduleCount[0]+1}/${totalModules})]`) : {};

        // Now we need to loop over the pages for wiki_pages table, followed by their history
        const totalPages = pages[0].length;
        pageCount[0] = recovery ? pageCount[0] : 0;

        for (let j = pageCount[0]; j < totalPages; j++) {
            pageHistory[0] = recovery ? pageHistory[0] : await getPageData(database, domain, wikiModuleIDs[i], pages[0][j], cfbmToken, lastviewed);
            !recovery ? statusMessage(MessageType.Process, `Found ${pageHistory[0].length} revisions for page ${pages[0][j]} [(${pageCount[0]+1}/${totalPages}) (${moduleCount[0]+1}/${totalModules})]`) : {};

            const totalHistoricPages = pageHistory[0].length;
            historicPageCount[0] = recovery ? historicPageCount[0] : 0;

            for (let k = historicPageCount[0]; k < totalHistoricPages; k++) {
                await getHistoricPageData(database, domain, wikiModuleIDs[i], pageHistory[0][k], cfbmToken, lastviewed);
                statusMessage(MessageType.Process, `Found revision ${pageHistory[0][k].rev_id} for page ${pageHistory[0][k].page_title} [(${++historicPageCount[0]}/${totalHistoricPages}) (${pageCount[0]+1}/${totalPages}) (${moduleCount[0]+1}/${totalModules})]`);
            }
            recovery = false;
            ++pageCount[0];
        }
        recovery = false;

        await getModuleCategories(database, domain, wikiModuleIDs[i], cfbmToken, lastviewed);
        await getModuleUploads(database, domain, wikiModuleIDs[i], cfbmToken, lastviewed);
        ++moduleCount[0];
    }

    removeExitListeners();
}