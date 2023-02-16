import axios from 'axios';
import { EnjinResponse } from '../util/interfaces';

interface User {
    username: string;
    forum_post_count: string;
    forum_votes: string;
    lastseen: string;
    datejoined: string;
    points_total: any;
    points_day: any;
    points_week: any;
    points_month: any;
    points_forum: any;
    points_purchase: any;
    points_other: any;
    points_spent: any;
    points_decayed: any;
    points_adjusted: any;
}

interface UsersResponse {
    [key: string]: User;
}

export async function getUsers(domain: string, apiKey: string): Promise<Record<string, User>> {
    console.log('Getting all users...');
    let result: Record<string, any> = {};
    const users: Record<string, User> = {};
    let page = 1;

    do {
        console.log(`Getting users page ${page}...`)
        const { data } = await axios.post<EnjinResponse<UsersResponse>>(
            `https://${domain}/api/v1/api.php`,
            {
                jsonrpc: '2.0',
                id: '12345',
                method: 'UserAdmin.get',
                params: { api_key: apiKey, characters: 'true', mcplayers: 'true', page: page.toString() },
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (data.error) {
            console.log(`Error getting users page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        const result = data.result;

        if (Object.keys(result).length > 0) {
            Object.keys(result).forEach((userID) => {
                users[userID] = result[userID];
            });
            page++;
        }
    } while (Object.keys(result).length > 0);

    console.log(`Finished getting all pages for users.`)
    return users;
}