/**
 * Home Energy Batch 1 against the revision 6.2 reference vectors
 * (fixtures/batch1_vectors_r6.json, from batch1_reference_r6.py).
 *
 * Each vector goes through the page's adapter exactly as typed form text, so
 * parsing, limits, cross-field rules and the engine are all exercised. A
 * reference result must be reproduced within the per-unit tolerances (money
 * 0.005, everything else 1e-9) with identical display text; a reference
 * error must be a field error on the matching field.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { plainDecimal } from '../../../src/lib/energy/format.js';
import { runUtilityCalculator } from '../../../src/adapters/energy/utility-cost.js';
import { runPpwCalculator } from '../../../src/adapters/energy/solar-price-per-watt.js';
import { runBillCalculator } from '../../../src/adapters/energy/electric-bill.js';
import { runPaybackCalculator } from '../../../src/adapters/energy/solar-payback.js';
import { formatCurrency } from '../../../src/lib/format.js';
import { runEvTimeCalculator, runBatteryCalculator } from '../../../src/adapters/energy/charging-time.js';
import { runEvCostCalculator } from '../../../src/adapters/energy/ev-charging-cost.js';
import { runFinancingCalculator } from '../../../src/adapters/energy/solar-financing.js';
import { scheduleInvariantFailures } from '../../../src/calculators/energy/solar-financing.js';
import { calculateLoan } from '../../../src/calculators/loan-payment.js';

const FIGURE_TYPES = { epa_kwh_per_100mi: 'epa', dashboard_mi_per_kwh: 'dashboard' };

const CHARGE_FIELDS = { start_soc: 'startLevel', target_soc: 'targetLevel', vehicle_max_ac: 'vehicleMax' };
const chargeValues = ({ capacity, s0, s1, power, basis, efficiency, vehicle_max_ac: vehicleMax }) => ({
  capacity: text(capacity), startLevel: text(s0), targetLevel: text(s1), power: text(power), basis, efficiency: text(efficiency), vehicleMax: text(vehicleMax)
});

const VECTORS = JSON.parse(readFileSync(new URL('./fixtures/batch1_vectors_r6.json', import.meta.url), 'utf8'));

/** Form text for a reference input: numbers as plain decimals (never exponent notation), strings as typed. */
export const text = (value) => (value === null || value === undefined ? '' : typeof value === 'number' ? plainDecimal(value) : String(value));

const MONEY = 0.005;
const EXACT = 1e-9;
/** Money is compared absolutely (half a cent); other units relative to their size. */
const close = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: ${actual} is not finite`);
  const allowed = tolerance === MONEY ? MONEY : EXACT * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= allowed, `${label}: ${actual} vs ${expected}`);
};

/**
 * Per reference function: how to build form values, the reference-to-form
 * field names for errors, and how to check a result.
 */
const RUNNERS = {
  utility_cost: {
    run: (input) => runUtilityCalculator(Object.fromEntries(Object.entries(input).map(([key, value]) => [key, text(value)]))),
    fields: {},
    check(view, expected, name) {
      close(view.result.monthly, expected.monthly, MONEY, `${name} monthly`);
      close(view.result.twelveTimesMonthly, expected.annual, MONEY, `${name} 12 × monthly`);
      if (expected.shares === null) {
        assert.equal(view.shares, null, `${name} shares`);
        assert.equal(view.message, 'Enter at least one amount.');
        return;
      }
      assert.deepEqual(view.shares.map((row) => row.category).sort(), Object.keys(expected.shares).sort(), `${name} share categories`);
      for (const row of view.shares) {
        close(row.share, expected.shares[row.category], EXACT, `${name} ${row.category} share`);
        assert.equal(row.shareText, expected.shares_display[row.category], `${name} ${row.category} share text`);
      }
      assert.equal(view.sharesNote, expected.shares_note, `${name} shares note`);
    }
  },
  price_per_watt: {
    run: ({ price, size, unit = 'kW', incentives }) => runPpwCalculator({ price: text(price), size: text(size), unit, incentives: text(incentives) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.watts, expected.watts, EXACT, `${name} watts`);
      close(view.result.grossPerWatt, expected.gross_per_w, EXACT, `${name} gross`);
      close(view.result.netPerWatt, expected.net_per_w, EXACT, `${name} net`);
      assert.equal(view.gross, expected.display.gross, `${name} gross text`);
      assert.equal(view.net, expected.display.net, `${name} net text`);
    }
  },
  electric_bill: {
    run: ({ kwh, rate, fixed = 0, days = 30 }) => runBillCalculator({ kwh: text(kwh), rate: text(rate), fixed: text(fixed), days: text(days) }),
    fields: {},
    check(view, expected, name) {
      close(view.result.bill, expected.bill, MONEY, `${name} bill`);
      close(view.result.daily, expected.daily, MONEY, `${name} daily`);
      close(view.result.twelveTimesBill, expected.annual_repetition, MONEY, `${name} 12 × bill`);
      if (expected.avg_cents_per_kwh === null) assert.equal(view.result.averageCentsPerKwh, null, `${name} average`);
      else close(view.result.averageCentsPerKwh, expected.avg_cents_per_kwh, EXACT, `${name} average`);
      assert.equal(view.result.highRate, expected.rate_note, `${name} rate note`);
    }
  },
  simple_payback: {
    run: ({ cost, savings, incentives, maintenance = 0 }) => runPaybackCalculator({ cost: text(cost), savings: text(savings), incentives: text(incentives), maintenance: text(maintenance) }),
    fields: {},
    check(view, expected, name) {
      const outcome = { payback: 'payback', 'recovered at installation': 'recovered' }[expected.result] ?? 'undefined';
      assert.equal(view.result.outcome, outcome, `${name} outcome`);
      if (expected.years === null) assert.equal(view.result.years, null, `${name} years`);
      else close(view.result.years, expected.years, EXACT, `${name} years`);
      assert.equal(view.display, expected.display, `${name} display`);
      assert.equal(view.note, expected.note ?? null, `${name} note`);
      close(view.netCost, expected.net_cost, MONEY, `${name} net cost`);
      close(view.netSavings, expected.net_savings, MONEY, `${name} net savings`);
      assert.equal(formatCurrency(view.netCost), expected.net_cost_display, `${name} net cost text`);
      assert.equal(formatCurrency(view.netSavings), expected.net_savings_display, `${name} net savings text`);
    }
  },
  charge_time: {
    run: (input) => {
      const values = chargeValues(input);
      const ev = runEvTimeCalculator(values);
      // The solar battery page has no vehicle maximum; without one it must agree with the EV page.
      if (input.vehicle_max_ac === undefined) assert.deepEqual(runBatteryCalculator(values), ev);
      return ev;
    },
    fields: CHARGE_FIELDS,
    check(view, expected, name) {
      close(view.result.energyKwh, expected.energy_kwh, EXACT, `${name} energy`);
      close(view.result.effectivePowerKw, expected.effective_power, EXACT, `${name} power`);
      close(view.result.hours, expected.hours, EXACT, `${name} hours`);
      if (expected.source_kwh === null) assert.equal(view.result.sourceKwh, null, `${name} source kWh`);
      else close(view.result.sourceKwh, expected.source_kwh, EXACT, `${name} source kWh`);
      assert.equal(view.result.vehicleCapIgnored, expected.vehicle_cap_ignored, `${name} cap ignored`);
      assert.equal(view.message, expected.note === 'nothing to charge' ? 'Nothing to charge.' : null, `${name} message`);
      assert.equal(view.energyText, expected.display.energy, `${name} energy text`);
      assert.equal(view.timeText, expected.display.time, `${name} time text`);
      assert.deepEqual(view.notes, expected.display.notes, `${name} notes`);
    }
  },
  ev_charging_cost: {
    run: ({ capacity, s0, s1, efficiency, rate, figure_type: type, figure, miles_per_month: miles }) => runEvCostCalculator({
      capacity: text(capacity), startLevel: text(s0), targetLevel: text(s1), efficiency: text(efficiency), rate: text(rate),
      figureType: type ? FIGURE_TYPES[type] : '', figure: text(figure), milesPerMonth: text(miles)
    }),
    fields: { ...CHARGE_FIELDS, figure_type: 'figureType', miles_per_month: 'milesPerMonth' },
    check(view, expected, name) {
      close(view.result.batteryKwh, expected.battery_kwh, EXACT, `${name} battery kWh`);
      close(view.result.meteredKwh, expected.metered_kwh, EXACT, `${name} metered kWh`);
      close(view.result.costPerCharge, expected.cost_per_charge, MONEY, `${name} per charge`);
      assert.equal(view.result.highRate, expected.rate_note, `${name} rate note`);
      assert.deepEqual(view.notes, expected.notes, `${name} notes`);
      if (!('cost_per_mile' in expected)) {
        assert.equal(view.result.perMile, null, `${name} per mile`);
        return;
      }
      close(view.result.perMile.costPerMile, expected.cost_per_mile, EXACT, `${name} per mile`);
      close(view.result.perMile.costPer100Miles, expected.cost_per_100mi, EXACT, `${name} per 100 mi`);
      assert.equal(view.perMileText, expected.per_mile_display, `${name} per mile text`);
      if ('monthly' in expected) close(view.result.perMile.monthly, expected.monthly, MONEY, `${name} monthly`);
      else assert.equal(view.result.perMile.monthly, null, `${name} monthly`);
    }
  },
  solar_financing: {
    run: ({ price, down, purchase_rebates: purchaseRebates, later_rebates: laterRebates, rate, term_months: term = 120, term_unit: termUnit = 'months', fees }) => runFinancingCalculator({
      price: text(price), down: text(down), purchaseRebates: text(purchaseRebates), laterRebates: text(laterRebates),
      rate: text(rate), term: text(term), termUnit, fees: text(fees)
    }),
    fields: { purchase_rebates: 'purchaseRebates', later_rebates: 'laterRebates' },
    check(view, expected, name) {
      const { result } = view;
      assert.equal(result.noLoanNeeded, expected.no_loan_needed, `${name} no loan`);
      close(result.loan, expected.loan, MONEY, `${name} loan`);
      if (expected.payment === null) assert.equal(result.payment, null, `${name} payment`);
      else close(result.payment, expected.payment, EXACT, `${name} payment`);
      close(result.totalOfPayments, expected.total_of_payments, MONEY, `${name} total of payments`);
      close(result.interest, expected.interest_outlay, MONEY, `${name} interest`);
      if (expected.interest_outlay === 0) assert.equal(result.interest, 0, `${name} interest is exactly 0 (R02)`);
      close(result.financingOutlay, expected.financing_outlay, MONEY, `${name} financing outlay`);
      close(result.netInstalledPrice, expected.net_installed_price, MONEY, `${name} net installed`);
      close(result.netCostAfterLaterRebates, expected.net_cost_after_later_rebates, MONEY, `${name} after later rebates`);
      if ('payments' in expected) assert.equal(result.payments, expected.payments, `${name} payments`);
    }
  }
};

test('the invariants reject the live loan engine\'s failures outside the B1-1 domain (LD1–LD3)', () => {
  const lifted = JSON.parse(readFileSync(new URL('./fixtures/batch1_lifted_domain_r6.json', import.meta.url), 'utf8'));
  assert.equal(lifted.length, 3);
  for (const { name, input: [loan, annualRate, termMonths], output } of lifted) {
    const result = calculateLoan({ principal: loan, annualRate, termMonths });
    assert.equal(result.schedule.length, output.rows, `${name} rows`);
    const fails = scheduleInvariantFailures({ loan, payment: result.monthlyPayment, termMonths, schedule: result.schedule });
    assert.deepEqual(fails, output.fails, name);
  }
});

for (const fn of Object.keys(RUNNERS)) {
  const vectors = VECTORS.filter((vector) => vector.fn === fn);
  test(`${fn}: ${vectors.length} reference vectors`, () => {
    assert.ok(vectors.length > 0);
    const runner = RUNNERS[fn];
    for (const vector of vectors) {
      const outcome = runner.run(vector.input);
      if (vector.error_field) {
        assert.equal(outcome.ok, false, `${vector.name}: expected a field error on ${vector.error_field}, got a result`);
        const field = runner.fields[vector.error_field] ?? vector.error_field;
        assert.ok(field in outcome.errors, `${vector.name}: expected an error on ${field}, got ${JSON.stringify(outcome.errors)}`);
      } else {
        assert.equal(outcome.ok, true, `${vector.name}: expected a result, got ${JSON.stringify(outcome.errors)}`);
        runner.check(outcome.view, vector.output, vector.name);
      }
    }
  });
}
