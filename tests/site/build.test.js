import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';

import { build, normalizeOrigin, outputPathFor, moduleGraph, headersFile, resolveTarget, DEV_ORIGIN, CONTENT_SECURITY_POLICY } from '../../scripts/build.js';
import { auditSite, headerProblems } from '../../scripts/site-audit.js';
import { createSiteServer, parseHeadersFile } from '../../scripts/serve.js';
import { smokeTest } from '../../scripts/smoke.js';

const ORIGIN = 'https://calculators.test';
let dist;

test.before(async () => {
  dist = await mkdtemp(join(tmpdir(), 'site-build-'));
  await build({ outDir: dist, origin: ORIGIN });
});

test.after(async () => {
  await rm(dist, { recursive: true, force: true });
});

const read = (path) => readFile(join(dist, path), 'utf8');

test('builds only real destinations with clean URLs', async () => {
  const { pages, indexable } = await auditSite(dist);
  const calculators = ['401k-calculator', 'asphalt-calculator', 'auto-loan-calculator', 'auto-loan-refinance-calculator', 'balance-transfer-calculator', 'board-foot-calculator', 'btu-calculator', 'car-lease-calculator', 'cd-calculator', 'compound-interest-calculator', 'concrete-calculator', 'credit-card-payoff-calculator', 'cubic-yard-calculator', 'debt-to-income-calculator', 'deck-calculator', 'dividend-calculator', 'drywall-calculator', 'fence-calculator', 'flooring-calculator', 'fuel-cost-calculator', 'gravel-calculator', 'heloc-payment-calculator', 'home-affordability-calculator', 'home-equity-loan-calculator', 'hourly-to-salary-calculator', 'loan-payment-calculator', 'loan-payoff-calculator', 'margin-calculator', 'mortgage-calculator', 'mortgage-points-calculator', 'mortgage-refinance-calculator', 'mulch-calculator', 'overtime-calculator', 'percentage-calculator', 'personal-loan-calculator', 'rent-vs-buy-calculator', 'roofing-calculator', 'sales-tax-calculator', 'savings-goal-calculator', 'square-footage-calculator', 'student-loan-refinance-calculator', 'time-card-calculator', 'tip-calculator']
    .map((slug) => `/calculators/${slug}/`);
  assert.deepEqual(pages, ['/', '/404.html', '/about/', ...calculators]);
  assert.deepEqual(indexable, ['/', '/about/', ...calculators]);
});

test('built site passes the technical SEO audit', async () => {
  const { problems } = await auditSite(dist);
  assert.deepEqual(problems, []);
});

test('calculator page has canonical, metadata, one h1 and breadcrumb data', async () => {
  const doc = await read('calculators/loan-payment-calculator/index.html');
  assert.match(doc, /<link rel="canonical" href="https:\/\/calculators\.test\/calculators\/loan-payment-calculator\/">/);
  assert.match(doc, /<title>Loan Payment Calculator — Monthly Payment &amp; Amortization<\/title>/);
  assert.match(doc, /<meta name="description" content="Calculate the monthly payment/);
  assert.equal((doc.match(/<h1[\s>]/g) ?? []).length, 1);
  const [, json] = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(doc);
  const data = JSON.parse(json);
  assert.equal(data['@type'], 'BreadcrumbList');
  assert.equal(data.itemListElement.at(-1).item, `${ORIGIN}/calculators/loan-payment-calculator/`);
  // Pre-rendered example results are in the HTML for crawlers and no-JS users.
  assert.match(doc, /\$506\.91/);
  assert.match(doc, /id="schedule-yearly"/);
  assert.match(doc, /<script type="module" src="\/assets\/js\/[0-9a-f]{10}\/client\/loan-payment\.js"><\/script>/);
});

test('404 page is noindex, has no canonical and is not in the sitemap', async () => {
  const doc = await read('404.html');
  assert.match(doc, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(doc, /rel="canonical"/);
  assert.doesNotMatch(await read('sitemap.xml'), /404/);
});

test('robots.txt allows crawling and points at the sitemap', async () => {
  assert.equal(await read('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  const sitemap = await read('sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/calculators\.test\/calculators\/loan-payment-calculator\/<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 45);
});

test('every relative import in shipped browser modules resolves', async () => {
  const jsRoot = join(dist, 'assets', 'js');
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  };
  await walk(jsRoot);
  assert.ok(files.some((file) => file.endsWith('client/loan-payment.js')));
  assert.ok(files.some((file) => file.endsWith('calculators/loan-payment.js')));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const [, spec] of source.matchAll(/from '(\.[^']+)'/g)) {
      await assert.doesNotReject(stat(resolve(dirname(file), spec)), `${file} imports missing ${spec}`);
    }
    assert.doesNotMatch(source, /from 'node:/, `${file} imports a Node built-in`);
  }
  // Server-only layout is not shipped.
  await assert.rejects(stat(join(jsRoot, 'components', 'layout.js')));
});

test('stylesheet is content-hashed for caching', async () => {
  const doc = await read('index.html');
  const [, href] = /<link rel="stylesheet" href="([^"]+)">/.exec(doc);
  assert.match(href, /^\/assets\/site\.[0-9a-f]{10}\.css$/);
  await assert.doesNotReject(stat(join(dist, href)));
});

test('origin validation protects canonical URLs', () => {
  assert.equal(normalizeOrigin('https://www.example.com/'), 'https://www.example.com');
  assert.equal(normalizeOrigin('http://localhost:4173'), 'http://localhost:4173');
  assert.throws(() => normalizeOrigin('http://www.example.com'), /https/);
  assert.throws(() => normalizeOrigin('https://www.example.com/sub/'), /no path/);
  assert.throws(() => normalizeOrigin('not a url'), /absolute URL/);
  assert.equal(outputPathFor('/'), 'index.html');
  assert.equal(outputPathFor('/a/b/'), 'a/b/index.html');
  assert.equal(outputPathFor('/404.html'), '404.html');
  assert.throws(() => outputPathFor('/no-slash'));
});

test('audit catches broken SEO and markup', async () => {
  const broken = await mkdtemp(join(tmpdir(), 'site-broken-'));
  try {
    await build({ outDir: broken, origin: ORIGIN });
    const file = join(broken, 'about', 'index.html');
    let doc = await readFile(file, 'utf8');
    doc = doc
      .replace(/<link rel="canonical"[^>]+>/, '')
      .replace('</main>', '<h1>Second</h1><a href="/missing/">x</a><td class=&quot;num&quot;>1</td></main>');
    await writeFile(file, doc);
    const calc = join(broken, 'calculators', 'loan-payment-calculator', 'index.html');
    let calcDoc = await readFile(calc, 'utf8');
    calcDoc = calcDoc
      .replace('</body>', '<script>alert(1)</script><button onclick="x()">x</button><a href="http://insecure.example/">x</a><script src="/app.js"></script></body>')
      .replace(/"item":"https:\/\/calculators\.test\/calculators\/loan-payment-calculator\/"/, '"item":"https://calculators.test/elsewhere/"');
    await writeFile(calc, calcDoc);
    await writeFile(join(broken, 'app.js'), '');
    await writeFile(join(broken, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    await rm(join(broken, '_headers'));
    await rm(join(broken, '404.html'));
    const { problems } = await auditSite(broken);
    const text = problems.join('\n');
    assert.match(text, /\/about\/: missing canonical/);
    assert.match(text, /\/about\/: has 2 <h1> elements/);
    assert.match(text, /broken internal link \/missing\//);
    assert.match(text, /escaped attribute markup/);
    assert.match(text, /robots\.txt: blocks the whole site/);
    assert.match(text, /_headers: missing/);
    assert.match(text, /404\.html: missing/);
    assert.match(text, /loan-payment-calculator\/: inline <script>/);
    assert.match(text, /inline event handler/);
    assert.match(text, /insecure http:\/\/ reference http:\/\/insecure\.example\//);
    assert.match(text, /script \/app\.js is not fingerprinted/);
    assert.match(text, /breadcrumb structured data does not end at the canonical URL/);
  } finally {
    await rm(broken, { recursive: true, force: true });
  }
});

test('preview server resolves clean URLs like a static host', async () => {
  const server = createSiteServer(dist);
  await new Promise((done) => server.listen(0, done));
  const base = `http://localhost:${server.address().port}`;
  try {
    const ok = await fetch(`${base}/calculators/loan-payment-calculator/`);
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get('content-type'), /text\/html/);
    assert.equal(ok.headers.get('content-security-policy'), CONTENT_SECURITY_POLICY);
    assert.equal(ok.headers.get('cache-control'), null);
    const css = /<link rel="stylesheet" href="([^"]+)">/.exec(await ok.text())[1];
    assert.equal((await fetch(`${base}${css}`)).headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const redirect = await fetch(`${base}/about`, { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), '/about/');
    const missing = await fetch(`${base}/nope/`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /Page not found/);
    const traversal = await fetch(`${base}/..%2f..%2fetc/passwd`);
    assert.notEqual(traversal.status, 200);
  } finally {
    await new Promise((done) => server.close(done));
  }
});

test('browser modules are fingerprinted and every page references the same build', async () => {
  const scripts = [];
  for (const path of ['calculators/loan-payment-calculator/index.html', 'calculators/auto-loan-calculator/index.html']) {
    const [, src] = /<script type="module" src="([^"]+)">/.exec(await read(path));
    scripts.push(src);
    await assert.doesNotReject(stat(join(dist, src)));
  }
  const roots = scripts.map((src) => src.split('/client/')[0]);
  assert.equal(new Set(roots).size, 1);
  assert.match(roots[0], /^\/assets\/js\/[0-9a-f]{10}$/);

  // Rebuilding identical sources yields the same fingerprint.
  const again = await mkdtemp(join(tmpdir(), 'site-rebuild-'));
  try {
    await build({ outDir: again, origin: ORIGIN });
    const [, src] = /<script type="module" src="([^"]+)">/.exec(await readFile(join(again, 'calculators/loan-payment-calculator/index.html'), 'utf8'));
    assert.equal(src, scripts[0]);
  } finally {
    await rm(again, { recursive: true, force: true });
  }
});

test('_headers sets a strict CSP everywhere and long caching only for assets', async () => {
  const rules = parseHeadersFile(await read('_headers'));
  const all = rules.find((rule) => rule.pattern.test('/calculators/loan-payment-calculator/'));
  assert.equal(all.headers['Content-Security-Policy'], CONTENT_SECURITY_POLICY);
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self'(;|$)/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /script-src[^;]*unsafe-inline/);
  assert.equal(all.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(all.headers['Cache-Control'], undefined);
  const assets = rules.filter((rule) => rule.pattern.test('/assets/site.abc.css'));
  assert.ok(assets.some((rule) => rule.headers['Cache-Control'] === 'public, max-age=31536000, immutable'));
  assert.ok(!rules.some((rule) => rule.pattern.test('/about/') && rule.headers['Cache-Control']));
});

test('every page links to every live calculator, and the header nav stays short', async () => {
  const { liveCalculators } = await import('../../src/content/site.js');
  for (const path of ['index.html', 'about/index.html', '404.html', 'calculators/mortgage-refinance-calculator/index.html']) {
    const doc = await read(path);
    const directory = doc.slice(doc.indexOf('aria-label="All calculators"'));
    for (const calc of liveCalculators()) assert.match(directory, new RegExp(`href="${calc.path}"`), `${path} misses ${calc.path}`);
    const header = doc.slice(doc.indexOf('<nav aria-label="Main">'), doc.indexOf('</header>'));
    assert.equal((header.match(/<li>/g) ?? []).length, 3);
  }
});

test('the audit rejects weakened security or caching headers', () => {
  assert.deepEqual(headerProblems(headersFile()), []);
  const weakened = headersFile().replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
  assert.match(headerProblems(weakened).join('\n'), /script-src is not strict/);
  const noNosniff = headersFile().replace(/\s+X-Content-Type-Options: nosniff/, '');
  assert.match(headerProblems(noNosniff).join('\n'), /nosniff missing/);
  const htmlCached = headersFile().replace('/*\n', '/*\n  Cache-Control: max-age=3600\n');
  assert.match(headerProblems(htmlCached).join('\n'), /\/\* sets Cache-Control/);
  const assetsUncached = headersFile().replace('immutable', '');
  assert.match(headerProblems(assetsUncached).join('\n'), /not cached as immutable/);
});

test('each calculator page preloads exactly its module graph, and only loaded modules ship', async () => {
  const doc = await read('calculators/mortgage-refinance-calculator/index.html');
  const [, root] = /<script type="module" src="(\/assets\/js\/[0-9a-f]{10}\/)client\/mortgage-refinance\.js">/.exec(doc);
  const preloaded = [...doc.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map(([, href]) => href.slice(root.length)).sort();
  const graph = await moduleGraph('client/mortgage-refinance.js');
  assert.equal(graph[0], 'client/mortgage-refinance.js');
  assert.deepEqual(preloaded, graph.slice(1).sort());
  assert.ok(preloaded.includes('calculators/loan-payment.js'));
  for (const href of preloaded) await assert.doesNotReject(stat(join(dist, root, href)));
  // Every engine now has a page, so check the page-level rule instead: an
  // engine that ships for another page is not preloaded here.
  await assert.doesNotReject(stat(join(dist, root, 'calculators', 'heloc.js')));
  assert.ok(!preloaded.includes('calculators/heloc.js'));
});

test('module graphs never pull server-only code into the browser', async () => {
  const src = await mkdtemp(join(tmpdir(), 'site-graph-'));
  try {
    await mkdir(join(src, 'client'), { recursive: true });
    await mkdir(join(src, 'components'), { recursive: true });
    await writeFile(join(src, 'client', 'bad.js'), "import { renderDocument } from '../components/layout.js';\n");
    await writeFile(join(src, 'components', 'layout.js'), 'export const renderDocument = 1;\n');
    await assert.rejects(moduleGraph('client/bad.js', src), /not a browser module/);
  } finally {
    await rm(src, { recursive: true, force: true });
  }
});

test('every external link on a calculator page is an official source listed under "Sources"', async () => {
  const { liveCalculators } = await import('../../src/content/site.js');
  const { SOURCES } = await import('../../src/content/sources.js');
  const known = new Set(Object.values(SOURCES).map((source) => source.url));
  // Official US government sources only: the CFPB, the Department of Education's Federal Student Aid, NIST, the Department of Labor and California's DIR,
  // FuelEconomy.gov and ENERGY STAR (DOE and EPA), the SEC's Investor.gov, the IRS and the SBA.
  for (const url of known) assert.match(url, /^https:\/\/(www\.consumerfinance\.gov|studentaid\.gov|www\.nist\.gov|www\.dol\.gov|www\.dir\.ca\.gov|www\.fueleconomy\.gov|www\.energystar\.gov|www\.irs\.gov|www\.sba\.gov|www\.investor\.gov)\//);
  for (const calc of liveCalculators()) {
    const doc = await read(`${calc.path.slice(1)}index.html`);
    const main = doc.slice(doc.indexOf('<main'), doc.indexOf('</main>'));
    const listed = main.slice(main.indexOf('id="sources-heading"'));
    const external = [...main.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(([, href]) => href);
    assert.ok(external.length, `${calc.path} cites no source`);
    for (const href of external) {
      assert.ok(known.has(href), `${calc.path} links unregistered source ${href}`);
      assert.ok(listed.includes(`href="${href}"`), `${calc.path} does not list ${href} under Sources`);
    }
  }
});

test('the deployment smoke test passes against a host that serves the build correctly', async () => {
  const server = createSiteServer(dist);
  await new Promise((done) => server.listen(0, done));
  const base = `http://localhost:${server.address().port}`;
  try {
    const ok = await smokeTest(base, { origin: ORIGIN });
    assert.deepEqual(ok.problems, []);
    assert.equal(ok.checked, 45);
    // A build made for a different domain is caught.
    const wrong = await smokeTest(base, { origin: 'https://other.test' });
    assert.match(wrong.problems.join('\n'), /robots\.txt does not name https:\/\/other\.test\/sitemap\.xml/);
    assert.match(wrong.problems.join('\n'), /not on https:\/\/other\.test/);
  } finally {
    await new Promise((done) => server.close(done));
  }
});

test('the smoke test flags a host that drops headers, caches HTML or soft-404s', async () => {
  const html = '<link rel="stylesheet" href="/assets/site.abc.css">';
  const responses = {
    '/': new Response(html, { headers: { 'cache-control': 'public, max-age=86400' } }),
    '/robots.txt': new Response(`User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`),
    '/sitemap.xml': new Response('<urlset></urlset>'),
    '/assets/site.abc.css': new Response('', { headers: { 'cache-control': 'max-age=0' } })
  };
  const fakeFetch = async (url) => responses[new URL(url).pathname] ?? new Response('home again', { status: 200 });
  const { problems } = await smokeTest('http://localhost:1', { origin: ORIGIN, fetchImpl: fakeFetch });
  const text = problems.join('\n');
  assert.match(text, /script-src is missing/);
  assert.match(text, /nosniff missing/);
  assert.match(text, /HTML is cached long-term/);
  assert.match(text, /lists no URLs/);
  assert.match(text, /not cached as immutable/);
  assert.match(text, /returned 200, not 404/);
});

test('the placeholder brand lives only in the site registry', async () => {
  const { SITE } = await import('../../src/content/site.js');
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(js|mjs|css)$/.test(entry.name)) files.push(full);
    }
  };
  for (const dir of ['src', 'scripts']) await walk(new URL(`../../${dir}/`, import.meta.url).pathname);
  const offenders = [];
  for (const file of files) {
    if (file.endsWith('src/content/site.js')) continue;
    if ((await readFile(file, 'utf8')).includes(SITE.name)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], 'hard-coded brand name; use SITE.name');
  // Every built page carries the brand only through SITE.name.
  for (const path of ['index.html', 'about/index.html', 'calculators/loan-payment-calculator/index.html']) {
    assert.match(await read(path), new RegExp(`<a class="site-name" href="/">${SITE.name}</a>`));
  }
});

test('Netlify contexts: previews are noindex, production needs the custom domain', () => {
  // Local dev and plain production builds.
  assert.deepEqual(resolveTarget({}, { dev: true }), { origin: DEV_ORIGIN, noindex: false });
  assert.deepEqual(resolveTarget({ SITE_URL: 'https://www.example.com' }), { origin: 'https://www.example.com', noindex: false });
  assert.throws(() => resolveTarget({}), /SITE_URL is required/);
  // Netlify production: SITE_URL is required and may not be a netlify.app address.
  assert.throws(() => resolveTarget({ CONTEXT: 'production', URL: 'https://calc.netlify.app' }), /SITE_URL is required/);
  assert.throws(() => resolveTarget({ CONTEXT: 'production', SITE_URL: 'https://calc.netlify.app' }), /custom domain/);
  assert.throws(() => resolveTarget({ SITE_URL: 'https://calc.netlify.app/' }), /custom domain/);
  assert.deepEqual(resolveTarget({ CONTEXT: 'production', SITE_URL: 'https://www.example.com' }), { origin: 'https://www.example.com', noindex: false });
  // Deploy previews and branch deploys: always noindex; the real domain wins when set.
  const prime = 'https://deploy-preview-7--calc.netlify.app';
  assert.deepEqual(resolveTarget({ CONTEXT: 'deploy-preview', DEPLOY_PRIME_URL: prime }), { origin: prime, noindex: true });
  assert.deepEqual(resolveTarget({ CONTEXT: 'branch-deploy', DEPLOY_PRIME_URL: prime, SITE_URL: 'https://www.example.com' }), { origin: 'https://www.example.com', noindex: true });
  assert.throws(() => resolveTarget({ CONTEXT: 'deploy-preview' }), /SITE_URL is required/);
});

test('a preview build is noindex everywhere, and the audit refuses it as production', async () => {
  const preview = await mkdtemp(join(tmpdir(), 'site-preview-'));
  try {
    const result = await build({ outDir: preview, origin: 'https://deploy-preview-7--calc.netlify.app', noindex: true });
    assert.equal(result.noindex, true);
    const rules = parseHeadersFile(await readFile(join(preview, '_headers'), 'utf8'));
    assert.equal(rules.find((rule) => rule.pattern.test('/')).headers['X-Robots-Tag'], 'noindex');
    const { problems } = await auditSite(preview);
    assert.match(problems.join('\n'), /X-Robots-Tag: noindex on \/\* would remove the whole site/);
    // The production build carries no noindex at all.
    assert.doesNotMatch(await read('_headers'), /X-Robots-Tag/);
    assert.doesNotMatch(await read('index.html'), /noindex/);
  } finally {
    await rm(preview, { recursive: true, force: true });
  }
});

test('the smoke test tells a preview from production by its noindex header', async () => {
  const preview = await mkdtemp(join(tmpdir(), 'site-preview-smoke-'));
  const server = createSiteServer(preview);
  try {
    await build({ outDir: preview, origin: ORIGIN, noindex: true });
    await new Promise((done) => server.listen(0, done));
    const base = `http://localhost:${server.address().port}`;
    assert.deepEqual((await smokeTest(base, { origin: ORIGIN, preview: true })).problems, []);
    assert.match((await smokeTest(base, { origin: ORIGIN })).problems.join('\n'), /noindex is set, so search engines would drop the site/);
  } finally {
    await new Promise((done) => server.close(done));
    await rm(preview, { recursive: true, force: true });
  }
});
