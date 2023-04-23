import * as cheerio from 'cheerio';
import { Database } from 'sqlite3';
import { News, NewsArticle } from '../interfaces/news';
import { insertRow } from '../util/database';
import { enjinRequest, throttledGetRequest } from '../util/request';
import { SiteAuth } from '../interfaces/generic';
import { MessageType, statusMessage } from '../util/console';

interface NewsContent {
    [key: string]: {
        [key: string]: NewsArticle;
    }
}
interface NewsModule {
    [key: string]: NewsArticle;
}

async function getModuleNews(domain: string, sessionID: string, siteAuth: SiteAuth, newsModuleID: string, database: Database) {
    let result: News.GetNews = [];

    let page = 1;
    do {
        statusMessage(MessageType.Process, `Getting news posts for module ${newsModuleID} page ${page}...`);

        const params = {
            preset_id: newsModuleID,
            session_id: sessionID,
            page: page.toString(),
        };
        const data = await enjinRequest<News.GetNews>(params, 'News.getNews', domain);

        if (data.error) {
            statusMessage(MessageType.Error, `Error getting news posts for module ${newsModuleID}: ${data.error.code} ${data.error.message}`);
            break;
        }

        result = data.result;

        if (result.length > 0) {
            for (const newsPost of result) {
                const values = [
                    newsPost.article_id,
                    newsModuleID,
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
                    newsPost.displayname,
                    null
                ]
                
                if (+newsPost.num_comments > 0) {
                    const commentCid = await getNewsCommentsCid(domain, siteAuth, newsModuleID, newsPost.article_id);
                    values[values.length-1] = commentCid;
                }

                await insertRow(database, 'news_articles', ...values)
            };
            page++;
        }
    } while (result.length > 0);
}

async function getNewsCommentsCid(domain: string, siteAuth: SiteAuth, moduleID: string, articleID: string): Promise<string | null> {
    const newsArticleResonse = await throttledGetRequest(domain, `/home/m/${moduleID}/article/${articleID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
    }, '/getNewsCommentsCid')

    const $ = cheerio.load(newsArticleResonse.data);
    let commentCid = null;

    $('script').each((_i, el) => {
        const scriptContents = $(el).html();
        if (scriptContents && scriptContents.indexOf('enjinComments') !== -1) {
            const commentCidMatch = scriptContents.match(/comment_cid: (\d+)/);
            if (commentCidMatch) {
                commentCid = commentCidMatch[1];
                return false; // break out of each loop once we find a matching comment_cid value
            }
        }
    });

    statusMessage(MessageType.Plain, `Found comment cid ${commentCid} for news article ${articleID}`);
    return commentCid;
}

export async function getNews(database: Database, domain: string, sessionID: string, siteAuth: SiteAuth, newsModuleIDs: string[]) {
    await insertRow(database, 'scrapers', 'news', false);
    const totalNewsModules = newsModuleIDs.length;
    let currentNewsModule = 1;
    for (const newsModuleID of newsModuleIDs) {
        statusMessage(MessageType.Process, `Getting news posts for module ${newsModuleID} [(${currentNewsModule}/${totalNewsModules})]`);
        await getModuleNews(domain, sessionID, siteAuth, newsModuleID, database);
    }
}