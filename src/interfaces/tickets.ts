import { Pagination } from "./generic";

export namespace Tickets {
    export interface GetTickets {
        results: Ticket[];
        pagination: Pagination
    }
    export interface GetModules {
        [key: string]: TicketModule;
    }
}

export interface Ticket {
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

export interface TicketModule {
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