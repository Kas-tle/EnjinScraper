export namespace Applications {
    export interface GetTypes {
        [key: string]: string;
    }
    export interface GetList {
        items: Application[];
        total: string;
    }
    export interface GetApplication extends Application {
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

export interface Application {
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

export namespace ApplicationForms {

    export interface TextAnswer {
        type: 'form-text-answer';
        question: string;
        help: string | null;
        style: string;
    }

    export interface DropdownAnswer {
        type: 'form-dropdown-answer';
        question: string;
        options: string[];
        help: string | null;
        style: string;
    }

    export interface CheckboxAnswer {
        type: 'form-checkbox-answer';
        question: string;
        options: string[];
        help: string | null;
        style: string;
    }

    export interface NumericAnswer {
        type: 'form-numeric-answer';
        question: string;
        slider: boolean;
        help: string | null;
        style: string;
    }

    export interface DatetimeAnswer {
        type: 'form-datetime-answer';
        question: string;
        date: string;
        time: string;
        help: string | null;
        style: string;
    }

    export interface MatrixAnswer {
        type: 'form-matrix-answer';
        question: string;
        grid: string[][];
        help: string | null;
        style: string;
    }

    export interface BBCodeAnswer {
        type: 'form-bbcode-answer';
        style: string;
    }

    export interface ImageUploadAnswer {
        type: 'form-image_upload-answer';
        question: string;
        help: string | null;
        style: string;
    }

    export interface WowAnswer {
        type: 'form-wow-answer';
        question: string;
        help: string | null;
        style: string;
    }

    export type Answer =
        | TextAnswer
        | DropdownAnswer
        | CheckboxAnswer
        | NumericAnswer
        | DatetimeAnswer
        | MatrixAnswer
        | BBCodeAnswer
        | ImageUploadAnswer
        | WowAnswer;

    export interface SectionHeader {
        title: string;
        description: string;
        prevQuestionHash: string | null;
        nextQuestionHash: string | null;
    }
}