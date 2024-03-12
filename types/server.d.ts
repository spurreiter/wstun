/// <reference types="node" />
/// <reference types="node" />
export class Server extends EventEmitter<[never]> {
    /**
     * @param {import('./types').ServerOptions} [options]
     */
    constructor(options?: import("./types").ServerOptions | undefined);
    _listeningHost: string | undefined;
    _allowList: import("./allowList.js").AllowList | undefined;
    httpsFlag: boolean;
    httpServer: https.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    wsServer: any;
    /**
     * @param {number} port local listening port
     * @param {string} [dstHost] destination host `<hostname>:<port>`
     */
    start(port: number, dstHost?: string | undefined): void;
    close(): https.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    _reject(req: any, status: any, msg: any, logMsg: any): void;
}
import { EventEmitter } from 'node:events';
import * as http from 'node:http';
import * as https from 'node:https';
