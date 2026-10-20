import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build } from '../../scripts/build.js';
import { liveCalculators, findCalculator } from '../../src/content/site.js';

const ORIGIN = 'https://calculators.test';
let dist;

test.before(async () => {
  dist = await mkdtemp(join(tmpdir(), 'site-seo-'));
  await build({ outDir: dist, origin: ORIGIN });
});

test.after(async () => {
  await rm(dist, { recursive: true, force: true });
});

const page = (calc) => readFile(join(dist, calc.path, 'index.html'), 'utf8');
const structuredData = (doc) => [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json));
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const text = (fragment) => fragment.replace(/<[^>]+>/g, '').replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity]).replace(/\s+/g, ' ').trim();

// Pages given a direct answer and an FAQ for the 2026-10-20 search brief.
const FAQ_PAGES = ['fuel-cost', 'percentage', 'loan-payoff', 'personal-loan', 'savings-goal', 'square-footage', 'auto-loan', 'sales-tax', 'time-card', 'margin', 'mortgage-points', 'hourly-to-salary', 'tip']
  .map((name) => `${name}-calculator`);

test('every calculator page has WebApplication data and a visible last-updated date that agree', async () => {
  for (const calc of liveCalculators()) {
    const doc = await page(calc);
    const app = structuredData(doc).find((block) => block['@type'] === 'WebApplication');
    assert.ok(app, `${calc.slug}: WebApplication`);
    assert.equal(app['@context'], 'https://schema.org');
    assert.equal(app.name, calc.name);
    assert.equal(app.url, new URL(calc.path, ORIGIN).href);
    assert.equal(app.description, calc.description);
    assert.equal(app.operatingSystem, 'Any');
    assert.ok(['FinanceApplication', 'UtilitiesApplication'].includes(app.applicationCategory));
    assert.equal(app.offers.price, '0');
    assert.equal(app.dateModified, calc.updated);
    assert.match(doc, new RegExp(`Last updated <time datetime="${calc.updated}">`), `${calc.slug}: visible date`);
  }
});

test('sitemap lastmod matches each calculator\'s updated date', async () => {
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  for (const calc of liveCalculators()) {
    assert.match(sitemap, new RegExp(`<loc>${new URL(calc.path, ORIGIN).href}</loc>\\s*<lastmod>${calc.updated}</lastmod>`), calc.slug);
  }
});

test('FAQ pages show every FAQPage question and answer word for word, with a direct answer under the h1', async () => {
  for (const slug of FAQ_PAGES) {
    const doc = await page(findCalculator(slug));
    const faq = structuredData(doc).filter((block) => block['@type'] === 'FAQPage');
    assert.equal(faq.length, 1, slug);
    const questions = faq[0].mainEntity;
    assert.ok(questions.length >= 5 && questions.length <= 7, `${slug}: ${questions.length} questions`);
    const [section] = /<section class="content-section faq"[\s\S]*?<\/section>/.exec(doc) ?? [];
    assert.ok(section, `${slug}: visible FAQ`);
    const visible = [...section.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(([, q, a]) => ({ q: text(q), a: text(a) }));
    assert.deepEqual(visible, questions.map((item) => ({ q: item.name, a: item.acceptedAnswer.text })), slug);
    for (const item of questions) assert.doesNotMatch(item.acceptedAnswer.text, /undefined|NaN|\$-/, slug);
    assert.match(doc, /<\/h1>\s*<p class="callout direct-answer">/, `${slug}: direct answer`);
  }
});

test('example figures in edited titles and descriptions match the rendered page', async () => {
  // Each description quotes a worked example; the page must show the same figure, computed by the engine.
  const expected = {
    'fuel-cost-calculator': ['$42'],
    'percentage-calculator': ['20% of 150 is 30', '25% increase'],
    'loan-payoff-calculator': ['7 years, 4 months sooner', '$89,760.86'],
    'personal-loan-calculator': ['$498.21'],
    'savings-goal-calculator': ['$465.38'],
    'square-footage-calculator': ['168 sq ft'],
    'auto-loan-calculator': ['$635.62'],
    'sales-tax-calculator': ['$15.95', '$235.95'],
    'margin-calculator': ['40% margin', '66.7% markup'],
    'mortgage-points-calculator': ['$3,000.00', '$50.11'],
    'hourly-to-salary-calculator': ['$52,000'],
    'tip-calculator': ['$17.28', '$103.68']
  };
  for (const [slug, figures] of Object.entries(expected)) {
    const body = text(/<main[\s\S]*<\/main>/.exec(await page(findCalculator(slug)))[0]);
    for (const figure of figures) assert.ok(body.includes(figure), `${slug}: ${figure}`);
  }
  assert.match(findCalculator('fuel-cost-calculator').description, /\$42\b/);
  assert.match(findCalculator('loan-payoff-calculator').description, /\$89,761\b/);
});

test('fuel cost page answers the two-car word problem', async () => {
  const body = text(await page(findCalculator('fuel-cost-calculator')));
  for (const figure of ['720 miles', '$122.70', '$81.80', '$40.90']) assert.ok(body.includes(figure), figure);
});

test('llms.txt lists every live calculator with its canonical URL', async () => {
  const llms = await readFile(join(dist, 'llms.txt'), 'utf8');
  assert.match(llms, /^# /);
  for (const calc of liveCalculators()) assert.ok(llms.includes(`[${calc.name}](${new URL(calc.path, ORIGIN).href})`), calc.slug);
});
