import axios, { AxiosResponse } from "axios";
import { Mutex } from 'async-mutex';
import { getConfig } from './config';
import { getErrorMessage } from "./error";
import { EnjinResponse, Params } from "../interfaces/generic";
import { writeJsonFile } from "./files";

let id = 0;

export async function enjinRequest<T>(params: Params, method: string, domain: string): Promise<EnjinResponse<T>> {
    const config = await getConfig();
    let retries = 0;
    while (retries < 5) {
        const qid = (++id).toString().padStart(7, '0');
        try {
            const { data, headers } = await axios.post<EnjinResponse<T>>(
                `https://${domain}/api/v1/api.php`,
                {
                    jsonrpc: '2.0',
                    id: qid,
                    method: method,
                    params: params,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (config.debug) {
                params.hasOwnProperty('session_id') && (params.session_id = '***');
                params.hasOwnProperty('password') && (params.password = '***');
                params.hasOwnProperty('email') && (params.email = '***');
                params.hasOwnProperty('api_key') && (params.api_key = '***');
                writeJsonFile(`./target/debug/${method.split('.').join('/')}/${qid}.json`, { request: (params), headers, data: data })
            }

            return data;
        } catch (error: any) {
            if (error.response && error?.response.status === 429) {
                console.log(`Enjin API rate limit exceeded, retrying after 5 seconds...`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                console.log(`Error making request ${qid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    console.log(`Enjin API rate limit exceeded. Please try again later. Exiting...`)
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0';

export async function getRequest(domain: string, url: string, headers: any, debugPath=''): Promise<AxiosResponse> {
    const config = await getConfig();
    let retries = 0;
    while (retries < 5) {
        const rid = (++id).toString().padStart(7, '0');
        try {
            const response = await axios.get(url, {
                baseURL: `https://${domain}`,
                headers: {
                    'User-Agent': userAgent,
                    'Accept-Encoding': 'html',
                    ...headers,
                },
            });

            if (config.debug) {
                writeJsonFile(`./target/debug/get${debugPath}/${rid}.json`, { 
                    data: response.data, 
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    config: response.config
                })
            }

            return response;
        } catch (error: any) {
            if (error.response && error?.response.status === 429) {
                console.log(`Cloudflare rate limit exceeded, retrying after 5 seconds...`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                console.log(`Error making get request ${rid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    console.log(`Cloudflare rate limit exceeded. Please try again later. Exiting...`)
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}

const rateLimiterMutex = new Mutex();
let lastCallTime = 0;

export async function throttledGetRequest(domain: string, url: string, headers: any, debugPath=''): Promise<AxiosResponse> {
    await rateLimiterMutex.runExclusive(async () => {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;
        const timeToWait = Math.max(0, 25 - timeSinceLastCall);

        if (timeToWait > 0) {
            await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }

        lastCallTime = Date.now();
    });

    return getRequest(domain, url, headers, debugPath);
}

export async function postRequest(domain: string, url: string, data: any, headers: any, debugPath=''): Promise<AxiosResponse> {
    const config = await getConfig();
    let retries = 0;
    while (retries < 5) {
        const rid = (++id).toString().padStart(7, '0');
        try {
            const response = await axios.post(url, data, {
                baseURL: `https://${domain}`,
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...headers,
                },
                maxRedirects: 0,
                validateStatus: function (_status) {
                    return true; // Always return true to allow handling of all status codes
                }
            });

            if (config.debug) {
                writeJsonFile(`./target/debug/post${debugPath}/${rid}.json`, { 
                    data: response.data, 
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    config: response.config
                })
            }

            return response;
        } catch (error: any) {
            if (error.response && error?.response.status === 429) {
                console.log(`Cloudflare rate limit exceeded, retrying after 5 seconds...`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                console.log(`Error making post request ${rid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    console.log(`Cloudflare rate limit exceeded. Please try again later. Exiting...`)
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}
