import { Database } from 'sqlite3';
import { UserAdmin } from '../interfaces/useradmin';
import { enjinRequest } from '../util/request';
import { insertRow } from '../util/database';

export async function getUsers(database: Database, domain: string, apiKey: string) {
    console.log('Getting all users...');
    await insertRow(database, 'scrapers', 'users', false);
    let result: UserAdmin.Get = {};
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
            const userIDs = Object.keys(result);
            for (let i = 0; i < userIDs.length; i++) {
                const userID = userIDs[i];
                const user = result[userID];
                await insertRow(
                    database,
                    "users",
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
                    null,
                    user.points_adjusted
                );
            }
            page++;
        }
    } while (Object.keys(result).length > 0);

    console.log(`Finished getting all pages for users.`)
}