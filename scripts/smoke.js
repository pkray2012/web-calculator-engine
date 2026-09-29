/**
 * Smoke test for a deployed site (preview or production). Read-only: it only
 * sends GET requests. Checks what the local audit cannot see: the headers,
 * status codes and redirects the host actually serves.
 *
 * Usage:
 *   node scripts/smoke.js https://www.example.com
 *   node scripts/smoke.js https://deploy-preview-7--site.netlify.app --origin https://www.example.com --preview
 * --origin is the canonical SITE_URL the build used; it defaults to the URL tested.
 * --preview expects the X-Robots-Tag: noindex that preview builds carry; without
 * it, any noindex is reported as a problem.
 */

import { pathToFileURL } from 'node:url';

const HTML_MAX_AGE = 3600;

function longLived(cacheControl) {
  if (!cacheControl) return false;
  if (/immutable/.test(cacheControl)) return true;
  const maxAge = /max-age=(\d+)/.exec(cacheControl);
  return Boolean(maxAge && Number(maxAge[1]) > HTML_MAX_AGE);
}

export async function smokeTest(baseUrl, { origin = new URL(baseUrl).origin, preview = false, fetchImpl = fetch } = {}) {
  const base = new URL(baseUrl).origin;
  const problems = [];
  const get = (path, init) => fetchImpl(new URL(path, base), { redirect: 'manual', ...init });

  // Home page: security headers, and HTML must not be cached long-term.
  const home = await get('/');
  if (home.status !== 200) problems.push(`/ returned ${home.status}`);
  const csp = home.headers.get('content-security-policy') ?? '';
  const scriptSrc = /(?:^|;)\s*script-src ([^;]*)/.exec(csp)?.[1];
  if (!scriptSrc || /unsafe-inline|unsafe-eval|\*/.test(scriptSrc)) problems.push(`/: Content-Security-Policy script-src is missing or not strict ("${scriptSrc ?? ''}")`);
  if (home.headers.get('x-content-type-options') !== 'nosniff') problems.push('/: X-Content-Type-Options: nosniff missing');
  if (!home.headers.get('x-frame-options')) problems.push('/: X-Frame-Options missing');
  if (!home.headers.get('referrer-policy')) problems.push('/: Referrer-Policy missing');
  const noindex = /noindex/i.test(home.headers.get('x-robots-tag') ?? '');
  if (preview && !noindex) problems.push('/: preview is missing X-Robots-Tag: noindex, so it could be indexed');
  if (!preview && noindex) problems.push('/: X-Robots-Tag: noindex is set, so search engines would drop the site');
  if (longLived(home.headers.get('cache-control'))) problems.push(`/: HTML is cached long-term (${home.headers.get('cache-control')})`);
  const homeHtml = await home.text();

  // Fingerprinted assets must be immutable.
  const assets = [
    /<link rel="stylesheet" href="([^"]+)">/.exec(homeHtml)?.[1]
  ].filter(Boolean);

  // robots.txt and sitemap on the canonical origin.
  const robots = await get('/robots.txt');
  const robotsText = robots.status === 200 ? await robots.text() : '';
  if (!robotsText.includes(`Sitemap: ${origin}/sitemap.xml`)) problems.push(`robots.txt does not name ${origin}/sitemap.xml`);
  if (/^Disallow:\s*\/\s*$/m.test(robotsText)) problems.push('robots.txt blocks the whole site');
  const sitemap = await get('/sitemap.xml');
  const locs = sitemap.status === 200 ? [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc) : [];
  if (!locs.length) problems.push(`sitemap.xml returned ${sitemap.status} or lists no URLs`);

  // Every sitemap URL: 200, canonical and og:url equal to the sitemap URL, no localhost.
  let calculatorPath = null;
  for (const loc of locs) {
    const url = new URL(loc);
    if (url.origin !== origin) problems.push(`sitemap lists ${loc}, not on ${origin}`);
    const page = await get(url.pathname);
    if (page.status !== 200) {
      problems.push(`${url.pathname} returned ${page.status}`);
      continue;
    }
    const doc = await page.text();
    if (/<link rel="canonical" href="([^"]+)">/.exec(doc)?.[1] !== loc) problems.push(`${url.pathname}: canonical is not ${loc}`);
    if (/<meta property="og:url" content="([^"]+)">/.exec(doc)?.[1] !== loc) problems.push(`${url.pathname}: og:url is not ${loc}`);
    if (/localhost|127\.0\.0\.1/.test(doc)) problems.push(`${url.pathname}: contains a localhost URL`);
    const script = /<script type="module" src="([^"]+)">/.exec(doc)?.[1];
    if (script && assets.length < 2) assets.push(script);
    if (url.pathname.startsWith('/calculators/')) calculatorPath ??= url.pathname;
  }
  for (const asset of assets) {
    const response = await get(asset);
    if (response.status !== 200) problems.push(`${asset} returned ${response.status}`);
    else if (!/immutable/.test(response.headers.get('cache-control') ?? '')) problems.push(`${asset} is not cached as immutable`);
  }

  // Unknown URLs return a real 404 with the site's 404 page.
  const missing = await get(`/smoke-test-missing-${Date.now()}/`);
  if (missing.status !== 404) problems.push(`an unknown URL returned ${missing.status}, not 404`);
  else if (!/Page not found/.test(await missing.text())) problems.push('an unknown URL did not serve the site 404 page');

  // A URL without its trailing slash redirects permanently to the canonical form.
  if (calculatorPath) {
    const bare = calculatorPath.replace(/\/$/, '');
    const redirect = await get(bare);
    const location = redirect.headers.get('location') ?? '';
    if (![301, 308].includes(redirect.status) || !new URL(location, base).pathname.endsWith(calculatorPath)) {
      problems.push(`${bare} returned ${redirect.status} ${location}, not a permanent redirect to ${calculatorPath}`);
    }
  }

  // HTTP redirects to HTTPS (skipped for local servers and previews).
  const host = new URL(base).hostname;
  if (!preview && base.startsWith('https:') && !['localhost', '127.0.0.1'].includes(host)) {
    const insecure = await fetchImpl(`http://${host}/`, { redirect: 'manual' });
    const location = insecure.headers.get('location') ?? '';
    if (![301, 308].includes(insecure.status) || !location.startsWith('https://')) problems.push(`http://${host}/ returned ${insecure.status}, not a permanent redirect to https`);
  }

  return { problems, checked: locs.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [target] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const originFlag = process.argv.indexOf('--origin');
  if (!target) {
    console.error('Usage: node scripts/smoke.js <deployed URL> [--origin <canonical SITE_URL>]');
    process.exit(1);
  }
  const origin = originFlag > -1 ? new URL(process.argv[originFlag + 1]).origin : undefined;
  const preview = process.argv.includes('--preview');
  const { problems, checked } = await smokeTest(target, { origin, preview });
  if (problems.length) {
    console.error(`Smoke test failed with ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`Smoke test passed: ${checked} sitemap URLs, headers, caching, 404 and redirects checked on ${target}.`);
}
