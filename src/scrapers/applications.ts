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
import { MessageType, statusMessage } from '../util/console';

async function getApplicationTypes(domain: string): Promise<string[]> {
    const data = await enjinRequest<Applications.GetTypes>({}, 'Applications.getTypes', domain);

    if (data.error) {
        statusMessage(MessageType.Error, `Error getting application types: ${data.error.code} ${data.error.message}`);
        return [];
    }

    const { result } = data;
    return Object.keys(result);
}

async function getApplicationIDs(domain: string, types: string[], sessionID: string, siteID: string): Promise<string[]> {
    const applicationIDs: string[] = [];

    await Promise.all(types.map(async (type) => {
        let page = 1;
        try {
            while (true) {
                statusMessage(MessageType.Process, `Getting application IDs for type ${type} page ${page}...`);

                const params = {
                    session_id: sessionID,
                    type,
                    site_id: siteID,
                    page: page.toString(),
                }

                const data = await enjinRequest<Applications.GetList>(params, 'Applications.getList', domain);

                if (data.error) {
                    statusMessage(MessageType.Error, `Error getting application IDs for application type ${type} on page ${page}: ${data.error.code} ${data.error.message}`);
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
            statusMessage(MessageType.Error, `Error getting application IDs: ${getErrorMessage(error)}`);
        }
    }));

    return applicationIDs;
}

async function getApplicationCommentsCid(domain: string, siteAuth: SiteAuth, applicationID: string): Promise<{ comments_cid: string | null, admin_comments_cid: string | null }> {
    const applicationResonse = await getRequest(domain, `/ajax.php?s=dashboard_applications&cmd=app&app_id=${applicationID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/dashboard/applications/application?app_id=${applicationID}`
    }, '/getApplicationCommentsCid');

    const $ = cheerio.load(applicationResonse.data);
    const commentsBlockMain = $('.app_comments_block_main');
    let comments_cid = null;
    let admin_comments_cid = null;

    commentsBlockMain.each((_index, element) => {
        const dataType = $(element).attr('data-type');
        const commentsInner = $(element).find('.comments_inner');

        if (commentsInner.children().length > 0) {
            const commentsPostContainer = $(element).find('.comments_post_container');
            if (commentsPostContainer.length > 0) {
                const dataUrl = commentsPostContainer.attr('data-url');
                const cidMatch = dataUrl!.match(/cid=(\d+)/);
                if (cidMatch && cidMatch[1]) {
                    if (dataType === 'regular') {
                        comments_cid = cidMatch[1];
                    } else if (dataType === 'admin') {
                        admin_comments_cid = cidMatch[1];
                    }
                }
            }
        }
    });

    statusMessage(MessageType.Plain, `Found comment cid ${comments_cid} and admin comment cid ${admin_comments_cid} for application ${applicationID}`);
    return { comments_cid, admin_comments_cid };
}

async function getApplication(domain: string, siteAuth: SiteAuth, presetID: string): Promise<ApplicationContent | null> {
    const applicationResonse = await throttledGetRequest(domain, `/admin/editmodule/index/editoraction/form-builder/preset/${presetID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/admin/editmodule/index/editoraction/index/preset/${presetID}`
    }, '/getApplication');

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
    statusMessage(MessageType.Critical, `No application found for preset ${presetID}`);
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
    statusMessage(MessageType.Info, `Found ${applications.length} application types in application responses table`);

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
        statusMessage(MessageType.Process, `Gettting questions and sections for application ${presetID} [(${i + 1}/${applications.length})]`);

        const applicationConent = await getApplication(domain, siteAuth, presetID);

        if (!applicationConent) {
            statusMessage(MessageType.Critical, `Failed to get application ${presetID}`);
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
    const applicationTypes = await getApplicationTypes(domain);
    statusMessage(MessageType.Info, `Found ${applicationTypes.length} application types: ${applicationTypes.join(', ')}`);

    let applicationIDs: string[] = [];
    if (fileExists('./target/recovery/application_ids.json')) {
        statusMessage(MessageType.Info, 'Found recovery file, skipping application ID retrieval.');
        applicationIDs = parseJsonFile('./target/recovery/application_ids.json') as string[];
    } else {
        applicationIDs = await getApplicationIDs(domain, applicationTypes, sessionID, siteID);
        writeJsonFile('./target/recovery/application_ids.json', applicationIDs);
    }

    const totalApplications = applicationIDs.length;
    statusMessage(MessageType.Process, `Found ${totalApplications} applications to download.`);

    let currentApplication = 1;

    if (fileExists('./target/recovery/remaining_applications.json')) {
        statusMessage(MessageType.Info, 'Found recovery applications file, starting where we left off.');
        applicationIDs = parseJsonFile('./target/recovery/remaining_applications.json') as string[];
        currentApplication = totalApplications - applicationIDs.length + 1;
    }

    let remainingApplicationIDs: string[] = [...applicationIDs];
    addExitListeners(['./target/recovery/remaining_applications.json'], [remainingApplicationIDs]);

    try {
        for (const id of applicationIDs) {
            statusMessage(MessageType.Process, `Getting application ${id} [(${currentApplication++}/${totalApplications})]`);

            const params = {
                session_id: sessionID,
                application_id: id,
            }

            const data = await enjinRequest<Applications.GetApplication>(params, 'Applications.getApplication', domain);

            if (data.error) {
                statusMessage(MessageType.Error, `Error getting application ${id}: ${data.error.code} ${data.error.message}`);
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
                null,
                null
            ]

            if (result.comments > 0) {
                const commentCid = await getApplicationCommentsCid(domain, siteAuth, result.application_id);
                values[values.length - 2] = commentCid.comments_cid;
                values[values.length - 1] = commentCid.admin_comments_cid;
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
        statusMessage(MessageType.Error, `Error getting applications: ${getErrorMessage(error)}`);
    }

    removeExitListeners();
}