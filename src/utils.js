import * as fs from 'node:fs'
import { logger as loggerF } from 'debug-level'

/**
 * @param {string} namespace
 * @param {object} [opts]
 * @returns {import('debug-level').Log}
 */
export const logger = (namespace, opts) => loggerF(`wstun:${namespace}`, opts)

/**
 * @param {number} [ms]
 * @returns {Promise<number>}
 */
export const nap = (ms = 100) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms))

/**
 * load or pass on a PEM certificate or key
 * @param {string|URL|Buffer} [filenameOrPem]
 * @returns {Buffer|undefined}
 */
export function getPem(filenameOrPem) {
  if (!filenameOrPem) return
  if (filenameOrPem instanceof Buffer) {
    return filenameOrPem
  }
  if (
    typeof filenameOrPem === 'string' &&
    filenameOrPem.startsWith('-----BEGIN ')
  ) {
    return Buffer.from(filenameOrPem, 'utf-8')
  }
  return fs.readFileSync(filenameOrPem)
}

/**
 * @typedef {import('./types').TlsOptionsExt} TlsOptionsExt
 */ /**
 * @typedef {import('node:tls').TlsOptions} TlsOptions
 */
/**
 * @param {TlsOptionsExt} [tlsOptions]
 * @returns {TlsOptions|undefined}
 */
export function getPemFiles(tlsOptions) {
  if (typeof tlsOptions !== 'object') return
  const out = { ...tlsOptions }
  for (const prop of ['key', 'cert', 'ca']) {
    if (tlsOptions[prop]) {
      out[prop] = getPem(tlsOptions[prop])
    }
  }
  return out
}

/**
 * @param {string} path
 * @returns {object}
 */
export const qs = (path) => {
  // eslint-disable-next-line no-unused-vars
  const [_path, search] = path.split('?')
  const searchParams = new URLSearchParams(search)
  const query = {}
  for (const [name, value] of searchParams.entries()) {
    query[name] = value
  }
  return query
}

/**
 * @param {URL|string} strOrUrl
 * @returns {URL}
 */
export const toURL = (strOrUrl) =>
  strOrUrl instanceof URL ? strOrUrl : new URL(strOrUrl)

/**
 * @param {any} any
 * @returns {number|undefined}
 */
export const toInteger = (any) =>
  !isNaN(Number(any)) && Number.isSafeInteger(Number(any))
    ? Number(any)
    : undefined

/**
 * @param {any} any
 * @returns {string|undefined}
 */
export const toString = (any) => (typeof any === 'string' ? any : undefined)
