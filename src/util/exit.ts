import { MessageType, statusMessage } from "./console";
import { writeJsonFile } from "./files";

function handleExitSignal(writePath: string[], object: Object[], exitCode: number) {
    return () => {
        statusMessage(MessageType.Critical, `Exit signal ${exitCode} received, writing current object to file...`);
        for (let i = 0; i < writePath.length; i++) {
            writeJsonFile(writePath[i], object[i]);
        }
        process.exit(exitCode);
    };
}

export function addExitListeners(writePath: string[], object: Object[]) {
    process.prependListener('SIGINT', handleExitSignal(writePath, object, 0));
    process.prependListener('uncaughtException', handleExitSignal(writePath, object, 1));
    statusMessage(MessageType.Info, `Added exit listeners for recovery. Press Ctrl+C to exit and write current object to file.`);
}

export function removeExitListeners() {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('uncaughtException');
}