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
import { randomUUID } from 'node:crypto'
import { EventEmitter } from 'node:events'
import websocket from 'websocket'
import { bindSockets } from './bindSockets.js'
import { logger, getPemFiles, qs } from './utils.js'

const WebSocketServer = websocket.server
const log = logger('serverRev')

const CREATED = 'created'
const wsConnections = new EventEmitter()

const view = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>wstun</title>
</head>
<body>
  <h1>wstun is running!</h1>
</body>
</html>
`

const defaultApp = (req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(view)
}

export class ServerReverse extends EventEmitter {
  /**
   * @param {import('./types').ServerOptions} [options]
   */
  constructor(options) {
    super()
    const {
      listeningHost,
      allowList,
      app,
      maxConnections = 1000,
      tlsOptions,
      wsOptions
    } = options || {}
    const { key, cert } = tlsOptions || {}

    wsConnections.setMaxListeners(maxConnections)

    this._allowList = allowList
    this._listeningHost = listeningHost
    const httpsFlag = (this.httpsFlag = !!key && !!cert)

    const _app = app || defaultApp

    if (httpsFlag) {
      const _tlsOpts = getPemFiles(tlsOptions)
      // @ts-expect-error
      this.httpServer = https.createServer(_tlsOpts, _app)
    } else {
      this.httpServer = http.createServer(_app)
    }

    this.wsServerForControl = new WebSocketServer({
      keepalive: true,
      useNativeKeepalive: true,
      ...wsOptions,
      httpServer: this.httpServer,
      autoAcceptConnections: false
    })
  }

  /**
   * @param {number} port local listening port
   */
  start(port) {
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

    this.wsServerForControl.on('request', async (req) => {
      const srcAddress = req.httpRequest.client._peername.srcAddress

      const { dst } = qs(req.httpRequest.url)

      if (!dst) {
        log.info('WebSocket Request for Data')
        wsConnections.emit(CREATED, req)
        return
      }

      const [dstHost, dstPort] = String(dst || '').split(':')

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

      const port = Number(dstPort)

      if (!port || isNaN(port) || !Number.isSafeInteger(port)) {
        this._reject(req, 403, 'Forbidden destination')
        return
      }

      createTunnel(req, port, srcAddress)
    })

    /**
     * @param {object} req TCP request
     * @param {number} port
     * @param {string} srcAddress clients source address
     */
    const createTunnel = (req, port, srcAddress) => {
      log.info('WS creation towards src=%s on port=%s', srcAddress, port)

      // Create one TCP server for each client WebSocketRequest
      req.tcpServer = net.createServer()
      // manage TCP errors
      req.tcpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          log.error(`Port ${err.port} already used; Connection aborted`)
          req.wsConnectionForControl.close()
          return
        }
        log.error(`Error establishing TCP connection: ${err}`)
        this.emit('error', err)
      })
      // manage TCP connections
      req.tcpServer.on('connection', (tcpConn) => {
        // log.debug('connecting %j', tcpConn)
        // Putting in pause the tcp connection waiting the new socket WS Socket for data
        tcpConn.pause()

        const idConnection = randomUUID()
        const msgForNewConnection = `NC:${idConnection}`
        req.wsConnectionForControl.sendUTF(msgForNewConnection)

        log.debug('sendUTF %s', msgForNewConnection)

        const eventManager = (req) => {
          // log.debug('eventManager %j', req)
          try {
            const { id } = qs(req.httpRequest.url)

            if (id !== idConnection) {
              throw new Error('Wrong connection id provided')
            }

            // tcpConn.wsConnection = wsTCP;
            tcpConn.wsConnection = req.accept('tunnel-protocol', req.origin)
            bindSockets(tcpConn.wsConnection, tcpConn, this.emit.bind(this))

            // Resuming of the tcp connection after WS Socket is just created
            tcpConn.resume()

            wsConnections.removeListener(CREATED, eventManager)
          } catch (err) {
            log.error(`Connection error: ${err}`)
            req.tcpServer.close()
            wsConnections.removeListener(CREATED, eventManager)
          }
        }

        wsConnections.on(CREATED, eventManager)
      })

      // start server
      req.tcpServer.listen({ port, host: this._listeningHost })
      log.info('TCP server is listening on port=%s', port)

      req.wsConnectionForControl = req.accept('tunnel-protocol', req.origin)
      log.info('WS connection created')

      req.wsConnectionForControl.on('close', (reasonCode, description) => {
        log.info(
          'WS control peer=%s port=%s disconnected reason=%s desc=%s',
          req.wsConnectionForControl.remoteAddress,
          port,
          reasonCode,
          description
        )
        req.tcpServer.close()
      })
    }
  }

  close() {
    this.removeAllListeners()
    this.wsServerForControl.shutDown()
    this.httpServer.close()
  }

  _reject(req, status, msg, logMsg) {
    req.reject(status, msg)
    log.info(`Connection=${req.remoteAddress} rejected=${logMsg || msg}`)
  }
}
