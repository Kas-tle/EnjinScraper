import axios from 'axios';

interface Ticket {
    id: string;
    code: string;
    site_id: string;
    preset_id: string;
    subject: string;
    created: string;
    status: string;
    assignee: string;
    updated: string;
    requester: string;
    priority: string;
    extra_questions: string;
    status_change: string;
    email: string | null;
    viewers: boolean;
    createdHTML: string;
    updatedHTML: string;
    requesterHTML: string;
    assigneeText: string;
    assigneeHTML: string;
    priority_name: string;
    replies_count: number;
    private_reply_count: number;
}

interface TicketModule {
    module_name: string;
    questions: {
        id: string;
        site_id: string;
        preset_id: string;
        type: string;
        label: string;
        required: string;
        bold: string;
        help_text: string;
        order: string;
        other_options: {
            bbcode: string;
            lines: string;
            min: string;
            max: string;
        } | null;
        options: null;
        conditions: null;
        condition_qualify: string;
        system: string;
    }[];
}

interface TicketAPIResponse {
    result: {
        results: Ticket[];
        pagination: {
            page: string;
            nr_pages: number;
            nr_results: string;
            first_page: number;
            last_page: number;
        };
    };
    id: string;
    jsonrpc: string;
}

interface TicketModulesAPIResponse {
    result: {
        [key: string]: TicketModule;
    };
    id: string;
    jsonrpc: string;
}

async function getTicketModules(domain: string, apiKey: string): Promise<string[]> {
    const response = await axios.post(`https://${domain}/api/v1/api.php`, {
        jsonrpc: '2.0',
        id: '12345',
        method: 'Tickets.getModules',
        params: { api_key: apiKey },
    }, {
        headers: { 'Content-Type': 'application/json' },
    });

    const data: TicketModulesAPIResponse = response.data;
    return Object.keys(data.result);
}

async function getModuleTickets(domain: string, sessionID: string, moduleID: string): Promise<Ticket[]> {
    let page = 1;
    let lastPage = 1;
    const tickets: Ticket[] = [];

    while (page <= lastPage) {
        const response = await axios.post(`https://${domain}/api/v1/api.php`, {
            jsonrpc: '2.0',
            id: '12345',
            method: 'Tickets.getTickets',
            params: { session_id: sessionID, preset_id: moduleID, page },
        }, {
            headers: { 'Content-Type': 'application/json' },
        });

        const data: TicketAPIResponse = response.data;

        tickets.push(...data.result.results);
        lastPage = data.result.pagination.last_page;
        page++;
    }

    return tickets;
}

export async function getAllTickets(domain: string, apiKey: string, sessionID: string): Promise<Ticket[]> {
    const modules = await getTicketModules(domain, apiKey);

    const allTickets: Ticket[] = [];

    for (const moduleID of modules) {
        const tickets = await getModuleTickets(domain, sessionID, moduleID);
        allTickets.push(...tickets);
    }

    return allTickets;
}