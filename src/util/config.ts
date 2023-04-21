import fs from 'fs';
import readline from 'readline';
import { SiteAuth } from '../interfaces/generic';
import { MessageType, statusMessage } from './console';

interface Config {
    apiKey: string;
    domain: string;
    email: string;
    password: string;
    sessionID?: string;
    siteAuth?: SiteAuth;
    excludeForumModuleIDs?: string[];
    excludeGalleryModuleIDs?: string[];
    excludeNewsModuleIDs?: string[];
    excludeTicketModuleIDs?: string[];
    excludedWikiModuleIDs?: string[];
    disabledModules?: {
        forums?: boolean;
        galleries?: boolean;
        news?: boolean;
        wikis?: boolean;
        tickets?: boolean;
        applications?: boolean;
        comments?: boolean;
        users?: boolean;
        usertags?: boolean;
        userips?: boolean;
        files?: boolean;
    };
    debug?: boolean;
    disableSSL?: boolean;
}

const defaultConfig: Config = {
    apiKey: "someapiKey",
    domain: "www.example.com",
    email: "someemail@email.com",
    password: "somepassword",
    excludeForumModuleIDs: [
        "1000001",
        "1000002"
    ],
    excludeGalleryModuleIDs: [
        "1000001",
        "1000002"
    ],
    excludeNewsModuleIDs: [
        "1000001",
        "1000002"
    ],
    excludeTicketModuleIDs: [
        "1000001",
        "1000002"
    ],
    excludedWikiModuleIDs: [
        "1000001",
        "1000002"
    ],
    disabledModules: {
        forums: false,
        galleries: false,
        news: false,
        wikis: false,
        tickets: false,
        applications: false,
        comments: false,
        users: false,
        usertags: false,
        userips: false,
        files: false,
    },
    debug: true,
    disableSSL: false
};

let cachedConfig: Config | null = null;

export async function getConfig(): Promise<Config> {
    if (cachedConfig) {
        return cachedConfig;
    }
    try {
        const configData = await fs.promises.readFile("config.json", "utf-8");
        const config = JSON.parse(configData);
        cachedConfig = config;
        return config;
    } catch (err) {
        statusMessage(MessageType.Info, "No config file found. Please provide the required config values");
        statusMessage(MessageType.Info, "Simply input the value and press enter to proceed to the next value");
        statusMessage(MessageType.Info, "If you need help, please visit https://github.com/Kas-tle/EnjinScraper");
        statusMessage(MessageType.Info, "Press Ctrl+C to cancel");
        statusMessage(MessageType.Plain, "");
        const newConfig = await promptForConfig();
        await fs.promises.writeFile("config.json", JSON.stringify(newConfig, null, 4));
        cachedConfig = newConfig;
        return newConfig;
    }
}

async function promptForConfig(): Promise<Config> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt: string) => new Promise<string>((resolve) => {
        rl.question(prompt, resolve);
    });

    let domain = await question("Enjin Site Domain (e.g. www.myforum.com): ");
    let email = await question("Enjin Account Email (e.g. someone@gmail.com): ");
    let password = await question("Enjin Account Password (e.g. B4dP@$swUrD123): ");
    let apiKey = await question("Enjin Site API Key (e.g. 63858afe02dda02e895785894eae98f8a93d15920e64209b): ");

    let confirmed = false;

    while (!confirmed) {
        statusMessage(MessageType.Plain,`
Current values:
    Enjin Site Domain: ${domain}
    Enjin Account Email: ${email}
    Enjin Account Password: ${password}
    Enjin Site API Key: ${apiKey}
        `);

        const confirm = await question("Are these values correct? (y/n): ");

        if (confirm.toLowerCase() === 'y') {
            confirmed = true;
        } else {
            const fieldToEdit = await question("Which field do you want to edit? (apiKey, domain, email, password): ");

            switch (fieldToEdit) {
                case 'apiKey':
                    apiKey = await question("Enjin Site API Key (e.g. 63858afe02dda02e895785894eae98f8a93d15920e64209b): ");
                    break;
                case 'domain':
                    domain = await question("Enjin Site Domain (e.g. www.myforum.com): ");
                    break;
                case 'email':
                    email = await question("Enjin Account Email (e.g. someone@gmail.com): ");
                    break;
                case 'password':
                    password = await question("Enjin Account Password (e.g. B4dP@$swUrD123): ");
                    break;
                default:
                    console.log("Invalid field name. Please try again.");
            }
        }
    }

    rl.close();

    return {
        ...defaultConfig,
        apiKey,
        domain,
        email,
        password
    };
}