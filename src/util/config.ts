import fs from 'fs';
import readline from 'readline';
import { SiteAuth, Account } from '../interfaces/generic';
import { MessageType, statusMessage } from './console';

export interface Config {
    apiKey: string | null;
    domain: string;
    email: string;
    password: string;
    adminMode?: boolean;
    sessionID?: string;
    siteAuth?: SiteAuth;
    excludeHTMLModuleIDs?: string[];
    excludeForumModuleIDs?: string[];
    excludeNewsModuleIDs?: string[];
    excludeTicketModuleIDs?: string[];
    excludedWikiModuleIDs?: string[];
    manualForumModuleIDs?: string[];
    manualNewsModuleIDs?: string[];
    manualTicketModuleIDs?: string[];
    manualWikiModuleIDs?: string[];
    manualUserIDs?: string[];
    disabledModules: {
        html: boolean;
        forums: boolean | {
            postIPs: boolean;
		};
        galleries: boolean;
        news: boolean;
        wikis: boolean;
        tickets: boolean;
        applications: boolean;
        comments: boolean;
        users: boolean | {
            ips: boolean;
            tags: boolean;
            fullinfo: boolean;
            characters: boolean;
            games: boolean;
            photos: boolean;
            wall: boolean;
            yourFriends: boolean;
        };
        files: boolean | {
            s3: boolean;
            wiki: boolean;
            avatars: boolean;
            profileCovers: boolean;
            gameBoxes: boolean;
            userAlbums: boolean;
        };
    };
    retrySeconds: number;
    retryTimes: number;
    debug: boolean;
    disableSSL: boolean;
    notifier?: {
        enabled: boolean;
        messageSubject: string;
        messageBody: string;
        accounts: Account[];
    };
    overrideScrapeProgress?: boolean;
}

const defaultConfig: Config = {
    apiKey: "someapiKey",
    domain: "www.example.com",
    email: "someemail@email.com",
    password: "somepassword",
    excludeHTMLModuleIDs: [
        "1000001",
        "1000002"
    ],
    excludeForumModuleIDs: [],
    excludeNewsModuleIDs: [],
    excludeTicketModuleIDs: [],
    excludedWikiModuleIDs: [],
    manualForumModuleIDs: [],
    manualNewsModuleIDs: [],
    manualTicketModuleIDs: [],
    manualWikiModuleIDs: [],
    manualUserIDs: [],
    disabledModules: {
        html: false,
        forums: {
            postIPs: true,
		},
        galleries: false,
        news: false,
        wikis: false,
        tickets: false,
        applications: false,
        comments: false,
        users: {
            ips: false,
            tags: false,
            fullinfo: true,
            characters: true,
            games: true,
            photos: true,
            wall: true,
            yourFriends: false,
        },
        files: {
            s3: false,
            wiki: false,
            avatars: true,
            profileCovers: true,
            gameBoxes: true,
            userAlbums: true
        },
    },
    retrySeconds: 5,
    retryTimes: 5,
    debug: true,
    disableSSL: false,
    notifier: {
        enabled: false,
        messageSubject: "",
        messageBody: "",
        accounts: [
            {
                email: "someemail@email.com",
                password: "somepassword"
            },
            {
                email: "someemail2@email.com",
                password: "somepassword2"
            }
        ]
    },
    overrideScrapeProgress: false
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
        statusMessage(MessageType.Info, "If you are not using a site admin account, please exit as you must manually specify the IDs of modules you wish to scrape in the confg.json file");
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
    const apiKeyResponse = await question("Enjin Site API Key (e.g. 63858afe02dda02e895785894eae98f8a93d15920e64209b, or null for no key): ");
    let apiKey = (apiKeyResponse === '' || apiKeyResponse === 'null') ? null : apiKeyResponse;

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
                    const apiKeyResponse = await question("Enjin Site API Key (e.g. 63858afe02dda02e895785894eae98f8a93d15920e64209b): ");
                    apiKey = (apiKeyResponse === '' || apiKeyResponse === 'null') ? null : apiKeyResponse;
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