import { getConfig } from './src/util/config';
import { deleteFiles, ensureDirectory } from './src/util/files';
import { databaseConnection, initializeTables, insertRow, isModuleScraped } from './src/util/database';
import { authenticateAPI, authenticateSite, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplications } from './src/scrapers/applications';
import { getUsers } from './src/scrapers/users';
import { getComments } from './src/scrapers/comments';

async function main(): Promise<void> {
    // Needed for exit handler
    process.stdin.resume();

    // Get config
    const config = await getConfig();

    // Login to API and get session ID
    const sessionID = config.sessionID ? config.sessionID : await authenticateAPI(config.domain, config.email, config.password);
    
    // Login to site and get PHPSESSID and csrf_token
    const siteAuth = config.siteAuth ? config.siteAuth : await authenticateSite(config.domain, config.email, config.password);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    console.log(`Site ID: ${siteID}`);

    // Ensure needed directories exist
    ensureDirectory('./target/recovery');

    // Initialize database tables
    const database = await databaseConnection();
    await initializeTables(database);

    // Get forums
    if (!config.forumModuleIDs || config.forumModuleIDs.length === 0) {
        console.log('No forum module IDs provided, skipping forum scraping...');
    } else if (config.disabledModules?.forums) {
        console.log('Forums module disabled, skipping forum scraping...');
    } else if (await isModuleScraped(database, 'forums')) {
        console.log('Forums already scraped, skipping forum scraping...');
    } else {
        await getForums(database, config.domain, sessionID, config.forumModuleIDs);
        await insertRow(database, 'scrapers', 'forums', true);
        deleteFiles(['./target/recovery/forum_progress.json']);
    }

    // Get news
    if (!config.newsModuleIDs || config.newsModuleIDs.length === 0) {
        console.log('No news module IDs provided, skipping news scraping...');
    } else if (config.disabledModules?.news) {
        console.log('News module disabled, skipping news scraping...');
    } else if (await isModuleScraped(database, 'news')) {
        console.log('News already scraped, skipping news scraping...');
    } else {
        await getNews(database, config.domain, sessionID, siteAuth, config.newsModuleIDs);
        await insertRow(database, 'scrapers', 'news', true);
    }

    // Get applications
    if (config.disabledModules?.applications) {
        console.log('Applications module disabled, skipping application scraping.');
    } else if (await isModuleScraped(database, 'applications')) {
        console.log('Applications already scraped, skipping application scraping...');
    } else {
        await getApplications(database, config.domain, sessionID, siteAuth, siteID);
        await insertRow(database, 'scrapers', 'applications', true);
        deleteFiles(['./target/recovery/remaining_applications.json', './target/recovery/application_ids.json']);
    }

    // Get comments (from applications and news posts)
    if (config.disabledModules?.comments || (config.disabledModules?.news && config.disabledModules?.applications)) {
        console.log('Comments module disabled, skipping comment scraping.');
    } else if (await isModuleScraped(database, 'comments')) {
        console.log('Comments already scraped, skipping comment scraping...');
    } else {
        await getComments(database, config.domain, siteAuth)
        await insertRow(database, 'scrapers', 'comments', true);
        deleteFiles(['./target/recovery/comments.json']);
    }

    // Get tickets
    if (config.disabledModules?.tickets) {
        console.log('Tickets module disabled, skipping ticket scraping.');
    } else if (await isModuleScraped(database, 'tickets')) {
        console.log('Tickets already scraped, skipping ticket scraping...');
    } else {
        await getAllTickets(database, config.domain, config.apiKey, sessionID, siteAuth);
        await insertRow(database, 'scrapers', 'tickets', true);
        deleteFiles(['./target/recovery/module_tickets.json']);
    }

    // Get users
    if (config.disabledModules?.users) {
        console.log('Users module disabled, skipping user tag scraping.');
    } else if (await isModuleScraped(database, 'users')) {
        console.log('Users already scraped, skipping user tag scraping...');
    } else {
        await getUsers(database, config.domain, config.apiKey, config.disabledModules?.usertags);
        await insertRow(database, 'scrapers', 'users', true);
    }

    process.kill(process.pid, 'SIGINT');
}

main();