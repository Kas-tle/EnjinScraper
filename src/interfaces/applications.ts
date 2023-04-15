export namespace Applications {
    export interface GetTypes {
        [key: string]: string;
    }
    export interface GetList {
        items: ApplicationResponse[];
        total: string;
    }
    export interface GetApplication extends ApplicationResponse {
        user_data: UserData;
        is_archived: boolean;
        is_trashed: boolean;
        allow_app_comments: string;
        post_app_comments: boolean;
        allow_admin_comments: boolean;
    }
}

interface UserData {
    [key: string]: string | number | boolean | string[] | number[] | boolean[]
}

export interface ApplicationResponse {
    application_id: string;
    site_id: string;
    preset_id: string;
    title: string;
    user_ip: string;
    is_mine: boolean;
    can_manage: boolean;
    created: string;
    updated: string;
    read: string;
    comments: number;
    read_comments: string | null;
    app_comments: string;
    admin_comments: string;
    site_name: string;
    user_id: string;
    is_online: boolean;
    admin_online: boolean;
    username: string;
    avatar: string;
    admin_user_id: string;
    admin_username: string;
    admin_avatar: string;
    site_logo: string;
}

export interface ApplicationDBResponse {
    application_id: string;
    preset_id: string;
    user_data: string;
}

export interface Application {
    preset_id: string, 
    title: string, 
    post_app_comments: boolean, 
    allow_admin_comments: boolean
}

type ApplicationsTupple = [
    string, string, boolean, boolean
]
export interface ApplicationsDB extends Array<ApplicationsTupple[number]> {}

type ApplicationSectionsTupple = [
    string, string, string, string, string, string, string, string, boolean, string
]
export interface ApplicationSectionsDB extends Array<ApplicationSectionsTupple[number]> {}

type ApplicationQuestionsTupple = [
    string, string, string, string, string, string, string|null, boolean, string
]
export interface ApplicationQuestionsDB extends Array<ApplicationQuestionsTupple[number]> {}

export interface ApplicationContent {
    elements: {
        [key: string]: ApplicationQuestion;
    }
    sections: {
        [key: string]: ApplicationSection;
    }
}

export interface ApplicationQuestion {
    preset_id: string;
    hash: string;
    delta: string;
    data: QuestionData.Question;
    conditions:  ApplicationConditions | false;
    section_id: string;
    data_old: string | null;
    visible: boolean;
    widget: string;
}

export interface ApplicationSection {
    section_id: string;
    preset_id: string;
    title: string;
    new_page: string;
    hide_title: string;
    delta: string;
    description: string;
    conditions: ApplicationConditions | false;
    visible: boolean;
    header: string;
}

interface ApplicationConditions {
    action: string;
    on: string;
    items: {
        method: string;
        hash: string;
        choice: string;
    }[];
}

namespace QuestionData {
    export interface Question {
        questionType: string;
        type: string;
        required: number;
        bold_question: number;
        eid: number;
        help: string;
        text: string;
    }

    interface Text extends Question {
        questionType: "shorttext" | "longtext" | "richtext";
        type: "text";
        text: string;
        line_height: string;
        enable_bbcode: number;
    }

    interface Dropdown extends Question {
        questionType: "dropdown";
        type: "dropdown";
        choices: string[];
        line_count: string;
    }

    interface Checkbox extends Question {
        questionType: "checkbox";
        type: "checkbox";
        multiple: number;
        choices: string[];
    }

    interface Numeric extends Question {
        questionType: "numeric";
        type: "numeric";
        slider: number;
        decimal: number;
        min_value: string;
        max_value: string;
    }

    interface DateTime extends Question {
        questionType: "datetime";
        type: "datetime";
        enable_date: number;
        enable_time: number;
        military_format: number;
    }

    interface Matrix extends Question {
        questionType: "matrix";
        type: "matrix";
        rows: string[];
        columns: string[];
        multiple: number;
    }

    interface BBCode extends Question {
        questionType: "bbcode";
        type: "bbcode";
        hide_title: boolean;
    }

    interface ImageUpload extends Question {
        questionType: "image_upload";
        type: "image_upload";
        limit_upload: string;
    }

    interface Wow extends Question {
        questionType: "wow";
        type: "wow";
        multiple: number;
    }
}