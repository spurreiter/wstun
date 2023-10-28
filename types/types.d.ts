import { TlsOptions } from 'node:tls'
import { AllowList } from './allowList.js'

interface TlsOptionsPem {
  key?: string | URL | Buffer
  cert?: string | URL | Buffer
  ca?: string | URL | Buffer
}

export type TlsOptionsExt = TlsOptions & TlsOptionsPem

/**
 * @see websocket/lib/WebSocketClient.js
 */
export interface wsSocketOptions {
  /**
   * 1MiB max frame size.
   * @default 0x100000
   */
  maxReceivedFrameSize?: number
  /**
   * 8MiB max message size, only applicable if assembleFragments is true
   * @default 0x800000
   */
  maxReceivedMessageSize?: number
  /**
   * Outgoing messages larger than fragmentationThreshold will be split into
   * multiple fragments.
   * @default true
   */
  fragmentOutgoingMessages?: boolean
  /**
   * Outgoing frames are fragmented if they exceed this threshold. Default is
   * 16KiB
   * @default 0x4000
   */
  fragmentationThreshold?: number
  /**
   * If true, fragmented messages will be automatically assembled and the full
   * message will be emitted via a 'message' event.
   * @default true
   */
  assembleFragments?: boolean
  /**
   * The Nagle Algorithm makes more efficient use of network resources by
   * introducing a small delay before sending small packets so that multiple
   * messages can be batched together before going onto the wire.  This however
   * comes at the cost of latency, so the default is to disable it.  If you
   * don't need low latency and are streaming lots of small messages, you can
   * change this to 'false'
   * @default true
   */
  disableNagleAlgorithm?: boolean
  /**
   * The number of milliseconds to wait after sending a close frame for an
   * acknowledgement to come back before giving up and just closing the socket.
   * @default 5000
   */
  closeTimeout?: number
}

/**
 * @see websocket/lib/WebSocketServer.js
 */
export interface wsSocketServerOptions {
  /**
   * 64KiB max frame size.
   * @default 0x10000
   */
  maxReceivedFrameSize?: number
  /**
   * 1MiB max message size, only applicable if assembleFragments is true
   * @default 0x100000
   */
  maxReceivedMessageSize?: number
  /**
   * Outgoing messages larger than fragmentationThreshold will be split into
   * multiple fragments.
   * @default true
   */
  fragmentOutgoingMessages?: boolean
  /**
   * Outgoing frames are fragmented if they exceed this threshold. Default is
   * 16KiB
   * @default 0x4000
   */
  fragmentationThreshold?: number
  /**
   * If true, the server will automatically send a ping to all clients every
   * 'keepaliveInterval' milliseconds.  The timer is reset on any received data
   * from the client.
   * @default true
   */
  keepalive?: boolean
  /**
   * The interval to send keepalive pings to connected clients if the connection
   * is idle.  Any received data will reset the counter.
   * @default 20000
   * */
  keepaliveInterval?: number
  /**
   * If true, the server will consider any connection that has not received any
   * data within the amount of time specified by 'keepaliveGracePeriod' after a
   * keepalive ping has been sent to be dead, and will drop the connection.
   * Ignored if keepalive is false.
   * @default true
   */
  dropConnectionOnKeepaliveTimeout?: boolean
  /**
   * The amount of time to wait after sending a keepalive ping before closing
   * the connection if the connected peer does not respond. Ignored if keepalive
   * is false.
   * @default 10000
   */
  keepaliveGracePeriod?: number
  /**
   * Whether to use native TCP keep-alive instead of WebSockets ping and pong
   * packets.  Native TCP keep-alive sends smaller packets on the wire and so
   * uses bandwidth more efficiently.  This may be more important when talking
   * to mobile devices. If this value is set to true, then these values will be
   * ignored: keepaliveGracePeriod dropConnectionOnKeepaliveTimeout
   * @default false
   */
  useNativeKeepalive?: boolean
  /**
   * If true, fragmented messages will be automatically assembled and the full
   * message will be emitted via a 'message' event. If false, each frame will be
   * emitted via a 'frame' event and the application will be responsible for
   * aggregating multiple fragmented frames.  Single-frame messages will emit a
   * 'message' event in addition to the 'frame' event. Most users will want to
   * leave this set to 'true'
   * @default true
   */
  assembleFragments?: boolean
  /**
   * If this is true, websocket connections will be accepted regardless of the
   * path and protocol specified by the client. The protocol accepted will be
   * the first that was requested by the client.  Clients from any origin will
   * be accepted. This should only be used in the simplest of cases.  You should
   * probably leave this set to 'false' and inspect the request object to make
   * sure it's acceptable before accepting it.
   * @default false
   */
  autoAcceptConnections?: boolean
  /**
   * Whether or not the X-Forwarded-For header should be respected. It's
   * important to set this to 'true' when accepting connections from untrusted
   * clients, as a malicious client could spoof its IP address by simply setting
   * this header.  It's meant to be added by a trusted proxy or other
   * intermediary within your own infrastructure. See:
   * http:*en.wikipedia.org/wiki/X-Forwarded-For
   * @default false
   */
  ignoreXForwardedFor?: boolean
  /**
   * If this is true, 'cookie' headers are parsed and exposed as
   * WebSocketRequest.cookies
   * @default true
   */
  parseCookies?: boolean
  /**
   * If this is true, 'sec-websocket-extensions' headers are parsed and exposed
   * as WebSocketRequest.requestedExtensions
   * @default true
   */
  parseExtensions?: boolean
  /**
   * The Nagle Algorithm makes more efficient use of network resources by
   * introducing a small delay before sending small packets so that multiple
   * messages can be batched together before going onto the wire.  This however
   * comes at the cost of latency, so the default is to disable it.  If you
   * don't need low latency and are streaming lots of small messages, you can
   * change this to 'false'
   * @default true
   */
  disableNagleAlgorithm?: boolean
  /**
   * The number of milliseconds to wait after sending a close frame for an
   * acknowledgement to come back before giving up and just closing the socket.
   * @default 5000
   */
  closeTimeout?: number
}

export interface ClientOptions {
  /** bearer authentication against server (requires allowList) */
  bearerAuth?: string
  /** listening host */
  listeningHost?: string
  /** websocket options */
  wsOptions?: wsSocketOptions
  /** TLS Options */
  tlsOptions?: TlsOptionsExt
}

export interface ServerOptions {
  /** listening host */
  listeningHost?: string
  /**
   * server app
   */
  app?: (req: object, res: object) => void
  /**
   * List of allowed clients and their assigned ports
   */
  allowList?: AllowList
  /**
   * max allowed connections
   * @default 1000
   */
  maxConnections?: number
  /** websocket options */
  wsOptions?: wsSocketServerOptions
  /**
   * TLS Options
   */
  tlsOptions?: TlsOptionsExt
}

export interface AllowedClient {
  /** clients uuid */
  id: string
  /** clients assigned port */
  port: number
  /** list if allowed destinations */
  destinations?: string[]
}
