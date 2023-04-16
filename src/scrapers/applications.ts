import * as cheerio from 'cheerio';
import * as esprima from 'esprima';
import escodegen from 'escodegen';
import { Application, ApplicationContent, ApplicationQuestion, ApplicationQuestionsDB, ApplicationSection, ApplicationSectionsDB, Applications, ApplicationsDB } from '../interfaces/applications';
import { getErrorMessage } from '../util/error';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { enjinRequest, getRequest, throttledGetRequest } from '../util/request';
import { fileExists, parseJsonFile, safeEval, writeJsonFile } from '../util/files';
import { Database } from 'sqlite3';
import { insertRow, insertRows } from '../util/database';
import { SiteAuth } from '../interfaces/generic';

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

async function getApplicationCommentsCid(domain: string, siteAuth: SiteAuth, applicationID: string): Promise<string | null> {
    const applicationResonse = await getRequest(domain, `/ajax.php?s=dashboard_applications&cmd=app&app_id=${applicationID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/dashboard/applications/application?app_id=${applicationID}`
    }, '/applications')

    let commentCid = null;

    const $ = cheerio.load(applicationResonse.data);
    const commentsPostContainer = $('.comments_post_container');
    if (commentsPostContainer.length > 0) {
        const dataUrl = commentsPostContainer.attr('data-url');
        const cidMatch = dataUrl!.match(/cid=(\d+)/);
        if (cidMatch && cidMatch[1]) {
            commentCid = cidMatch[1];
        }
    }

    console.log(`Found comment cid ${commentCid} for application ${applicationID}`);
    return commentCid;
}

async function getApplication(domain: string, siteAuth: SiteAuth, presetID: string): Promise<ApplicationContent | null> {
    const applicationResonse = await throttledGetRequest(domain, `/admin/editmodule/index/editoraction/form-builder/preset/${presetID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/admin/editmodule/index/editoraction/index/preset/${presetID}`
    });

    const $ = cheerio.load(applicationResonse.data);

    const scriptNode = $('script[type="text/javascript"]').toArray().find((element) => {
        return $(element).html()?.includes('var formBuilder');
    });

    if (scriptNode) {
        const scriptContent = $(scriptNode).contents().text();

        const scriptAst = esprima.parseScript(scriptContent);

        let elementsObject;
        let sectionsObject;

        for (const node of scriptAst.body) {
            if (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression') {
                const callExpr = node.expression;
                if (
                    callExpr.callee.type === 'MemberExpression' &&
                    callExpr.callee.object.type === 'CallExpression' &&
                    callExpr.callee.property.type === 'Identifier' &&
                    callExpr.callee.property.name === 'ready'
                ) {
                    for (const arg of callExpr.arguments) {
                        if (arg.type === 'FunctionExpression') {
                            for (const prop of arg.body.body) {
                                if (
                                    prop.type === 'ExpressionStatement' &&
                                    prop.expression.type === 'AssignmentExpression' &&
                                    prop.expression.left.type === 'Identifier' &&
                                    prop.expression.left.name === 'formBuilder' &&
                                    prop.expression.right.type === 'NewExpression'
                                ) {
                                    for (const arg of prop.expression.right.arguments) {
                                        if (arg.type === 'ObjectExpression') {
                                            for (const prop of arg.properties) {
                                                if (
                                                    prop.type === 'Property' &&
                                                    prop.key.type === 'Identifier' &&
                                                    prop.value.type === 'ObjectExpression'
                                                ) {
                                                    if (prop.key.name === 'elements') {
                                                        elementsObject = prop.value;
                                                    } else if (prop.key.name === 'sections') {
                                                        sectionsObject = prop.value;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        const elements: { [key: string]: ApplicationQuestion } = elementsObject ? safeEval(escodegen.generate(elementsObject)) : {};
        const sections: { [key: string]: ApplicationSection } = sectionsObject ? safeEval(escodegen.generate(sectionsObject)) : {};

        return { elements, sections };
    }
    console.log(`No application found for preset ${presetID}`)
    return null;
}

export async function getApplications(database: Database, domain: string, siteAuth: SiteAuth) {
    const applications: Application[] = await new Promise((resolve, reject) => {
        database.all('SELECT preset_id, title, post_app_comments, allow_admin_comments FROM application_responses GROUP BY preset_id',
            (err, rows: Application[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
    });
    console.log(`Found ${applications.length} application types in application responses table`)

    const applicationDB: ApplicationsDB[] = [];
    for (const application of applications) {
        applicationDB.push(
            [
                application.preset_id,
                application.title,
                application.post_app_comments,
                application.allow_admin_comments
            ]
        )
    }
    await insertRows(database, 'applications', applicationDB);

    for (let i = 0; i < applications.length; i++) {
        const presetID = applications[i].preset_id;
        console.log(`Gettting questions and sections for application ${presetID} (${i+1}/${applications.length}))`);

        const applicationConent = await getApplication(domain, siteAuth, presetID);

        if (!applicationConent) {
            console.log(`Failed to get application ${presetID}`);
            continue;
        }

        const sectionDB: ApplicationSectionsDB[] = [];
        for (const section of Object.values(applicationConent.sections)) {
            sectionDB.push(
                [
                    section.section_id,
                    section.preset_id,
                    section.title,
                    section.new_page,
                    section.hide_title,
                    section.delta,
                    section.description,
                    JSON.stringify(section.conditions),
                    section.visible,
                    section.header
                ]
            )
        }
        if (sectionDB.length !== 0) {
            await insertRows(database, 'application_sections', sectionDB);
        }

        const questionDB: ApplicationQuestionsDB[] = [];
        for (const question of Object.values(applicationConent.elements)) {
            questionDB.push(
                [
                    question.hash,
                    question.preset_id,
                    question.delta,
                    JSON.stringify(question.data),
                    JSON.stringify(question.conditions),
                    question.section_id,
                    question.data_old ? JSON.stringify(question.data_old) : null,
                    question.visible,
                    question.widget
                ]
            )
        }
        if (questionDB.length !== 0) {
            await insertRows(database, 'application_questions', questionDB);
        }
    }
}

export async function getApplicationResponses(database: Database, domain: string, sessionID: string, siteAuth: SiteAuth, siteID: string) {
    console.log('Getting applications...');
    await insertRow(database, 'scrapers', 'application_responses', false);

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

            const values = [
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
                result.allow_admin_comments,
                null
            ]

            if (result.comments > 0) {
                const commentCid = await getApplicationCommentsCid(domain, siteAuth, result.application_id);
                values[values.length - 1] = commentCid;
            }

            await insertRow(
                database,
                'application_responses',
                ...values
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