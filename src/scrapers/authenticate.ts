import fs from 'fs';
import path from 'path';
import * as readline from 'readline';
import * as cheerio from 'cheerio';
import { Site } from "../interfaces/site";
import { User } from "../interfaces/user";
import { enjinRequest, getRequest, postRequest } from '../util/request';
import { SiteAuth } from '../interfaces/generic';
import { MessageType, statusMessage } from '../util/console';
import { getErrorMessage } from '../util/error';

export async function authenticateAPI(domain: string, email: string, password: string): Promise<string> {
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

    statusMessage(MessageType.Completion, `Authenticated with session ID ${data.result.session_id}`)
    return data.result.session_id;
}

export async function authenticateAPINotifier(domain: string, email: string, password: string): Promise<string> {
    const params = {
        email,
        password,
    }

    const data = await enjinRequest<User.Login>(params, 'User.login', domain);

    if (data.error) {
        throw new Error(`Error authenticating: ${data.error.code} ${data.error.message}`);
    }

    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), './config.json')).toString());
    let foundAccount = false;
    let sessionID = data.result.session_id;
    if (!config.notifier.accounts || config.notifier.accounts.length == 0) {
        let account = { email, password, sessionID };
        config.notifier.accounts = [ account ];
    } else{
        for (let i = 0; !foundAccount && i < config.notifier.accounts.length; i++) {
            if (email === config.notifier.accounts[i].email) {
                config.notifier.accounts[i].sessionID = sessionID;
                foundAccount = true;
            }
        }
        if (!foundAccount) {
            let account = { email, password, sessionID };
            config.notifier.accounts.push(account);
        }
    }
    fs.writeFileSync(path.join(process.cwd(), './config.json'), JSON.stringify(config, null, 4));

    statusMessage(MessageType.Completion, `Authenticated with session ID ${data.result.session_id}`)
    return data.result.session_id;
}

function booleanPromptUser(question: string): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(`${question} (y/n) `, (answer) => {
            if (answer.toLowerCase() === 'y') {
                statusMessage(MessageType.Plain, 'Continuing...')
                resolve();
            } else if (answer.toLowerCase() === 'n') {
                statusMessage(MessageType.Plain, 'Exiting...')
                rl.close();
                process.exit(0);
            } else {
                statusMessage(MessageType.Plain, 'Invalid input. Please enter y or n.');
                booleanPromptUser(question).then(resolve);
            }
        });
    });
}

export async function authenticateSite(domain: string, email: string, password: string): Promise<SiteAuth | null> {
    try {
        const loginResponse = await getRequest(domain, '/login', {}, '/authenticateSite/loginResponse');
        const setCookie = loginResponse.headers['set-cookie'];
        const cf_bm_token = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];
        const lastviewed = setCookie!.find((cookie: string) => cookie.includes('lastviewed'))!.split(';')[0];

        const $ = cheerio.load(loginResponse.data);
        const formName = $('div.input input[type="password"]').attr('name');

        const formData = new URLSearchParams({
            m: '0',
            do: '',
            username: email,
            [formName!]: password
        });

        const postLoginResponse = await postRequest(domain, '/login', formData, {
            Cookie: `${lastviewed}; enjin_browsertype=web; ${cf_bm_token}`,
        }, '/authenticateSite');

        const phpSessID = postLoginResponse.headers['set-cookie']!.find((cookie: string) => cookie.includes('PHPSESSID'))!.split(';')[0];

        const homeResponse = await getRequest(domain, '/', {
            Cookie: `${lastviewed}; ${phpSessID}; enjin_browsertype=web; ${cf_bm_token}; login_temp=1`,
        }, '/authenticateSite/homeResponse');

        const csrfToken = homeResponse.headers['set-cookie']!.find((cookie: string) => cookie.includes('csrf_token'))!.split(';')[0];

        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), './config.json')).toString());
        config.siteAuth = { phpSessID, csrfToken };
        fs.writeFileSync(path.join(process.cwd(), './config.json'), JSON.stringify(config, null, 4));

        statusMessage(MessageType.Completion, `Authenticated with PHPSESSID and CSRF token`);
        return { phpSessID, csrfToken };
    } catch (error) {
        statusMessage(MessageType.Error, `Error authenticating: ${getErrorMessage(error)}`);
        statusMessage(MessageType.Info, 'This seriously limit the info we can scrape from the site.');
        statusMessage(MessageType.Info, 'If you have 2FA enabled, you should disable it and try again later.');
        await booleanPromptUser('Do you still want to continue?')

        return null;
    }
}

export async function authenticateSiteNotifier(domain: string, email: string, password: string): Promise<SiteAuth | null> {
    try {
        const loginResponse = await getRequest(domain, '/login', {}, '/authenticateSite/loginResponse');
        const setCookie = loginResponse.headers['set-cookie'];
        const cf_bm_token = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];
        const lastviewed = setCookie!.find((cookie: string) => cookie.includes('lastviewed'))!.split(';')[0];

        const $ = cheerio.load(loginResponse.data);
        const formName = $('div.input input[type="password"]').attr('name');

        const formData = new URLSearchParams({
            m: '0',
            do: '',
            username: email,
            [formName!]: password
        });

        const postLoginResponse = await postRequest(domain, '/login', formData, {
            Cookie: `${lastviewed}; enjin_browsertype=web; ${cf_bm_token}`,
        }, '/authenticateSite');

        const phpSessID = postLoginResponse.headers['set-cookie']!.find((cookie: string) => cookie.includes('PHPSESSID'))!.split(';')[0];

        const homeResponse = await getRequest(domain, '/', {
            Cookie: `${lastviewed}; ${phpSessID}; enjin_browsertype=web; ${cf_bm_token}; login_temp=1`,
        }, '/authenticateSite/homeResponse');

        const csrfToken = homeResponse.headers['set-cookie']!.find((cookie: string) => cookie.includes('csrf_token'))!.split(';')[0];

        const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), './config.json')).toString());
        let siteAuth = { phpSessID, csrfToken };
        let foundAccount = false;
        if (!config.notifier.accounts || config.notifier.accounts.length == 0) {
            let account = { email, password, siteAuth  };
            config.notifier.accounts = [ account ];
        }
        else {
            for (let i = 0; !foundAccount && i < config.notifier.accounts.length; i++) {
                if (email === config.notifier.accounts[i].email) {
                    config.notifier.accounts[i].siteAuth = siteAuth;
                    foundAccount = true;
                }
            }
            if (!foundAccount) {
                let account = { email, password, siteAuth };
                config.notifier.accounts.push(account);
            }
        }
        fs.writeFileSync(path.join(process.cwd(), './config.json'), JSON.stringify(config, null, 4));

        statusMessage(MessageType.Completion, `Authenticated with PHPSESSID and CSRF token`);
        return { phpSessID, csrfToken };
    } catch (error) {
        statusMessage(MessageType.Error, `Error authenticating: ${getErrorMessage(error)}`);
        statusMessage(MessageType.Info, 'This seriously limit the info we can scrape from the site.');
        statusMessage(MessageType.Info, 'If you have 2FA enabled, you should disable it and try again later.');
        await booleanPromptUser('Do you still want to continue?')

        return null;
    }
}

export async function getSiteID(domain: string): Promise<string> {
    const data = await enjinRequest<Site.GetStats>({}, 'Site.getStats', domain);

    if (data.error) {
        throw new Error(`Error getting site ID: ${data.error.code} ${data.error.message}`);
    }

    const { result } = data;

    return result.latest_user.site_id;
}

export async function isSiteAdmin(domain: string, siteAuth: SiteAuth): Promise<boolean> {
    const adminResponse = await getRequest(domain, '/admin', {
        Cookie: `${siteAuth.phpSessID}; enjin_browsertype=web; ${siteAuth.csrfToken}`,
    }, '/isSiteAdmin');

    const $ = cheerio.load(adminResponse.data);

    return !($('.header_text_text').text() === 'Error');
}