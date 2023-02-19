import { Ticket, Tickets } from '../interfaces/tickets';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { fileExists } from '../util/files';
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
        const progress = require('../../target/recovery/module_tickets.json') as [Record<string, Ticket[]>[], Ticket[], string[], number[], number[], number[]];
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
            
            console.log(`Found tickets for module ${modules[i]} page ${page[0]++}...`);
        }
        page[0] = 1;
        allTickets[0] = { ...allTickets[0], ...{ [modules[i]]: tickets } };
        console.log(`Found ${tickets.length} tickets for module ${modules[i]}. (${++moduleCount[0]}/${totalModules}))`);
        tickets = [];
    }

    removeExitListeners();
    return allTickets[0];
}

export async function getAllTickets(domain: string, apiKey: string, sessionID: string): Promise<Record<string, Ticket[]>> {
    console.log('Getting all tickets...');
    const modules = await getTicketModules(domain, apiKey);

    console.log(`Found ${modules.length} ticket modules: ${modules.join(', ')}.`);

    const allTickets = await getTicketsByModule(domain, sessionID, modules);

    return allTickets;
}