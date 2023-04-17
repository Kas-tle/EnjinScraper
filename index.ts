import { getConfig } from './src/util/config';
import { deleteFiles, ensureDirectory } from './src/util/files';
import { databaseConnection, initializeTables, insertRow, isModuleScraped, queryModuleIDs } from './src/util/database';
import { authenticateAPI, authenticateSite, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplicationResponses, getApplications } from './src/scrapers/applications';
import { getUsers } from './src/scrapers/users';
import { getComments } from './src/scrapers/comments';
import { getSiteData } from './src/scrapers/sitedata';
import { getFiles } from './src/scrapers/files';
import { getWikis } from './src/scrapers/wiki';

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

    // Get site data
    if(await isModuleScraped(database, 'site_data')) {
        console.log('Site data already scraped, moving on...');
    } else {
        await getSiteData(config.domain, siteAuth, database, siteID);
        await insertRow(database, 'scrapers', 'site_data', true);
    }

    // Get forums
    let forumModuleIDs = await queryModuleIDs(database, 'forum');
    config.excludeForumModuleIDs ? forumModuleIDs.filter(id => !config.excludeForumModuleIDs?.includes(id)) : {};
    if (forumModuleIDs.length === 0) {
        console.log('No forum module IDs for site, skipping forum scraping...');
    } else if (config.disabledModules?.forums) {
        console.log('Forums module disabled, skipping forum scraping...');
    } else if (await isModuleScraped(database, 'forums')) {
        console.log('Forums already scraped, skipping forum scraping...');
    } else {
        await getForums(database, config.domain, sessionID, forumModuleIDs);
        await insertRow(database, 'scrapers', 'forums', true);
        deleteFiles(['./target/recovery/forum_progress.json']);
    }

    // Get wikis
    let wikiModuleIDs = await queryModuleIDs(database, 'wiki');
    config.excludedWikiModuleIDs ? wikiModuleIDs.filter(id => !config.excludedWikiModuleIDs?.includes(id)) : {};
    if (wikiModuleIDs.length === 0) {
        console.log('No wiki module IDs for site, skipping wiki scraping...');
    } else if (config.disabledModules?.wikis) {
        console.log('Wikis module disabled, skipping wiki scraping...');
    } else if (await isModuleScraped(database, 'wikis')) {
        console.log('Wikis already scraped, skipping wiki scraping...');
    } else {
        await getWikis(config.domain, database, wikiModuleIDs);
        await insertRow(database, 'scrapers', 'wikis', true);
        deleteFiles(['./target/recovery/wiki_progress.json']);
    }

    // Get news
    let newsModuleIDs = await queryModuleIDs(database, 'news');
    config.excludeNewsModuleIDs ? newsModuleIDs.filter(id => !config.excludeNewsModuleIDs?.includes(id)) : {};
    if (newsModuleIDs.length === 0) {
        console.log('No news module IDs provided, skipping news scraping...');
    } else if (config.disabledModules?.news) {
        console.log('News module disabled, skipping news scraping...');
    } else if (await isModuleScraped(database, 'news')) {
        console.log('News already scraped, skipping news scraping...');
    } else {
        await getNews(database, config.domain, sessionID, siteAuth, newsModuleIDs);
        await insertRow(database, 'scrapers', 'news', true);
    }

    // Get applications
    if (config.disabledModules?.applications) {
        console.log('Applications module disabled, skipping application scraping.');
    } else if (await isModuleScraped(database, 'applications')) {
        console.log('Applications already scraped, skipping application scraping...');
    } else {
        await getApplicationResponses(database, config.domain, sessionID, siteAuth, siteID);
        await getApplications(database, config.domain, siteAuth);
        await insertRow(database, 'scrapers', 'applications', true);
        deleteFiles(['./target/recovery/remaining_applications.json', './target/recovery/application_ids.json']);
    }

    // Get comments (from applications and news posts)
    if (config.disabledModules?.comments) {
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
        await getAllTickets(database, config.domain, config.apiKey, sessionID, siteAuth, config.excludeTicketModuleIDs ?? null);
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

    // Get files
    if (config.disabledModules?.files) {
        console.log('Files module disabled, skipping file scraping.');
    } else if (await isModuleScraped(database, 'files')) {
        console.log('Files already scraped, skipping file scraping...');
    } else {
        await getFiles(config.domain, siteAuth, siteID)
        await insertRow(database, 'scrapers', 'files', true);
        deleteFiles(['./target/recovery/file_progress.json']);
    }

    process.kill(process.pid, 'SIGINT');
}

main();