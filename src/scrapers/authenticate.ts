import axios from 'axios';
import { EnjinResponse } from '../util/interfaces';

export async function authenticate(domain: string, email: string, password: string): Promise<string> {
    const { data } = await axios.post<EnjinResponse<{ session_id: string }>>(
        `https://${domain}/api/v1/api.php`,
        {
            jsonrpc: '2.0',
            id: '1',
            method: 'User.login',
            params: { email, password },
        },
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    if (data.error) {
        throw new Error(`Error authenticating: ${data.error.code} ${data.error.message}`);
    }

    return data.result.session_id;
}

export async function getSiteID(domain: string): Promise<string> {
    const { data } = await axios.post<EnjinResponse<{ latest_user: { site_id: string } }>>(
        `https://${domain}/api/v1/api.php`,
        {
            jsonrpc: '2.0',
            id: '12345',
            params: {},
            method: 'Site.getStats',
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    if (data.error) {
        throw new Error(`Error getting site ID: ${data.error.code} ${data.error.message}`);
    }

    const { result } = data;
    return result.latest_user.site_id;
}