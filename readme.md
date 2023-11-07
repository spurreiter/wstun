# WSTUN - Tunnels and Reverse Tunnels over WebSocket

[![badge npm version][]][npm link]
![types-badge][]

> An improved fork of <https://github.com/MDSLab/wstun>.

- Refactored to use ESM
- Linted and Typed

## Table of Contents

<!-- !toc (minlevel=2) -->

* [Overview](#overview)
* [Installation](#installation)
* [Forward WS Tunnel](#forward-ws-tunnel)
  * [Instantiation of a forward tunnel server](#instantiation-of-a-forward-tunnel-server)
  * [Implementation of a forward tunnel client](#implementation-of-a-forward-tunnel-client)
* [Reverse WS Tunnel](#reverse-ws-tunnel)
  * [Instantiation of a reverse tunnel server](#instantiation-of-a-reverse-tunnel-server)
  * [Implementation of a reverse tunnel client](#implementation-of-a-reverse-tunnel-client)
* [CLI](#cli)
* [Logging system](#logging-system)

<!-- toc! -->

## Overview

A set of Node.js tools to establish TCP tunnels (or TCP reverse tunnels) over
WebSocket connections for circumventing the problem of directly connect to hosts
behind a strict firewall or without public IP. It also supports WebSocket Secure
(wss) connections.

## Installation

```
npm install @spurreiter/wstun
```

## Forward WS Tunnel

```
           host                         remote
        +--------+             +--------+      +---------+
        |  :9000 |----wstun--->|  :4000 |      |   :3000 |
   ====>| client |=====tcp====>| server |=====>| service |
:9000   |        |----wstun--->|        |      |         |
        +--------+             +--------+      +---------+
```

### Instantiation of a forward tunnel server

```js
import { Server } from '@spurreiter/wstun'

// start with TLS
const server = new Server({
  tlsOptions: {
    key: 'path-to-private-key',
    cert: 'path-to-public-cert'
  }
})

// listening port where websocket gets connected
const port = 4000
// destination host and port (optional)
const dstAddr = '127.0.0.1:3000'
server.start(port, dstAddr)
```

### Implementation of a forward tunnel client

```js
import { Client } from '@spurreiter/wstun'

const client = new Client({
  tlsOptions: {
    ca: 'path-to-public-cert' // for self signed certs
  }
})

// is the port on the localhost on which the tunneled service will be reachable
const localPort = 9000
const wsHostUrl = new URL('wss://remote:4000')

client.start(localPort, wsHostUrl)
```

## Reverse WS Tunnel

```
           host                        remote
        +--------+             +--------+      +---------+
        |  :8000 |<---wstun----|        |      |   :3000 |
  =====>| server |=====tcp====>| client |=====>| service |
:9000   |        |<---wstun----|        |      |         |
        +--------+             +--------+      +---------+
```

### Instantiation of a reverse tunnel server

```js
import { ServerReverse } from '@spurreiter/wstun'

// start with TLS
const serverRev = new ServerReverse({
  tlsOptions: {
    key: 'path-to-private-key',
    cert: 'path-to-public-cert'
  }
})

// listening port where websocket is connected
const port = 8000
serverRev.start(port)
```

### Implementation of a reverse tunnel client

```js
import { ClientReverse } from '@spurreiter/wstun'

const clientRev = new ClientReverse({
  tlsOptions: {
    ca: 'path-to-public-cert' // for self signed certs
  }
})

// is the port on the localhost on which the tunneled service will be reachable
const tunnelPort = 9000
const wsHostUrl = new URL('wss://host:8000')
const remoteAddr = '127.0.0.1:3000'

clientRev.start(tunnelPort, wsHostUrl, remoteAddr)
```

## CLI

```
    Tunnels and reverse tunnels over WebSocket.

    wstun [options]

    -h|--help

    -s|--server   port        run as server, specify listening port

    -r|--reverse              run server in reverse tunneling mode

    -t|--tunnel   [localport:]host:port
                              run as tunnel client, specify [localport:]host:port

    -a|--allow    file.json   server accepts only the requests coming from
                              authorized clients. Specify the path to the file
                              containing authorized clients. Must be a .json
                              file with:
                              [{id: <uuid>, destinations: [<string>]}, {..}]

    -u|--uuid     string      specify the bearer auth of the client

      |--local                tunnel server listens only on local host
                              "127.0.0.1" instead of all hosts "0.0.0.0".

      |--reconnect [number]   reconnect server or client after connection errors.
                              Optionally specify the number of ms to restart.

      |--key      filename    path to private key certificate

      |--cert     filename    path to public key certificate

      |--ca       filename    certification authority


    Examples:

    (forward tunnel server)
    wstun -t 127.0.0.1:3000 -s 4000 --key s.key --cert s.crt
    (forward tunnel client)
    wstun -t 9000 --ca s.crt wss://host:4000

    (reverse tunnel server)
    wstun -s 8000 --key s.key --cert s.crt
    (reverse tunnel client)
    wstun.js -r -t 9000:127.0.0.1:3000 --ca s.crt wss://host:8000
```

## Logging system

wstun uses [debug-level][] for logging.

To log to a file use, e.g.

```sh
npm i -g @spurreiter/wstun

NODE_ENV=production wstun -s 8000 2> /var/log/wstun.log
```

[badge npm version]: https://badgen.net/npm/v/%40spurreiter%2Fwstun
[npm link]: https://www.npmjs.com/package/@spurreiter/wstun
[types-badge]: https://badgen.net/npm/types/%40spurreiter%2Fwstun
[debug-level]: https://www.npmjs.com/package/debug-level
