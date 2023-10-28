import assert from 'assert/strict'
import { ClientReverse, ServerReverse, AllowList } from '../src/index.js'
import { server as service } from './echo.mjs'
import { nap } from './helper.js'

describe('reverse tunnel', function () {
  describe('normal', function () {
    let server
    let client
    before(async function () {
      service.listen(3013)
    })
    after(function () {
      service.close()
    })
    before(async function () {
      server = new ServerReverse()
      server.start(4014)
      await nap(50)
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(function () {
      client = new ClientReverse()
      client.start(9019, 'ws://127.0.0.1:4014', '127.0.0.1:3013')
    })
    after(async function () {
      client.close()
      await nap(100)
    })

    it('shall tunnel a request', async function () {
      const res = await fetch('http://127.0.0.1:9019?test=1')
      assert.equal(res.ok, true)
      const data = await res.json()
      // console.log(data)
      assert.equal(data.url, '/?test=1')
      assert.equal(data.headers.host, '127.0.0.1:9019')
    })
  })

  describe('secure', function () {
    const hostname = 'too.nice'
    const key = new URL(`../${hostname}.key`, import.meta.url)
    const cert = new URL(`../${hostname}.crt`, import.meta.url)

    let server
    let client
    before(function () {
      service.listen(3013)
    })
    after(function () {
      service.close()
    })
    before(async function () {
      server = new ServerReverse({ tlsOptions: { key, cert } })
      server.start(4014)
      await nap(25)
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(async function () {
      client = new ClientReverse({
        tlsOptions: { ca: cert, rejectUnauthorized: true }
      })
      client.start(9019, `wss://${hostname}:4014`, '127.0.0.1:3013')
      await nap(25)
    })
    after(async function () {
      client.close()
      await nap(100)
    })

    // it('foo', () => {})

    it('shall tunnel a request', async function () {
    // this.timeout(10e3)
      const res = await fetch('http://127.0.0.1:9019?test=1')
      assert.equal(res.ok, true)
      const data = await res.json()
      // console.log(data)
      assert.equal(data.url, '/?test=1')
      assert.equal(data.headers.host, '127.0.0.1:9019')
    })
  })

  describe('fails', function () {
    let server
    let client
    before(async function () {
      server = new ServerReverse()
      server.start(4014)
      await nap(50)
    })
    after(async function () {
      server.close()
      await nap(100)
    })
    before(function () {
      client = new ClientReverse()
      client.start(9019, 'ws://127.0.0.1:4014', '127.0.0.1:3013')
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
        assert.deepEqual(errors, [])
      }
    })
  })

  describe('allow list', function () {
    let server
    let client
    let errors = []

    before(function () {
      service.listen(3013)
    })
    after(function () {
      service.close()
    })
    before(async function () {
      const allowList = new AllowList([
        {
          id: '822d9865-6098-48bd-a13a-bfe761b6a052',
          destinations: ['127.0.0.1:9019']
        }
      ])
      server = new ServerReverse({ allowList })
      server.start(4014)
      server.once('error', (err) => errors.push(err.message))
      await nap(50)
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
      client = new ClientReverse({
        bearerAuth: '25885be0-039a-4bc3-a497-d49543b00fd9'
      })
      client.start(9019, 'ws://127.0.0.1:4014', '127.0.0.1:3013')
      client.once('error', (err) => errors.push(err.message))
      await nap(25)

      try {
        await fetch('http://127.0.0.1:9019?test=1')
        throw new Error()
      } catch (err) {
        assert.equal(err.message, 'fetch failed')
        assert.deepEqual(errors, [
          'Server responded with a non-101 status: 401 Unauthorized\nResponse Headers Follow:\nconnection: close\nx-websocket-reject-reason: Request unauthorized\n'
        ])
      }
    })

    it('shall fail with wrong destination', async function () {
      client = new ClientReverse({
        bearerAuth: '822d9865-6098-48bd-a13a-bfe761b6a052'
      })
      client.start(9018, 'ws://127.0.0.1:4014', '127.0.0.1:3013')
      client.once('error', (err) => errors.push(err.message))
      await nap(25)

      try {
        await fetch('http://127.0.0.1:9019?test=1')
        throw new Error()
      } catch (err) {
        assert.equal(err.message, 'fetch failed')
        assert.deepEqual(errors, [
          'Server responded with a non-101 status: 403 Forbidden\nResponse Headers Follow:\nconnection: close\nx-websocket-reject-reason: Forbidden destination\n'
        ])
      }
    })

    it('shall pass with correct auth and destination', async function () {
      client = new ClientReverse({
        bearerAuth: '822d9865-6098-48bd-a13a-bfe761b6a052'
      })
      client.start(9019, 'ws://127.0.0.1:4014', '127.0.0.1:3013')
      client.once('error', (err) => errors.push(err.message))
      await nap(25)

      const res = await fetch('http://127.0.0.1:9019?test=1')
      assert.ok(res.ok, true)
    })
  })
})
