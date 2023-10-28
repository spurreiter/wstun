/**
 * @param {*} wsConn
 * @param {*} tcpConn
 * @param {(event: string, err: Error) => void} emit
 */
export function bindSockets(wsConn: any, tcpConn: any, emit: (event: string, err: Error) => void): void;
