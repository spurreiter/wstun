import * as fs from 'node:fs'
import { timingSafeEqual } from 'node:crypto'

/**
 * @typedef {import('./types').AllowedClient} AllowedClient
 */

export class AllowList {
  /**
   * @param {AllowedClient[]} [allowList]
   */
  constructor(allowList) {
    if (!allowList) {
      return
    }
    this._init(allowList)
  }

  /**
   * @private
   * @param {AllowedClient[]} allowList
   */
  _init(allowList) {
    if (!Array.isArray(allowList)) {
      throw TypeError('allowList not an array')
    }
    for (const allowed of allowList) {
      if (!allowed || typeof allowed !== 'object') {
        throw TypeError('allowList item must be an object')
      }
      if (typeof allowed.id !== 'string') {
        throw TypeError(`allowList[].id must be a string id=${allowed.id}`)
      }
      if (allowed.destinations && !Array.isArray(allowed.destinations)) {
        throw TypeError(
          `allowList[].destinations must be an array of strings id=${allowed.id}`
        )
      }
      this._list = this._list || new Map()
      this._list.set(allowed.id, allowed)
    }
  }

  /**
   * @returns {boolean}
   */
  needsAuth() {
    return !!this._list
  }

  /**
   * @param {string} authHeader
   * @returns {Promise<object>}
   */
  async isAuthorized(authHeader) {
    if (!this._list) {
      return null
    }
    const _auth = String(authHeader)
    if (!_auth.startsWith('Bearer ')) {
      return null
    }
    const id = _auth.slice(7)
    const found = this._list.get(id)
    if (!found) {
      const buf = Buffer.from(id)
      timingSafeEqual(buf, buf)
      return null
    }
    return found
  }

  loadSync(filename) {
    const allowListStr = fs.readFileSync(filename, 'utf-8')
    const allowList = JSON.parse(allowListStr)
    this._init(allowList)
  }
}
