import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Database } from "sqlite3";
import { SiteAuth } from "../interfaces/generic";
import { throttledGetRequest } from "../util/request";
import { insertRow } from '../util/database';
import { MessageType, statusMessage } from '../util/console';
import { fileExists, parseJsonFile } from '../util/files';
import { addExitListeners, removeExitListeners } from '../util/exit';

function decodeHtml(input: string): string | null {
    const dom = new JSDOM();
    const document = dom.window.document;
    const div = document.createElement('div');
    div.innerHTML = input;
    return div.innerHTML;
}

async function getModuleHTML(domain: string, siteAuth: SiteAuth, moduleID: string): Promise<string | null> {
    const htmlResponse = await throttledGetRequest(domain, `/admin/editmodule/index/editoraction/html/preset/${moduleID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/admin/editmodule/index/editoraction/index/preset/${moduleID}`
    }, '/getModuleHTML')

    const $ = cheerio.load(htmlResponse.data);
    const encodedHtml = $('#ace-editor').text();
    const decodedHtml = decodeHtml(encodedHtml);

    return decodedHtml === '' ? null : decodedHtml;
}

async function getModuleJs(domain: string, siteAuth: SiteAuth, moduleID: string): Promise<string | null> {
    const jsResponse = await throttledGetRequest(domain, `/admin/editmodule/index/editoraction/javascript/preset/${moduleID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/admin/editmodule/index/editoraction/index/preset/${moduleID}`
    }, '/getModuleJs')

    const $ = cheerio.load(jsResponse.data);
    const js = $('#ace-editor').text();

    return js === '' ? null : js;
}

async function getModuleCss(domain: string, siteAuth: SiteAuth, moduleID: string): Promise<string | null> {
    const cssResponse = await throttledGetRequest(domain, `/admin/editmodule/index/editoraction/css/preset/${moduleID}`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Referer: `Referer https://${domain}/admin/editmodule/index/editoraction/index/preset/${moduleID}`
    }, '/getModuleCss')

    const $ = cheerio.load(cssResponse.data);
    const css = $('#ace-editor').text();

    return css === '' ? null : css;
}

export async function getHTMLModules(domain: string, siteAuth: SiteAuth, database: Database, moduleIDs: string[]) {
    let moduleCount = [0];

    if (fileExists('./target/recovery/html_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering HTML module progress from previous session...')
        const progress = parseJsonFile('./target/recovery/html_progress.json') as [number[]];
        moduleCount = progress[0];
    }

    addExitListeners(['./target/recovery/html_progress.json'], [[moduleCount]])

    const totalModules = moduleIDs.length;

    for (let i = moduleCount[0]; i < totalModules; i++) {
        const html = await getModuleHTML(domain, siteAuth, moduleIDs[i]);
        const css = await getModuleCss(domain, siteAuth, moduleIDs[i]);
        const js = await getModuleJs(domain, siteAuth, moduleIDs[i]);

        await insertRow(database, 'html_modules', moduleIDs[i], html, css, js)
        statusMessage(MessageType.Process, `Scraped html module ${moduleIDs[i]} [(${++moduleCount[0]}/${totalModules})]`);
    }

    removeExitListeners();
}