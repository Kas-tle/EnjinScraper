import chalk from 'chalk';

export enum MessageType {
    Completion = 'completion',
    Process = 'process',
    Critical = 'critical',
    Error = 'error',
    Info = 'info',
    Plain = 'plain'
}

export function statusMessage(type: MessageType, message: string) {
    switch (type) {
        case MessageType.Completion:
            console.log(chalk.green(`[+] ${chalk.ansi256(246)(message)}`));
            break;
        case MessageType.Process:
            console.log(chalk.yellow(`[•] ${chalk.ansi256(246)(message)}`));
            break;
        case MessageType.Critical:
            console.log(chalk.red(`[X] ${chalk.ansi256(246)(message)}`));
            break;
        case MessageType.Error:
            console.log(chalk.red(`[ERROR] ${chalk.ansi256(246)(message)}`));
            break;
        case MessageType.Info:
            console.log(chalk.blue(`[i] ${chalk.ansi256(246)(message)}`));
            break;
        case MessageType.Plain:
            console.log(chalk.gray(message));
            break;
        default:
            console.log(chalk.gray(message));
    }
}

