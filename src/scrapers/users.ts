import { Database } from 'sqlite3';
import { UserAdmin, UserAdminUser } from '../interfaces/useradmin';
import { enjinRequest } from '../util/request';
import { insertRow, insertRows } from '../util/database';
import { getAllUserTags } from './usertags';

export async function getUsers(database: Database, domain: string, apiKey: string) {
    const allUserTags = await getAllUserTags(domain, apiKey);
    console.log('Getting all users...');
    await insertRow(database, 'scrapers', 'users', false);
    let result: UserAdmin.Get = {};
    const userDB: [
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string | null, 
        string
    ][] = [];

    let page = 1;

    do {
        console.log(`Getting users page ${page}...`)

        const params = {
            api_key: apiKey,
            characters: 'true',
            mcplayers: 'true',
            page: page.toString(),
        }
        const data = await enjinRequest<UserAdmin.Get>(params, 'UserAdmin.get', domain);

        if (data.error) {
            console.log(`Error getting users page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        result = data.result;

        if (Object.keys(result).length > 0) {
            Object.keys(result).forEach((userID) => {
                const user = result[userID];
                userDB.push([
                    userID,
                    user.username,
                    user.forum_post_count,
                    user.forum_votes,
                    user.lastseen,
                    user.datejoined,
                    user.points_total,
                    user.points_day,
                    user.points_week,
                    user.points_month,
                    user.points_forum,
                    user.points_purchase,
                    user.points_other,
                    user.points_spent,
                    user.points_decayed,
                    userID in allUserTags ? JSON.stringify(allUserTags[userID]) : null,
                    user.points_adjusted
                ]);
            });
            page++;
        }
    } while (Object.keys(result).length > 0);

    await insertRows(database, 'users', userDB);

    console.log(`Finished getting all pages for users.`)
}