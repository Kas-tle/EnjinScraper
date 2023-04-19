import fs, { promises, createWriteStream } from 'fs';
import path from 'path';
import { getErrorMessage } from './error';
import { MessageType, statusMessage } from './console';

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
    try {
        const filePath = path.join(process.cwd(), filename);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error(`Failed to write file ${filename}: ${getErrorMessage(error)}`);
        if (error instanceof RangeError) {
            statusMessage(MessageType.Error, `File too big. You hate to see it.`);
        }
    }
}

export function writeTextFile(filename: string, data: any): void {
    try {
        const filePath = path.join(process.cwd(), filename);
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, data);
    } catch (error) {
        console.error(`Failed to write file ${filename}: ${getErrorMessage(error)}`);
        if (error instanceof RangeError) {
            statusMessage(MessageType.Error, `File too big. You hate to see it.`);
        }
    }
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

export function safeEval(code: string): any {
    const evalFn = eval;
    return evalFn(`(${code})`);
  }