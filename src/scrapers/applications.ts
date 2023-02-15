import axios from 'axios';

import { EnjinResponse } from '../interfaces';

interface EnjinApplicationTypes {
    [key: string]: string;
}

interface EnjinApplicationIDs {
    items:
    {
        application_id: string;
    }[]
}

interface EnjinApplication {
    application_id: string;
    site_id: string;
    preset_id: string;
    title: string;
    user_ip: string;
    is_mine: boolean;
    can_manage: boolean;
    created: string;
    updated: string;
    read: boolean;
    comments: number;
    app_comments: string;
    admin_comments: string;
    site_name: string;
    user_id: string;
    is_online: boolean;
    username: string;
    avatar: string;
    admin_user_id: string;
    admin_online: boolean;
    admin_username: string;
    admin_avatar: string;
    site_logo: string;
    user_data: {
        [key: string]: string | number | string[];
    };
    is_archived: boolean;
    is_trashed: boolean;
    allow_app_comments: string;
    post_app_comments: boolean;
    allow_admin_comments: boolean;
}

async function getApplicationTypes(domain: string): Promise<string[]> {
    const response = await axios.post<EnjinResponse<EnjinApplicationTypes>>(`https://${domain}/api/v1/api.php`, {
        jsonrpc: '2.0',
        id: '12345',
        params: {},
        method: 'Applications.getTypes',
    }, {
        headers: { 'Content-Type': 'application/json' },
    });
    const { result } = response.data;
    return Object.keys(result);
}

async function getApplicationIDs(domain: string, types: string[], sessionID: string, siteID: string): Promise<string[]> {
    const applicationIDs: string[] = [];

    await Promise.all(types.map(async (type) => {
        let page = 1;
        while (true) {
            const response = await axios.post<EnjinResponse<EnjinApplicationIDs>>(`https://${domain}/api/v1/api.php`, {
                jsonrpc: '2.0',
                id: '12345',
                params: {
                    session_id: sessionID,
                    type,
                    site_id: siteID,
                    page,
                },
                method: 'Applications.getList',
            }, {
                headers: { 'Content-Type': 'application/json' },
            });
            const { result } = response.data;
            if (result.items.length === 0) {
                break;
            }
            applicationIDs.push(...result.items.map((item: { application_id: string }) => item.application_id));
            page++;
        }
    }));

    return applicationIDs;
}

export async function getApplications(domain: string, sessionID: string, siteID: string): Promise<EnjinApplication[]> {
    const applications: EnjinApplication[] = [];

    const applicationTypes = await getApplicationTypes(domain);
    const applicationIDs = await getApplicationIDs(domain, applicationTypes, sessionID, siteID);

    for (const id of applicationIDs) {
        const response = await axios.post<EnjinResponse<EnjinApplication>>(`https://${domain}/api/v1/api.php`, {
            jsonrpc: '2.0',
            id: '12345',
            params: {
                session_id: sessionID,
                application_id: id,
            },
            method: 'Applications.getApplication',
        }, {
            headers: { 'Content-Type': 'application/json' },
        });
        const { result } = response.data;
        applications.push(result);
    }

    return applications;
}