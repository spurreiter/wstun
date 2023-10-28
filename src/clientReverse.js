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

const log = logger('clientRev')

const WebSocketClient = websocket.client

export class ClientReverse extends EventEmitter {
  /**
   * @param {import('./types').ClientOptions} [clientOptions]
   */
  constructor(clientOptions) {
    super()
    const { bearerAuth, tlsOptions, wsOptions } = clientOptions || {}
    this._headers = bearerAuth
      ? { authorization: `Bearer ${bearerAuth}` }
      : undefined
    this._clientOptions = {
      ...wsOptions,
      tlsOptions: getPemFiles(tlsOptions)
    }
    // SMELL: new websocket.client changes clientOptions, so let's clone them...
    this.wsClientForControl = new WebSocketClient(
      structuredClone(this._clientOptions)
    )
  }

  /**
   * @param {number} tunnelPort opens remote port at server
   * @param {URL|string} wsHostUrl websocket url of server
   * @param {string} destination `<hostname>:<port>` hostname, port of target
   * service
   */
  start(tunnelPort, wsHostUrl, destination = '') {
    const _wsHostUrl = toURL(wsHostUrl)
    _wsHostUrl.search = ''
    _wsHostUrl.searchParams.set('dst', `${_wsHostUrl.hostname}:${tunnelPort}`)

    const connUrl = _wsHostUrl.toString()

    this.wsClientForControl.on('connectFailed', (err) => {
      log.error('WS connect error=%s', err)
      this.emit('error', err)
    })

    this.wsClientForControl.on('connect', (wsConnectionForControl) => {
      log.info('TCP connection established')

      wsConnectionForControl.on('message', (message) => {
        log.debug('message=%s', message?.utf8Data)

        // Only utf8 message used in Control WS Socket
        const [cmd, idConnection] = message.utf8Data.split(':')

        // Managing new TCP connection on WS Server
        if (cmd !== 'NC' || !idConnection) {
          return
        }

        _wsHostUrl.search = ''
        _wsHostUrl.searchParams.set('id', idConnection)
        const connUrl = _wsHostUrl.toString()

        log.debug('connUrl=%s', connUrl)

        this.wsClientData = new WebSocketClient(
          structuredClone(this._clientOptions)
        )
        this.wsClientData.on('connectFailed', (err) => {
          log.error('wsClientData connectFailed')
          this.emit('error', err)
        })

        // Management of new WS Client for every TCP connection on WS Server
        this.wsClientData.on('connect', (wsConnectionForData) => {
          log.debug('wsClientData connect')

          // Waiting of WS Socket with WS Server
          wsConnectionForData.socket.pause()

          const [hostname, port] = destination.split(':')
          log.info('Start TCP connection on client to %s:%s', hostname, port)

          const tcpConn = net.connect({ host: hostname, port: Number(port) })
          bindSockets(wsConnectionForData, tcpConn, this.emit.bind(this))

          tcpConn.on('connect', function () {
            // Resume of the WS Socket after the connection to WS Server
            wsConnectionForData.socket.resume()
          })
        })

        this.wsClientData.connect(connUrl, 'tunnel-protocol')
      })
    })

    this.wsClientForControl.connect(connUrl, 'tunnel-protocol', undefined, this._headers)
  }

  close() {
    this.removeAllListeners()
  }
}
