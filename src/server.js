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

import * as http from 'node:http'
import * as https from 'node:https'
import * as net from 'node:net'
import { EventEmitter } from 'node:events'
import websocket from 'websocket'
import { bindSockets } from './bindSockets.js'
import { logger, getPemFiles, qs } from './utils.js'

const WebSocketServer = websocket.server
const log = logger('server')

const defaultApp = (req, res) => {
  log.info(req)
}

export class Server extends EventEmitter {
  /**
   * @param {import('./types').ServerOptions} [options]
   */
  constructor(options) {
    super()
    const { listeningHost, allowList, app, tlsOptions, wsOptions } =
      options || {}
    const { key, cert } = tlsOptions || {}

    this._listeningHost = listeningHost
    this._allowList = allowList

    const httpsFlag = (this.httpsFlag = !!key && !!cert)

    const _app = app || defaultApp

    if (httpsFlag) {
      const _tlsOpts = getPemFiles(tlsOptions)
      // @ts-expect-error
      this.httpServer = https.createServer(_tlsOpts, _app)
    } else {
      this.httpServer = http.createServer(_app)
    }

    this.wsServer = new WebSocketServer({
      ...wsOptions,
      httpServer: this.httpServer,
      autoAcceptConnections: false
    })
  }

  /**
   * @param {number} port local listening port
   * @param {string} [dstHost] destination host `<hostname>:<port>`
   */
  start(port, dstHost = '') {
    log.info(
      `WS Tunnel Server starting on: ${
        this.httpsFlag ? 'wss:' : 'ws:'
      }//localhost:${port}`
    )

    this.httpServer.on('error', (err) => {
      this.emit('error', err)
    })
    this.httpServer.listen(port, () => {
      log.info(`WS Tunnel Server listening on port:${port}`)
    })

    const [_dstHost, _dstPort] = dstHost.split(':') || []

    this.wsServer.on('request', async (req) => {
      let host = _dstHost
      let port = _dstPort

      const { dst = '' } = qs(req.httpRequest.url)
      const [dstHost, dstPort] = dst.split(':')

      const authorization = req.httpRequest?.headers?.authorization

      if (this._allowList && this._allowList.needsAuth()) {
        const allowed = await this._allowList
          .isAuthorized(authorization)
          .catch(() => null)

        if (!allowed) {
          this._reject(req, 401, 'Request unauthorized')
          return
        }
        if (
          dstHost &&
          dstPort &&
          allowed.destinations &&
          !allowed.destinations.includes(dst)
        ) {
          this._reject(
            req,
            403,
            'Forbidden destination',
            `Forbidden destination=${dst}`
          )
          return
        }
      }
      if (dstHost && dstPort) {
        host = dstHost
        port = dstPort
      }

      if (!host || !port) {
        this._reject(req, 502, 'Bad Gateway', 'No tunnel target specified')
        return
      }

      const tcpConn = net.connect({ port: Number(port), host }, () => {
        log.info(`Establishing tunnel to ${host}:${port}`)
        const wsConn = req.accept('tunnel-protocol', req.origin)
        bindSockets(wsConn, tcpConn, this.emit.bind(this))
      })

      tcpConn.on('error', (err) => {
        this._reject(req, 502, 'Bad Gateway', `Tunnel connect error to ${host}:${port}: ${err}`)
        this.emit('error', err)
      })
    })
  }

  close() {
    this.removeAllListeners()
    return this.httpServer.close()
  }

  _reject(req, status, msg, logMsg) {
    req.reject(status, msg)
    log.info(`Connection=${req.remoteAddress} rejected=${logMsg || msg}`)
  }
}
