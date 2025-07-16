export class ClientReverse extends EventEmitter<[never]> {
    /**
     * @param {import('./types').ClientOptions} [clientOptions]
     */
    constructor(clientOptions?: import("./types").ClientOptions);
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
