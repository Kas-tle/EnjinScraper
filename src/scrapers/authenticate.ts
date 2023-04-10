import fs from 'fs';
import path from 'path';
import { Site } from "../interfaces/site";
import { User } from "../interfaces/user";
import { enjinRequest } from '../util/request';

export async function authenticate(domain: string, email: string, password: string): Promise<string> {
    const params = {
        email,
        password,
    }

    const data = await enjinRequest<User.Login>(params, 'User.login', domain);

    if (data.error) {
        throw new Error(`Error authenticating: ${data.error.code} ${data.error.message}`);
    }

    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), './config.json')).toString());
    config.sessionID = data.result.session_id;
    fs.writeFileSync(path.join(process.cwd(), './config.json'), JSON.stringify(config, null, 4));

    return data.result.session_id;
}

export async function getSiteID(domain: string): Promise<string> {
    const data = await enjinRequest<Site.GetStats>({}, 'Site.getStats', domain);

    if (data.error) {
        throw new Error(`Error getting site ID: ${data.error.code} ${data.error.message}`);
    }

    const { result } = data;
    return result.latest_user.site_id;
}