import axios, { AxiosResponse, ResponseType } from "axios";
import { Mutex } from 'async-mutex';
import { getConfig } from './config';
import { getErrorMessage } from "./error";
import { EnjinResponse, Params } from "../interfaces/generic";
import { writeJsonFile } from "./files";
import { MessageType, statusMessage } from "./console";

let id = 0;

export async function enjinRequest<T>(params: Params, method: string, domain: string, inputHeaders: any = {}): Promise<EnjinResponse<T>> {
    const config = await getConfig();
    const protocol = config.disableSSL ? 'http' : 'https';
    const retrySeconds = config.retrySeconds >= 0 ? config.retrySeconds : 0;
    const retryTimes = config.retryTimes >= 0 ? config.retryTimes : Number.MAX_SAFE_INTEGER;
    const retryTime = retrySeconds * 1000;

    let retries = 0;
    while (retries <= retryTimes) {
        const qid = (++id).toString().padStart(7, '0');
        try {
            const { data, headers } = await axios.post<EnjinResponse<T>>(
                `${protocol}://${domain}/api/v1/api.php`,
                {
                    jsonrpc: '2.0',
                    id: qid,
                    method: method,
                    params: params,
                },
                { headers: { 'Content-Type': 'application/json', ...inputHeaders, } }
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
                statusMessage(MessageType.Critical, `Enjin API rate limit exceeded. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status === 403) {
                statusMessage(MessageType.Critical, `File is not available for download (403 Forbidden)`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                return Promise.reject();            
            } else if (error.response && error?.response.status === 405) {
                    statusMessage(MessageType.Critical, `Enjin API returned method not allowed (405 Method not allowed)`);
                    statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                    return Promise.reject();
            } else if (error.response && error?.response.status === 524) {
                statusMessage(MessageType.Critical, `Enjin took too long to respond per Cloudflare's 100 second limit (524 a timeout occurred) Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.code === 'EAI_AGAIN') {
                statusMessage(MessageType.Critical, `DNS lookup error on request ${qid}: ${getErrorMessage(error)}. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status >= 400 && error?.response.status <= 599) {
                statusMessage(MessageType.Critical, `Response code ${error?.response.status}: ${getErrorMessage(error)}`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else {
                statusMessage(MessageType.Error, `Error making request ${qid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    statusMessage(MessageType.Error, `Configured retry limit exceeded. Please try again later. Exiting...`);
    throw new Error('Must exit now!');
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0';
const rateLimiterMutex = new Mutex();
let lastCallTime = 0;

export async function getRequest(domain: string, url: string, headers: any, debugPath = '', overrideDebug = false, responseType: ResponseType | undefined = undefined): Promise<AxiosResponse> {
    const config = await getConfig();
    const protocol = config.disableSSL ? 'http' : 'https';
    const retrySeconds = config.retrySeconds >= 0 ? config.retrySeconds : 0;
    const retryTimes = config.retryTimes >= 0 ? config.retryTimes : Number.MAX_SAFE_INTEGER;
    const retryTime = retrySeconds * 1000;

    let retries = 0;
    while (retries <= retryTimes) {
        const rid = (++id).toString().padStart(7, '0');
        try {
            const response = await axios.get(url, {
                baseURL: `${protocol}://${domain}`,
                headers: {
                    'User-Agent': userAgent,
                    'Accept-Encoding': 'html',
                    ...headers,
                },
                responseType: responseType,
            });

            if (config.debug && !overrideDebug) {
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
                statusMessage(MessageType.Critical, `Enjin API rate limit exceeded. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status === 403) {
                statusMessage(MessageType.Critical, `File is not available for download (403 Forbidden)`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                return Promise.reject();
            } else if (error.response && error?.response.status === 524) {
                statusMessage(MessageType.Critical, `Enjin took too long to respond per Cloudflare's 100 second limit (524 a timeout occurred) Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.code === 'EAI_AGAIN') {
                statusMessage(MessageType.Critical, `DNS lookup error on request ${rid}: ${getErrorMessage(error)}. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status >= 400 && error?.response.status <= 599) {
                statusMessage(MessageType.Critical, `Response code ${error?.response.status}: ${getErrorMessage(error)}`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else {
                statusMessage(MessageType.Error, `Error making request ${rid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    statusMessage(MessageType.Error, `Configured retry limit exceeded. Please try again later. Exiting...`);
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}

export async function throttledGetRequest(domain: string, url: string, headers: any, debugPath = '', overrideDebug = false, responseType = undefined): Promise<AxiosResponse> {
    await rateLimiterMutex.runExclusive(async () => {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;
        const timeToWait = Math.max(0, 25 - timeSinceLastCall);

        if (timeToWait > 0) {
            await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }

        lastCallTime = Date.now();
    });

    return getRequest(domain, url, headers, debugPath, overrideDebug, responseType);
}

export async function postRequest(domain: string, url: string, data: any, headers: any, debugPath = ''): Promise<AxiosResponse> {
    const config = await getConfig();
    const protocol = config.disableSSL ? 'http' : 'https';
    const retrySeconds = config.retrySeconds >= 0 ? config.retrySeconds : 0;
    const retryTimes = config.retryTimes >= 0 ? config.retryTimes : Number.MAX_SAFE_INTEGER;
    const retryTime = retrySeconds * 1000;
    
    let retries = 0;
    while (retries <= retryTimes) {
        const rid = (++id).toString().padStart(7, '0');
        try {
            const response = await axios.post(url, data, {
                baseURL: `${protocol}://${domain}`,
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
                statusMessage(MessageType.Critical, `Enjin API rate limit exceeded. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status === 403) {
                statusMessage(MessageType.Critical, `File is not available for download (403 Forbidden)`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                return Promise.reject();
            } else if (error.response && error?.response.status === 524) {
                statusMessage(MessageType.Critical, `Enjin took too long to respond per Cloudflare's 100 second limit (524 a timeout occurred) Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.code === 'EAI_AGAIN') {
                statusMessage(MessageType.Critical, `DNS lookup error on request ${rid}: ${getErrorMessage(error)}. Retrying...`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else if (error.response && error?.response.status >= 400 && error?.response.status <= 599) {
                statusMessage(MessageType.Critical, `Response code ${error?.response.status}: ${getErrorMessage(error)}`);
                statusMessage(MessageType.Critical, `Attempt [(${retries+1}/${retryTimes+1})]`);
                retries++;
                await new Promise((resolve) => setTimeout(resolve, retryTime));
            } else {
                statusMessage(MessageType.Error, `Error making request ${rid}: ${getErrorMessage(error)}`);
                throw error;
            }
        }
    }
    statusMessage(MessageType.Error, `Configured retry limit exceeded. Please try again later. Exiting...`);
    process.kill(process.pid, 'SIGINT');
    return Promise.reject();
}

export async function throttledPostRequest(domain: string, url: string, data: any, headers: any, debugPath = ''): Promise<AxiosResponse> {
    await rateLimiterMutex.runExclusive(async () => {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;
        const timeToWait = Math.max(0, 25 - timeSinceLastCall);

        if (timeToWait > 0) {
            await new Promise((resolve) => setTimeout(resolve, timeToWait));
        }

        lastCallTime = Date.now();
    });

    return postRequest(domain, url, data, headers, debugPath);
}
