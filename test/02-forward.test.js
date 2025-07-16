import assert from 'assert/strict'
import { Client, Server, AllowList } from '../src/index.js'
import { server as service } from './echo.mjs'
import { nap, dnsEquals } from './helper.js'

describe('forward tunnel', function () {
  describe('normal', function () {
    let server
    let client
    before(function () {
      service.listen(3003)
    })
    after(function () {
      service.close()
    })
    before(function () {
      server = new Server()
      server.start(4004, '127.0.0.1:3003')
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(function () {
      client = new Client({
        bearerAuth: '6c2e5730-c6d0-4a9a-9555-1d327e59f56b'
      })
      client.start(9009, 'ws://127.0.0.1:4004')
    })
    after(async function () {
      client.close()
      await nap(100)
    })

    it('shall tunnel a request', async function () {
      const res = await fetch('http://127.0.0.1:9009?test=1')
      assert.equal(res.ok, true)
      const data = await res.json()
      // console.log(data)
      assert.equal(data.url, '/?test=1')
      assert.equal(data.headers.host, '127.0.0.1:9009')
    })
  })

  describe('secure', function () {
    const hostname = 'too.nice'
    const key = new URL(`../${hostname}.key`, import.meta.url)
    const cert = new URL(`../${hostname}.crt`, import.meta.url)

    before(async function () {
      await dnsEquals(hostname).catch(err => {
        console.error(`add '127.0.0.1  ${hostname}' to /etc/hosts`)
        throw err
      })
    })

    let server
    let client
    before(function () {
      service.listen(3003)
    })
    after(function () {
      service.close()
    })
    before(function () {
      server = new Server({ tlsOptions: { key, cert } })
      server.start(4004, '127.0.0.1:3003')
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(function () {
      client = new Client({
        tlsOptions: { ca: cert, rejectUnauthorized: true }
      })
      client.start(9009, `wss://${hostname}:4004`)
    })
    after(async function () {
      client.close()
      await nap(100)
    })

    it('shall tunnel a request', async function () {
      const res = await fetch('http://127.0.0.1:9009?test=1')
      assert.equal(res.ok, true)
      const data = await res.json()
      // console.log(data)
      assert.equal(data.url, '/?test=1')
      assert.equal(data.headers.host, '127.0.0.1:9009')
    })
  })

  describe('unknown destination', function () {
    let server
    let client
    before(function () {
      server = new Server()
      server.start(4004, '127.0.0.1:3003')
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(function () {
      client = new Client()
      client.start(9009, 'ws://127.0.0.1:4004')
    })
    after(async function () {
      client.close()
      await nap(100)
    })

    it('shall fail to tunnel a request', async function () {
      const errors = []
      server.on('error', (err) => errors.push(`server:${err.message}`))
      client.on('error', (err) => errors.push(`client:${err.message}`))

      try {
        await fetch('http://127.0.0.1:9009?test=1')
        throw new Error()
      } catch (err) {
        assert.equal(err.message, 'fetch failed')
        assert.deepEqual(errors, [
          'server:connect ECONNREFUSED 127.0.0.1:3003',
          'client:Server responded with a non-101 status: 502 Bad Gateway\nResponse Headers Follow:\nconnection: close\nx-websocket-reject-reason: Bad Gateway\n'
        ])
      }
    })
  })

  describe('allow list', function () {
    let server
    let client
    let errors = []

    before(function () {
      service.listen(3003)
    })
    after(function () {
      service.close()
    })
    before(function () {
      const allowList = new AllowList([
        {
          id: '822d9865-6098-48bd-a13a-bfe761b6a052',
          destinations: ['127.0.0.1:3003']
        }
      ])
      server = new Server({ allowList })
      server.start(4004)
      server.once('error', (err) => errors.push(err.message))
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    afterEach(function () {
      client && client.close()
      errors = []
    })

    it('shall fail with wrong bearer auth', async function () {
      client = new Client({
        bearerAuth: '25885be0-039a-4bc3-a497-d49543b00fd9'
      })
      client.start(9009, 'ws://127.0.0.1:4004')

      client.once('error', (err) => errors.push(err.message))

      try {
        await fetch('http://127.0.0.1:9009?test=1')
        throw new Error()
      } catch (err) {
        assert.equal(err.message, 'fetch failed')
        assert.deepEqual(errors, [
          'Server responded with a non-101 status: 401 Unauthorized\nResponse Headers Follow:\nconnection: close\nx-websocket-reject-reason: Request unauthorized\n'
        ])
      }
    })

    it('shall fail with wrong destination', async function () {
      client = new Client({
        bearerAuth: '822d9865-6098-48bd-a13a-bfe761b6a052'
      })
      client.start(9009, 'ws://127.0.0.1:4004', 'localhost:3002')

      client.once('error', (err) => errors.push(err.message))

      try {
        await fetch('http://127.0.0.1:9009?test=1')
        throw new Error()
      } catch (err) {
        assert.equal(err.message, 'fetch failed')
        assert.deepEqual(errors, [
          'Server responded with a non-101 status: 403 Forbidden\nResponse Headers Follow:\nconnection: close\nx-websocket-reject-reason: Forbidden destination\n'
        ])
      }
    })

    it('shall pass with correct auth and destination', async function () {
      client = new Client({
        bearerAuth: '822d9865-6098-48bd-a13a-bfe761b6a052'
      })
      client.start(9009, 'ws://127.0.0.1:4004', '127.0.0.1:3003')

      client.once('error', (err) => errors.push(err.message))

      const res = await fetch('http://127.0.0.1:9009?test=1')
      assert.ok(res.ok, true)
    })
  })
})
