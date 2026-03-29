export class Server extends EventEmitter<any> {
    /**
     * @param {import('./types.js').ServerOptions} [options]
     */
    constructor(options?: import("./types.js").ServerOptions);
    _listeningHost: string | undefined;
    _allowList: import("./allowList.js").AllowList | undefined;
    httpsFlag: boolean;
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    wsServer: any;
    /**
     * @param {number} port local listening port
     * @param {string} [dstHost] destination host `<hostname>:<port>`
     */
    start(port: number, dstHost?: string): void;
    close(): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    _reject(req: any, status: any, msg: any, logMsg: any): void;
}
import { EventEmitter } from 'node:events';
import * as http from 'node:http';
