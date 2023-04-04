import { Database } from 'sqlite3';
import { Ticket, TicketReply, Tickets } from '../interfaces/tickets';
import { insertRows } from '../util/database';
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

async function getTicketReplies(database: Database, domain: string, sessionID: string, ticketCode: string, ticketId: string): Promise<boolean> {
    let page = [1];
    let lastPage = [1];
    let replies: TicketReply[] = [];
    let has_uploads = false;
    const userDB: [
        string,
        string,
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string, 
        string
    ][] = [];

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

        for (const reply of data.result.results) {
            userDB.push([
                reply.id,
                ticketId,
                reply.preset_id,
                reply.sent,
                reply.text,
                reply.user_id,
                reply.mode,
                reply.origin,
                reply.agent,
                reply.userHTML,
                reply.createdHTML,
                reply.username
            ]);
        }
        await insertRows(database, 'ticket_replies', userDB);

        lastPage[0] = data.result.pagination.last_page;

        replies.push(...data.result.results);
        has_uploads = data.result.has_uploads;
        page[0]++;
    }

    return has_uploads;
}

async function getTicketsByModule(database: Database, domain: string, sessionID: string, modules: string[]): Promise<Record<string, Ticket[]>> {
    const moduleCount = [0];
    let totalModules = modules.length;
    let page = [1];
    let lastPage = [1];
    let tickets: Ticket[] = [];
    let allTickets: Record<string, Ticket[]>[] = [];
    const userDB: [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
        boolean,
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        number,
        boolean
    ][] = [];

    if (fileExists('./target/recovery/module_tickets.json')) {
        const progress = parseJsonFile('../../target/recovery/module_tickets.json') as [Record<string, Ticket[]>[], Ticket[], string[], number[], number[], number[]];
        allTickets = progress[0];
        tickets = progress[1];
        modules = progress[2];
        totalModules = modules.length;
        moduleCount[0] = progress[3][0];
        page[0] = progress[4][0];
        lastPage[0] = progress[5][0];
    }

    addExitListeners(['./target/recovery/module_tickets.json'], [[allTickets, tickets, modules, moduleCount, page, lastPage]]);

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
            tickets.push(...data.result.results);

            console.log(`Found tickets for module ${modules[i]} page (${page[0]++}/${lastPage})...`);
        }
        for (const ticket of tickets) {
            const has_uploads = await getTicketReplies(database, domain, sessionID, ticket.code, ticket.id);
            userDB.push([
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
                has_uploads
            ]);
        }
        await insertRows(database, 'tickets', userDB);
        page[0] = 1;
        allTickets[0] = { ...allTickets[0], ...{ [modules[i]]: tickets } };
        console.log(`Found ${tickets.length} tickets for module ${modules[i]}. (${++moduleCount[0]}/${totalModules}))`);
        tickets = [];
    }

    removeExitListeners();
    return allTickets[0];
}

export async function getAllTickets(database: Database, domain: string, apiKey: string, sessionID: string): Promise<Record<string, { ticket: Ticket, replies: TicketReply[] }>> {
    console.log('Getting all tickets...');
    const modules = await getTicketModules(database, domain, apiKey);

    console.log(`Found ${modules.length} ticket modules: ${modules.join(', ')}.`);
    let allTickets: Record<string, Ticket[]> = {};

    if (!fileExists('./target/recovery/tickets.json')) {
        allTickets = await getTicketsByModule(database, domain, sessionID, modules);
    }


    let ticketsWithReplies: Record<string, { ticket: Ticket, replies: TicketReply[] }> = {};
    let ticketCodes: [string, string, number][] = Object.values(allTickets).flatMap(memberTickets => memberTickets.map<[string, string, number]>((ticket, index) => [ticket.code, ticket.preset_id, index]));
    let totalTicketCodes = ticketCodes.length;
    const ticketCodesCount = [0];

    if (fileExists('./target/recovery/tickets.json')) {
        const progress = parseJsonFile('./target/recovery/tickets.json') as [Record<string, Ticket[]>, Record<string, { ticket: Ticket, replies: TicketReply[] }>, [string, string, number][], number[]];
        allTickets = progress[0];
        ticketsWithReplies = progress[1];
        ticketCodes = progress[2];
        ticketCodesCount[0] = progress[3][0];
        totalTicketCodes = ticketCodes.length;
    }

    addExitListeners(['./target/recovery/tickets.json'], [[allTickets, ticketsWithReplies, ticketCodes, ticketCodesCount]])
    removeExitListeners();
    return ticketsWithReplies;
}