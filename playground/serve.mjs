// Static server for the playground; WASM cannot be loaded from file:// URLs.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtime = path.dirname(createRequire(import.meta.url).resolve('web-tree-sitter'));
const port = Number(process.env.PORT || process.argv[2] || 8123);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
};

// `/web-tree-sitter/*` is the runtime from node_modules; everything else is this directory.
function resolve(url) {
  const [root, rel] = url.startsWith('/web-tree-sitter/')
    ? [runtime, url.slice('/web-tree-sitter/'.length)]
    : [here, url === '/' ? 'index.html' : url.slice(1)];
  const file = path.resolve(root, rel);
  return file.startsWith(root + path.sep) ? file : null;
}

http.createServer((req, res) => {
  const file = resolve(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`playground: http://127.0.0.1:${port}/`));
