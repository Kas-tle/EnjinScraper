import { UserAdmin } from '../interfaces/useradmin';
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

export async function getAllUserTags(domain: string, apiKey: string, users: Record<string, any>): Promise<Record<string, UserAdmin.GetUserTags>> {
    console.log('Getting all user tags...');
    let allUserTags: Record<string, UserAdmin.GetUserTags> = {};

    const totalUsers = Object.keys(users).length;
    let userCount = 1;

    for (const [userID] of Object.entries(users)) {
        console.log(`Getting tags for user ${userID}... (${userCount++}/${totalUsers})`);
        const userTags = await getUserTags(domain, apiKey, userID);
        console.log(`Found ${userTags.length} tags for user ${userID}.`);
        allUserTags[userID] = userTags;
    }

    return allUserTags;
}