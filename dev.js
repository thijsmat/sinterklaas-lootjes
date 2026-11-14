// Local development server: serves public/ and the api/ functions like Vercel does. Run: npm run dev
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const port = process.env.PORT || 3000;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    try {
      const { default: handler } = await import(`./api/${name}.js`);
      req.query = Object.fromEntries(url.searchParams);
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (d) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
      return await handler(req, res);
    } catch { res.statusCode = 404; return res.end('not found'); }
  }
  let path = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!extname(path)) path += '.html';
  try {
    const body = await readFile(new URL(`./public${path}`, import.meta.url));
    res.setHeader('Content-Type', TYPES[extname(path)] || 'application/octet-stream'); res.end(body);
  } catch { res.statusCode = 404; res.end('niet gevonden'); }
}).listen(port, () => console.log(`Sinterklaas draait op http://localhost:${port}`));
