import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateSelfEmploymentTax } from '../src/calculators/self-employment-tax.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Independent reference following the Schedule SE and Form 8959 lines, written without the engine.
const BASE = { 2025: 176100, 2026: 184500 };
const THRESHOLD = { single: 200000, headOfHousehold: 200000, qualifyingSurvivingSpouse: 200000, marriedJointly: 250000, marriedSeparately: 125000 };
function reference({ taxYear, netProfit, socialSecurityWages, medicareWages, filingStatus }) {
  const line4a = netProfit > 0 ? netProfit * 0.9235 : 0;
  const line6 = line4a < 400 ? 0 : line4a;
  const line9 = Math.max(0, BASE[taxYear] - socialSecurityWages);
  const line10 = Math.min(line6, line9) * 0.124;
  const line11 = line6 * 0.029;
  const seTax = line10 + line11;
  const form8959Line11 = Math.max(0, THRESHOLD[filingStatus] - medicareWages);
  const additional = Math.max(0, line6 - form8959Line11) * 0.009;
  return { seTax, deduction: seTax / 2, additional };
}

test('hand-checked: $80,000 profit, no W-2 wages, 2026', () => {
  const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 80000 });
  close(r.netEarnings, 73880);
  close(r.socialSecurityTax, 9161.12);
  close(r.medicareTax, 2142.52);
  close(r.selfEmploymentTax, 11303.64);
  close(r.deductibleHalf, 5651.82);
  close(r.additionalMedicareTax, 0);
  assert.equal(r.socialSecurityCapped, false);
});

test('hand-checked: $150,000 profit plus $100,000 W-2 wages, single, 2026', () => {
  const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 150000, socialSecurityWages: 100000, medicareWages: 100000 });
  close(r.netEarnings, 138525);
  close(r.wageBaseLeft, 84500);
  close(r.socialSecurityTax, 10478);
  close(r.medicareTax, 4017.225);
  close(r.selfEmploymentTax, 14495.225);
  close(r.additionalMedicareTax, 346.725);
  assert.equal(r.socialSecurityCapped, true);
});

test('hand-checked: $250,000 profit, single, 2026: Social Security capped at the wage base', () => {
  const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 250000 });
  close(r.socialSecurityTax, 184500 * 0.124);
  close(r.medicareTax, 6695.375);
  close(r.additionalMedicareTax, 277.875);
});

test('the tax year selects the wage base', () => {
  const r2025 = calculateSelfEmploymentTax({ taxYear: 2025, netProfit: 250000 });
  const r2026 = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 250000 });
  close(r2025.socialSecurityTax, 176100 * 0.124);
  close(r2026.socialSecurityTax - r2025.socialSecurityTax, (184500 - 176100) * 0.124);
});

test('net earnings under $400 owe no SE tax; $400 exactly does', () => {
  const under = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 433 }); // 399.88
  assert.equal(under.belowMinimum, true);
  assert.equal(under.selfEmploymentTax, 0);
  const at = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 400 / 0.9235 });
  assert.equal(at.belowMinimum, false);
  close(at.selfEmploymentTax, 400 * 0.153);
});

test('a loss or zero profit owes nothing', () => {
  for (const netProfit of [0, -5000]) {
    const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit });
    assert.equal(r.selfEmploymentTax, 0);
    assert.equal(r.additionalMedicareTax, 0);
    assert.equal(r.effectiveRateOnProfit, 0);
  }
});

test('W-2 wages at or above the wage base leave only the Medicare part', () => {
  const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 50000, socialSecurityWages: 200000, medicareWages: 200000 });
  assert.equal(r.socialSecurityTax, 0);
  close(r.selfEmploymentTax, 50000 * 0.9235 * 0.029);
  close(r.additionalMedicareTax, 50000 * 0.9235 * 0.009);
});

test('Additional Medicare threshold follows filing status', () => {
  const profit = 200000; // NE 184,700
  const mfs = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: profit, filingStatus: 'marriedSeparately' });
  const mfj = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: profit, filingStatus: 'marriedJointly' });
  close(mfs.additionalMedicareTax, (184700 - 125000) * 0.009);
  assert.equal(mfj.additionalMedicareTax, 0);
});

test('Medicare wages default to Social Security wages', () => {
  const r = calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 150000, socialSecurityWages: 100000 });
  close(r.additionalMedicareTax, 346.725);
});

test('random inputs match the line-by-line reference', () => {
  let seed = 41;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const statuses = Object.keys(THRESHOLD);
  for (let run = 0; run < 2000; run += 1) {
    const input = {
      taxYear: rand() < 0.5 ? 2025 : 2026,
      netProfit: Math.round((rand() * 450000 - 20000) * 100) / 100,
      socialSecurityWages: rand() < 0.5 ? 0 : Math.round(rand() * 250000),
      filingStatus: statuses[Math.floor(rand() * statuses.length)]
    };
    input.medicareWages = input.socialSecurityWages + (rand() < 0.2 ? Math.round(rand() * 20000) : 0);
    const r = calculateSelfEmploymentTax(input);
    const ref = reference(input);
    close(r.selfEmploymentTax, ref.seTax, 1e-7);
    close(r.deductibleHalf, ref.deduction, 1e-7);
    close(r.additionalMedicareTax, ref.additional, 1e-7);
    assert.ok(r.socialSecurityTax <= BASE[input.taxYear] * 0.124 + 1e-9);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => calculateSelfEmploymentTax({ taxYear: 2027, netProfit: 1000 }), RangeError);
  assert.throws(() => calculateSelfEmploymentTax({ taxYear: 2026, netProfit: Number.NaN }), RangeError);
  assert.throws(() => calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 1000, socialSecurityWages: -1 }), RangeError);
  assert.throws(() => calculateSelfEmploymentTax({ taxYear: 2026, netProfit: 1000, filingStatus: 'widow' }), RangeError);
});
