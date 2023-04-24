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
    }, '/getDirectoryListing');

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

    let files: [{ filename: string, url: string, dirPath: string }] = await new Promise((resolve, reject) => {
        database.all('SELECT filename, url, dirPath FROM s3_files',
            (err, rows: [{ filename: string, url: string, dirPath: string }]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
    });

    if (fileExists('./target/recovery/s3_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering s3 file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/s3_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/s3_file_progress.json'], [[fileCount]])

    const totalFiles = files.length;

    for (let i = fileCount[0]; i < totalFiles; i++) {
        try {
            const file = files[i];
            const response = await getRequest('', file.url, {}, '', true, 'arraybuffer');

            const filePath = path.join(targetPath, file.url.replace(/^https?:\/\//i, ""));
            const fileDirectory = path.dirname(filePath);
            await fs.mkdir(fileDirectory, { recursive: true });

            await fs.writeFile(filePath, response.data, { encoding: null });
            statusMessage(MessageType.Process, `Downloaded ${file.url} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
        } catch (error) {
            statusMessage(MessageType.Error, `Error downloading ${files[i].url}: ${getErrorMessage(error)}`)
            statusMessage(MessageType.Error, `Skipping file ${files[i].url} [(${++fileCount[0]}/${totalFiles})]`)
        }
    }

    statusMessage(MessageType.Completion, 'Finished getting s3 files')

    removeExitListeners();
}

export async function getS3Files(domain: string, database: Database, siteAuth: SiteAuth, siteID: string) {
    if (!fileExists('./target/recovery/s3_file_progress.json')) {
        const tokenResponse = await postRequest(domain, '/moxiemanager/api.php?action=token', '', {
            Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
            Origin: `https://${domain}`,
            Referer: `https://${domain}/admin/files`,
        }, '/getFiles')
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

    statusMessage(MessageType.Info, 'Getting s3 files...')
    const filePath = path.join(process.cwd(), './target/files');
    await downloadS3Files(database, filePath);
}

export async function getWikiFiles(database: Database) {
    statusMessage(MessageType.Info, 'Getting wiki files...');

    let fileCount = [0];

    let wikiFiles: [{ preset_id: string, path: string, name: string }] = await new Promise((resolve, reject) => {
        database.all('SELECT preset_id, path, name FROM wiki_uploads',
            (err, rows: [{ preset_id: string, path: string, name: string }]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
    });

    if (fileExists('./target/recovery/wiki_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering wiki file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/wiki_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/wiki_file_progress.json'], [[fileCount]])

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

                const filePath = path.join(process.cwd(), './target/files', file.path.replace(/^https?:\/\//i, ""));
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });

                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file.path} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${wikiFiles[i].path}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${wikiFiles[i].path} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
        statusMessage(MessageType.Completion, 'Finished getting wiki files')
    } else {
        statusMessage(MessageType.Critical, 'No wiki files found')
    }

    removeExitListeners();
}

async function getColumnURLs(database: Database, column: string, table: string): Promise<string[]> {
    const URLs: string[] = await new Promise((resolve, reject) => {
        database.all(`SELECT ${column} FROM ${table} WHERE ${column} IS NOT NULL`,
            (err, rows: [{ [column: string]: string }]) => {
                if (err) {
                    reject(err);
                } else {
                    const URLValues = rows.map(row => row[column]);
                    resolve(URLValues);
                }
            });
    });
    return URLs;
}

export async function getAvatarFiles(database: Database, siteID: string) {
    statusMessage(MessageType.Info, 'Getting avatar files...');

    let fileCount = [0];

    const preAvatarURLs = [
        ...await getColumnURLs(database, 'avatar', 'user_profiles'),
        ...await getColumnURLs(database, 'avatar', 'user_wall_comments'),
        ...await getColumnURLs(database, 'avatar', 'user_wall_post_likes'),
    ].filter((value, index, array) => array.indexOf(value) === index);

    const avatarURLs: string[] = preAvatarURLs.filter(url => {
        return !url.startsWith(`https://s3.amazonaws.com/files.enjin.com/${siteID}/`) &&
        !url.startsWith("https://cravatar.eu/");
    }).map(url => {
        return url.replace("/medium.", "/full.");
    });

    if (fileExists('./target/recovery/avatar_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering avatar file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/avatar_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/avatar_file_progress.json'], [[fileCount]])

    const totalFiles = avatarURLs.length;

    if (totalFiles > 0) {
        const cfbmTokenResponse = await getRequest('', avatarURLs[0], {}, '', true, 'arraybuffer');
        const setCookie = cfbmTokenResponse.headers['set-cookie'];
        const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];

        for (let i = fileCount[0]; i < totalFiles; i++) {
            try {
                const file = avatarURLs[i];
                const response = await getRequest('', file, {
                    Cookie: cfbmToken,
                }, '', true, 'arraybuffer');

                const filePath = path.join(process.cwd(), './target/files', file.replace(/^https?:\/\//i, ""));
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });

                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${avatarURLs[i]}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${avatarURLs[i]} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
        statusMessage(MessageType.Completion, 'Finished getting avatar files')
    } else {
        statusMessage(MessageType.Critical, 'No avatar files found')
    }

    removeExitListeners();
}

export async function getProfileCoverFiles(database: Database) {
    statusMessage(MessageType.Info, 'Getting profile cover files...');

    let fileCount = [0];

    const profileURLs = (await getColumnURLs(database, 'cover_image', 'user_profiles'))
        .filter((value, index, array) => array.indexOf(value) === index);

    if (fileExists('./target/recovery/cover_file_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering profile cover file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/cover_file_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/cover_file_progress.json'], [[fileCount]])

    const totalFiles = profileURLs.length;

    if (totalFiles > 0) {
        const cfbmTokenResponse = await getRequest('', profileURLs[0], {}, '', true, 'arraybuffer');
        const setCookie = cfbmTokenResponse.headers['set-cookie'];
        const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];

        for (let i = fileCount[0]; i < totalFiles; i++) {
            try {
                const file = profileURLs[i];
                const response = await getRequest('', file, {
                    Cookie: cfbmToken,
                }, '', true, 'arraybuffer');

                const filePath = path.join(process.cwd(), './target/files', file.replace(/^https?:\/\//i, ""));
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });

                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${profileURLs[i]}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${profileURLs[i]} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
        statusMessage(MessageType.Completion, 'Finished profile cover files')
    } else {
        statusMessage(MessageType.Critical, 'No profile cover files found')
    }

    removeExitListeners();
}

export async function getGameBoxFiles(database: Database) {
    statusMessage(MessageType.Info, 'Getting game box files...');

    let fileCount = [0];

    const gameBoxURLs = (await getColumnURLs(database, 'avatar', 'user_games'))
        .filter((value, index, array) => array.indexOf(value) === index);

    if (fileExists('./target/recovery/game_box_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering game box file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/game_box_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/game_box_progress.json'], [[fileCount]])

    const totalFiles = gameBoxURLs.length;

    if (totalFiles > 0) {
        const cfbmTokenResponse = await getRequest('', gameBoxURLs[0], {}, '', true, 'arraybuffer');
        const setCookie = cfbmTokenResponse.headers['set-cookie'];
        const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];

        for (let i = fileCount[0]; i < totalFiles; i++) {
            try {
                const file = gameBoxURLs[i];
                const response = await getRequest('', file, {
                    Cookie: cfbmToken,
                }, '', true, 'arraybuffer');

                const filePath = path.join(process.cwd(), './target/files', file.replace(/^https?:\/\//i, ""));
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });

                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${gameBoxURLs[i]}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${gameBoxURLs[i]} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
        statusMessage(MessageType.Completion, 'Finished getting game box files')
    } else {
        statusMessage(MessageType.Critical, 'No game box cover files found')
    }

    removeExitListeners();
}

export async function getUserAlbumFiles(database: Database) {
    statusMessage(MessageType.Info, 'Getting user album files...');

    let fileCount = [0];

    const userAlbumURLs = (await getColumnURLs(database, 'url_original', 'user_images'))
        .filter((value, index, array) => array.indexOf(value) === index);

    if (fileExists('./target/recovery/user_album_progress.json')) {
        statusMessage(MessageType.Info, 'Recovering user album file download progress previous session...')
        const progress = parseJsonFile('./target/recovery/user_album_progress.json') as [number[]];
        fileCount = progress[0];
    }

    addExitListeners(['./target/recovery/user_album_progress.json'], [[fileCount]])

    const totalFiles = userAlbumURLs.length;

    if (totalFiles > 0) {
        const cfbmTokenResponse = await getRequest('', userAlbumURLs[0], {}, '', true, 'arraybuffer');
        const setCookie = cfbmTokenResponse.headers['set-cookie'];
        const cfbmToken = setCookie!.find((cookie: string) => cookie.includes('__cf_bm'))!.split(';')[0];

        for (let i = fileCount[0]; i < totalFiles; i++) {
            try {
                const file = userAlbumURLs[i];
                const response = await getRequest('', file, {
                    Cookie: cfbmToken,
                }, '', true, 'arraybuffer');

                const filePath = path.join(process.cwd(), './target/files', file.replace(/^https?:\/\//i, ""));
                const fileDirectory = path.dirname(filePath);
                await fs.mkdir(fileDirectory, { recursive: true });

                await fs.writeFile(filePath, response.data, { encoding: null });
                statusMessage(MessageType.Process, `Downloaded ${file} with size ${response.data.length} bytes [(${++fileCount[0]}/${totalFiles})]`)
            } catch (error) {
                statusMessage(MessageType.Error, `Error downloading ${userAlbumURLs[i]}: ${getErrorMessage(error)}`)
                statusMessage(MessageType.Error, `Skipping file ${userAlbumURLs[i]} [(${++fileCount[0]}/${totalFiles})]`)
            }
        }
        statusMessage(MessageType.Completion, 'Finished getting user album files')
    } else {
        statusMessage(MessageType.Critical, 'No user album files found')
    }

    removeExitListeners();
}