import fs from 'fs';

interface Config {
    apiKey: string;
    domain: string;
    email: string;
    password: string;
    sessionID?: string;
    forumModuleIDs?: string[];
    newsModuleIDs?: string[];
}

const defaultConfig: Config = {
    apiKey: "someapiKey",
    domain: "www.example.com",
    email: "someemail@email.com",
    password: "somepassword",
    sessionID: "someSessionID",
    forumModuleIDs: [
        "1000001",
        "1000002"
    ],
    newsModuleIDs: [
        "1000001",
        "1000002"
    ]
};

export async function getConfig(): Promise<Config> {
    try {
        const configData = await fs.promises.readFile("config.json", "utf-8");
        return JSON.parse(configData);
    } catch (err) {
        console.error("No config file found, generating default config. Please fill out config.json and run the program again to continue.");
        await fs.promises.writeFile("config.json", JSON.stringify(defaultConfig, null, 4));
        return defaultConfig;
    }
}