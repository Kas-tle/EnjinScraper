import fs from 'fs';
import { SiteAuth } from '../interfaces/generic';
import { MessageType, statusMessage } from './console';

interface Config {
    apiKey: string;
    domain: string;
    email: string;
    password: string;
    sessionID?: string;
    siteAuth: SiteAuth;
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
}

const defaultConfig: Config = {
    apiKey: "someapiKey",
    domain: "www.example.com",
    email: "someemail@email.com",
    password: "somepassword",
    sessionID: "someSessionID",
    siteAuth: {
        phpSessID: "somePHPSESSID",
        csrfToken: "someCSRFToken"
    },
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
    debug: false
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
        statusMessage(MessageType.Info, "No config file found, generating default config. Please fill out config.json and run the program again to continue.");
        await fs.promises.writeFile("config.json", JSON.stringify(defaultConfig, null, 4));
        process.exit(1);
    }
}