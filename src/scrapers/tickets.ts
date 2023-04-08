import { Database } from 'sqlite3';
import { Ticket, TicketReply, Tickets } from '../interfaces/tickets';
import { insertRow, insertRows } from '../util/database';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';

async function getTicketModules(database: Database, domain: string, apiKey: string): Promise<string[]> {

    const params = {
        api_key: apiKey,
    }
    const data = await enjinRequest<Tickets.GetModules>(params, 'Tickets.getModules', domain);
    const userDB: [
        string, 
        string | null
    ][] = [];

    if (data.error) {
        console.log(`Error getting ticket modules: ${data.error.code} ${data.error.message}`)
        return [];
    }

    if (Object.keys(data.result).length > 0) {
        Object.keys(data.result).forEach((module) => {
            const result = data.result[module]
            userDB.push([
                result.module_name,
                JSON.stringify(result.questions)
            ]);
        });
    }
    await insertRows(database, 'ticket_modules', userDB);

    return Object.keys(data.result);
}

async function getTicketReplies(database: Database, domain: string, sessionID: string, ticketCode: string, ticketId: string): Promise<[TicketReply[], boolean]> {
    let page = [1];
    let lastPage = [1];
    let replies: TicketReply[] = [];
    let has_uploads = false;

    while (page[0] <= lastPage[0]) {
        const params = {
            session_id: sessionID,
            ticket_code: ticketCode,
            page: page[0],
        }

        const data = await enjinRequest<Tickets.GetReplies>(params, 'Tickets.getReplies', domain);

        if (data.error) {
            console.log(`Error getting replies for ticket ${ticketCode}: ${data.error.code} ${data.error.message}`)
            break;
        }

        lastPage[0] = data.result.pagination.last_page;

        replies.push(...data.result.results);
        has_uploads = data.result.has_uploads;
        page[0]++;
    }

    return [replies, has_uploads];
}

async function getTicketsByModule(database: Database, domain: string, sessionID: string, modules: string[]) {
    const moduleCount = [0];
    let totalModules = modules.length;
    let tickets = 0;
    let page = [1];
    let lastPage = [1];
    let allTickets: Record<string, Ticket[]>[] = [];

    if (fileExists('./target/recovery/module_tickets.json')) {
        const progress = parseJsonFile('../../target/recovery/module_tickets.json') as [Record<string, Ticket[]>[], Ticket[], string[], number[], number[], number[]];
        allTickets = progress[0];
        modules = progress[2];
        totalModules = modules.length;
        moduleCount[0] = progress[3][0];
        page[0] = progress[4][0];
        lastPage[0] = progress[5][0];
    }

    addExitListeners(['./target/recovery/module_tickets.json'], [[allTickets, modules, moduleCount, page, lastPage]]);

    for (let i = moduleCount[0]; i < totalModules; i++) {
        while (page[0] <= lastPage[0]) {
            const params = {
                session_id: sessionID,
                preset_id: modules[i],
                status: 'all',
                page: page[0],
            }
            const data = await enjinRequest<Tickets.GetTickets>(params, 'Tickets.getTickets', domain);

            if (data.error) {
                console.log(`Error getting tickets for module ${modules[i]} page ${page[0]}: ${data.error.code} ${data.error.message}`)
                break;
            }

            lastPage[0] = data.result.pagination.last_page;
            allTickets[0] = { ...allTickets[0], ...{ [modules[i]]: data.result.results } };
            tickets += data.result.results.length;
            console.log(`Found tickets for module ${modules[i]} page (${page[0]++}/${lastPage})...`);

            for (const ticket of data.result.results) {
                const [replies, has_uploads] = await getTicketReplies(database, domain, sessionID, ticket.code, ticket.id);
                const values = [
                    ticket.id,
                    ticket.code,
                    ticket.site_id,
                    ticket.preset_id,
                    ticket.subject,
                    ticket.created,
                    ticket.status,
                    ticket.assignee,
                    ticket.updated,
                    ticket.requester,
                    ticket.priority,
                    ticket.extra_questions,
                    ticket.status_change,
                    ticket.email,
                    ticket.viewers,
                    ticket.createdHTML,
                    ticket.updatedHTML,
                    ticket.requesterHTML,
                    ticket.assigneeText,
                    ticket.assigneeHTML,
                    ticket.priority_name,
                    ticket.replies_count,
                    ticket.private_reply_count,
                    JSON.stringify(replies),
                    has_uploads
                ];
                await insertRow(database, 'tickets', ...values);

            }

        }
        page[0] = 1;
        console.log(`Found ${tickets} tickets for module ${modules[i]}. (${++moduleCount[0]}/${totalModules}))`);
        tickets = 0;
    }
    removeExitListeners();
}

export async function getAllTickets(database: Database, domain: string, apiKey: string, sessionID: string) {
    console.log('Getting all tickets...');
    const modules = await getTicketModules(database, domain, apiKey);
    console.log(`Found ${modules.length} ticket modules: ${modules.join(', ')}.`);
    await getTicketsByModule(database, domain, sessionID, modules);
}