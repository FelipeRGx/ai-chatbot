import {Utils} from './Utils.class';
import {IncomingHttpHeaders} from 'http';
import cloneDeep from 'lodash/cloneDeep';
import * as HttpStatus from 'http-status-codes';
import Axios, {AxiosError, AxiosRequestConfig, AxiosResponse, Method} from 'axios';

export class HttpRequest {
    private config: AxiosRequestConfig = {
        ...cloneDeep(Axios.defaults),
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
        }
    };

    private method: Method | undefined;
    private timeout: number | undefined;
    private readonly initialHeaders = {
        'accept': 'application/json',
        'content-type': 'application/json'
    };

    constructor(private host: string, private responseType: any = '') {}

    /**
     * Get http action
     * @param path
     * @param params
     * @param headers
     */
    async get(path: string = '', params: object = {}, headers: IncomingHttpHeaders = {}) {
        this.method = 'GET';
        return await this.request(path, params, headers);
    }

    /**
     * Get http action
     * @param path
     * @param params
     * @param headers
     */
    async getWithBody(path: string, params: object = {}, headers: IncomingHttpHeaders = {}) {
        this.method = 'GET';
        return await this.request(path, params, headers, true);
    }

    /**
     * Post http action
     * @param data
     * @param path
     * @param headers
     * @param timeout
     */
    async post(data: any = {}, path: string = '', headers: IncomingHttpHeaders = this.initialHeaders, timeout: number = 0) {
        this.method = 'POST';
        this.timeout = timeout;
        return await this.request(path, data, headers);
    }

    /**
     * Put http action
     * @param path
     * @param data
     * @param headers
     */
    async put(path: string, data: any = {}, headers: IncomingHttpHeaders = this.initialHeaders) {
        this.method = 'PUT';
        return await this.request(path, data, headers);
    }

    /**
     * Delete http action
     * @param path
     * @param data
     * @param headers
     */
    async delete(path: string, data: object = {}, headers: IncomingHttpHeaders = this.initialHeaders) {
        this.method = 'DELETE';
        return this.request(path, data, headers);
    }

    /**
     * Request http manager
     * @param path
     * @param data
     * @param headers
     * @param isWithBody
     */
    async request(path: string, data: any, headers: IncomingHttpHeaders, isWithBody: Boolean = false): Promise<AxiosResponse> {
        this.config.method = this.method;
        this.config.url = (!path) ? this.host : `${this.host}/${path}`;

        if (Object.keys(data).length) {
            let object: 'params' | 'data' = (this.method === 'GET') && !isWithBody ? 'params' : 'data';
            this.config[object] = data;
        }

        if (Object.keys(headers).length) {
            this.config['headers'] = headers;
        }

        if (this.responseType) {
            this.config['responseType'] = this.responseType;
        }

        if (this.timeout) {
            this.config['timeout'] = this.timeout;
        }

        //console.log('Request config:', JSON.stringify(config));
        return new Promise((resolve) => {
            Axios(this.config).then((response: AxiosResponse) => {
                //console.log('Request response', response);
                resolve(response);
            }).catch((error: AxiosError) => {
                //console.log('Request error:', error);

                const currentError = Utils.objected(error.response);
                const errorResponse = (currentError.hasOwnProperty('status')) ? currentError : {status: HttpStatus.INTERNAL_SERVER_ERROR};
                resolve(errorResponse);
            });
        });
    }
}
