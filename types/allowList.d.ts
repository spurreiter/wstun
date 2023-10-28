/**
 * @typedef {import('./types').AllowedClient} AllowedClient
 */
export class AllowList {
    /**
     * @param {AllowedClient[]} [allowList]
     */
    constructor(allowList?: import("./types").AllowedClient[] | undefined);
    /**
     * @private
     * @param {AllowedClient[]} allowList
     */
    private _init;
    _list: any;
    /**
     * @returns {boolean}
     */
    needsAuth(): boolean;
    /**
     * @param {string} authHeader
     * @returns {Promise<object>}
     */
    isAuthorized(authHeader: string): Promise<object>;
    loadSync(filename: any): void;
}
export type AllowedClient = import('./types').AllowedClient;
