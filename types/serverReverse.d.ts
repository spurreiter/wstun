/// <reference types="node" />
/// <reference types="node" />
export class ServerReverse extends EventEmitter<[never]> {
    /**
     * @param {import('./types').ServerOptions} [options]
     */
    constructor(options?: import("./types").ServerOptions | undefined);
    _allowList: import("./allowList.js").AllowList | undefined;
    _listeningHost: string | undefined;
    httpsFlag: boolean;
    httpServer: https.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    wsServerForControl: any;
    /**
     * @param {number} port local listening port
     */
    start(port: number): void;
    close(): void;
    _reject(req: any, status: any, msg: any, logMsg: any): void;
}
import { EventEmitter } from 'node:events';
import * as http from 'node:http';
import * as https from 'node:https';
