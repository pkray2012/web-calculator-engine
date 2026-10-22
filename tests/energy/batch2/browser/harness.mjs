/**
 * Browser QA for the Home Energy Batch 2 draft pages (real Chromium via
 * Playwright). The drafts are deliberately not part of `npm run build`, so
 * this harness builds the normal site into a scratch directory, renders the
 * drafts into it (noindex) with the same layout, and serves it under the
 * production headers. Not part of `npm test`; run with:
 *   node --test tests/energy/batch2/browser/harness.mjs
 */

/* global document, window -- page.evaluate() callbacks run in the browser. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { build, moduleGraph, outputPathFor, BRAND_FILES, DEV_ORIGIN } from '../../../../scripts/build.js';
import { createSiteServer } from '../../../../scripts/serve.js';
import { renderDocument } from '../../../../src/components/layout.js';
import { SITE, CATEGORIES, liveCalculators } from '../../../../src/content/site.js';
import { DRAFT_CHECKS } from './checks.mjs';

const SRC = fileURLToPath(new URL('../../../../src/', import.meta.url));
const AXE_SOURCE = fileURLToPath(new URL('../../../../node_modules/axe-core/axe.min.js', import.meta.url));
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 }
];

/** Build the site, then add the draft pages with the same document shell. */
async function buildWithDrafts(outDir) {
  await build({ outDir, origin: DEV_ORIGIN, noindex: true });
  const home = await readFile(join(outDir, 'index.html'), 'utf8');
  const find = (pattern) => {
    const match = pattern.exec(home);
    if (!match) throw new Error(`asset not found in the built home page: ${pattern}`);
    return match[0];
  };
  const brand = Object.fromEntries(Object.entries(BRAND_FILES).map(([key, file]) => {
    const dot = file.lastIndexOf('.');
    return [key, `/assets/brand/${file.slice(0, dot)}.[0-9a-f]+\\${file.slice(dot)}`];
  }));
  const assets = {
    css: find(/\/assets\/site\.[0-9a-f]+\.css/),
    js: '/assets/js/energy-draft/',
    brand: Object.fromEntries(Object.entries(brand).map(([key, pattern]) => {
      const match = new RegExp(pattern).exec(home);
      return [key, match ? match[0] : `/assets/brand/${BRAND_FILES[key]}`];
    }))
  };
  const directory = Object.entries(CATEGORIES)
    .map(([key, category]) => ({ name: category.name, calculators: liveCalculators().filter((calc) => calc.category === key).map((calc) => ({ name: calc.name, path: calc.path })) }))
    .filter((group) => group.calculators.length);
  const ctx = { site: SITE, origin: DEV_ORIGIN, nav: [{ name: 'Calculators', path: '/#calculators' }, { name: 'About', path: '/about/' }], directory, assets };

  for (const { render } of DRAFT_CHECKS) {
    const page = { ...render(), noindex: true };
    const graphs = await Promise.all((page.scripts ?? []).map((entry) => moduleGraph(entry, SRC)));
    for (const path of graphs.flat()) {
      await mkdir(dirname(join(outDir, 'assets/js/energy-draft', path)), { recursive: true });
      await cp(join(SRC, path), join(outDir, 'assets/js/energy-draft', path));
    }
    page.preload = [...new Set(graphs.flatMap((graph) => graph.slice(1)))];
    const file = join(outDir, outputPathFor(page.path));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, renderDocument(page, ctx));
  }
}

let outDir;
let server;
let base;
let browser;

test.before(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'energy-drafts-b2-'));
  await buildWithDrafts(outDir);
  server = createSiteServer(outDir);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});

test.after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(outDir, { recursive: true, force: true });
});

async function openPage(path, viewport = VIEWPORTS[2], options = {}) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base + path);
  return { page, errors, close: () => context.close() };
}

for (const check of DRAFT_CHECKS) {
  const { path } = check.render();

  test(`${path}: no horizontal overflow, no errors, tappable inputs at every width`, async () => {
    for (const viewport of VIEWPORTS) {
      const { page, errors, close } = await openPage(path, viewport);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.equal(overflow, 0, `overflows by ${overflow}px at ${viewport.width}px`);
      const input = await page.locator(check.firstInput).boundingBox();
      assert.ok(input.height >= 40, `first input is ${input.height}px tall at ${viewport.width}px`);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
      assert.deepEqual(errors, [], `${viewport.name}`);
      await close();
    }
  });

  test(`${path}: example is pre-rendered and typing recalculates`, async () => {
    const { page, errors, close } = await openPage(path);
    assert.equal((await page.locator('.stat--primary .stat__value').first().textContent()).trim(), check.example);
    await check.interact(page);
    assert.deepEqual(errors, []);
    await close();
  });

  test(`${path}: invalid input shows an accessible field error and recovers`, async () => {
    const { page, errors, close } = await openPage(path);
    const { input, value, message } = check.invalid;
    await page.fill(input, value);
    await page.locator('#calc-form button[type="submit"]').click();
    const error = page.locator(`${input}-error`);
    await error.waitFor({ state: 'visible' });
    assert.match((await error.textContent()).trim(), message);
    assert.equal(await page.locator(input).getAttribute('aria-invalid'), 'true');
    await page.fill(input, check.invalid.recover);
    await page.locator('#calc-form button[type="submit"]').click();
    await error.waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
    await close();
  });

  test(`${path}: works without JavaScript (example shown, no script errors)`, async () => {
    const { page, close } = await openPage(path, VIEWPORTS[2], { javaScriptEnabled: false });
    assert.equal((await page.locator('.stat--primary .stat__value').first().textContent()).trim(), check.example);
    await close();
  });

  test(`${path}: keyboard reaches the first input and the submit button`, async () => {
    const { page, close } = await openPage(path);
    await page.locator(check.firstInput).focus();
    assert.equal(await page.evaluate(() => document.activeElement?.id), check.firstInput.slice(1));
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement?.matches('#calc-form button[type="submit"]'))) break;
    }
    assert.ok(await page.evaluate(() => document.activeElement?.matches('#calc-form button[type="submit"]')), 'Tab reaches Calculate');
    await close();
  });

  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`${path}: axe finds no WCAG 2.1 A/AA violations at ${viewport.name} (example and error states)`, async () => {
      for (const prepare of [async () => {}, async (page) => {
        await page.fill(check.invalid.input, check.invalid.value);
        await page.locator('#calc-form button[type="submit"]').click();
        await page.locator(`${check.invalid.input}-error`).waitFor({ state: 'visible' });
      }]) {
        const { page, close } = await openPage(path, viewport, { bypassCSP: true });
        await prepare(page);
        await page.addScriptTag({ path: AXE_SOURCE });
        const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
        assert.deepEqual(result.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`), []);
        await close();
      }
    });
  }
}
