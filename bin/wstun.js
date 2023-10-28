#!/usr/bin/env node

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

import path from 'path'
import {
  Server,
  ServerReverse,
  Client,
  ClientReverse,
  AllowList
} from '../src/index.js'
import { cli } from '../src/cli.js'
import { logger, nap, toString, toInteger } from '../src/utils.js'

const log = logger('cli')

const _usage = `Tunnels and reverse tunnels over WebSocket.

wstun [options]`
const _example = `Examples:

(forward tunnel server)
wstun -t 127.0.0.1:3000 -s 4000 --key s.key --cert s.crt
(forward tunnel client)
wstun -t 9000 --ca s.crt wss://host:4000

(reverse tunnel server)
wstun -s 8000 --key s.key --cert s.crt
(reverse tunnel client)
wstun.js -r -t 9000:127.0.0.1:3000 --ca s.crt wss://host:8000
`

const cmmds = {
  _usage,
  _example,
  help: {
    short: '-h',
    long: '--help'
  },
  server: {
    short: '-s',
    long: '--server',
    type: 'port',
    help: 'run as server, specify listening port'
  },
  reverse: {
    short: '-r',
    long: '--reverse',
    help: 'run server in reverse tunneling mode'
  },
  tunnel: {
    short: '-t',
    long: '--tunnel',
    type: '[localport:]host:port',
    help: 'run as tunnel client, specify [localport:]host:port'
  },
  allow: {
    short: '-a',
    long: '--allow',
    type: 'file.json',
    help:
      //                                                   |
      'server accepts only the requests coming from \n' +
      'authorized clients. Specify the path to the file \n' +
      'containing authorized clients. Must be a .json \n' +
      'file with: \n' +
      '[{id: <uuid>, destinations: [<string>]}, {..}]'
  },
  uuid: {
    short: '-u',
    long: '--uuid',
    type: 'string',
    help: 'specify the bearer auth of the client'
  },
  local: {
    long: '--local',
    help:
      'tunnel server listens only on local host \n' +
      '"127.0.0.1" instead of all hosts "0.0.0.0".'
  },
  reconnect: {
    long: '--reconnect',
    type: '[number]',
    help:
      'reconnect server or client after connection errors. \n' +
      'Optionally specify the number of ms to restart.'
  },
  key: {
    long: '--key',
    type: 'filename',
    help: 'path to private key certificate'
  },
  cert: {
    long: '--cert',
    type: 'filename',
    help: 'path to public key certificate'
  },
  ca: {
    long: '--ca',
    type: 'filename',
    help: 'certification authority'
  }
}

/**
 * @param {object} cmd
 * @returns {AllowList|undefined}
 */
function loadAllowList(cmd) {
  if (!cmd.server || !cmd.allow) {
    return
  }
  try {
    const filename = path.resolve(process.cwd(), cmd.allow)
    const allowList = new AllowList()
    allowList.loadSync(filename)
    return allowList
  } catch (err) {
    log.error('Could not load allowList at %s', cmd.allow)
    throw err
  }
}

async function main() {
  const cmd = cli(cmmds)
  // log.debug(cmd)

  if (cmd.help) {
    console.log(cmd.helptext)
    return
  }

  cmd.server = toInteger(cmd.server)
  cmd.tunnel = toString(cmd.tunnel)

  if (
    cmd.reconnect === true ||
    (cmd.reconnect !== undefined && isNaN(cmd.reconnect)) ||
    (typeof cmd.reconnect === 'number' && cmd.reconnect < 50)
  ) {
    cmd.reconnect = cmd.server ? 100 : 500
  }

  const prgArgs = {}
  ;['key', 'cert', 'ca'].forEach((prop) => {
    if (cmd[prop]) {
      prgArgs.opts = prgArgs.opts || { tlsOptions: {} }
      prgArgs.opts.tlsOptions[prop] = cmd[prop]
    }
  })

  if (cmd.local) {
    prgArgs.opts = prgArgs.opts || {}
    prgArgs.opts.listeningHost = '127.0.0.1'
  }
  if (!cmd.server && cmd.uuid) {
    prgArgs.opts = prgArgs.opts || {}
    prgArgs.opts.bearerAuth = cmd.uuid
  }

  if (cmd.reverse) {
    if (cmd.server) {
      prgArgs.Cls = ServerReverse
      prgArgs.opts = prgArgs.opts || {}
      prgArgs.opts.allowList = loadAllowList(cmd)
      prgArgs.args = [toInteger(cmd.server)]
    } else {
      if (!cmd.tunnel) {
        throw TypeError('client needs tunnel settings -t')
      }
      if (!cmd.args[0]) {
        throw TypeError('client needs websocket url')
      }

      const wsHostUrl = new URL(cmd.args[0])
      if (!/^wss?:$/.test(wsHostUrl.protocol)) {
        throw TypeError('client needs WS Host URL')
      }
      const [localPort, hostname, port] = cmd.tunnel.split(':')
      if (!localPort) {
        throw TypeError('client needs localport')
      }

      prgArgs.Cls = ClientReverse
      prgArgs.args = [toInteger(localPort), wsHostUrl, `${hostname}:${port}`]
    }
  } else if (cmd.server) {
    const [hostname, port] = ('' + cmd.tunnel).split(':')
    prgArgs.Cls = Server
    prgArgs.opts = prgArgs.opts || {}
    prgArgs.args = [toInteger(cmd.server)]
    if (hostname && port) {
      prgArgs.args.push(`${hostname}:${port}`)
    }
  } else {
    if (!cmd.tunnel) {
      throw TypeError('client needs tunnel settings -t')
    }
    if (!cmd.args?.[0]) {
      throw TypeError('client needs websocket url')
    }

    const wsHostUrl = new URL(cmd.args[0])
    if (!/^wss?:/.test(wsHostUrl.protocol)) {
      throw TypeError('client needs WS Host URL')
    }

    let [localPort, hostname, port] = cmd.tunnel.split(':')
    localPort = toInteger(localPort)
    if (!localPort) {
      throw TypeError('client needs localport')
    }
    prgArgs.Cls = Client
    prgArgs.args = [localPort, wsHostUrl]
    if (hostname && port) {
      prgArgs.args.push(`${hostname}:${port}`)
    }
  }

  // log.debug(prgArgs)

  if (cmd.reconnect) {
    doReconnect(prgArgs, cmd.reconnect)
  } else {
    const prg = new prgArgs.Cls(prgArgs.opts)
    prg.start(...prgArgs.args)
  }
}

async function doReconnect(prgArgs, reconnectTimeout) {
  const prg = new prgArgs.Cls(prgArgs.opts)
  prg.once('error', async (err) => {
    log.error('wstun failed error=%s', err.message)
    prg.close()
    await nap(reconnectTimeout)
    log.info('wstun reconnecting')
    doReconnect(prgArgs, reconnectTimeout)
  })
  prg.start(...prgArgs.args)
}

main().catch((err) => {
  console.error('wstun failed with error=%s', err.message)
})
