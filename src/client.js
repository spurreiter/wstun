/**
 * @copyright (C) 2014-2015 Andrea Rocco Lotronto, 2017 Nicola Peditto
 * @copyright (C) 2023 spurreiter
 * @license Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import * as net from 'node:net'
import { EventEmitter } from 'node:events'
import { logger, getPemFiles, toURL } from './utils.js'
import websocket from 'websocket'
import { bindSockets } from './bindSockets.js'

const log = logger('client')

const WebSocketClient = websocket.client

export class Client extends EventEmitter {
  /**
   * @param {import('./types').ClientOptions} [clientOptions]
   */
  constructor(clientOptions) {
    super()
    const { bearerAuth, listeningHost, tlsOptions, wsOptions } =
      clientOptions || {}
    this._listeningHost = listeningHost
    this._headers = bearerAuth
      ? { authorization: `Bearer ${bearerAuth}` }
      : undefined
    this._clientOptions = {
      ...wsOptions,
      tlsOptions: getPemFiles(tlsOptions)
    }
    log.info('WS Tunnel Client starting...')
    this.tcpServer = net.createServer()
  }

  /**
   * @param {number} localPort
   * @param {URL|string} wsHostUrl
   * @param {string} [destination] `<hostname>:<port>`
   */
  start(localPort, wsHostUrl, destination) {
    const _wsHostUrl = toURL(wsHostUrl)

    log.info('client started.')

    this.tcpServer.on('error', (err) => {
      this.emit('error', err)
    })
    this.tcpServer.listen({
      port: Number(localPort),
      host: this._listeningHost
    })

    log.info('WS tunnel established. Waiting for incoming connections...')

    this.tcpServer.on('connection', (tcpConn) => {
      log.info('New connection...')
      const wsClient = new WebSocketClient(structuredClone(this._clientOptions))

      wsClient.on('connectFailed', (err) => {
        log.info('WS connect error=%s', err)
        tcpConn.destroy()
        this.emit('error', err)
      })

      wsClient.on('connect', (wsConn) => {
        log.info('WS connected')
        bindSockets(wsConn, tcpConn, this.emit.bind(this))
      })

      _wsHostUrl.search = ''
      if (destination) {
        _wsHostUrl.searchParams.set('dst', destination)
      }

      wsClient.connect(_wsHostUrl.toString(), 'tunnel-protocol', undefined, this._headers)
    })
  }

  close() {
    this.removeAllListeners()
    return this.tcpServer.close()
  }
}
