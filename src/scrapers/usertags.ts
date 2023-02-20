import { Tags } from '../interfaces/tags';
import { UserAdmin } from '../interfaces/useradmin';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';


async function getUserTags(domain: string, apiKey: string, userID: string): Promise<UserAdmin.GetUserTags> {
    const params = {
        api_key: apiKey,
        user_id: userID,
    }
    const data = await enjinRequest<UserAdmin.GetUserTags>(params, 'UserAdmin.getUserTags', domain);

    if (data.error) {
        console.log(`Error getting user tags for user ${userID}: ${data.error.code} ${data.error.message}`);
    }

    return data.result;
}

export async function getAllUserTags(domain: string, apiKey: string): Promise<Record<string, UserAdmin.GetUserTags>> {
    console.log('Getting all user tags...');
    let taggedUsers: string[] = [];

    if (!fileExists('./target/recovery/usertags.json')) {
        let page = 1;
        while (true) {
            console.log(`Getting tagged users page ${page}...`);

            const params = {
                api_key: apiKey,
                characters: 'true',
                mcplayers: 'true',
                page: page.toString(),
            }
            const data = await enjinRequest<Tags.Get>(params, 'Tags.get', domain);

            if (data.error) {
                console.log(`Error getting tagged users page ${page}: ${data.error.code} ${data.error.message}`);
                break;
            }

            const result = data.result;

            if (result instanceof Array) break;

            taggedUsers.push(...Object.keys(result.users))
            page++;
        };
    }

    let allUserTags: Record<string, UserAdmin.GetUserTags> = {};
    let totalUsers = taggedUsers.length;
    let userCount = [0];

    if (fileExists('./target/recovery/usertags.json')) {
        const progress = parseJsonFile('./target/recovery/usertags.json') as [Record<string, UserAdmin.GetUserTags>, string[], number[]];
        allUserTags = progress[0];
        taggedUsers = progress[1];
        totalUsers = taggedUsers.length;
        userCount[0] = progress[2][0];
    }

    addExitListeners(['./target/recovery/usertags.json'], [[allUserTags, taggedUsers, userCount]])

    for (let i = userCount[0]; i < totalUsers; i++) {
        const userTags = await getUserTags(domain, apiKey, taggedUsers[i]);

        allUserTags[taggedUsers[i]] = userTags;
        console.log(`Found ${userTags.length} tags for user ${taggedUsers[i]} (${++userCount[0]}/${totalUsers})...`);
    }

    removeExitListeners();
    return allUserTags;
}