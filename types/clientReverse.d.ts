/// <reference types="node" />
export class ClientReverse extends EventEmitter {
    /**
     * @param {import('./types').ClientOptions} [clientOptions]
     */
    constructor(clientOptions?: import("./types").ClientOptions | undefined);
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
    wsClientForControl: any;
    /**
     * @param {number} tunnelPort opens remote port at server
     * @param {URL|string} wsHostUrl websocket url of server
     * @param {string} destination `<hostname>:<port>` hostname, port of target
     * service
     */
    start(tunnelPort: number, wsHostUrl: URL | string, destination?: string): void;
    wsClientData: any;
    close(): void;
}
import { EventEmitter } from 'node:events';
