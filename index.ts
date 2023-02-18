import { getConfig } from './src/util/config';
import { ensureDirectory, writeJsonFile } from './src/util/writer';
import { authenticate, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplications } from './src/scrapers/applications';
import { getUsers } from './src/scrapers/users';
import { getAllUserTags } from './src/scrapers/usertags';

async function main(): Promise<void> {
    // Needed for exit handler
    process.stdin.resume();

    // Get config
    const config = await getConfig();

    // Log in and get session ID
    const sessionID = config.sessionID ? config.sessionID : await authenticate(config.domain, config.email, config.password);
    console.log(`Session ID: ${sessionID}`);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    console.log(`Site ID: ${siteID}`);

    // Ensure needed directories exist
    ensureDirectory('./target/recovery');

    // Get forums
    if (config.forumModuleIDs && !(config.forumModuleIDs.length === 0) && !config.disabledModules?.forums) {
        const forums = await getForums(config.domain, sessionID, config.forumModuleIDs);
        writeJsonFile('./target/forums.json', forums);
    } else {
        console.log('No forum module IDs provided or module disabled, skipping forum scraping.');
    }

    // Get news
    if (config.newsModuleIDs && !(config.newsModuleIDs.length === 0) && !config.disabledModules?.news) {
        const news = await getNews(config.domain, sessionID, config.newsModuleIDs);
        writeJsonFile('./target/news.json', news);
    } else {
        console.log('No news module IDs provided or module disabled, skipping news scraping.');
    }

    // Get tickets
    if (!config.disabledModules?.tickets) {
        const tickets = await getAllTickets(config.domain, config.apiKey, sessionID);
        writeJsonFile('./target/tickets.json', tickets);
    } else {
        console.log('Tickets module disabled, skipping ticket scraping.');
    }

    // Get applications
    if (!config.disabledModules?.applications) {
        const applications = await getApplications(config.domain, sessionID, siteID);
        writeJsonFile('./target/applications.json', applications);
    } else {
        console.log('Applications module disabled, skipping application scraping.');
    }

    // Get users
    if (!config.disabledModules?.users) {
        const users = await getUsers(config.domain, config.apiKey);
        writeJsonFile('./target/users.json', users);
        if (!config.disabledModules?.usertags) {
            // Get user tags
            const userTags = await getAllUserTags(config.domain, config.apiKey, users);
            writeJsonFile('./target/usertags.json', userTags);
        } else {
            console.log('User tags module disabled, skipping user tag scraping.');
        }
    } else {
        console.log('Users module disabled, skipping user scraping.');
    }
}

main();