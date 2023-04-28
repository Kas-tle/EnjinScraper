#! /usr/bin/env node

import fs from 'fs';
import path from 'path';
import packageJson from './package.json';
import { getConfig } from './src/util/config';
import { deleteFiles, ensureDirectory } from './src/util/files';
import { databaseConnection, initializeTables, insertRow, isModuleScraped, queryModuleIDs } from './src/util/database';
import { authenticateAPI, authenticateAPINotifier, authenticateSite, authenticateSiteNotifier, getSiteID, isSiteAdmin } from './src/scrapers/authenticate';
import { getForums } from './src/scrapers/forums';
import { getNews } from './src/scrapers/news';
import { getAllTickets } from './src/scrapers/tickets';
import { getApplicationResponses, getApplications } from './src/scrapers/applications';
import { getAdditionalUserData, getUsers } from './src/scrapers/users';
import { getComments } from './src/scrapers/comments';
import { getSiteData } from './src/scrapers/sitedata';
import { getAvatarFiles, getGameBoxFiles, getProfileCoverFiles, getS3Files, getUserAlbumFiles, getWikiFiles } from './src/scrapers/files';
import { getWikis } from './src/scrapers/wiki';
import { getGalleries } from './src/scrapers/galleries';
import { MessageType, statusMessage } from './src/util/console';
import { getHTMLModules } from './src/scrapers/html';
import { startNotifier } from './src/util/notifier';
import { SiteAuth } from './src/interfaces/generic';

async function main(): Promise<void> {
    // Needed for exit handler
    process.stdin.resume();

    // Print Start Message
    statusMessage(MessageType.Info, `Starting ${packageJson.name} v${packageJson.version}...`);
    statusMessage(MessageType.Info, `For support, please join the support Discord: https://discord.gg/2SfGAMskWt`);

    // Get config
    const config = await getConfig();

    // Login to API and get session ID
    const sessionID = config.sessionID ? config.sessionID : await authenticateAPI(config.domain, config.email, config.password);

    // Login to site and get PHPSESSID and csrf_token
    const siteAuth = config.siteAuth ? config.siteAuth : await authenticateSite(config.domain, config.email, config.password);

    var siteAuths:SiteAuth[] = [];
    if (config.notifier) {
        if (config.notifier.accounts) {
            for (let i = 0; i < config.notifier.accounts.length; i++) {
                if (config.notifier.accounts[i].email === config.email) {
                    config.notifier.accounts[i].sessionID = sessionID;
                    if (siteAuth !== null && typeof siteAuth !== 'undefined') {
                        config.notifier.accounts[i].siteAuth = siteAuth;
                        siteAuths.push(siteAuth);
                    }
                    fs.writeFileSync(path.join(process.cwd(), './config.json'), JSON.stringify(config, null, 4));
                } else {
                    if (!config.notifier.accounts[i].sessionID) {
                        await authenticateAPINotifier(config.domain, config.notifier.accounts[i].email, config.notifier.accounts[i].password);
                    }
                    let curSiteAuth:SiteAuth|undefined|null = config.notifier.accounts[i].siteAuth
                    if (curSiteAuth !== null && typeof curSiteAuth !== 'undefined') {
                        siteAuths.push(curSiteAuth);
                    } else {
                        curSiteAuth = await authenticateSiteNotifier(config.domain, config.notifier.accounts[i].email, config.notifier.accounts[i].password);
                        if (curSiteAuth !== null && typeof curSiteAuth !== 'undefined') {
                            siteAuths.push(curSiteAuth);
                        }
                    }
                }
            }
        } else {
            let email = config.email;
            let password = config.password;
            let siteAuthOrUndefined = siteAuth != null ? siteAuth : undefined;
            let account = { email, password, sessionID, siteAuthOrUndefined };
            config.notifier.accounts = [ account ];
        }
    }

    // Check if we are admin
    let adminMode: boolean = true;
    if (siteAuth !== null && config.adminMode !== false) {
        adminMode = await isSiteAdmin(config.domain, siteAuth);
    } else {
        adminMode = false;
    }
    statusMessage(MessageType.Info, `Admin Mode: ${adminMode}`);

    // Get site ID
    const siteID = await getSiteID(config.domain);
    statusMessage(MessageType.Info, `Site ID: ${siteID}`);

    // Ensure needed directories exist
    ensureDirectory('./target/recovery');

    // Initialize database tables
    const database = await databaseConnection();
    await initializeTables(database);

    // Notifier Mode
    if (siteAuth != null && config.notifier && config.notifier.enabled === true && config.apiKey && siteAuths.length != 0) {
        await startNotifier(database, config.domain, config.apiKey, siteAuths, config.notifier.messageSubject, config.notifier.messageBody);
        deleteFiles(['./target/recovery/notifier_progress.json']);
    }

    // Get site data
    if (await isModuleScraped(database, 'site_data')) {
        statusMessage(MessageType.Critical, 'Site data already scraped, moving on...');
    } else if (siteAuth != null && adminMode) {
        await getSiteData(config.domain, siteAuth, database, siteID);
        await insertRow(database, 'scrapers', 'site_data', true);
    }

    // Get HTML modules
    let htmlModuleIDs = await queryModuleIDs(database, 'html');
    config.excludeHTMLModuleIDs ? htmlModuleIDs.filter(id => !config.excludeHTMLModuleIDs?.includes(id)) : {};
    if (htmlModuleIDs.length === 0) {
        statusMessage(MessageType.Critical, 'No HTML module IDs for site, skipping forum scraping...');
    } else if (config.disabledModules?.html) {
        statusMessage(MessageType.Critical, 'HTML module disabled, skipping forum scraping...');
    } else if (await isModuleScraped(database, 'html')) {
        statusMessage(MessageType.Critical, 'HTML already scraped, skipping forum scraping...');
    } else if (siteAuth != null && adminMode) {
        statusMessage(MessageType.Info, 'Scraping HTML modules...');
        await getHTMLModules(config.domain, siteAuth, database, htmlModuleIDs);
        await insertRow(database, 'scrapers', 'html', true);
        deleteFiles(['./target/recovery/html_progress.json']);
        statusMessage(MessageType.Completion, 'Finished HTML module scraping');
    } else {
        statusMessage(MessageType.Info, 'Cannot scrape HTML modules without admin credentials, skipping...');
    }

    // Get forums
    let forumModuleIDs = await queryModuleIDs(database, 'forum');
    config.excludeForumModuleIDs ? forumModuleIDs.filter(id => !config.excludeForumModuleIDs?.includes(id)) : {};
    config.manualForumModuleIDs && config.manualForumModuleIDs.length > 0 ? forumModuleIDs.push(...config.manualForumModuleIDs) : {};
    if (forumModuleIDs.length === 0) {
        statusMessage(MessageType.Critical, 'No forum module IDs for site, skipping forum scraping...');
    } else if (config.disabledModules?.forums) {
        statusMessage(MessageType.Critical, 'Forums module disabled, skipping forum scraping...');
    } else if (await isModuleScraped(database, 'forums')) {
        statusMessage(MessageType.Critical, 'Forums already scraped, skipping forum scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping forums...');
        await getForums(database, config.domain, sessionID, [...new Set(forumModuleIDs)]);
        await insertRow(database, 'scrapers', 'forums', true);
        deleteFiles(['./target/recovery/forum_progress.json']);
        statusMessage(MessageType.Completion, 'Finished forum scraping');
    }

    //Get galleries
    if (config.disabledModules?.galleries) {
        statusMessage(MessageType.Critical, 'Galleries module disabled, skipping gallery scraping...');
    } else if (await isModuleScraped(database, 'galleries')) {
        statusMessage(MessageType.Critical, 'Galleries already scraped, skipping gallery scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping galleries...');
        await getGalleries(config.domain, database, sessionID);
        await insertRow(database, 'scrapers', 'galleries', true);
        statusMessage(MessageType.Completion, 'Finished gallery scraping');
    }

    // Get wikis
    let wikiModuleIDs = await queryModuleIDs(database, 'wiki');
    config.excludedWikiModuleIDs ? wikiModuleIDs.filter(id => !config.excludedWikiModuleIDs?.includes(id)) : {};
    config.manualWikiModuleIDs && config.manualWikiModuleIDs.length > 0 ? wikiModuleIDs.push(...config.manualWikiModuleIDs) : {};
    if (wikiModuleIDs.length === 0) {
        statusMessage(MessageType.Critical, 'No wiki module IDs for site, skipping wiki scraping...');
    } else if (config.disabledModules?.wikis) {
        statusMessage(MessageType.Critical, 'Wikis module disabled, skipping wiki scraping...');
    } else if (await isModuleScraped(database, 'wikis')) {
        statusMessage(MessageType.Critical, 'Wikis already scraped, skipping wiki scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping wikis...');
        await getWikis(config.domain, database, [...new Set(wikiModuleIDs)]);
        await insertRow(database, 'scrapers', 'wikis', true);
        deleteFiles(['./target/recovery/wiki_progress.json']);
        statusMessage(MessageType.Completion, 'Finished wiki scraping');
    }

    // Get news
    let newsModuleIDs = await queryModuleIDs(database, 'news');
    config.excludeNewsModuleIDs ? newsModuleIDs.filter(id => !config.excludeNewsModuleIDs?.includes(id)) : {};
    config.manualNewsModuleIDs && config.manualNewsModuleIDs.length > 0 ? newsModuleIDs.push(...config.manualNewsModuleIDs) : {};
    if (newsModuleIDs.length === 0) {
        statusMessage(MessageType.Critical, 'No news module IDs for site, skipping news scraping...');
    } else if (config.disabledModules?.news) {
        statusMessage(MessageType.Critical, 'News module disabled, skipping news scraping...');
    } else if (await isModuleScraped(database, 'news')) {
        statusMessage(MessageType.Critical, 'News already scraped, skipping news scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping news...');
        await getNews(database, config.domain, sessionID, siteAuth, [...new Set(newsModuleIDs)]);
        await insertRow(database, 'scrapers', 'news', true);
        statusMessage(MessageType.Completion, 'Finished news scraping');
    }

    // Get applications
    if (config.disabledModules?.applications) {
        statusMessage(MessageType.Critical, 'Applications module disabled, skipping application scraping...');
    } else if (await isModuleScraped(database, 'applications')) {
        statusMessage(MessageType.Critical, 'Applications already scraped, skipping application scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping application responses...');
        await getApplicationResponses(database, config.domain, sessionID, siteAuth, siteID);
        statusMessage(MessageType.Info, 'Scraping applications...');
        siteAuth ? await getApplications(database, config.domain, siteAuth) : {};
        await insertRow(database, 'scrapers', 'applications', true);
        deleteFiles(['./target/recovery/remaining_applications.json', './target/recovery/application_ids.json']);
        statusMessage(MessageType.Completion, 'Finished application scraping');
    }

    // Get comments (from applications and news posts)
    if (config.disabledModules?.comments) {
        statusMessage(MessageType.Critical, 'Comments module disabled, skipping comment scraping...');
    } else if (await isModuleScraped(database, 'comments')) {
        statusMessage(MessageType.Critical, 'Comments already scraped, skipping comment scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping comments...');
        siteAuth ? await getComments(database, config.domain, siteAuth) : {};
        await insertRow(database, 'scrapers', 'comments', true);
        deleteFiles(['./target/recovery/comments.json']);
        statusMessage(MessageType.Completion, 'Finished comment scraping');
    }

    // Get tickets
    let ticketModuleIDs = await queryModuleIDs(database, 'tickets');
    config.manualTicketModuleIDs && config.manualTicketModuleIDs.length > 0 ? ticketModuleIDs.push(...config.manualTicketModuleIDs) : {};
    if (config.disabledModules?.tickets) {
        statusMessage(MessageType.Critical, 'Tickets module disabled, skipping ticket scraping...');
    } else if (await isModuleScraped(database, 'tickets')) {
        statusMessage(MessageType.Critical, 'Tickets already scraped, skipping ticket scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping tickets...');
        await getAllTickets(database, config.domain, config.apiKey, sessionID, siteAuth, adminMode, config.excludeTicketModuleIDs ?? null, ticketModuleIDs ?? null);
        await insertRow(database, 'scrapers', 'tickets', true);
        deleteFiles(['./target/recovery/module_tickets.json']);
        statusMessage(MessageType.Completion, 'Finished ticket scraping');
    }

    // Get users
    if (config.disabledModules?.users === true) {
        statusMessage(MessageType.Critical, 'Users module disabled, skipping user tag scraping...');
    } else if (await isModuleScraped(database, 'users') && await isModuleScraped(database, 'user_data')) {
        statusMessage(MessageType.Critical, 'Users already scraped, skipping user tag scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping users...');
        await isModuleScraped(database, 'users') ? {} : await getUsers(database, config.domain, config.apiKey, config.disabledModules.users, config.manualUserIDs ?? []);
        await insertRow(database, 'scrapers', 'users', true);
        await isModuleScraped(database, 'user_data') ? {} : await getAdditionalUserData(config.domain, sessionID, siteAuth, database, config.disabledModules.users, adminMode);
        await insertRow(database, 'scrapers', 'user_data', true);
        deleteFiles(['./target/recovery/user_tags.json', './target/recovery/user_data.json']);
        statusMessage(MessageType.Completion, 'Finished user scraping');
    }

    // Get files
    if (config.disabledModules?.files === true) {
        statusMessage(MessageType.Critical, 'Files module disabled, skipping file scraping...');
    } else if (
        await isModuleScraped(database, 's3_files') &&
        await isModuleScraped(database, 'wiki_files') &&
        await isModuleScraped(database, 'avatar_files') &&
        await isModuleScraped(database, 'profile_cover_files') &&
        await isModuleScraped(database, 'game_box_files') &&
        await isModuleScraped(database, 'user_album_files')
    ) {
        statusMessage(MessageType.Critical, 'Files already scraped, skipping file scraping...');
    } else {
        statusMessage(MessageType.Info, 'Scraping files...');
        const disabledFileModules = config.disabledModules?.files;
        if (!await isModuleScraped(database, 's3_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.s3) : true)) {
            await getS3Files(config.domain, database, siteAuth, siteID, adminMode);
            await insertRow(database, 'scrapers', 's3_files', true);
        }
        if (!await isModuleScraped(database, 'wiki_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.wiki) : true)) {
            await getWikiFiles(database);
            await insertRow(database, 'scrapers', 'wiki_files', true);
        }
        if (!await isModuleScraped(database, 'avatar_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.avatars) : true)) {
            await getAvatarFiles(database, siteID);
            await insertRow(database, 'scrapers', 'avatar_files', true);
        }
        if (!await isModuleScraped(database, 'profile_cover_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.profileCovers) : true)) {
            await getProfileCoverFiles(database);
            await insertRow(database, 'scrapers', 'profile_cover_files', true);
        }
        if (!await isModuleScraped(database, 'game_box_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.gameBoxes) : true)) {
            await getGameBoxFiles(database);
            await insertRow(database, 'scrapers', 'game_box_files', true);
        }
        if (!await isModuleScraped(database, 'user_album_files') && ((typeof disabledFileModules === 'object') ? !(disabledFileModules.userAlbums) : true)) {
            await getUserAlbumFiles(database);
            await insertRow(database, 'scrapers', 'user_album_files', true);
        }

        deleteFiles([
            './target/recovery/s3_file_progress.json',
            './target/recovery/wiki_file_progress.json',
            './target/recovery/avatar_file_progress.json',
            './target/recovery/cover_file_progress.json',
            './target/recovery/game_box_progress.json',
            './target/recovery/user_album_progress.json'
        ]);
        statusMessage(MessageType.Completion, 'Finished file scraping');
    }

    process.kill(process.pid, 'SIGINT');
}

main();