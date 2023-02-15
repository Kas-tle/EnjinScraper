import axios from 'axios';
import { EnjinResponse } from '../interfaces';

export async function getNews(domain: string, sessionID: string, newsModuleID: string): Promise<Record<string, any>> {
    const newsPosts: Record<string, any> = {};
    let page = 1;
    let result: Record<string, any>[] = [];

    do {
        const { data } = await axios.post<EnjinResponse<Record<string, any>[]>>(
            `https://www.${domain}/api/v1/api.php`,
            {
                jsonrpc: '2.0',
                id: '1',
                method: 'News.getNews',
                params: { preset_id: newsModuleID, session_id: sessionID, page: page.toString() },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        result = data.result;

        if (result.length > 0) {
            result.forEach((newsPost) => {
                newsPosts[newsPost.article_id] = newsPost;
            });
            page++;
        }
    } while (result.length > 0);

    return newsPosts;
}