/* Serves the Vite production build from frontend/dist (local / simple hosting). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8085;
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

http
  .createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0].split('#')[0];
    const relativePath = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\//, '');
    let filePath = path.join(DIST_DIR, relativePath);

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const extname = path.extname(filePath);
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        sendFile(res, filePath, contentType);
        return;
      }

      // SPA fallback: unknown paths → index.html (after build)
      const indexPath = path.join(DIST_DIR, 'index.html');
      sendFile(res, indexPath, 'text/html');
    });
  })
  .listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving static files from ${DIST_DIR}`);
    console.log('Run "npm run build" first if dist/ is missing.');
  });
