/**
 * Static site build. Renders every page to dist/ with clean directory URLs,
 * copies the browser modules the pages actually load (engines, adapters,
 * components, client code), and writes sitemap.xml, robots.txt and _headers.
 *
 * Usage:
 *   SITE_URL=https://www.example.com node scripts/build.js
 *   node scripts/build.js --dev          (uses http://localhost:4173)
 *
 * On Netlify, CONTEXT decides the target (see resolveTarget): deploy previews
 * and branch deploys are served with X-Robots-Tag: noindex, and a production
 * build needs SITE_URL set to the custom domain.
 */

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderDocument } from '../src/components/layout.js';
import { SITE, CATEGORIES, liveCalculators } from '../src/content/site.js';
import { loanPaymentPage } from '../src/pages/loan-payment-calculator.js';
import { autoLoanPage } from '../src/pages/auto-loan-calculator.js';
import { personalLoanPage } from '../src/pages/personal-loan-calculator.js';
import { creditCardPayoffPage } from '../src/pages/credit-card-payoff-calculator.js';
import { mortgageRefinancePage } from '../src/pages/mortgage-refinance-calculator.js';
import { balanceTransferPage } from '../src/pages/balance-transfer-calculator.js';
import { helocPaymentPage } from '../src/pages/heloc-payment-calculator.js';
import { mortgagePointsPage } from '../src/pages/mortgage-points-calculator.js';
import { autoLoanRefinancePage } from '../src/pages/auto-loan-refinance-calculator.js';
import { homeEquityLoanPage } from '../src/pages/home-equity-loan-calculator.js';
import { studentLoanRefinancePage } from '../src/pages/student-loan-refinance-calculator.js';
import { mortgagePaymentPage } from '../src/pages/mortgage-calculator.js';
import { homeAffordabilityPage } from '../src/pages/home-affordability-calculator.js';
import { flooringPage } from '../src/pages/flooring-calculator.js';
import { drywallPage } from '../src/pages/drywall-calculator.js';
import { roofingPage } from '../src/pages/roofing-calculator.js';
import { fencePage } from '../src/pages/fence-calculator.js';
import { cdPage } from '../src/pages/cd-calculator.js';
import { compoundInterestPage } from '../src/pages/compound-interest-calculator.js';
import { timeCardPage } from '../src/pages/time-card-calculator.js';
import { boardFootPage } from '../src/pages/board-foot-calculator.js';
import { savingsGoalPage } from '../src/pages/savings-goal-calculator.js';
import { carLeasePage } from '../src/pages/car-lease-calculator.js';
import { debtToIncomePage } from '../src/pages/debt-to-income-calculator.js';
import { hourlyToSalaryPage } from '../src/pages/hourly-to-salary-calculator.js';
import { deckPage } from '../src/pages/deck-calculator.js';
import { fuelCostPage } from '../src/pages/fuel-cost-calculator.js';
import { salesTaxPage } from '../src/pages/sales-tax-calculator.js';
import { marginPage } from '../src/pages/margin-calculator.js';
import { percentagePage } from '../src/pages/percentage-calculator.js';
import { tipPage } from '../src/pages/tip-calculator.js';
import { squareFootagePage } from '../src/pages/square-footage-calculator.js';
import { asphaltPage } from '../src/pages/asphalt-calculator.js';
import { dividendPage } from '../src/pages/dividend-calculator.js';
import { rentVsBuyPage } from '../src/pages/rent-vs-buy-calculator.js';
import { concretePage } from '../src/pages/concrete-calculator.js';
import { gravelPage } from '../src/pages/gravel-calculator.js';
import { mulchPage } from '../src/pages/mulch-calculator.js';
import { loanPayoffPage } from '../src/pages/loan-payoff-calculator.js';
import { homePage, aboutPage, notFoundPage } from '../src/pages/static-pages.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEV_ORIGIN = 'http://localhost:4173';

/** Directories browser modules may come from. Server-only code (pages, content, layout) is never shipped. */
const BROWSER_MODULE_DIRS = ['calculators', 'adapters', 'components', 'lib', 'client'];
const SERVER_ONLY_MODULES = ['components/layout.js'];
const SRC = join(ROOT, 'src');

export function normalizeOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL must be an absolute URL, got "${value}"`);
  }
  const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocal) throw new Error('SITE_URL must use https');
  if (url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an origin with no path');
  return url.origin;
}

const PREVIEW_CONTEXTS = ['deploy-preview', 'branch-deploy'];

/**
 * The origin to build for and whether the whole site must be noindex.
 * - Netlify deploy previews and branch deploys are always noindex. They use
 *   SITE_URL when it is set, so canonicals already name the real domain, and
 *   otherwise the preview's own URL (DEPLOY_PRIME_URL).
 * - Every other build needs SITE_URL, and an indexable build may never use a
 *   temporary *.netlify.app address as its canonical origin.
 */
export function resolveTarget(env = process.env, { dev = false } = {}) {
  if (dev) return { origin: DEV_ORIGIN, noindex: false };
  const preview = PREVIEW_CONTEXTS.includes(env.CONTEXT ?? '');
  const origin = env.SITE_URL || (preview ? env.DEPLOY_PRIME_URL : undefined);
  if (!origin) {
    throw new Error('SITE_URL is required for a production build (canonical URLs and the sitemap use it).\n'
      + 'Set it to the custom domain, or use "npm run build:dev" for local preview.');
  }
  const noindex = preview || env.SITE_NOINDEX === 'true';
  if (!noindex && /(^|\.)netlify\.app$/i.test(new URL(normalizeOrigin(origin)).hostname)) {
    throw new Error('SITE_URL must be the custom domain, not a temporary *.netlify.app address.');
  }
  return { origin, noindex };
}

export function outputPathFor(pagePath) {
  if (pagePath.endsWith('.html')) return pagePath.slice(1);
  if (!pagePath.endsWith('/')) throw new Error(`Page paths must end with "/" or ".html": ${pagePath}`);
  return `${pagePath.slice(1)}index.html`;
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 10);
}

/**
 * @typedef {{ path: string, title: string, description: string, body: import('../src/lib/html.js').SafeHtml,
 *   noindex?: boolean, updated?: string, scripts?: string[], preload?: string[],
 *   breadcrumbs?: { name: string, path: string }[], structuredData?: object[] }} Page
 */

/** @returns {Page[]} */
export function buildPages(origin) {
  const calculators = liveCalculators();
  const latest = calculators.map((calc) => calc.updated).sort().at(-1);
  return [
    { ...homePage(origin), updated: latest },
    { ...mortgagePaymentPage(), updated: calculators.find((calc) => calc.slug === 'mortgage-calculator').updated },
    { ...homeAffordabilityPage(), updated: calculators.find((calc) => calc.slug === 'home-affordability-calculator').updated },
    { ...flooringPage(), updated: calculators.find((calc) => calc.slug === 'flooring-calculator').updated },
    { ...drywallPage(), updated: calculators.find((calc) => calc.slug === 'drywall-calculator').updated },
    { ...roofingPage(), updated: calculators.find((calc) => calc.slug === 'roofing-calculator').updated },
    { ...fencePage(), updated: calculators.find((calc) => calc.slug === 'fence-calculator').updated },
    { ...cdPage(), updated: calculators.find((calc) => calc.slug === 'cd-calculator').updated },
    { ...compoundInterestPage(), updated: calculators.find((calc) => calc.slug === 'compound-interest-calculator').updated },
    { ...timeCardPage(), updated: calculators.find((calc) => calc.slug === 'time-card-calculator').updated },
    { ...boardFootPage(), updated: calculators.find((calc) => calc.slug === 'board-foot-calculator').updated },
    { ...savingsGoalPage(), updated: calculators.find((calc) => calc.slug === 'savings-goal-calculator').updated },
    { ...carLeasePage(), updated: calculators.find((calc) => calc.slug === 'car-lease-calculator').updated },
    { ...debtToIncomePage(), updated: calculators.find((calc) => calc.slug === 'debt-to-income-calculator').updated },
    { ...hourlyToSalaryPage(), updated: calculators.find((calc) => calc.slug === 'hourly-to-salary-calculator').updated },
    { ...deckPage(), updated: calculators.find((calc) => calc.slug === 'deck-calculator').updated },
    { ...fuelCostPage(), updated: calculators.find((calc) => calc.slug === 'fuel-cost-calculator').updated },
    { ...salesTaxPage(), updated: calculators.find((calc) => calc.slug === 'sales-tax-calculator').updated },
    { ...marginPage(), updated: calculators.find((calc) => calc.slug === 'margin-calculator').updated },
    { ...percentagePage(), updated: calculators.find((calc) => calc.slug === 'percentage-calculator').updated },
    { ...tipPage(), updated: calculators.find((calc) => calc.slug === 'tip-calculator').updated },
    { ...squareFootagePage(), updated: calculators.find((calc) => calc.slug === 'square-footage-calculator').updated },
    { ...asphaltPage(), updated: calculators.find((calc) => calc.slug === 'asphalt-calculator').updated },
    { ...dividendPage(), updated: calculators.find((calc) => calc.slug === 'dividend-calculator').updated },
    { ...rentVsBuyPage(), updated: calculators.find((calc) => calc.slug === 'rent-vs-buy-calculator').updated },
    { ...concretePage(), updated: calculators.find((calc) => calc.slug === 'concrete-calculator').updated },
    { ...gravelPage(), updated: calculators.find((calc) => calc.slug === 'gravel-calculator').updated },
    { ...mulchPage(), updated: calculators.find((calc) => calc.slug === 'mulch-calculator').updated },
    { ...loanPaymentPage(), updated: calculators.find((calc) => calc.slug === 'loan-payment-calculator').updated },
    { ...autoLoanPage(), updated: calculators.find((calc) => calc.slug === 'auto-loan-calculator').updated },
    { ...personalLoanPage(), updated: calculators.find((calc) => calc.slug === 'personal-loan-calculator').updated },
    { ...creditCardPayoffPage(), updated: calculators.find((calc) => calc.slug === 'credit-card-payoff-calculator').updated },
    { ...mortgageRefinancePage(), updated: calculators.find((calc) => calc.slug === 'mortgage-refinance-calculator').updated },
    { ...balanceTransferPage(), updated: calculators.find((calc) => calc.slug === 'balance-transfer-calculator').updated },
    { ...helocPaymentPage(), updated: calculators.find((calc) => calc.slug === 'heloc-payment-calculator').updated },
    { ...mortgagePointsPage(), updated: calculators.find((calc) => calc.slug === 'mortgage-points-calculator').updated },
    { ...autoLoanRefinancePage(), updated: calculators.find((calc) => calc.slug === 'auto-loan-refinance-calculator').updated },
    { ...homeEquityLoanPage(), updated: calculators.find((calc) => calc.slug === 'home-equity-loan-calculator').updated },
    { ...studentLoanRefinancePage(), updated: calculators.find((calc) => calc.slug === 'student-loan-refinance-calculator').updated },
    { ...loanPayoffPage(), updated: calculators.find((calc) => calc.slug === 'loan-payoff-calculator').updated },
    { ...aboutPage(), updated: '2026-09-27' },
    notFoundPage()
  ];
}

export function sitemapXml(pages, origin) {
  const urls = pages
    .filter((page) => !page.noindex)
    .map((page) => `  <url>\n    <loc>${new URL(page.path, origin).href}</loc>\n    <lastmod>${page.updated}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Response headers for static hosts that read a _headers file (Netlify,
 * Cloudflare Pages); scripts/serve.js applies the same file locally.
 * Cache-Control is set only for fingerprinted assets because hosts merge
 * headers from every matching rule; HTML keeps the host's revalidation default.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

export function headersFile({ noindex = false } = {}) {
  return `/*
${noindex ? '  X-Robots-Tag: noindex\n' : ''}  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

/**
 * Every module an entry point loads, entry first, as paths relative to src/
 * with forward slashes (e.g. "client/loan-payment.js"). Only static relative
 * imports are followed; the browser code uses no bare or dynamic imports.
 */
export async function moduleGraph(entry, srcDir = SRC) {
  const seen = new Set();
  const visit = async (path) => {
    if (seen.has(path)) return;
    seen.add(path);
    const source = await readFile(join(srcDir, path), 'utf8');
    for (const [, spec] of source.matchAll(/(?:from|import)\s*'(\.[^']+)'/g)) {
      await visit(relative(srcDir, resolve(srcDir, dirname(path), spec)).split(sep).join('/'));
    }
  };
  await visit(entry);
  for (const path of seen) {
    if (!BROWSER_MODULE_DIRS.includes(path.split('/')[0]) || SERVER_ONLY_MODULES.includes(path)) {
      throw new Error(`${entry} imports ${path}, which is not a browser module`);
    }
  }
  return [...seen];
}

async function hashModules(paths) {
  const digest = createHash('sha256');
  for (const path of [...paths].sort()) digest.update(path).update(await readFile(join(SRC, path)));
  return digest.digest('hex').slice(0, 10);
}

export function robotsTxt(origin) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export async function build({ outDir = join(ROOT, 'dist'), origin, noindex = false }) {
  origin = normalizeOrigin(origin);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'assets'), { recursive: true });

  const css = await readFile(join(ROOT, 'src', 'styles', 'site.css'), 'utf8');
  const cssFile = `assets/site.${hash(css)}.css`;
  await writeFile(join(outDir, cssFile), css);

  const pages = buildPages(origin);

  // Only modules some page loads are shipped. They live in one content-hashed
  // directory, so relative imports keep working and every file can be cached
  // as immutable. Each page preloads its whole graph, so the browser fetches
  // the modules in parallel instead of discovering them one import level at a time.
  const graphs = new Map();
  for (const entry of new Set(pages.flatMap((page) => page.scripts ?? []))) graphs.set(entry, await moduleGraph(entry));
  const shipped = new Set([...graphs.values()].flat());
  const jsBase = `assets/js/${await hashModules(shipped)}/`;
  for (const path of shipped) {
    await mkdir(dirname(join(outDir, jsBase, path)), { recursive: true });
    await cp(join(SRC, path), join(outDir, jsBase, path));
  }
  for (const page of pages) {
    page.preload = [...new Set((page.scripts ?? []).flatMap((entry) => graphs.get(entry).slice(1)))];
  }

  // The header stays short at any number of calculators; every live
  // calculator is linked from the footer directory, grouped by category.
  const nav = [
    { name: 'Home', path: '/' },
    { name: 'Calculators', path: '/#calculators' },
    { name: 'About', path: '/about/' }
  ];
  const directory = Object.entries(CATEGORIES)
    .map(([key, category]) => ({
      name: category.name,
      calculators: liveCalculators().filter((calc) => calc.category === key).map((calc) => ({ name: calc.name, path: calc.path }))
    }))
    .filter((group) => group.calculators.length);
  const ctx = { site: SITE, origin, nav, directory, assets: { css: `/${cssFile}`, js: `/${jsBase}` } };

  for (const page of pages) {
    const file = join(outDir, outputPathFor(page.path));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, renderDocument(page, ctx));
  }

  await writeFile(join(outDir, 'sitemap.xml'), sitemapXml(pages, origin));
  await writeFile(join(outDir, 'robots.txt'), robotsTxt(origin));
  await writeFile(join(outDir, '_headers'), headersFile({ noindex }));

  return { outDir, origin, noindex, pages: pages.map((page) => page.path) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let target;
  try {
    target = resolveTarget(process.env, { dev: process.argv.includes('--dev') });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  const result = await build(target);
  console.log(`Built ${result.pages.length} pages for ${result.origin} into ${result.outDir}`
    + (result.noindex ? ' (preview: every page is served with X-Robots-Tag: noindex)' : ''));
}
