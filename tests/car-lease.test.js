import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCarLease, moneyFactorFromApr } from '../src/calculators/car-lease.js';

const base = {
  msrp: 40000, price: 38000, residualPercent: 58, leaseApr: 6, leaseMonths: 36, downPayment: 3000, capitalizedFees: 995,
  paymentTaxPercent: 7, loanApr: 6.5, loanMonths: 60, purchaseTaxPercent: 7
};

// Reference values from an independent Python implementation of the same formulas.
test('lease payment and lease-vs-buy match the independent reference', () => {
  const result = calculateCarLease(base);
  assert.ok(Math.abs(result.lease.payment - 538.6424583333334) < 1e-9);
  assert.ok(Math.abs(result.lease.cashOut - 22391.1285) < 1e-6);
  assert.ok(Math.abs(result.buy.payment - 756.3294593949569) < 1e-9);
  assert.ok(Math.abs(result.buy.balanceAtLeaseEnd - 16978.520864406026) < 1e-6);
  assert.ok(Math.abs(result.buy.netCost - 24006.38140262449) < 1e-6);
  assert.ok(Math.abs(result.leaseMinusBuy - -1615.2529026244883) < 1e-6);
});

test('money factor is APR ÷ 2,400 and the payment splits into depreciation and rent charge', () => {
  assert.equal(moneyFactorFromApr(6), 0.0025);
  const { lease } = calculateCarLease({ ...base, paymentTaxPercent: 0 });
  assert.ok(Math.abs(lease.payment - (lease.depreciation + lease.rentCharge)) < 1e-12);
  assert.ok(Math.abs(lease.depreciation * 36 - (lease.adjustedCapCost - lease.residual)) < 1e-9);
});

test('a zero money factor leaves only depreciation', () => {
  const { lease } = calculateCarLease({ ...base, leaseApr: 0, paymentTaxPercent: 0 });
  assert.equal(lease.rentCharge, 0);
  assert.ok(Math.abs(lease.payment - (38000 + 995 - 3000 - 23200) / 36) < 1e-9);
});

test('a higher residual lowers the lease payment', () => {
  assert.ok(calculateCarLease({ ...base, residualPercent: 62 }).lease.payment < calculateCarLease(base).lease.payment);
});

test('invalid leases are rejected', () => {
  assert.throws(() => calculateCarLease({ ...base, residualPercent: 100 }), RangeError);
  assert.throws(() => calculateCarLease({ ...base, downPayment: 20000 }), /residual/);
  assert.throws(() => calculateCarLease({ ...base, loanMonths: 24 }), /loanMonths/);
});
