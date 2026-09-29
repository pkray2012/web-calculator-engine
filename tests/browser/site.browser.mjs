/**
 * Browser QA for the built site (real Chromium via Playwright).
 * Not part of `npm test` because it needs a browser; run with:
 *   npm run build:dev && npm run test:browser
 * Set QA_SCREENSHOTS=<dir> to save screenshots at each viewport.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

import { createSiteServer } from '../../scripts/serve.js';
import { buildLoanView, parseLoanForm, LOAN_DEFAULTS } from '../../src/adapters/loan-payment.js';
import { runAutoCalculator, AUTO_DEFAULTS } from '../../src/adapters/auto-loan.js';
import { runPersonalCalculator, PERSONAL_DEFAULTS } from '../../src/adapters/personal-loan.js';
import { runCardCalculator, CARD_DEFAULTS } from '../../src/adapters/credit-card-payoff.js';
import { runPointsCalculator, POINTS_DEFAULTS } from '../../src/adapters/mortgage-points.js';
import { runPayoffCalculator, PAYOFF_DEFAULTS } from '../../src/adapters/loan-payoff.js';
import { runRentVsBuyCalculator, RVB_DEFAULTS } from '../../src/adapters/rent-vs-buy.js';
import { runHelocCalculator, HELOC_DEFAULTS } from '../../src/adapters/heloc.js';
import { runTransferCalculator, TRANSFER_DEFAULTS } from '../../src/adapters/balance-transfer.js';
import { runDtiCalculator, DTI_DEFAULTS } from '../../src/adapters/debt-to-income.js';
import { runLeaseCalculator, LEASE_DEFAULTS } from '../../src/adapters/car-lease.js';
import { runSavingsCalculator, SAVINGS_DEFAULTS } from '../../src/adapters/savings-goal.js';
import { runAffordabilityCalculator, AFFORDABILITY_DEFAULTS } from '../../src/adapters/mortgage-affordability.js';
import { runAutoRefiCalculator, AUTO_REFI_DEFAULTS } from '../../src/adapters/auto-loan-refinance.js';
import { runHelCalculator, HEL_DEFAULTS } from '../../src/adapters/home-equity-loan.js';
import { runSlrCalculator, SLR_DEFAULTS } from '../../src/adapters/student-loan-refinance.js';
import { runMortgageCalculator, MORTGAGE_DEFAULTS } from '../../src/adapters/mortgage-payment.js';
import { runRefiCalculator, REFI_DEFAULTS } from '../../src/adapters/mortgage-refinance.js';
import { formatCurrency, formatCurrencyWhole, formatPercent } from '../../src/lib/format.js';

const DIST = new URL('../../dist/', import.meta.url).pathname;
const CALC = '/calculators/loan-payment-calculator/';
const AUTO = '/calculators/auto-loan-calculator/';
const PERSONAL = '/calculators/personal-loan-calculator/';
const CARD = '/calculators/credit-card-payoff-calculator/';
const REFI = '/calculators/mortgage-refinance-calculator/';
const POINTS = '/calculators/mortgage-points-calculator/';
const PAYOFF = '/calculators/loan-payoff-calculator/';
const RVB = '/calculators/rent-vs-buy-calculator/';
const HELOC = '/calculators/heloc-payment-calculator/';
const TRANSFER = '/calculators/balance-transfer-calculator/';
const DTI = '/calculators/debt-to-income-calculator/';
const LEASE = '/calculators/car-lease-calculator/';
const SAVINGS = '/calculators/savings-goal-calculator/';
const AFFORD = '/calculators/home-affordability-calculator/';
const AUTO_REFI = '/calculators/auto-loan-refinance-calculator/';
const HEL = '/calculators/home-equity-loan-calculator/';
const SLR = '/calculators/student-loan-refinance-calculator/';
const MORTGAGE = '/calculators/mortgage-calculator/';
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1280', width: 1280, height: 900 }
];

let server;
let base;
let browser;

test.before(async () => {
  server = createSiteServer(DIST);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
});

test.after(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

async function openPage(path, viewport = VIEWPORTS[2]) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base + path);
  return { page, errors, close: () => context.close() };
}

function expectedPayment(values) {
  return formatCurrency(buildLoanView(parseLoanForm({ ...LOAN_DEFAULTS, ...values }).input).monthlyPayment);
}

async function primaryPayment(page) {
  return (await page.locator('.stat--primary .stat__value').textContent()).trim();
}

for (const viewport of VIEWPORTS) {
  test(`no horizontal overflow and results visible at ${viewport.name}`, async () => {
    for (const path of ['/', CALC, AUTO, PERSONAL, CARD, REFI, POINTS, PAYOFF, MORTGAGE, SLR, HEL, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, TRANSFER, HELOC, RVB, '/about/']) {
      const { page, errors, close } = await openPage(path, viewport);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.equal(overflow, 0, `${path} overflows by ${overflow}px at ${viewport.width}px`);
      if ([CALC, AUTO, PERSONAL, CARD, REFI, POINTS, PAYOFF, MORTGAGE, SLR, HEL, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, TRANSFER, HELOC, RVB].includes(path)) {
        if (![REFI, POINTS, SLR, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, HELOC, RVB].includes(path)) await page.locator('details.disclosure summary').click();
        const openOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.equal(openOverflow, 0, 'monthly schedule overflows the page');
        const firstInput = { [CALC]: '#principal', [AUTO]: '#vehicle-price', [PERSONAL]: '#loan-amount', [CARD]: '#card-balance', [REFI]: '#current-balance', [POINTS]: '#points-loan-amount', [PAYOFF]: '#payoff-balance', [MORTGAGE]: '#home-price', [SLR]: '#slr-balance', [HEL]: '#home-value', [AUTO_REFI]: '#auto-payoff', [AFFORD]: '#afford-income', [SAVINGS]: '#savings-goal', [LEASE]: '#lease-msrp', [DTI]: '#dti-income', [TRANSFER]: '#transfer-balance', [HELOC]: '#heloc-balance', [RVB]: '#rvb-price' }[path];
        const tapTarget = await page.locator(firstInput).boundingBox();
        const header = await page.locator('.site-header').boundingBox();
        assert.ok(header.height <= 130, `header is ${header.height}px tall at ${viewport.width}px`);
        assert.ok(tapTarget.height >= 40, 'inputs must be comfortably tappable');
      }
      if (process.env.QA_SCREENSHOTS) {
        await mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
        const name = `${viewport.name}${path.replaceAll('/', '_') || '_home'}.png`;
        await page.screenshot({ path: join(process.env.QA_SCREENSHOTS, name), fullPage: true });
      }
      assert.deepEqual(errors, []);
      await close();
    }
  });
}

test('example results are pre-rendered and match the engine', async () => {
  const { page, errors, close } = await openPage(CALC);
  assert.equal(await primaryPayment(page), expectedPayment({}));
  assert.equal(await page.locator('#schedule-yearly tbody tr').count(), 5);
  assert.deepEqual(errors, []);
  await close();
});

test('typing new values recalculates without submitting', async () => {
  const { page, errors, close } = await openPage(CALC);
  await page.fill('#principal', '40,000');
  await page.fill('#annual-rate', '6.25');
  await page.fill('#term', '72');
  await page.selectOption('#term-unit', 'months');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), expectedPayment({ principal: '40000', annualRate: '6.25', termValue: '72', termUnit: 'months' }));
  assert.match(page.url(), /principal=40%2C000|principal=40000/);
  assert.deepEqual(errors, []);
  await close();
});

test('extra payment and start month show savings and a payoff date', async () => {
  const { page, close } = await openPage(CALC);
  await page.fill('#extra-monthly', '150');
  await page.fill('#start-month', '2027-01');
  await page.locator('button[type="submit"]').click();
  const callout = await page.locator('.callout').textContent();
  const view = buildLoanView(parseLoanForm({ ...LOAN_DEFAULTS, extraMonthly: '150', startMonth: '2027-01' }).input);
  assert.match(callout, new RegExp(formatCurrency(view.extra.interestSaved).replace('$', '\\$')));
  assert.match(callout, /2031|2030/);
  assert.equal(await page.locator('#extra-table tbody tr').count(), 2);
  assert.match(await page.locator('#calc-announcer').textContent(), /Monthly payment/);
  await close();
});

test('invalid input shows accessible errors, keeps focus usable, and recovers', async () => {
  const { page, close } = await openPage(CALC);
  await page.fill('#principal', '');
  await page.fill('#annual-rate', 'abc');
  await page.locator('button[type="submit"]').click();

  const summary = page.locator('.error-summary');
  await summary.waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('error-summary')), true);
  assert.equal(await page.getAttribute('#principal', 'aria-invalid'), 'true');
  assert.equal((await page.locator('#principal-error').textContent()).trim(), 'Loan amount is required.');
  assert.equal(await page.locator('#calc-results').getAttribute('data-state'), 'stale');

  await summary.locator('a').first().click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'principal');

  await page.fill('#principal', '10000');
  await page.fill('#annual-rate', '5');
  await page.locator('button[type="submit"]').click();
  assert.equal(await page.getAttribute('#principal', 'aria-invalid'), null);
  assert.equal(await page.locator('#principal-error').isHidden(), true);
  assert.equal(await page.locator('.error-summary').count(), 0);
  assert.equal(await page.locator('#calc-results').getAttribute('data-state'), 'current');
  await close();
});

test('a shared URL restores the calculation', async () => {
  const { page, close } = await openPage(`${CALC}?principal=12000&annualRate=0&termValue=12&termUnit=months`);
  assert.equal(await page.inputValue('#principal'), '12000');
  assert.equal(await primaryPayment(page), '$1,000.00');
  await close();
});

test('keyboard users reach the skip link and fields in order', async () => {
  const { page, close } = await openPage(CALC);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
  await page.keyboard.press('Enter');
  const order = [];
  for (let i = 0; i < 12 && order.at(-1) !== 'submit'; i += 1) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.type));
  }
  // A month input takes one Tab per date segment, so collapse repeats.
  const fields = order
    .filter((id) => ['principal', 'annual-rate', 'term', 'term-unit', 'extra-monthly', 'start-month', 'submit'].includes(id))
    .filter((id, index, list) => id !== list[index - 1]);
  assert.deepEqual(fields, ['principal', 'annual-rate', 'term', 'term-unit', 'extra-monthly', 'start-month', 'submit']);

  await page.focus('#principal');
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement.closest('.input')).boxShadow);
  assert.notEqual(ring, 'none', 'focused input needs a visible focus indicator');
  await close();
});

test('unknown URLs return the 404 page', async () => {
  const response = await fetch(`${base}/does-not-exist/`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Page not found/);
});

test('an extreme rate/term shows a field error instead of crashing', async () => {
  const { page, errors, close } = await openPage(CALC);
  await page.fill('#principal', '100000000');
  await page.fill('#annual-rate', '100');
  await page.fill('#term', '600');
  await page.selectOption('#term-unit', 'months');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#annual-rate-error').textContent(), /too extreme/);
  assert.deepEqual(errors, []);
  await close();
});

test('phone users see the updated payment right under the button', async () => {
  const { page, close } = await openPage(CALC, VIEWPORTS[0]);
  assert.equal(await page.locator('#quick-result').isVisible(), true);
  await page.fill('#principal', '18000');
  await page.waitForFunction(() => document.querySelector('#quick-result strong')?.textContent !== '$506.91');
  assert.equal((await page.locator('#quick-result strong').textContent()).trim(), expectedPayment({ principal: '18000' }));
  const desktop = await openPage(CALC, VIEWPORTS[2]);
  assert.equal(await desktop.page.locator('#quick-result').isVisible(), false);
  await desktop.close();
  await close();
});

function expectedAutoPayment(values) {
  return formatCurrency(runAutoCalculator({ ...AUTO_DEFAULTS, ...values }).view.monthlyPayment);
}

test('auto loan: example is pre-rendered and typing updates the payment', async () => {
  const { page, errors, close } = await openPage(AUTO);
  assert.equal(await primaryPayment(page), expectedAutoPayment({}));
  assert.equal(await page.locator('#financed-table tbody tr').count(), 5);
  await page.fill('#vehicle-price', '42,500');
  await page.fill('#apr', '5.9');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), expectedAutoPayment({ vehiclePrice: '42500', annualRate: '5.9' }));
  assert.deepEqual(errors, []);
  await close();
});

test('auto loan: budget mode swaps the price field for a budget and solves the price', async () => {
  const { page, errors, close } = await openPage(AUTO);
  assert.equal(await page.isVisible('#monthly-budget'), false);
  await page.check('#auto-mode-budget');
  assert.equal(await page.isVisible('#vehicle-price'), false);
  await page.fill('#monthly-budget', '450');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  const expected = runAutoCalculator({ ...AUTO_DEFAULTS, mode: 'budget', monthlyBudget: '450' }).view;
  assert.equal(await primaryPayment(page), formatCurrency(expected.monthlyPayment));
  assert.match(await page.locator('#summary-heading ~ .callout').first().textContent(), new RegExp(`about ${formatCurrencyWhole(expected.budget.vehiclePrice).replace('$', '\\$')}`));
  await page.locator('button[type="submit"]').click();
  assert.match(page.url(), /mode=budget/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#auto-mode-budget'), true);
  assert.equal(await page.inputValue('#monthly-budget'), '450');
  assert.deepEqual(errors, []);
  await close();
});

test('auto loan: negative equity shows a warning and a bridge line', async () => {
  const { page, close } = await openPage(AUTO);
  await page.fill('#trade-in-value', '5000');
  await page.fill('#trade-in-payoff', '9000');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('.callout--warning').textContent(), /\$4,000\.00 more on your trade-in/);
  assert.match(await page.locator('#financed-table').textContent(), /Negative equity rolled into the loan/);
  await close();
});

test('auto loan: the tax checkbox changes the result and survives a shared link', async () => {
  const { page, close } = await openPage(AUTO);
  await page.fill('#trade-in-value', '8000');
  await page.locator('button[type="submit"]').click();
  const before = await primaryPayment(page);
  await page.check('#tax-after-trade-in');
  await page.locator('button[type="submit"]').click();
  const after = await primaryPayment(page);
  assert.equal(after, expectedAutoPayment({ tradeInValue: '8000', taxAfterTradeIn: 'on' }));
  assert.notEqual(after, before);
  assert.match(page.url(), /taxAfterTradeIn=on/);

  await page.goto(page.url());
  assert.equal(await page.isChecked('#tax-after-trade-in'), true);
  assert.equal(await primaryPayment(page), after);
  await close();
});

test('auto loan: a down payment covering everything is reported on that field', async () => {
  const { page, close } = await openPage(AUTO);
  await page.fill('#down-payment', '40000');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#down-payment-error').textContent(), /nothing to finance/);
  assert.equal(await page.getAttribute('#down-payment', 'aria-invalid'), 'true');
  await close();
});

test('related calculators link the two loan pages both ways', async () => {
  const { page, close } = await openPage(CALC);
  await page.locator('#related-heading ~ ul a[href="/calculators/auto-loan-calculator/"]').click();
  await page.waitForURL(`**${AUTO}`);
  assert.match(await page.locator('h1').textContent(), /Auto Loan Calculator/);
  assert.equal(await page.locator('#related-heading ~ ul a[href="/calculators/loan-payment-calculator/"]').count(), 1);
  await close();
});

function personalView(values) {
  return runPersonalCalculator({ ...PERSONAL_DEFAULTS, ...values }).view;
}

async function statValue(page, label) {
  return (await page.locator('.stat', { hasText: label }).locator('.stat__value').textContent()).trim();
}

test('personal loan: typing updates payment, cash received and fee-adjusted APR', async () => {
  const { page, errors, close } = await openPage(PERSONAL);
  assert.equal(await primaryPayment(page), formatCurrency(personalView({}).monthlyPayment));
  await page.fill('#loan-amount', '20,000');
  await page.fill('#origination-fee', '8');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  const expected = personalView({ loanAmount: '20000', originationFeeRate: '8' });
  assert.equal(await primaryPayment(page), formatCurrency(expected.monthlyPayment));
  assert.equal(await statValue(page, 'Cash you receive'), '$18,400.00');
  assert.equal(await statValue(page, 'Fee-adjusted APR'), `${Number(expected.fee.effectiveAPR.toFixed(2))}%`);
  assert.deepEqual(errors, []);
  await close();
});

test('personal loan: zero fee makes the APR equal the rate', async () => {
  const { page, close } = await openPage(PERSONAL);
  await page.fill('#origination-fee', '0');
  await page.locator('button[type="submit"]').click();
  assert.equal(await statValue(page, 'Fee-adjusted APR'), '12%');
  assert.match(await page.locator('#flow-heading ~ p.note').textContent(), /equals the interest rate/);
  await close();
});

test('personal loan: an invalid fee is reported on the fee field', async () => {
  const { page, close } = await openPage(PERSONAL);
  await page.fill('#origination-fee', '75');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#origination-fee-error').textContent(), /50 or less/);
  assert.equal(await page.getAttribute('#origination-fee', 'aria-invalid'), 'true');
  await close();
});

test('personal loan: extra payments show the fee note and the URL restores the loan', async () => {
  const { page, close } = await openPage(PERSONAL);
  await page.fill('#extra-monthly', '200');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('#extra-heading').locator('..').textContent(), /fee is not refunded when you pay early/);
  assert.match(page.url(), /extraMonthly=200/);
  const payment = await primaryPayment(page);
  await page.goto(page.url());
  assert.equal(await page.inputValue('#extra-monthly'), '200');
  assert.equal(await primaryPayment(page), payment);
  await close();
});

test('personal loan: related links reach the loan and credit card calculators', async () => {
  const { page, close } = await openPage(PERSONAL);
  const links = page.locator('#related-heading ~ ul a');
  assert.deepEqual(await links.evaluateAll((els) => els.map((el) => el.getAttribute('href'))), [CALC, AUTO, CARD, SLR]);
  await close();
});

function cardView(values) {
  return runCardCalculator({ ...CARD_DEFAULTS, ...values }).view;
}

test('credit card: switching to a debt-free date shows only the target input and solves the payment', async () => {
  const { page, errors, close } = await openPage(CARD);
  assert.equal(await page.isVisible('#monthly-payment'), true);
  assert.equal(await page.isVisible('#target-months'), false);
  await page.check('#mode-target');
  assert.equal(await page.isVisible('#monthly-payment'), false);
  assert.equal(await page.isVisible('#target-months'), true);
  await page.fill('#target-months', '18');
  await page.locator('button[type="submit"]').click();
  assert.equal(await primaryPayment(page), formatCurrency(cardView({ mode: 'target', targetMonths: '18' }).monthlyPayment));
  assert.match(page.url(), /mode=target/);
  assert.equal(await page.locator('#extra-heading').count(), 0);

  await page.goto(page.url());
  assert.equal(await page.isChecked('#mode-target'), true);
  assert.equal(await page.isVisible('#target-months'), true);
  assert.deepEqual(errors, []);
  await close();
});

test('credit card: a payment below the interest is reported on the payment field', async () => {
  const { page, close } = await openPage(CARD);
  await page.fill('#monthly-payment', '100');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#monthly-payment-error').textContent(), /does not cover the monthly interest/);
  assert.equal(await page.getAttribute('#monthly-payment', 'aria-invalid'), 'true');
  await page.locator('.error-summary a').first().click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'monthly-payment');
  await close();
});

test('credit card: typing an extra payment shows the savings', async () => {
  const { page, close } = await openPage(CARD);
  await page.fill('#extra-monthly', '100');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  const expected = cardView({ extraMonthly: '100' });
  assert.match(await page.locator('.callout').textContent(), new RegExp(formatCurrency(expected.extra.interestSaved).replace('$', '\\$')));
  await close();
});

function pointsView(values) {
  return runPointsCalculator({ ...POINTS_DEFAULTS, ...values }).view;
}

test('mortgage points: example is pre-rendered and typing updates the break-even', async () => {
  const { page, errors, close } = await openPage(POINTS);
  assert.equal(await primaryPayment(page), `Month ${pointsView({}).breakEvenMonth} (4 years)`);
  await page.fill('#points-rate', '6.5');
  await page.fill('#points-count', '2');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  const expected = pointsView({ points: '2', pointsRate: '6.5' });
  assert.match(await primaryPayment(page), new RegExp(`^Month ${expected.breakEvenMonth} `));
  assert.equal(await page.locator('#points-horizon').isVisible(), true);
  await page.goto(page.url());
  assert.equal(await page.inputValue('#points-count'), '2');
  assert.deepEqual(errors, []);
  await close();
});

test('mortgage points: a rate with points above the base rate is reported on its field', async () => {
  const { page, close } = await openPage(POINTS);
  await page.fill('#points-rate', '7.5');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#points-rate-error').textContent(), /must not be higher/);
  assert.equal(await page.getAttribute('#points-rate', 'aria-invalid'), 'true');
  await close();
});

function payoffView(values) {
  return runPayoffCalculator({ ...PAYOFF_DEFAULTS, ...values }).view;
}

test('loan payoff: switching to a target shows only the target input and solves the extra', async () => {
  const { page, errors, close } = await openPage(PAYOFF);
  assert.equal(await page.isVisible('#payoff-extra-monthly'), true);
  assert.equal(await page.isVisible('#payoff-target-years'), false);
  await page.check('#payoff-mode-target');
  assert.equal(await page.isVisible('#payoff-extra-monthly'), false);
  await page.fill('#payoff-target-years', '10');
  await page.locator('button[type="submit"]').click();
  const expected = payoffView({ mode: 'target', targetYears: '10' });
  await page.waitForFunction((value) => document.querySelector('#calc-results').textContent.includes(value), formatCurrency(expected.target.extraMonthly));
  assert.match(page.url(), /mode=target/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#payoff-mode-target'), true);
  assert.equal(await page.inputValue('#payoff-target-years'), '10');
  assert.deepEqual(errors, []);
  await close();
});

test('loan payoff: a payment below the interest is reported on the payment field', async () => {
  const { page, close } = await openPage(PAYOFF);
  await page.fill('#payoff-payment', '1000');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#payoff-payment-error').textContent(), /does not cover the monthly interest/);
  assert.equal(await page.getAttribute('#payoff-payment', 'aria-invalid'), 'true');
  await close();
});

function mortgageView(values) {
  return runMortgageCalculator({ ...MORTGAGE_DEFAULTS, ...values }).view;
}

test('mortgage: example is pre-rendered, 20% down removes PMI and dates restore from the URL', async () => {
  const { page, errors, close } = await openPage(MORTGAGE);
  assert.equal(await primaryPayment(page), formatCurrency(mortgageView({}).totalMonthly));
  await page.fill('#down-payment', '20');
  const expected = formatCurrency(mortgageView({ downPaymentValue: '20' }).totalMonthly);
  await page.waitForFunction((value) => document.querySelector('.stat--primary .stat__value').textContent.trim() === value, expected);
  await page.fill('#down-payment', '10');
  await page.fill('#mortgage-start-month', '2026-11');
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => /November 2035/.test(document.querySelector('#calc-results').textContent));
  await page.goto(page.url());
  assert.equal(await page.inputValue('#mortgage-start-month'), '2026-11');
  assert.match(await page.locator('#calc-results').textContent(), /September 2034/);
  assert.deepEqual(errors, []);
  await close();
});

test('mortgage: a down payment of the whole price is reported on its field', async () => {
  const { page, close } = await openPage(MORTGAGE);
  await page.selectOption('#down-payment-unit', 'dollars');
  await page.fill('#down-payment', '400000');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#down-payment-error').textContent(), /less than the home price/);
  assert.equal(await page.getAttribute('#down-payment', 'aria-invalid'), 'true');
  await close();
});

function slrView(values) {
  return runSlrCalculator({ ...SLR_DEFAULTS, ...values }).view;
}

test('student loan refinance: federal warning shows by default and goes away for private loans', async () => {
  const { page, errors, close } = await openPage(SLR);
  assert.equal(await primaryPayment(page), formatCurrency(slrView({}).refinance.payment));
  assert.match(await page.locator('#calc-results').textContent(), /cannot be undone/);
  await page.check('#slr-type-private');
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => !/cannot be undone/.test(document.querySelector('#calc-results').textContent));
  assert.match(page.url(), /loanType=private/);
  await page.fill('#slr-new-term', '20');
  const expected = formatCurrency(slrView({ loanType: 'private', newTermValue: '20' }).refinance.payment);
  await page.waitForFunction((value) => document.querySelector('.stat--primary .stat__value').textContent.trim() === value, expected);
  assert.match(await page.locator('#calc-results').textContent(), /Lower payment, higher total cost/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#slr-type-private'), true);
  assert.deepEqual(errors, []);
  await close();
});

test('student loan refinance: an invalid balance is reported on its field', async () => {
  const { page, close } = await openPage(SLR);
  await page.fill('#slr-balance', '');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#slr-balance-error').textContent(), /required/);
  assert.equal(await page.getAttribute('#slr-balance', 'aria-invalid'), 'true');
  await close();
});

function helView(values) {
  return runHelCalculator({ ...HEL_DEFAULTS, ...values }).view;
}

test('home equity loan: example is pre-rendered and a larger loan shows the CLTV warning', async () => {
  const { page, errors, close } = await openPage(HEL);
  assert.equal(await primaryPayment(page), formatCurrency(helView({}).monthlyPayment));
  await page.fill('#hel-amount', '90000');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(helView({ loanAmount: '90000' }).monthlyPayment));
  assert.match(await page.locator('#limit-heading ~ .callout').textContent(), /caps at 80% would lend at most \$80,000\.00/);
  await page.check('#hel-finance-costs');
  await page.locator('button[type="submit"]').click();
  await page.goto(page.url());
  assert.equal(await page.isChecked('#hel-finance-costs'), true);
  assert.equal(await page.inputValue('#hel-amount'), '90000');
  assert.deepEqual(errors, []);
  await close();
});

test('home equity loan: closing costs larger than a deducted loan are reported on their field', async () => {
  const { page, close } = await openPage(HEL);
  await page.fill('#hel-closing-costs', '60000');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#hel-closing-costs-error').textContent(), /less than the loan amount/);
  assert.equal(await page.getAttribute('#hel-closing-costs', 'aria-invalid'), 'true');
  await close();
});

function autoRefiView(values) {
  return runAutoRefiCalculator({ ...AUTO_REFI_DEFAULTS, ...values }).view;
}

test('auto refinance: example is pre-rendered and a longer term shows the ahead-only warning', async () => {
  const { page, errors, close } = await openPage(AUTO_REFI);
  assert.equal(await primaryPayment(page), formatCurrency(autoRefiView({}).refinance.payment));
  await page.fill('#auto-new-term', '72');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(autoRefiView({ newTermValue: '72' }).refinance.payment));
  assert.match(await page.locator('.callout').first().textContent(), /Ahead only for a while/);
  await page.check('#auto-finance-costs');
  await page.locator('button[type="submit"]').click();
  assert.match(page.url(), /financeCosts=on/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#auto-finance-costs'), true);
  assert.equal(await page.inputValue('#auto-new-term'), '72');
  assert.deepEqual(errors, []);
  await close();
});

test('auto refinance: an invalid payoff amount is reported on its field', async () => {
  const { page, close } = await openPage(AUTO_REFI);
  await page.fill('#auto-payoff', '0');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#auto-payoff-error').textContent(), /greater than 0/);
  assert.equal(await page.getAttribute('#auto-payoff', 'aria-invalid'), 'true');
  await close();
});

function affordView(values) {
  return runAffordabilityCalculator({ ...AFFORDABILITY_DEFAULTS, ...values }).view;
}

test('home affordability: example is pre-rendered and higher debts switch the binding limit', async () => {
  const { page, errors, close } = await openPage(AFFORD);
  assert.equal(await primaryPayment(page), formatCurrencyWhole(affordView({}).maxHomePrice));
  assert.match(await page.locator('#summary-heading ~ .callout').textContent(), /housing limit sets the budget/);
  await page.fill('#afford-debts', '1200');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrencyWhole(affordView({ monthlyDebt: '1200' }).maxHomePrice));
  assert.match(await page.locator('#summary-heading ~ .callout').textContent(), /total debt limit sets the budget/);
  await page.locator('button[type="submit"]').click();
  await page.goto(page.url());
  assert.equal(await page.inputValue('#afford-debts'), '1200');
  assert.deepEqual(errors, []);
  await close();
});

test('home affordability: limits with no room show a message, and a bad income is reported on its field', async () => {
  const { page, close } = await openPage(AFFORD);
  await page.fill('#afford-debts', '3000');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.match(await page.locator('#calc-results-body').textContent(), /leave no room for a mortgage payment/);
  await page.fill('#afford-income', '0');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#afford-income-error').textContent(), /greater than 0/);
  assert.equal(await page.getAttribute('#afford-income', 'aria-invalid'), 'true');
  await close();
});

function savingsView(values) {
  return runSavingsCalculator({ ...SAVINGS_DEFAULTS, ...values }).view;
}

test('savings goal: example is pre-rendered and the goal and plan switches change the inputs', async () => {
  const { page, errors, close } = await openPage(SAVINGS);
  assert.equal(await primaryPayment(page), formatCurrency(savingsView({}).monthlyContribution));
  assert.equal(await page.isVisible('#savings-expenses'), false);
  await page.check('#savings-type-emergency');
  assert.equal(await page.isVisible('#savings-goal'), false);
  await page.fill('#savings-expenses', '4000');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(savingsView({ goalType: 'emergency', monthlyExpenses: '4000' }).monthlyContribution));
  await page.check('#savings-plan-deposit');
  assert.equal(await page.isVisible('#savings-time'), false);
  await page.fill('#savings-deposit', '600');
  await page.locator('button[type="submit"]').click();
  assert.match(page.url(), /plan=deposit/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#savings-type-emergency'), true);
  assert.equal(await page.inputValue('#savings-deposit'), '600');
  assert.match(await page.locator('.stat--primary .stat__label').textContent(), /Time to reach your goal/);
  assert.deepEqual(errors, []);
  await close();
});

test('savings goal: a deposit too small to finish is reported on its field', async () => {
  const { page, close } = await openPage(SAVINGS);
  await page.check('#savings-plan-deposit');
  await page.fill('#savings-deposit', '1');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#savings-deposit-error').textContent(), /more than 50 years/);
  assert.equal(await page.getAttribute('#savings-deposit', 'aria-invalid'), 'true');
  await close();
});

function leaseView(values) {
  return runLeaseCalculator({ ...LEASE_DEFAULTS, ...values }).view;
}

test('car lease: example is pre-rendered and a higher rate updates the payment and verdict', async () => {
  const { page, errors, close } = await openPage(LEASE);
  assert.equal(await primaryPayment(page), formatCurrency(leaseView({}).lease.payment));
  await page.fill('#lease-apr', '9');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(leaseView({ leaseApr: '9' }).lease.payment));
  assert.match(await page.locator('#compare-heading ~ .callout').textContent(), /buying costs about/);
  await page.locator('button[type="submit"]').click();
  await page.goto(page.url());
  assert.equal(await page.inputValue('#lease-apr'), '9');
  assert.deepEqual(errors, []);
  await close();
});

test('car lease: a loan shorter than the lease is reported on its field', async () => {
  const { page, close } = await openPage(LEASE);
  await page.fill('#lease-loan-months', '24');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#lease-loan-months-error').textContent(), /at least as long as the lease/);
  await close();
});

function dtiView(values) {
  return runDtiCalculator({ ...DTI_DEFAULTS, ...values }).view;
}

test('debt-to-income: example is pre-rendered and switching to monthly income updates the ratio', async () => {
  const { page, errors, close } = await openPage(DTI);
  assert.equal(await primaryPayment(page), formatPercent(dtiView({}).backEndPercent, 1));
  assert.equal(await primaryPayment(page), '43.2%');
  assert.match(await page.locator('#summary-heading ~ .callout').textContent(), /above your 36% target/);
  await page.fill('#dti-income', '9000');
  await page.check('#dti-income-month');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatPercent(dtiView({ incomeValue: '9000', incomeUnit: 'month' }).backEndPercent, 1));
  assert.match(await page.locator('#summary-heading ~ .callout').textContent(), /within your 36% target/);
  await page.locator('button[type="submit"]').click();
  await page.goto(page.url());
  assert.equal(await page.isChecked('#dti-income-month'), true);
  assert.deepEqual(errors, []);
  await close();
});

test('debt-to-income: a missing income is reported on its field', async () => {
  const { page, close } = await openPage(DTI);
  await page.fill('#dti-income', '');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#dti-income-error').textContent(), /required/);
  assert.equal(await page.getAttribute('#dti-income', 'aria-invalid'), 'true');
  await close();
});

function transferView(values) {
  return runTransferCalculator({ ...TRANSFER_DEFAULTS, ...values }).view;
}

test('balance transfer: example is pre-rendered and typing updates the verdict', async () => {
  const { page, errors, close } = await openPage(TRANSFER);
  assert.equal(await primaryPayment(page), `Saves ${formatCurrency(transferView({}).netSavings)}`);
  await page.fill('#transfer-payment', '400');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), `Saves ${formatCurrency(transferView({ monthlyPayment: '400' }).netSavings)}`);
  await page.locator('details.disclosure summary').click();
  assert.equal(await page.locator('#transfer-schedule').isVisible(), true);
  assert.deepEqual(errors, []);
  await close();
});

test('balance transfer: a payment below the post-intro interest is reported on the payment field', async () => {
  const { page, close } = await openPage(TRANSFER);
  await page.fill('#transfer-payment', '100');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#transfer-payment-error').textContent(), /higher monthly payment/);
  assert.equal(await page.getAttribute('#transfer-payment', 'aria-invalid'), 'true');
  await close();
});

function helocView(values) {
  return runHelocCalculator({ ...HELOC_DEFAULTS, ...values }).view;
}

test('HELOC: example is pre-rendered and typing updates the repayment payment and shock', async () => {
  const { page, errors, close } = await openPage(HELOC);
  assert.equal(await primaryPayment(page), formatCurrency(helocView({}).repaymentPayment));
  assert.match(await page.locator('.callout--warning').textContent(), /rises by \$79\.74/);
  await page.fill('#heloc-rate', '9.5');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(helocView({ rate: '9.5' }).repaymentPayment));
  assert.equal(await page.locator('#rate-scenarios tbody tr').count(), 4);
  assert.equal(await page.locator('#heloc-yearly tbody tr').count(), 30);
  assert.deepEqual(errors, []);
  await close();
});

test('HELOC: principal-and-interest draw removes the payment jump and survives a shared link', async () => {
  const { page, close } = await openPage(HELOC);
  await page.check('#draw-payment-pi');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('.result-block .callout').first().textContent(), /payment stays the same/);
  assert.match(page.url(), /drawPayment=principalAndInterest/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#draw-payment-pi'), true);
  assert.equal(await primaryPayment(page), formatCurrency(helocView({ drawPayment: 'principalAndInterest' }).repaymentPayment));
  await close();
});

test('HELOC: an invalid balance is reported on its field', async () => {
  const { page, close } = await openPage(HELOC);
  await page.fill('#heloc-balance', '0');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#heloc-balance-error').textContent(), /greater than 0/);
  assert.equal(await page.getAttribute('#heloc-balance', 'aria-invalid'), 'true');
  await close();
});

function rvbView(values) {
  return runRentVsBuyCalculator({ ...RVB_DEFAULTS, ...values }).view;
}

test('rent vs buy: example is pre-rendered and a longer stay flips the verdict', async () => {
  const { page, errors, close } = await openPage(RVB);
  assert.equal(await primaryPayment(page), 'Renting comes out ahead');
  await page.fill('#rvb-years', '20');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), 'Buying comes out ahead');
  assert.equal(rvbView({ years: '20' }).breakevenYear, 13);
  assert.match(await page.locator('#calc-results-body').textContent(), /Year 13/);
  assert.equal(await page.locator('#rvb-years tbody tr').count(), 20);
  await page.locator('button[type="submit"]').click();
  await page.goto(page.url());
  assert.equal(await page.inputValue('#rvb-years'), '20');
  assert.deepEqual(errors, []);
  await close();
});

test('rent vs buy: a missing rent is reported on its field', async () => {
  const { page, close } = await openPage(RVB);
  await page.fill('#rvb-rent', '');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#rvb-rent-error').textContent(), /required/);
  assert.equal(await page.getAttribute('#rvb-rent', 'aria-invalid'), 'true');
  await close();
});

test('home page lists every live calculator by category', async () => {
  const { page, close } = await openPage('/');
  const links = await page.locator('#calculators .card__link').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  assert.deepEqual(links.sort(), [AUTO, CARD, CALC, PERSONAL, REFI, POINTS, PAYOFF, MORTGAGE, SLR, HEL, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, TRANSFER, HELOC, RVB].sort());
  assert.deepEqual(await page.locator('#calculators h3').allTextContents(), ['Loans', 'Debt and credit', 'Savings']);
  await close();
});

test('the production CSP is enforced: injected inline scripts do not run', async () => {
  const { page, errors, close } = await openPage(CALC);
  const executed = await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__injected = true;';
    document.body.append(script);
    return window.__injected === true;
  });
  assert.equal(executed, false);
  assert.ok(errors.some((message) => /Content Security Policy/.test(message)));
  await close();
});

const AXE_SOURCE = new URL('../../node_modules/axe-core/axe.min.js', import.meta.url).pathname;

async function axeViolations(path, viewport, prepare = async () => {}) {
  // axe is injected as an inline script, so this context bypasses the CSP.
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, bypassCSP: true });
  const page = await context.newPage();
  await page.goto(base + path);
  await prepare(page);
  await page.addScriptTag({ path: AXE_SOURCE });
  const result = await page.evaluate(() => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
  }));
  await context.close();
  return result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
}

for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
  test(`axe finds no WCAG 2.1 A/AA violations on any page at ${viewport.name}`, async () => {
    for (const path of ['/', CALC, AUTO, PERSONAL, CARD, REFI, POINTS, PAYOFF, MORTGAGE, SLR, HEL, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, TRANSFER, HELOC, RVB, '/about/', '/404.html']) {
      assert.deepEqual(await axeViolations(path, viewport), [], path);
    }
  });
}

test('axe finds no violations in error and alternate states', async () => {
  const states = [
    [CALC, async (page) => { await page.fill('#principal', ''); await page.locator('button[type="submit"]').click(); await page.locator('.error-summary').waitFor(); }],
    [CARD, async (page) => { await page.check('#mode-target'); await page.locator('button[type="submit"]').click(); }],
    [AUTO, async (page) => { await page.fill('#trade-in-payoff', '9000'); await page.fill('#trade-in-value', '5000'); await page.locator('button[type="submit"]').click(); }],
    [PERSONAL, async (page) => { await page.fill('#extra-monthly', '200'); await page.locator('details.disclosure summary').click(); }],
    [REFI, async (page) => { await page.check('#finance-closing-costs'); await page.fill('#current-rate', '6.5'); await page.locator('button[type="submit"]').click(); }],
    [POINTS, async (page) => { await page.fill('#points-rate', '7.5'); await page.locator('button[type="submit"]').click(); await page.locator('.error-summary').waitFor(); }],
    [PAYOFF, async (page) => { await page.check('#payoff-mode-target'); await page.fill('#payoff-lump-sum', '5000'); await page.locator('button[type="submit"]').click(); }],
    [MORTGAGE, async (page) => { await page.fill('#pmi-rate', ''); await page.locator('button[type="submit"]').click(); }],
    [SLR, async (page) => { await page.fill('#slr-new-term', '20'); await page.locator('button[type="submit"]').click(); }],
    [HEL, async (page) => { await page.fill('#hel-amount', '150000'); await page.check('#hel-finance-costs'); await page.locator('button[type="submit"]').click(); }],
    [AUTO_REFI, async (page) => { await page.check('#auto-finance-costs'); await page.fill('#auto-new-term', '72'); await page.locator('button[type="submit"]').click(); }],
    [AFFORD, async (page) => { await page.fill('#afford-debts', '1200'); await page.fill('#afford-rate', '7'); await page.locator('button[type="submit"]').click(); }],
    [AUTO, async (page) => { await page.check('#auto-mode-budget'); await page.fill('#monthly-budget', '450'); await page.locator('button[type="submit"]').click(); }],
    [SAVINGS, async (page) => { await page.check('#savings-type-emergency'); await page.check('#savings-plan-deposit'); await page.locator('button[type="submit"]').click(); }],
    [LEASE, async (page) => { await page.fill('#lease-loan-months', '24'); await page.locator('button[type="submit"]').click(); await page.locator('.error-summary').waitFor(); }],
    [DTI, async (page) => { await page.fill('#dti-income', '9000'); await page.check('#dti-income-month'); await page.locator('button[type="submit"]').click(); }],
    [TRANSFER, async (page) => { await page.fill('#transfer-payment', '100'); await page.locator('button[type="submit"]').click(); await page.locator('.error-summary').waitFor(); }],
    [HELOC, async (page) => { await page.check('#draw-payment-pi'); await page.locator('button[type="submit"]').click(); }],
    [RVB, async (page) => { await page.fill('#rvb-years', '20'); await page.fill('#rvb-rent', ''); await page.locator('button[type="submit"]').click(); await page.locator('.error-summary').waitFor(); }]
  ];
  for (const [path, prepare] of states) {
    assert.deepEqual(await axeViolations(path, VIEWPORTS[2], prepare), [], path);
  }
});

function refiView(values) {
  return runRefiCalculator({ ...REFI_DEFAULTS, ...values }).view;
}

test('refinance: example is pre-rendered and typing updates the new payment', async () => {
  const { page, errors, close } = await openPage(REFI);
  assert.equal(await primaryPayment(page), formatCurrency(refiView({}).refinance.payment));
  await page.fill('#new-rate', '5.5');
  await page.waitForFunction(() => document.querySelector('#calc-results').dataset.state === 'current');
  assert.equal(await primaryPayment(page), formatCurrency(refiView({ newRate: '5.5' }).refinance.payment));
  assert.ok(await page.locator('#horizon-table tbody tr').count() >= 8);
  assert.deepEqual(errors, []);
  await close();
});

test('refinance: a term reset with financed costs shows the never-ahead warning and survives a shared link', async () => {
  const { page, close } = await openPage(REFI);
  await page.fill('#current-balance', '300000');
  await page.fill('#current-rate', '6.5');
  await page.fill('#current-term', '25');
  await page.fill('#closing-costs', '8000');
  await page.check('#finance-closing-costs');
  await page.locator('button[type="submit"]').click();
  assert.match(await page.locator('.callout--warning').textContent(), /never comes out ahead/);
  assert.equal(await page.locator('.stat', { hasText: 'True break-even' }).locator('.stat__value').textContent(), 'Never ahead within the loan terms');
  assert.match(page.url(), /financeClosingCosts=on/);
  await page.goto(page.url());
  assert.equal(await page.isChecked('#finance-closing-costs'), true);
  assert.match(await page.locator('.callout--warning').textContent(), /never comes out ahead/);
  await close();
});

test('refinance: invalid rate is reported on its field', async () => {
  const { page, close } = await openPage(REFI);
  await page.fill('#new-rate', '45');
  await page.locator('button[type="submit"]').click();
  await page.locator('.error-summary').waitFor();
  assert.match(await page.locator('#new-rate-error').textContent(), /30 or less/);
  assert.equal(await page.getAttribute('#new-rate', 'aria-invalid'), 'true');
  await close();
});

test('refinance and loan payment link to each other', async () => {
  const { page, close } = await openPage(REFI);
  assert.deepEqual(await page.locator('#related-heading ~ ul a').evaluateAll((els) => els.map((el) => el.getAttribute('href'))), [MORTGAGE, POINTS, CALC, HELOC, HEL]);
  await page.goto(base + CALC);
  assert.equal(await page.locator(`#related-heading ~ ul a[href="${REFI}"]`).count(), 1);
  await close();
});

test('pages load without layout shift, and the preloaded modules are the ones the page runs', async () => {
  for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
    for (const path of ['/', CALC, AUTO, PERSONAL, CARD, REFI, POINTS, PAYOFF, MORTGAGE, SLR, HEL, AUTO_REFI, AFFORD, SAVINGS, LEASE, DTI, TRANSFER, HELOC, RVB]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const cls = await page.evaluate(() => window.__cls);
      assert.ok(cls < 0.02, `${path} at ${viewport.name}: cumulative layout shift ${cls}`);
      if (path !== '/') {
        const loaded = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.js')).map((e) => new URL(e.name).pathname));
        const preloaded = await page.locator('link[rel="modulepreload"]').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
        for (const href of preloaded) assert.ok(loaded.includes(href), `${path} preloads ${href} but never loads it`);
        assert.equal(new Set(loaded).size, loaded.length, `${path} downloads a module twice`);
      }
      await context.close();
    }
  }
});
