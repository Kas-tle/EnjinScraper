import { Database } from 'sqlite3';
import { News, NewsArticle } from '../interfaces/news';
import { insertRow } from '../util/database';
import { enjinRequest } from '../util/request';

interface NewsContent {
    [key: string]: {
        [key: string]: NewsArticle;
    }
}
interface NewsModule {
    [key: string]: NewsArticle;
}

async function getModuleNews(domain: string, sessionID: string, newsModuleID: string, database: Database) {
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
            result.forEach(async (newsPost) => {
                await insertRow(
                    database,
                    'news_articles',
                    newsPost.article_id, 
                    newsPost.user_id, 
                    newsPost.num_comments, 
                    newsPost.timestamp, 
                    newsPost.status, 
                    newsPost.title, 
                    newsPost.content, 
                    newsPost.commenting_mode, 
                    newsPost.ordering, 
                    newsPost.sticky, 
                    newsPost.last_updated, 
                    newsPost.username, 
                    newsPost.displayname
                )
            });
            page++;
        }
    } while (result.length > 0);
}

export async function getNews(database: Database, domain: string, sessionID: string, newsModuleIDs: string[]) {
    await insertRow(database, 'scrapers', 'news', false);
    const totalNewsModules = newsModuleIDs.length;
    let currentNewsModule = 1;
    for (const newsModuleID of newsModuleIDs) {
        console.log(`Getting news posts for module ${newsModuleID}... (${currentNewsModule}/${totalNewsModules})`);
        await getModuleNews(domain, sessionID, newsModuleID, database);
    }
}