export interface EnjinResponse<T> {
    id: string;
    jsonrpc: string;
    result: T;
}