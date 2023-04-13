import fs from 'fs';
import { SiteAuth } from '../interfaces/generic';

interface Config {
    apiKey: string;
    domain: string;
    email: string;
    password: string;
    sessionID?: string;
    siteAuth: SiteAuth;
    forumModuleIDs?: string[];
    newsModuleIDs?: string[];
    disabledModules?: {
        forums?: boolean;
        news?: boolean;
        tickets?: boolean;
        applications?: boolean;
        comments?: boolean;
        users?: boolean;
        usertags?: boolean;
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
    forumModuleIDs: [
        "1000001",
        "1000002"
    ],
    newsModuleIDs: [
        "1000001",
        "1000002"
    ],
    disabledModules: {
        forums: false,
        news: false,
        tickets: false,
        applications: false,
        comments: false,
        users: false
    },
    debug: false
};

let cachedConfig: Config | null = null;

export async function getConfig(): Promise<Config> {
    if (cachedConfig) {
        return cachedConfig;
    }
    try {
        //const credentialsData = await fs.promises.readFile("credentials.json", "utf-8");
        const configData = await fs.promises.readFile("config.json", "utf-8");
        const config = JSON.parse(configData);
        cachedConfig = config;
        return config;
    } catch (err) {
        console.error("No config file found, generating default config. Please fill out config.json and run the program again to continue.");
        await fs.promises.writeFile("config.json", JSON.stringify(defaultConfig, null, 4));
        process.exit(1);
    }
}