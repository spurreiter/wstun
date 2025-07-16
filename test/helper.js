import dns from 'dns'
import { promisify } from 'util'

/**
 * @param {number} ms
 * @returns {Promise<number>}
 */
export const nap = (ms = 100) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms))

const dnsLookup = promisify(dns.lookup);

export const dnsEquals = async (hostname, ip = '127.0.0.1') => {
  const { address } = await dnsLookup(hostname)
  return address === ip
}
