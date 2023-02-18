import { Ticket, Tickets } from '../interfaces/tickets';
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

async function getModuleTickets(domain: string, sessionID: string, moduleID: string): Promise<Record<string, Ticket[]>> {
    let page = 1;
    let lastPage = 1;
    const tickets: Ticket[] = [];

    while (page <= lastPage) {
        console.log(`Getting tickets for module ${moduleID} page ${page}...`)

        const params = {
            session_id: sessionID,
            preset_id: moduleID,
            status: 'all',
            page,
        }
        const data = await enjinRequest<Tickets.GetTickets>(params, 'Tickets.getTickets', domain);

        if (data.error) {
            console.log(`Error getting tickets for module ${moduleID} page ${page}: ${data.error.code} ${data.error.message}`)
            break;
        }

        tickets.push(...data.result.results);
        lastPage = data.result.pagination.last_page;
        page++;
    }

    return { [moduleID]: tickets };
}

export async function getAllTickets(domain: string, apiKey: string, sessionID: string): Promise<Record<string, Ticket[]>> {
    console.log('Getting all tickets...');
    const modules = await getTicketModules(domain, apiKey);

    console.log(`Found ${modules.length} ticket modules: ${modules.join(', ')}.`);

    let allTickets: Record<string, Ticket[]> = {};

    for (const moduleID of modules) {
        console.log(`Getting tickets for module ${moduleID}...`);
        const tickets = await getModuleTickets(domain, sessionID, moduleID);
        console.log(`Found ${tickets[moduleID].length} tickets for module ${moduleID}.`);
        allTickets = { ...allTickets, ...tickets };
    }

    return allTickets;
}