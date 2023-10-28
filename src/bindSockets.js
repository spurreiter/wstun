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

import { logger } from './utils.js'

const log = logger('bindSockets')

/**
 * @param {*} wsConn
 * @param {*} tcpConn
 * @param {(event: string, err: Error) => void} emit
 */
export function bindSockets(wsConn, tcpConn, emit) {
  wsConn.__paused = false

  wsConn.on('message', (message) => {
    if (message.type === 'utf8') {
      log.warn('Unexpected UTF-8 message')
    } else if (message.type === 'binary') {
      if (tcpConn.write(message.binaryData) === false) {
        wsConn.socket.pause()
        wsConn.__paused = true
      } else {
        if (wsConn.__paused === true) {
          wsConn.socket.resume()
          wsConn.__paused = false
        }
      }
    }
  })

  wsConn.on('overflow', () => {
    tcpConn.pause()
  })

  wsConn.socket.on('drain', () => {
    tcpConn.resume()
  })

  wsConn.on('error', (err) => {
    log.error('WS connection error=%s', err)
    emit('error', err)
  })

  wsConn.on('close', (reasonCode, description) => {
    log.debug(
      'WS disconnected peer=%s disconnected reason=%s desc=%s',
      wsConn.remoteAddress,
      reasonCode,
      description
    )
    tcpConn.destroy()
  })

  tcpConn.on('drain', () => {
    wsConn.socket.resume()
    wsConn.__paused = false
  })

  tcpConn.on('data', (buffer) => {
    wsConn.sendBytes(buffer)
  })

  tcpConn.on('error', (err) => {
    log.error(err)
    emit('error', err)
  })

  tcpConn.on('close', () => {
    log.debug('TCP connection closed')
    wsConn.close()
  })
}
