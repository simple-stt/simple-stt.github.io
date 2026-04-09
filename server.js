const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const DIST_DIR = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

function resolveRequestPath(root, requestUrl) {
  const urlPath = decodeURIComponent((requestUrl || '/').split('?')[0])
  const relPath = urlPath === '/' ? '/index.html' : urlPath
  const filePath = path.normalize(path.join(root, relPath))
  if (!filePath.startsWith(root)) return null
  return filePath
}

class DistServer {
  constructor(opts = {}) {
    this.root = opts.root || DIST_DIR
    this.port = Number(opts.port || PORT)
    this.server = null
  }
  start() {
    this.server = http.createServer((req, res) => this.handle(req, res))
    this.server.listen(this.port, () => {
      console.log(`[simple-stt] serving ${this.root} at http://localhost:${this.port}`)
    })
  }
  handle(req, res) {
    let filePath = resolveRequestPath(this.root, req.url)
    if (!filePath) return this.send(res, 403, 'Forbidden')
    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html')
      this.sendFile(res, filePath)
    })
  }
  sendFile(res, filePath) {
    fs.readFile(filePath, (err, buf) => {
      if (err) {
        const fallback = path.join(this.root, '404.html')
        return fs.readFile(fallback, (fallbackErr, fallbackBuf) => {
          if (fallbackErr) return this.send(res, 404, 'Not found')
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(fallbackBuf)
        })
      }
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(buf)
    })
  }
  send(res, code, text) {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(text)
  }
}

if (require.main === module) new DistServer().start()

module.exports = {
  DIST_DIR,
  MIME,
  PORT,
  DistServer,
  resolveRequestPath,
}
