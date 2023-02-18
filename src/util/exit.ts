import { writeJsonFile } from "./writer";

function handleExitSignal(writePath: string, object: Object, exitCode: number) {
    return () => {
        console.log(`Exit signal received, writing current object to file...`);
        writeJsonFile(writePath, object);
        process.exit(exitCode);
    };
}

export function addExitListeners(writePath: string, object: Object) {
    process.prependListener('SIGINT', handleExitSignal(writePath, object, 0));
    process.prependListener('uncaughtException', handleExitSignal(writePath, object, 1));
    console.log(`Added exit listeners ${process.listeners('SIGINT')}`);
}

export function removeExitListeners() {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('uncaughtException');
}