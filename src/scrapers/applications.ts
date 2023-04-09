import { Applications } from '../interfaces/applications';
import { getErrorMessage } from '../util/error';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { enjinRequest } from '../util/request';
import { fileExists, parseJsonFile, writeJsonFile } from '../util/files';
import { Database } from 'sqlite3';
import { insertRow } from '../util/database';

async function getApplicationTypes(domain: string): Promise<string[]> {
    const data = await enjinRequest<Applications.GetTypes>({}, 'Applications.getTypes', domain);

    if (data.error) {
        console.log(`Error getting application types: ${data.error.code} ${data.error.message}`)
        return [];
    }

    const { result } = data;
    return Object.keys(result);
}

async function getApplicationIDs(domain: string, types: string[], sessionID: string, siteID: string): Promise<string[]> {
    console.log('Getting application IDs...');
    const applicationIDs: string[] = [];

    await Promise.all(types.map(async (type) => {
        let page = 1;
        try {
            while (true) {
                console.log(`Getting application IDs for type ${type} page ${page}...`);

                const params = {
                    session_id: sessionID,
                    type,
                    site_id: siteID,
                    page: page.toString(),
                }

                const data = await enjinRequest<Applications.GetList>(params, 'Applications.getList', domain);

                if (data.error) {
                    console.log(`Error getting application IDs for application type ${type} on page ${page}: ${data.error.code} ${data.error.message}`)
                    break;
                }

                const { result } = data;
                if (result.items.length === 0) {
                    break;
                }
                applicationIDs.push(...result.items.map((item: { application_id: string }) => item.application_id));
                page++;
            }
        } catch (error) {
            console.log(`Error getting application IDs: ${getErrorMessage(error)}`);
        }
    }));

    return applicationIDs;
}

export async function getApplications(database: Database, domain: string, sessionID: string, siteID: string) {
    console.log('Getting applications...');
    await insertRow(database, 'scrapers', 'applications', false);

    const applicationTypes = await getApplicationTypes(domain);
    console.log(`Application types: ${applicationTypes.join(', ')}`);

    let applicationIDs: string[] = [];
    if (fileExists('./target/recovery/application_ids.json')) {
        console.log('Found recovery file, skipping application ID retrieval.');
        applicationIDs = parseJsonFile('./target/recovery/application_ids.json') as string[];
    } else {
        applicationIDs = await getApplicationIDs(domain, applicationTypes, sessionID, siteID);
        writeJsonFile('./target/recovery/application_ids.json', applicationIDs);
    }

    const totalApplications = applicationIDs.length;
    console.log(`Found ${totalApplications} to download.`)

    let currentApplication = 1;

    if (fileExists('./target/recovery/remaining_applications.json')) {
        console.log('Found recovery applications file, starting where we left off.');
        applicationIDs = parseJsonFile('./target/recovery/remaining_applications.json') as string[];
        currentApplication = totalApplications - applicationIDs.length + 1;
    }

    let remainingApplicationIDs: string[] = [...applicationIDs];
    addExitListeners(['./target/recovery/remaining_applications.json'], [remainingApplicationIDs]);

    try {
        for (const id of applicationIDs) {
            console.log(`Getting application ${id}... (${currentApplication++}/${totalApplications})`);

            const params = {
                session_id: sessionID,
                application_id: id,
            }

            const data = await enjinRequest<Applications.GetApplication>(params, 'Applications.getApplication', domain);

            if (data.error) {
                console.log(`Error getting application ${id}: ${data.error.code} ${data.error.message}`)
                continue;
            }

            const { result } = data;
            await insertRow(
                database,
                'applications', 
                result.application_id, 
                result.site_id, 
                result.preset_id, 
                result.title, 
                result.user_ip, 
                result.is_mine, 
                result.can_manage, 
                result.created, 
                result.updated, 
                result.read, 
                result.comments, 
                result.read_comments, 
                result.app_comments, 
                result.admin_comments, 
                result.site_name, 
                result.user_id, 
                result.is_online, 
                result.admin_online, 
                result.username, 
                result.avatar, 
                result.admin_user_id, 
                result.admin_username, 
                result.admin_avatar,
                result.site_logo,
                JSON.stringify(result.user_data),
                result.is_archived,
                result.is_trashed,
                result.allow_app_comments,
                result.post_app_comments,
                result.allow_admin_comments
            ).then(() => {
                const index = remainingApplicationIDs.indexOf(id);
                if (index !== -1) {
                    remainingApplicationIDs.splice(index, 1);
                }
            })
        }
    } catch (error) {
        console.log(`Error getting applications: ${getErrorMessage(error)}`);
    }

    removeExitListeners();
}