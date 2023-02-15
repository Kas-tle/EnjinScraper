import fs from 'fs';
import path from 'path';

export function ensureDirectory(filePath: string): void {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return;
    }
    ensureDirectory(dirname);
    fs.mkdirSync(dirname);
}

export function writeJsonFile(filename: string, data: any): void {
    fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(data, null, 4));
}