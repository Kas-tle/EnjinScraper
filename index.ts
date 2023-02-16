import { getConfig } from './src/util/config';
import { ensureDirectory, writeJsonFile } from './src/util/writer';
import { authenticate, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplications } from './src/scrapers/applications';

async function main(): Promise<void> {
    const config = await getConfig();
    
    // Log in and get session ID
    const sessionID = config.sessionID ? config.sessionID : await authenticate(config.domain, config.email, config.password);
    console.log(`Session ID: ${sessionID}`);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    console.log(`Site ID: ${siteID}`);

    // Ensure output directory exists
    ensureDirectory('./target');

    // Get forums
    if (config.forumModuleIDs && !(config.forumModuleIDs.length === 0)) {
        const forums = await getForums(config.domain, sessionID, config.forumModuleIDs);
        writeJsonFile('forums.json', forums);
    } else {
        console.log('No forum module IDs provided, skipping forum scraping.');
    }


    // Get news
    if (config.newsModuleIDs && !(config.newsModuleIDs.length === 0)) {
        const news = await getNews(config.domain, sessionID, config.newsModuleIDs);
        writeJsonFile('news.json', news);
    } else {
        console.log('No news module IDs provided, skipping news scraping.');
    }

    // Get tickets
    const tickets = await getAllTickets(config.domain, config.apiKey, sessionID);
    writeJsonFile('./target/tickets.json', tickets);


    // Get applications
    const applications = await getApplications(config.domain, sessionID, siteID);
    writeJsonFile('./target/applications.json', applications);
}

main();