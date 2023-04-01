const sqlite3 = require('sqlite3').verbose();
import { Database } from 'sqlite3';
import { News, NewsArticle } from '../interfaces/news';
import { insertNewsTable } from '../util/database';
import { enjinRequest } from '../util/request';

interface NewsContent {
    [key: string]: {
        [key: string]: NewsArticle;
    }
}
interface NewsModule {
    [key: string]: NewsArticle;
}

async function getModuleNews(domain: string, sessionID: string, newsModuleID: string): Promise<NewsContent> {
    let newsPosts: NewsModule = {};
    let result: News.GetNews = [];

    let page = 1;
    do {
        console.log(`Getting news posts for module ${newsModuleID} page ${page}...`);

        const params = {
            preset_id: newsModuleID,
            session_id: sessionID,
            page: page.toString(),
        };
        const data = await enjinRequest<News.GetNews>(params, 'News.getNews', domain);

        if (data.error) {
            console.log(`Error getting news posts for module ${newsModuleID}: ${data.error.code} ${data.error.message}`)
            break;
        }

        result = data.result;

        if (result.length > 0) {
            result.forEach((newsPost) => {
                newsPosts[newsPost.article_id] = newsPost;
            });
            page++;
        }
    } while (result.length > 0);

    return { [newsModuleID]: newsPosts };
}

export async function getNews(database: Database, domain: string, sessionID: string, newsModuleIDs: string[]): Promise<NewsContent> {
    let allNews: NewsContent = {};

    const totalNewsModules = newsModuleIDs.length;
    let currentNewsModule = 1;
    for (const newsModuleID of newsModuleIDs) {
        console.log(`Getting news posts for module ${newsModuleID}... (${currentNewsModule}/${totalNewsModules})`);
        const moduleNews = await getModuleNews(domain, sessionID, newsModuleID);
        allNews = { ...allNews, ...moduleNews };
    }

    for (const moduleID in allNews) {
        const newsModule = allNews[moduleID];
        for (const articleID in newsModule) {
            const newsArticle = newsModule[articleID];
            insertNewsTable(database, articleID, newsArticle);
        }
    }

      
    return allNews;
}