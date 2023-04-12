import { Pagination } from "./generic";

export namespace Tickets {
    export interface GetTickets {
        results: Ticket[];
        pagination: Pagination
    }
    export interface GetModules {
        [key: string]: TicketModule;
    }
    export interface GetReplies {
        results: TicketReply[];
        pagination: Pagination;
        has_uploads: boolean;
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

export interface TicketReply {
    id: string;
    preset_id: string;
    sent: string;
    text: string;
    user_id: string;
    mode: string;
    origin: string;
    agent: string;
    userHTML: string;
    createdHTML: string;
    username: string;
}

export interface TicketUpload {
    href: string;
    uploader: string;
    filename: string;
    timestamp: number;
}