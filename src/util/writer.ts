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