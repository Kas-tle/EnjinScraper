import axios from "axios";
import { getConfig } from './config';
import { getErrorMessage } from "./error";
import { EnjinResponse } from "../interfaces/generic";
import { writeJsonFile } from "./files";

let id = 0;

export async function enjinRequest<T>(params: object, method: string, domain: string): Promise<EnjinResponse<T>> {
    const config = await getConfig();
    let retries = 0;
    while (retries < 5) {
        try {
            const qid = (++id).toString().padStart(7, '0');
            const { data } = await axios.post<EnjinResponse<T>>(
                `https://${domain}/api/v1/api.php`,
                {
                    jsonrpc: '2.0',
                    id: qid,
                    method: method,
                    params: params,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            config.debug ? writeJsonFile(`./target/debug/${method.split('.').join('/')}/${qid}.json`, {request: params, data: data}) : {};

            return data;
        } catch (error: any) {
            if (error.response && error?.response.status === 429) {
                console.log(`Enjin API rate limit exceeded, retrying after 5 seconds...`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                console.log(`Error making request: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    console.log(`Enjin API rate limit exceeded. Please try again later. Exiting...`)
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}
