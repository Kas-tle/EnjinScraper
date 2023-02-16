import axios from 'axios';
import { EnjinResponse } from '../util/interfaces';

interface UserTag {
    tag_id: string;
    site_id: string;
    expiry_time: string;
    tagname: string;
    numusers: string;
    visible: string;
    have_image: string;
    ordering: string;
    show_area: string;
    tag_color: string;
    tag_color_username: string;
    tag_url: string;
    tag_url_newwindow: string;
    tag_background: string;
    tag_prefix: string;
    tag_prefix_color: string;
    tag_post_color: string;
    tag_post_opacity: string;
    tag_post_bg_color: string;
    tag_background_color: string;
    microtag_text: string;
    microtag_text_color: string;
    microtag_bg_color: string;
    microtag_bg_style: string;
    microtag_image: string;
    microtag_icon: string;
    tag_forum_title: string;
    category_id: string | null;
    award_status: string;
    award_name: string;
    award_group: string;
    award_large_image: string;
    award_small_image: string;
    award_large_bg: string;
    award_display: string;
    award_description: string;
    award_sort: string;
    award_wall_post: string;
    category_order: string | null;
    url: string;
}

async function getUserTags(domain: string, apiKey: string, userID: string): Promise<UserTag[]> {
    const { data } = await axios.post<EnjinResponse<UserTag[]>>(
        `https://${domain}/api/v1/api.php`,
        {
            jsonrpc: '2.0',
            id: '12345',
            method: 'UserAdmin.getUserTags',
            params: { api_key: apiKey, user_id: userID },
        },
        { headers: { 'Content-Type': 'application/json' } }
    );

    if (data.error) {
        console.log(`Error getting user tags for user ${userID}: ${data.error.code} ${data.error.message}`);
    }

    return data.result;
}

export async function getAllUserTags(domain: string, apiKey: string, users: Record<string, any>): Promise<Record<string, UserTag[]>> {
    console.log('Getting all user tags...');
    let allUserTags: Record<string, UserTag[]> = {};

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