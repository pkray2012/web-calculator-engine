/**
 * Technical SEO and integrity checks on a built site (dist/).
 * Returns a list of problems; an empty list means the build passed.
 *
 * Usage: node scripts/site-audit.js [distDir]
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return files.flat();
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

function urlPathFor(file, dist) {
  const rel = relative(dist, file).split('\\').join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function attr(tag, name) {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : null;
}

function all(regex, text) {
  return [...text.matchAll(regex)];
}

/** Resolve an internal link to the file it should serve. */
function targetFile(dist, href) {
  const path = decodeURI(href.split('#')[0].split('?')[0]);
  if (path.endsWith('/')) return join(dist, path, 'index.html');
  return join(dist, path);
}

/**
 * Security and caching rules the host must receive from _headers: a strict CSP
 * and security headers on every path, and long-lived caching only for the
 * fingerprinted /assets/ files (hosts merge headers from all matching rules).
 */
export function headerProblems(text) {
  const rules = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) rules.set((current = line.trim()), new Map());
    else if (current) {
      const index = line.indexOf(':');
      rules.get(current).set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
    }
  }
  const problems = [];
  const everywhere = rules.get('/*') ?? new Map();
  const csp = everywhere.get('content-security-policy');
  const scriptSrc = csp && /(?:^|;)\s*script-src ([^;]*)/.exec(csp)?.[1];
  if (!csp) problems.push('no Content-Security-Policy for /*');
  else if (!scriptSrc || /unsafe-inline|unsafe-eval|\*/.test(scriptSrc)) problems.push(`CSP script-src is not strict: "${scriptSrc ?? 'missing'}"`);
  else if (!/frame-ancestors 'none'/.test(csp)) problems.push("CSP is missing frame-ancestors 'none'");
  if (/noindex/i.test(everywhere.get('x-robots-tag') ?? '')) problems.push('X-Robots-Tag: noindex on /* would remove the whole site from search (preview builds only)');
  if (everywhere.get('x-content-type-options') !== 'nosniff') problems.push('X-Content-Type-Options: nosniff missing for /*');
  if (!everywhere.get('x-frame-options')) problems.push('X-Frame-Options missing for /*');
  if (!everywhere.get('referrer-policy')) problems.push('Referrer-Policy missing for /*');
  if (everywhere.has('cache-control')) problems.push('/* sets Cache-Control, which would also apply to HTML');
  if (!/immutable/.test(rules.get('/assets/*')?.get('cache-control') ?? '')) problems.push('/assets/* is not cached as immutable');
  return problems;
}

export async function auditSite(distDir) {
  const dist = resolve(distDir);
  const problems = [];
  const report = (page, message) => problems.push(`${page}: ${message}`);

  const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
  const titles = new Map();
  const descriptions = new Map();
  const indexable = [];

  const robots = await readFile(join(dist, 'robots.txt'), 'utf8').catch(() => null);
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8').catch(() => null);
  if (!robots) report('robots.txt', 'missing');
  if (!sitemap) report('sitemap.xml', 'missing');
  const sitemapLine = robots && /^Sitemap:\s*(\S+)\s*$/m.exec(robots);
  if (robots && !sitemapLine) report('robots.txt', 'does not reference the sitemap');
  if (robots && /^Disallow:\s*\/\s*$/m.test(robots)) report('robots.txt', 'blocks the whole site');
  const origin = sitemapLine ? new URL(sitemapLine[1]).origin : null;
  const localOrigin = origin && ['localhost', '127.0.0.1'].includes(new URL(origin).hostname);
  if (origin && !localOrigin && !origin.startsWith('https:')) report('robots.txt', `site origin ${origin} is not https`);
  if (!(await exists(join(dist, '404.html')))) report('404.html', 'missing (hosts serve it for unknown URLs)');

  const headers = await readFile(join(dist, '_headers'), 'utf8').catch(() => null);
  if (!headers) report('_headers', 'missing (caching and security headers for the host)');
  else for (const problem of headerProblems(headers)) report('_headers', problem);

  for (const file of htmlFiles) {
    const page = urlPathFor(file, dist);
    const doc = await readFile(file, 'utf8');
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(doc);

    if (!/^<!doctype html>/i.test(doc)) report(page, 'missing <!doctype html>');
    if (!/<html lang="[a-z]{2}(-[A-Z]{2})?">/.test(doc)) report(page, 'missing <html lang>');
    if (!/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(doc)) report(page, 'missing responsive viewport meta');

    const title = /<title>([^<]+)<\/title>/.exec(doc)?.[1];
    if (!title) report(page, 'missing <title>');
    else {
      if (title.length > 70) report(page, `title is ${title.length} characters (max 70)`);
      if (titles.has(title)) report(page, `duplicate title also used by ${titles.get(title)}`);
      titles.set(title, page);
    }

    const description = /<meta name="description" content="([^"]+)">/.exec(doc)?.[1];
    if (!description) report(page, 'missing meta description');
    else {
      if (!noindex && (description.length < 70 || description.length > 170)) {
        report(page, `meta description is ${description.length} characters (want 70–170)`);
      }
      if (descriptions.has(description)) report(page, `duplicate description also used by ${descriptions.get(description)}`);
      descriptions.set(description, page);
    }

    // The CSP allows only same-origin script files: inline scripts and handlers would be blocked.
    for (const [tag] of all(/<script\b[^>]*>/g, doc)) {
      if (!/\ssrc="/.test(tag) && !/type="application\/ld\+json"/.test(tag)) report(page, 'inline <script> (blocked by the CSP)');
    }
    if (/<[a-z][^>]*\son[a-z]+="/i.test(doc)) report(page, 'inline event handler attribute (blocked by the CSP)');
    for (const [, href] of all(/<link rel="(?:stylesheet|modulepreload)" href="([^"]+)"/g, doc)) {
      if (!/^\/assets\/(site\.[0-9a-f]{10}\.css|js\/[0-9a-f]{10}\/.+\.js)$/.test(href)) report(page, `asset ${href} is not fingerprinted (it would be cached as immutable)`);
    }
    for (const [, src] of all(/<script\b[^>]*\ssrc="([^"]+)"/g, doc)) {
      if (!/^\/assets\/js\/[0-9a-f]{10}\/.+\.js$/.test(src)) report(page, `script ${src} is not fingerprinted`);
    }
    for (const [, url] of all(/\s(?:href|src)="(http:\/\/[^"]+)"/g, doc)) {
      if (!localOrigin || new URL(url).origin !== origin) report(page, `insecure http:// reference ${url}`);
    }

    // An escaped quote inside a tag means an attribute string was HTML-escaped.
    if (/<[a-z][^>]*&quot;/i.test(doc)) report(page, 'escaped attribute markup inside a tag (&quot;)');

    const h1s = all(/<h1[\s>]/g, doc).length;
    if (h1s !== 1) report(page, `has ${h1s} <h1> elements (want 1)`);

    // Heading levels must not skip (h2 → h4).
    let previous = 1;
    for (const [, level] of all(/<h([1-6])[\s>]/g, doc)) {
      const current = Number(level);
      if (current > previous + 1) report(page, `heading jumps from h${previous} to h${current}`);
      previous = current;
    }

    const canonical = /<link rel="canonical" href="([^"]+)">/.exec(doc)?.[1];
    if (noindex) {
      if (canonical) report(page, 'noindex page should not declare a canonical');
    } else {
      indexable.push(page);
      if (!canonical) report(page, 'missing canonical');
      else if (origin && canonical !== new URL(page, origin).href) report(page, `canonical ${canonical} does not match its URL`);
      const ogUrl = /<meta property="og:url" content="([^"]+)">/.exec(doc)?.[1];
      if (canonical && ogUrl !== canonical) report(page, 'og:url does not match the canonical URL');
    }

    for (const [, json] of all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, doc)) {
      try {
        const data = JSON.parse(json);
        if (data['@context'] !== 'https://schema.org' || !data['@type']) report(page, 'structured data missing @context/@type');
        if (data['@type'] === 'BreadcrumbList' && !noindex && canonical && data.itemListElement?.at(-1)?.item !== canonical) {
          report(page, 'breadcrumb structured data does not end at the canonical URL');
        }
      } catch {
        report(page, 'structured data is not valid JSON');
      }
    }

    for (const [tag] of all(/<(?:input|select)\b[^>]*>/g, doc)) {
      const id = attr(tag, 'id');
      if (/type="hidden"/.test(tag)) continue;
      if (!id || !new RegExp(`<label[^>]*for="${id}"`).test(doc)) report(page, `form control ${id ?? '(no id)'} has no <label>`);
      const describedBy = attr(tag, 'aria-describedby');
      for (const ref of describedBy ? describedBy.split(' ') : []) {
        if (!doc.includes(`id="${ref}"`)) report(page, `aria-describedby references missing id "${ref}"`);
      }
    }

    for (const [tag] of all(/<img\b[^>]*>/g, doc)) {
      if (attr(tag, 'alt') === null) report(page, 'image missing alt');
    }

    const refs = [
      ...all(/<a\b[^>]*\shref="([^"]+)"/g, doc).map((m) => m[1]),
      ...all(/<link\b[^>]*\shref="(\/[^"]+)"/g, doc).map((m) => m[1]),
      ...all(/<script\b[^>]*\ssrc="([^"]+)"/g, doc).map((m) => m[1])
    ];
    for (const href of refs) {
      if (href.startsWith('#')) {
        const id = href.slice(1);
        if (id && !doc.includes(`id="${id}"`)) report(page, `in-page link to missing #${id}`);
        continue;
      }
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      if (!href.startsWith('/')) {
        report(page, `relative link "${href}" (use root-relative paths)`);
        continue;
      }
      if (!(await exists(targetFile(dist, href)))) report(page, `broken internal link ${href}`);
    }
  }

  if (sitemap && origin) {
    const urls = all(/<loc>([^<]+)<\/loc>/g, sitemap).map((m) => new URL(m[1]));
    for (const url of urls) if (url.origin !== origin) report('sitemap.xml', `${url.href} is not on the site origin ${origin}`);
    const locs = urls.map((url) => url.pathname);
    for (const page of indexable) if (!locs.includes(page)) report('sitemap.xml', `indexable page ${page} is missing`);
    for (const loc of locs) if (!indexable.includes(loc)) report('sitemap.xml', `lists ${loc}, which is not an indexable page`);
    if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) report('sitemap.xml', 'missing lastmod dates');
  }

  return { problems, pages: htmlFiles.map((file) => urlPathFor(file, dist)).sort(), indexable: indexable.sort() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const { problems, pages } = await auditSite(dist);
  if (problems.length) {
    console.error(`Site audit failed with ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Site audit passed: ${pages.length} pages checked (${pages.join(', ')}).`);
}
