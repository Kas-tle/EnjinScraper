import { Ticket, TicketReply, Tickets } from '../interfaces/tickets';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists, parseJsonFile } from '../util/files';
import { enjinRequest } from '../util/request';

async function getTicketModules(domain: string, apiKey: string): Promise<string[]> {

    const params = {
        api_key: apiKey,
    }
    const data = await enjinRequest<Tickets.GetModules>(params, 'Tickets.getModules', domain);

    if (data.error) {
        console.log(`Error getting ticket modules: ${data.error.code} ${data.error.message}`)
        return [];
    }
    return Object.keys(data.result);
}

async function getTicketsByModule(domain: string, sessionID: string, modules: string[]): Promise<Record<string, Ticket[]>> {
    const moduleCount = [0];
    let totalModules = modules.length;
    let page = [1];
    let lastPage = [1];
    let tickets: Ticket[] = [];
    let allTickets: Record<string, Ticket[]>[] = [];

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
        page[0] = 1;
        allTickets[0] = { ...allTickets[0], ...{ [modules[i]]: tickets } };
        console.log(`Found ${tickets.length} tickets for module ${modules[i]}. (${++moduleCount[0]}/${totalModules}))`);
        tickets = [];
    }

    removeExitListeners();
    return allTickets[0];
}

async function getTicketReplies(domain: string, sessionID: string, ticketCode: string): Promise<TicketReply[]> {
    let page = [1];
    let lastPage = [1];
    let replies: TicketReply[] = [];

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

        page[0]++;
    }

    return replies;
}

export async function getAllTickets(domain: string, apiKey: string, sessionID: string): Promise<Record<string, { ticket: Ticket, replies: TicketReply[] }>> {
    console.log('Getting all tickets...');
    const modules = await getTicketModules(domain, apiKey);

    console.log(`Found ${modules.length} ticket modules: ${modules.join(', ')}.`);
    let allTickets: Record<string, Ticket[]> = {};

    if (!fileExists('./target/recovery/tickets.json')) {
        allTickets = await getTicketsByModule(domain, sessionID, modules);
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

    addExitListeners(['./target/recovery/tickets.json'], [[allTickets, ticketsWithReplies, ticketCodes, ticketCodesCount]]);

    for (let i = ticketCodesCount[0]; i < totalTicketCodes; i++) {

        const replies = await getTicketReplies(domain, sessionID, ticketCodes[i][0]);

        ticketsWithReplies[ticketCodes[i][1]] = {
            ...ticketsWithReplies[ticketCodes[i][1]],
            ...{
                [ticketCodes[i][0]]:
                { ticket: allTickets[ticketCodes[i][1]][ticketCodes[i][2]], replies }
            }
        };

        console.log(`Found all replies for ticket ${ticketCodes[i][0]} (${++ticketCodesCount[0]}/${totalTicketCodes})...`);
    }

    removeExitListeners();
    return ticketsWithReplies;
}