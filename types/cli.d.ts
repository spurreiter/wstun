/**
 * @typedef {object} CliOption
 * @property {string} [short] short option
 * @property {string} [long] long option
 * @property {'number'|'string'} [type] type of option
 * @property {number|string} [def] default option
 * @property {string} [help]
 */
/**
 * @typedef {object} CliHelper
 * @property {number} [_break]
 * @property {string} [_usage]
 * @property {string} [_example]
 */
/**
 * a cli commander
 *
 * @example
 * const cmmds = {
 *   help: { short: '-h', long: '--help', help: 'this help' },
 *   test: { short: '-t', long: '--test', type: 'string', def: 'test', help: 'this is a test' },
 * }
 * cli(cmmds, [])
 * // { test: 'this is a test', hasArgs: false, helptext: '\n    Usage: myprg [options]\n\n...' }
 * cli(cmmds, ['--test', 'hi world'])
 * // { test: 'hi world', hasArgs: true, helptext: '\n    Usage: myprg [options]\n\n...' }
 *
 * @param {Record<string, CliOption> & CliHelper} cmds
 * @param {string[]|[]} argv
 * @returns {Record<string, boolean|number|string>}
 */
export function cli(cmds: Record<string, CliOption> & CliHelper, argv?: string[] | []): Record<string, boolean | number | string>;
export type CliOption = {
    /**
     * short option
     */
    short?: string | undefined;
    /**
     * long option
     */
    long?: string | undefined;
    /**
     * type of option
     */
    type?: "string" | "number" | undefined;
    /**
     * default option
     */
    def?: string | number | undefined;
    help?: string | undefined;
};
export type CliHelper = {
    _break?: number | undefined;
    _usage?: string | undefined;
    _example?: string | undefined;
};
