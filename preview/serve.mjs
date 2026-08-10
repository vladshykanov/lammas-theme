// Local preview server. Re-renders on every request, so editing a .liquid or
// .css file and refreshing is the whole loop.
//
//   node preview/serve.mjs   →   http://127.0.0.1:9494

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRoute } from './render.mjs';
import * as Cart from './cart.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 9494);

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on('end', () => resolve(new URLSearchParams(raw)));
    req.on('error', reject);
  });
}

const seeOther = (res, to) => { res.writeHead(303, { location: to }); res.end(); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && url.pathname === '/cart/add') {
      const f = await readBody(req);
      const result = Cart.add({
        id: f.get('id'), week: f.get('week'),
        delivery_date: f.get('delivery_date'), delivery_method: f.get('delivery_method'),
        quantity: f.get('quantity'),
      });
      return seeOther(res, result.ok ? '/cart' : `/cart?error=${encodeURIComponent(result.error)}`);
    }

    if (req.method === 'POST' && url.pathname === '/cart/change') {
      const f = await readBody(req);
      Cart.change({
        key: f.get('key'), quantity: f.get('quantity'),
        date: f.get('delivery_date'), method: f.get('delivery_method'),
      });
      return seeOther(res, '/cart');
    }

    // Checkout re-runs the same rules. A cart page that only hides the button
    // is not enforcement — this is the gate.
    if (url.pathname === '/checkout') {
      const problems = Cart.checkoutBlocked();
      if (problems.length) return seeOther(res, '/cart?blocked=1');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(
        '<body style="font:16px/1.6 Georgia,serif;max-width:34rem;margin:6rem auto;padding:0 1.5rem;color:#1b1a17">' +
        '<h1 style="font-family:Helvetica,sans-serif;font-weight:600">Checkout lives on Shopify</h1>' +
        '<p>The preview stops here on purpose: checkout is hosted by Shopify and cannot be reproduced locally. ' +
        'On a real store this hands the cart, its delivery date and its method to their secure checkout.</p>' +
        '<p><a href="/cart">Back to the cart</a></p></body>',
      );
    }

    if (url.pathname.startsWith('/assets/')) {
      // Plates live in assets/plates/, so keep the sub-path but refuse anything
      // trying to climb out of the assets directory.
      const rel = decodeURIComponent(url.pathname.replace(/^\/assets\//, ''));
      const file = path.resolve(ROOT, 'assets', rel);
      if (!file.startsWith(path.join(ROOT, 'assets'))) {
        res.writeHead(403);
        return res.end('Forbidden');
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      });
      return res.end(body);
    }

    const html = await renderRoute(url.pathname, url.searchParams);

    // Unknown URLs get the theme's own 404, rendered through the layout so the
    // header, week strip and footer are all still there. A bare error page is
    // a dead end; this one offers the current week and the archive.
    if (html === null) {
      const notFound = await renderRoute('/404', url.searchParams);
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(notFound);
    }

    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<pre style="font:14px ui-monospace,monospace;padding:2rem;white-space:pre-wrap">${err.stack}</pre>`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Lammas preview → http://127.0.0.1:${PORT}`);
});
