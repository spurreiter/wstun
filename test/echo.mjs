import http from 'http'
import os from 'os'
import { fileURLToPath } from 'url'

const hostname = os.hostname()

const { PORT = '3000' } = process.env

const toInteger = (any) =>
  !isNaN(Number(any)) && Number.isSafeInteger(Number(any)) ? Number(any) : any

const app = (req, res) => {
  const { method, url, headers } = req
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ hostname, method, url, headers }))
}

export const server = http.createServer(app)

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(toInteger(PORT), () => {
    console.info(server.address())
  })
}
