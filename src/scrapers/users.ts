const sqlite3 = require('sqlite3').verbose();
import { Database } from 'sqlite3';
import { UserAdmin, UserAdminUser } from '../interfaces/useradmin';
import { enjinRequest } from '../util/request';
import { insertUsersTable } from '../util/database';

export async function getUsers(database: Database, domain: string, apiKey: string): Promise<Record<string, UserAdminUser>> {
    console.log('Getting all users...');
    let result: UserAdmin.Get = {};
    const users: Record<string, UserAdminUser> = {};
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
                users[userID] = result[userID];
                insertUsersTable(database, userID, users[userID]);
            });
            page++;
        }
    } while (Object.keys(result).length > 0);

    console.log(`Finished getting all pages for users.`)
    return users;
}