import axios from 'axios';
import { EnjinResponse } from '../util/interfaces';

async function getModuleNews(domain: string, sessionID: string, newsModuleID: string): Promise<Record<string, any>> {
    let newsPosts: Record<string, any> = {};
    let result: Record<string, any>[] = [];

    let page = 1;
    do {
        const { data } = await axios.post<EnjinResponse<Record<string, any>[]>>(
            `https://${domain}/api/v1/api.php`,
            {
                jsonrpc: '2.0',
                id: '1',
                method: 'News.getNews',
                params: { preset_id: newsModuleID, session_id: sessionID, page: page.toString() },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log(JSON.stringify(data, null, 4));

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

export async function getNews(domain: string, sessionID: string, newsModuleIDs: string[]): Promise<Record<string, any>> {
    let allNews: Record<string, any> = {};

    for (const newsModuleID of newsModuleIDs) {
        const moduleNews = await getModuleNews(domain, sessionID, newsModuleID);
        allNews = { ...allNews, ...moduleNews };
    }

    return allNews;
}