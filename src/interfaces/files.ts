export interface DirectoryListingResponse {
    jsonrpc: string;
    result: DirectoryListing;
    id: string;
    token: string;
}

export interface DirectoryListing {
    columns: string[];
    config: Directory.Config;
    file: Directory.File;
    urlFile: null;
    data: Directory.Data[];
    url: string;
    thumbnailFolder: string;
    thumbnailPrefix: string;
    offset: number;
    last: boolean;
}

export namespace Directory {
    export interface Config {
        [key: string]: string | boolean;
        "general.hidden_tools": string;
        "general.disabled_tools": string;
        "filesystem.extensions": string;
        "filesystem.force_directory_template": boolean;
        "upload.maxsize": string;
        "upload.chunk_size": string;
        "upload.extensions": string;
        "createdoc.templates": string;
        "createdoc.fields": string;
        "createdir.templates": string;
    }
    export interface File {
        path: string;
        size: number;
        url: string;
        lastModified: number;
        isFile: boolean;
        canRead: boolean;
        canWrite: boolean;
        canEdit: boolean;
        canRename: boolean;
        canView: boolean;
        canPreview: boolean;
        exists: boolean;
        meta: {
            url: string;
        };
    }
    export type Data = [
        string,
        number,
        number,
        string,
        Record<string, never>
    ];
}

export interface FileData {
    filename: string;
    url: string;
    dirPath: string;
}

type S3FilesTuple = [
    string, string, string
]
export interface S3FilesDB extends Array<S3FilesTuple[number]> {}