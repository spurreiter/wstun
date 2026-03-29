export class ServerReverse extends EventEmitter<any> {
    /**
     * @param {import('./types.js').ServerOptions} [options]
     */
    constructor(options?: import("./types.js").ServerOptions);
    _allowList: import("./allowList.js").AllowList | undefined;
    _listeningHost: string | undefined;
    httpsFlag: boolean;
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
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
