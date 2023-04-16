import { Directory, DirectoryListing, FileData } from "../interfaces/files";
import { SiteAuth } from "../interfaces/generic";
import { addExitListeners, removeExitListeners } from "../util/exit";
import { getRequest, postRequest, throttledGetRequest } from "../util/request";
import fs from 'fs/promises';
import path from 'path';
import { fileExists, parseJsonFile } from "../util/files";

async function getDirectoryListing(domain: string, siteAuth: SiteAuth, token: string, path: string): Promise<DirectoryListing> {
    const fileData = new URLSearchParams({
        json: `{"id":"i1","method":"listFiles","params":{"path":"${path}","filter":"","orderBy":"name","desc":false,"offset":0,"length":99999,"lastPath":null},"jsonrpc":"2.0"}`,
        csrf: token,
    });
    const dirResponse = await postRequest(domain, '/moxiemanager/api.php', fileData, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/admin/files`,
    });

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

async function getAllFileUrls(domain: string, siteAuth: SiteAuth, token: string, dirPath: string): Promise<FileData[]> {
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
        const subDirFileData = await getAllFileUrls(domain, siteAuth, token, dirPath + '/' + subDir);
        subDirTotalFiles += subDirFileData.length;
        allFileData.push(...subDirFileData);
    }

    console.log(`Found ${files.length} files in ${dirPath}`);
    console.log(`Found ${subDirTotalFiles} files in subdirectories of ${dirPath}`);

    return allFileData;
}

async function downloadFiles(files: FileData[], targetPath: string) {
    let fileCount = [0];

    if(fileExists('./target/recovery/file_progress.json')) {
        console.log('Recovering file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/file_progress.json') as [FileData[], number[]];
        files = progress[0];
        fileCount = progress[1];
    }

    addExitListeners(['./target/recovery/file_progress.json'],[[files, fileCount]])

    const totalFiles = files.length;

    for (let i = fileCount[0]; i < totalFiles; i++) {
        const file = files[i];
        const response = await getRequest('', file.url, {}, '', true, 'arraybuffer');

        const filePath = path.join(targetPath, file.dirPath, file.filename);
        const fileDirectory = path.dirname(filePath);
        await fs.mkdir(fileDirectory, { recursive: true });

        await fs.writeFile(filePath, response.data, { encoding: null });
        console.log(`Downloaded ${file.url} with size ${response.data.length} bytes (${++fileCount[0]}/${files.length})`);
    }
}

export async function getFiles(domain: string, siteAuth: SiteAuth, siteID: string) {
    const tokenResponse = await postRequest(domain, '/moxiemanager/api.php?action=token', '', {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/admin/files`,
    })
    const token = tokenResponse.data.token;

    let allFileUrls: FileData[] = [];

    if (!fileExists('./target/recovery/file_progress.json')) {
        allFileUrls = await getAllFileUrls(domain, siteAuth, token, `/${siteID}`);
    }

    const filePath = path.join(process.cwd(), './target/files');
    await downloadFiles(allFileUrls, filePath);

    removeExitListeners();
}