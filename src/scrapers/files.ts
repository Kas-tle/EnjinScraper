import { Directory, DirectoryListing, FileData, S3FilesDB } from "../interfaces/files";
import { SiteAuth } from "../interfaces/generic";
import { addExitListeners, removeExitListeners } from "../util/exit";
import { getRequest, postRequest } from "../util/request";
import fs from 'fs/promises';
import path from 'path';
import { fileExists, parseJsonFile } from "../util/files";
import { getErrorMessage } from "../util/error";
import { Database } from "sqlite3";
import { insertRows } from "../util/database";
import { MessageType, statusMessage } from "../util/console";

async function getDirectoryListing(domain: string, siteAuth: SiteAuth, token: string, path: string): Promise<DirectoryListing> {
    const fileData = new URLSearchParams({
        json: `{"id":"i1","method":"listFiles","params":{"path":"${path}","filter":"","orderBy":"name","desc":false,"offset":0,"length":99999,"lastPath":null},"jsonrpc":"2.0"}`,
        csrf: token,
    });
    const dirResponse = await postRequest(domain, '/moxiemanager/api.php', fileData, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/admin/files`,
    }, '/files');

    const dirListing: DirectoryListing = dirResponse.data.result;
    return dirListing;
}

function getListedDirectories(data: Directory.Data[]): string[] {
    const filteredData = data.filter(
        ([, , , modified]) => modified.toString().startsWith("d")
    );
    return filteredData.map(([name]) => name);
}

function getListedFiles(data: Directory.Data[]): string[] {
    const filteredData = data.filter(
        ([, , , modified]) => modified.toString().startsWith("-")
    );
    return filteredData.map(([name]) => name);
}

async function getS3FileUrls(domain: string, siteAuth: SiteAuth, token: string, dirPath: string): Promise<FileData[]> {
    const dirListing = await getDirectoryListing(domain, siteAuth, token, dirPath);
    const subDirs = getListedDirectories(dirListing.data);
    const files = getListedFiles(dirListing.data).filter(file => !subDirs.includes(file));
    const allFileData = files.map(file => ({
        filename: file,
        url: dirListing.file.url + '/' + file,
        dirPath: dirPath,
    }));

    let subDirTotalFiles = 0;

    for (const subDir of subDirs) {
        const subDirFileData = await getS3FileUrls(domain, siteAuth, token, dirPath + '/' + subDir);
        subDirTotalFiles += subDirFileData.length;
        allFileData.push(...subDirFileData);
    }

    statusMessage(MessageType.Process, `Found ${files.length} files in ${dirPath}`)
    statusMessage(MessageType.Process, `Found ${subDirTotalFiles} files in subdirectories of ${dirPath}`)

    return allFileData;
}

async function downloadS3Files(database: Database, targetPath: string) {
    let fileCount = [0];

    let files: [{filename: string, url: string, dirPath: string}] = await new Promise((resolve, reject) => {
        database.all('SELECT filename, url, dirPath FROM s3_files',
            (err, rows: [{filename: string, url: string, dirPath: string}]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
    });

    if(fileExists('./target/recovery/s3_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering s3 file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/s3_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/s3_file_progress.json'],[[fileCount]])

    const totalFiles = files.length;

    for (let i = fileCount[0]; i < totalFiles; i++) {
        try {
            const file = files[i];
            const response = await getRequest('', file.url, {}, '', true, 'arraybuffer');
    
            const filePath = path.join(targetPath, file.dirPath, file.filename);
            const fileDirectory = path.dirname(filePath);
            await fs.mkdir(fileDirectory, { recursive: true });
    
            await fs.writeFile(filePath, response.data, { encoding: null });
            statusMessage(MessageType.Process, `Downloaded ${file.url} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
        } catch (error) {
            statusMessage(MessageType.Error, `Error downloading ${files[i].url}: ${getErrorMessage(error)}`)
            statusMessage(MessageType.Error, `Skipping file ${files[i].url} [(${++fileCount[0]}/${totalFiles})]`)
        }
    }
}

async function downloadWikiFiles(database: Database, targetPath: string) {
    let fileCount = [0];

    let wikiFiles: [{preset_id: string, path: string, name: string}] = await new Promise((resolve, reject) => {
        database.all('SELECT preset_id, path, name FROM wiki_uploads',
            (err, rows: [{preset_id: string, path: string, name: string}]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
    });

    if(fileExists('./target/recovery/wiki_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering wiki file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/wiki_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/wiki_file_progress.json'],[[fileCount]])

    const totalFiles = wikiFiles.length;

    if (totalFiles > 0) {
        const cfbmTokenResponse = await getRequest('', wikiFiles[0].path, {}, '', true, 'arraybuffer');
        const setCookie = cfbmTokenResponse.headers['set-cookie'];
        const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];

        for (let i = fileCount[0]; i < totalFiles; i++) {
            try {
                const file = wikiFiles[i];
                const response = await getRequest('', file.path, {
                    Cookie: cfbmToken,
                }, '', true, 'arraybuffer');
    
                const filePath = path.join(targetPath, file.preset_id, file.name);
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });
    
                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file.path} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${wikiFiles[i].path}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${wikiFiles[i].path} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
    } else {
        statusMessage(MessageType.Critical, 'No wiki files found')
    }
}

export async function getFiles(domain: string, database: Database, siteAuth: SiteAuth, siteID: string) {
    const s3Exists = fileExists('./target/recovery/s3_file_progress.json');
    const wikiExists = fileExists('./target/recovery/wiki_file_progress.json');
    if (!s3Exists && !wikiExists) {
        const tokenResponse = await postRequest(domain, '/moxiemanager/api.php?action=token', '', {
            Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
            Origin: `https://${domain}`,
            Referer: `https://${domain}/admin/files`,
        }, '/files')
        const token = tokenResponse.data.token;
        
        const s3FileUrls: FileData[] = await getS3FileUrls(domain, siteAuth, token, `/${siteID}`);
        const s3FilesDB: S3FilesDB[] = [];
        for (const file of s3FileUrls) {
            s3FilesDB.push([
                file.filename,
                file.url,
                file.dirPath,
            ]);
        }
        await insertRows(database, 's3_files', s3FilesDB);
    }

    if (!wikiExists) {
        statusMessage(MessageType.Info, 'Getting s3 files...')
        const filePath = path.join(process.cwd(), './target/files');
        await downloadS3Files(database, filePath);
    }

    statusMessage(MessageType.Info, 'Getting wiki files...')
    const wikiFilePath = path.join(process.cwd(), './target/files/wiki');
    await downloadWikiFiles(database, wikiFilePath);

    removeExitListeners();
}