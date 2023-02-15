import { ensureDirectory, writeJsonFile } from './src/writer';
import { authenticate, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplications } from './src/scrapers/applications';
import config from './config.json';

async function main(): Promise<void> {
    // Log in and get session ID
    const sessionID = await authenticate(config.domain, config.email, config.password);
    console.log(`Session ID: ${sessionID}`);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    console.log(`Site ID: ${siteID}`);

    // Ensure output directory exists
    ensureDirectory('./target');

    // Get forums
    const forums = await getForums(config.domain, sessionID, config.forumModuleIDs);
    console.log(forums);
    writeJsonFile('forums.json', forums);

    // Get news
    const news = await getNews(config.domain, sessionID, siteID);
    console.log(news);
    writeJsonFile('news.json', news);

    // Get tickets
    const tickets = await getAllTickets(config.domain, config.apiKey, sessionID);
    console.log(tickets);
    writeJsonFile('tickets.json', tickets);


    // Get applications
    const applications = await getApplications(config.domain, sessionID, siteID);
    console.log(applications);
    writeJsonFile('applications.json', applications);
}

main();