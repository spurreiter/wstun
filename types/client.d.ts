/// <reference types="node" />
/// <reference types="node" />
export class Client extends EventEmitter {
    /**
     * @param {import('./types').ClientOptions} [clientOptions]
     */
    constructor(clientOptions?: import("./types").ClientOptions | undefined);
    _listeningHost: string | undefined;
    _headers: {
        authorization: string;
    } | undefined;
    _clientOptions: {
        tlsOptions: import("tls").TlsOptions | undefined;
        maxReceivedFrameSize?: number | undefined;
        maxReceivedMessageSize?: number | undefined;
        fragmentOutgoingMessages?: boolean | undefined;
        fragmentationThreshold?: number | undefined;
        assembleFragments?: boolean | undefined;
        disableNagleAlgorithm?: boolean | undefined;
        closeTimeout?: number | undefined;
    };
    tcpServer: net.Server;
    /**
     * @param {number} localPort
     * @param {URL|string} wsHostUrl
     * @param {string} [destination] `<hostname>:<port>`
     */
    start(localPort: number, wsHostUrl: URL | string, destination?: string | undefined): void;
    close(): net.Server;
}
import { EventEmitter } from 'node:events';
import * as net from 'node:net';
