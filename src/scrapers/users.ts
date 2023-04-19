import { Database } from 'sqlite3';
import { UserAdmin } from '../interfaces/useradmin';
import { enjinRequest, throttledGetRequest } from '../util/request';
import { insertRows, updateRow } from '../util/database';
import { getAllUserTags } from './usertags';
import { UserIPs, UsersDB } from '../interfaces/user';
import { SiteAuth } from '../interfaces/generic';
import { fileExists, parseJsonFile } from '../util/files';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { MessageType, statusMessage } from '../util/console';

async function getUserIPs(domain: string, siteAuth: SiteAuth, database: Database) {
    statusMessage(MessageType.Info, 'Getting user IPs...')

    let userCount = [0];

    const userIDs: string[] = await new Promise((resolve, reject) => {
        database.all('SELECT user_id FROM users',
            (err, rows: [{user_id: string}]) => {
                if (err) {
                    reject(err);
                } else {
                    const userIDs = rows.map(row => row.user_id);
                    resolve(userIDs);
                }
            });
    });

    if(fileExists('./target/recovery/user_ips.json')) {
        statusMessage(MessageType.Info, 'Recovering user ip progress previous session...')
        const progress = parseJsonFile('./target/recovery/user_ips.json') as [number[]];
        userCount = progress[0];
    }

    addExitListeners(['./target/recovery/user_ips.json'],[[userCount]])

    const totalUsers = userIDs.length;

    for (let i = userCount[0]; i < totalUsers; i++) {
        const userIPsResponse = await throttledGetRequest(domain, `/ajax.php?s=admin_users&cmd=getUserAdditionalData&user_id=${userIDs[i]}`, {
            Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
            Referer: `Referer https://${domain}/admin/users`
        }, '/userips');

        const userIPs: UserIPs = userIPsResponse.data;
        await updateRow(database, 'users', 'user_id', userIDs[i], ['ip_history'], [JSON.stringify(userIPs.ips_history)]);
        statusMessage(MessageType.Process, `Found ${userIPs.ips_history.length} IPs for user ${userIDs[i]} [(${++userCount[0]}/${totalUsers})]`);
    }

    removeExitListeners();
}

export async function getUsers(database: Database, domain: string, siteAuth: SiteAuth, apiKey: string, disableUserTags = false, disableUserIPs = false) {
    if(!fileExists('./target/recovery/user_ips.json')) {
        const allUserTags = await getAllUserTags(domain, apiKey, disableUserTags);
        let result: UserAdmin.Get = {};
        const userDB: UsersDB[] = [];
    
        let page = 1;
    
        do {
            statusMessage(MessageType.Process, `Getting users page ${page}...`)
    
            const params = {
                api_key: apiKey,
                characters: 'true',
                mcplayers: 'true',
                page: page.toString(),
            }
            const data = await enjinRequest<UserAdmin.Get>(params, 'UserAdmin.get', domain);
    
            if (data.error) {
                statusMessage(MessageType.Error, `Error getting users page ${page}: ${data.error.code} ${data.error.message}`)
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
                        user.points_adjusted,
                        null
                    ]);
                });
                page++;
            }
        } while (Object.keys(result).length > 0);
    
        await insertRows(database, 'users', userDB);
    }

    disableUserIPs ? {} : await getUserIPs(domain, siteAuth, database);
}