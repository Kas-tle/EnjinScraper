import { getConfig } from './src/util/config';
import { deleteFiles, ensureDirectory, fileExists, writeJsonFile } from './src/util/files';
import { databaseConnection, initializeTables, insertRow, isModuleScraped } from './src/util/database';
import { authenticate, getSiteID } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplications } from './src/scrapers/applications';
import { getUsers } from './src/scrapers/users';
import { getAllUserTags } from './src/scrapers/usertags';
import { queryTable } from './src/util/database';

async function main(): Promise<void> {
    // Needed for exit handler
    process.stdin.resume();

    // Get config
    const config = await getConfig();

    // Log in and get session ID
    const sessionID = config.sessionID ? config.sessionID : await authenticate(config.domain, config.email, config.password);
    //console.log(`Session ID: ${sessionID}`);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    console.log(`Site ID: ${siteID}`);

    // Ensure needed directories exist
    ensureDirectory('./target/recovery');

    // Initialize database tables
    const database = await databaseConnection();
    await initializeTables(database);

    //process.kill(process.pid, 'SIGINT');

    // Get forums
    if (!config.forumModuleIDs || config.forumModuleIDs.length === 0) {
        console.log('No forum module IDs provided, skipping forum scraping...');
    } else if (config.disabledModules?.forums) {
        console.log('Forums module disabled, skipping forum scraping...');
    } else if (fileExists('./target/forums.json')) {
        console.log('Forums already scraped, skipping forum scraping...');
    } else {
        const forums = await getForums(config.domain, sessionID, config.forumModuleIDs);
        writeJsonFile('./target/forums.json', forums);
        deleteFiles(['./target/recovery/forums.json', './target/recovery/forum_progress.json']);
    }

    // Get news
    if (!config.newsModuleIDs || config.newsModuleIDs.length === 0) {
        console.log('No news module IDs provided, skipping news scraping...');
    } else if (config.disabledModules?.news) {
        console.log('News module disabled, skipping news scraping...');
    } else if (await isModuleScraped(database, 'news')) {
        console.log('News already scraped, skipping news scraping...');
    } else {
        await getNews(database, config.domain, sessionID, config.newsModuleIDs);
        await insertRow(database, 'scrapers', 'news', true);
        //await queryTable(database, 'news_articles');
    }

    // Get tickets
    if (config.disabledModules?.tickets) {
        console.log('Tickets module disabled, skipping ticket scraping.');
    } else if (await isModuleScraped(database, 'tickets')) {
        console.log('Tickets already scraped, skipping ticket scraping...');
    } else {
        await getAllTickets(database, config.domain, config.apiKey, sessionID);
        await insertRow(database, 'scrapers', 'tickets', true);
        // await queryTable(database, 'tickets');
        // writeJsonFile('./target/tickets.json', tickets);
        deleteFiles(['./target/recovery/module_tickets.json']);
    }

    // Get applications
    if (config.disabledModules?.applications) {
        console.log('Applications module disabled, skipping application scraping.');
    } else if (await isModuleScraped(database, 'applications')) {
        console.log('Applications already scraped, skipping application scraping...');
    } else {
        await getApplications(database, config.domain, sessionID, siteID);
        await insertRow(database, 'scrapers', 'applications', true);
        //await queryTable(database, 'applications');
        deleteFiles(['./target/recovery/remaining_applications.json', './target/recovery/application_ids.json']);
    }

    // Get users
    if (config.disabledModules?.users) {
        console.log('Users module disabled, skipping user tag scraping.');
    } else if (await isModuleScraped(database, 'users')) {
        console.log('Users already scraped, skipping user tag scraping...');
    } else {
        await getUsers(database, config.domain, config.apiKey);
        await insertRow(database, 'scrapers', 'users', true);
        //await queryTable(database, 'users');
    }

    // Get user tags
    if (config.disabledModules?.usertags) {
        console.log('User tags module disabled, skipping user scraping.');
    } else if (fileExists('./target/userstags.json')) {
        console.log('User tags already scraped, skipping user scraping...');
    } else {
        const userTags = await getAllUserTags(config.domain, config.apiKey);
        writeJsonFile('./target/usertags.json', userTags);
        deleteFiles(['./target/recovery/usertags.json']);
    }

    process.kill(process.pid, 'SIGINT');
}

main();