/**
 * load or pass on a PEM certificate or key
 * @param {string|URL|Buffer} [filenameOrPem]
 * @returns {Buffer|undefined}
 */
export function getPem(filenameOrPem?: string | URL | Buffer | undefined): Buffer | undefined;
/**
 * @typedef {import('./types').TlsOptionsExt} TlsOptionsExt
 */ /**
* @typedef {import('node:tls').TlsOptions} TlsOptions
*/
/**
 * @param {TlsOptionsExt} [tlsOptions]
 * @returns {TlsOptions|undefined}
 */
export function getPemFiles(tlsOptions?: import("./types").TlsOptionsExt | undefined): TlsOptions | undefined;
export function logger(namespace: string, opts?: object): import('debug-level').Log;
export function nap(ms?: number | undefined): Promise<number>;
export function qs(path: string): object;
export function toURL(strOrUrl: URL | string): URL;
export function toInteger(any: any): number | undefined;
export function toString(any: any): string | undefined;
export type TlsOptionsExt = import('./types').TlsOptionsExt;
export type TlsOptions = import('node:tls').TlsOptions;
