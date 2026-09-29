/**
 * Minimal static server for previewing dist/ with the same clean-URL rules
 * a static host uses: /path/ → /path/index.html, /path → 301 to /path/,
 * unknown paths → 404.html with status 404. Response headers come from
 * dist/_headers (Netlify / Cloudflare Pages format), so local browser tests
 * run under the production Content-Security-Policy.
 *
 * Usage: node scripts/serve.js [distDir] (PORT env, default 4173)
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDir(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Parse a _headers file: an unindented URL pattern ("*" wildcard) followed
 * by indented "Name: value" lines. Returns [{ pattern: RegExp, headers }].
 */
export function parseHeadersFile(text) {
  const rules = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const source = line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      rules.push({ pattern: new RegExp(`^${source}$`), headers: {} });
    } else if (rules.length) {
      const index = line.indexOf(':');
      rules.at(-1).headers[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  }
  return rules;
}

function headersFor(rules, path) {
  return Object.assign({}, ...rules.filter((rule) => rule.pattern.test(path)).map((rule) => rule.headers));
}

export function createSiteServer(distDir) {
  const root = resolve(distDir);
  let rules = null;
  return createServer(async (req, res) => {
    rules ??= parseHeadersFile(await readFile(join(root, '_headers'), 'utf8').catch(() => ''));
    const url = new URL(req.url, 'http://localhost');
    const path = normalize(decodeURIComponent(url.pathname));
    const target = join(root, path);
    if (!target.startsWith(root)) {
      res.writeHead(400).end();
      return;
    }

    let file = null;
    if (path.endsWith('/') && await isFile(join(target, 'index.html'))) file = join(target, 'index.html');
    else if (!path.endsWith('/') && await isFile(target)) file = target;
    else if (!path.endsWith('/') && await isDir(target) && await isFile(join(target, 'index.html'))) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
      return;
    }

    const extra = headersFor(rules, url.pathname);
    if (!file) {
      res.writeHead(404, { ...extra, 'Content-Type': TYPES['.html'] });
      res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'));
      return;
    }

    res.writeHead(200, {
      ...extra,
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream'
    });
    res.end(await readFile(file));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const port = Number(process.env.PORT ?? 4173);
  createSiteServer(dist).listen(port, () => console.log(`Serving ${dist} at http://localhost:${port}/`));
}
