import fs, { promises } from 'fs';
import path from 'path';

export async function ensureDirectory(directory: string) {
    try {
        await promises.stat(directory);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await promises.mkdir(directory, { recursive: true });
        } else {
            throw error;
        }
    }
}

export function writeJsonFile(filename: string, data: any): void {
    fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(data, null, 4));
}

export function parseJsonFile(filename: string): object {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), filename)).toString());
}

export function fileExists(filename: string): boolean {
    return fs.existsSync(path.join(process.cwd(), filename));
}

export function deleteFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
        try {
            fs.unlinkSync(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to delete file ${filePath}: ${error}`);
            }
        }
    });
}