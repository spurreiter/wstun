export class Client extends EventEmitter<[never]> {
    /**
     * @param {import('./types').ClientOptions} [clientOptions]
     */
    constructor(clientOptions?: import("./types").ClientOptions);
    _listeningHost: string | undefined;
    _headers: {
        authorization: string;
    } | undefined;
    _clientOptions: {
        tlsOptions: import("tls").TlsOptions | undefined;
        maxReceivedFrameSize?: number;
        maxReceivedMessageSize?: number;
        fragmentOutgoingMessages?: boolean;
        fragmentationThreshold?: number;
        assembleFragments?: boolean;
        disableNagleAlgorithm?: boolean;
        closeTimeout?: number;
    };
    tcpServer: net.Server;
    /**
     * @param {number} localPort
     * @param {URL|string} wsHostUrl
     * @param {string} [destination] `<hostname>:<port>`
     */
    start(localPort: number, wsHostUrl: URL | string, destination?: string): void;
    close(): net.Server;
}
import { EventEmitter } from 'node:events';
import * as net from 'node:net';
