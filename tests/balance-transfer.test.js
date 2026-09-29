import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateBalanceTransfer } from '../src/calculators/balance-transfer.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not within ${tolerance} of ${expected}`);

const base = { balance: 6000, currentApr: 24.99, monthlyPayment: 300, transferFeePercent: 3, introApr: 0, introMonths: 18, postIntroApr: 21.99 };

test('hand-computed 0% offer: fee, balance at promo end, post-promo interest and payoff month', () => {
  const r = calculateBalanceTransfer(base);
  close(r.transferFee, 180);
  close(r.transferredBalance, 6180);
  close(r.transfer.balanceAtPromoEnd, 780); // 6180 − 18 × 300
  // Month 19: 780 × 21.99%/12 = 14.2935; month 20 on 494.2935; month 21 clears the rest.
  const r1 = 0.2199 / 12;
  const i19 = 780 * r1;
  const b19 = 780 + i19 - 300;
  const i20 = b19 * r1;
  const b20 = b19 + i20 - 300;
  const i21 = b20 * r1;
  close(r.transfer.interest, i19 + i20 + i21, 1e-9);
  assert.equal(r.transfer.payoffMonths, 21);
  close(r.transfer.totalCost, 6180 + i19 + i20 + i21, 1e-9);
  close(r.netSavings, r.keep.totalCost - r.transfer.totalCost, 1e-9);
  assert.equal(r.transfer.clearsDuringPromo, false);
});

test('a non-zero intro APR is charged (regression for #24, which modelled it as 0%)', () => {
  const r = calculateBalanceTransfer({ ...base, introApr: 1.99 });
  const i = 0.0199 / 12;
  // Closed form for the balance after 18 months of 300 at the intro APR.
  const expected = 6180 * (1 + i) ** 18 - 300 * (((1 + i) ** 18 - 1) / i);
  close(r.transfer.balanceAtPromoEnd, expected, 1e-6);
  assert.ok(r.transfer.interest > calculateBalanceTransfer(base).transfer.interest + 50);
});

test('the payment to clear during the promotion is an annuity at the intro APR and clears exactly on time', () => {
  for (const introApr of [0, 1.99, 3.99]) {
    const r = calculateBalanceTransfer({ ...base, introApr });
    const i = introApr / 1200;
    const expected = i === 0 ? 6180 / 18 : 6180 * i / (1 - (1 + i) ** -18);
    close(r.paymentToClearDuringPromo, expected, 1e-9);
    const paid = calculateBalanceTransfer({ ...base, introApr, monthlyPayment: r.paymentToClearDuringPromo + 1e-9 });
    assert.equal(paid.transfer.payoffMonths, 18);
    assert.equal(paid.transfer.clearsDuringPromo, true);
    close(paid.transfer.balanceAtPromoEnd, 0);
  }
});

/** Independent reference with a different structure: phases computed separately. */
function reference({ balance, currentApr, monthlyPayment, transferFeePercent, introApr, introMonths, postIntroApr }) {
  const run = (start, schedule) => {
    let b = start, interest = 0, n = 0;
    while (b > 1e-8 && n < 1200) {
      const apr = schedule(n + 1);
      const due = b * apr / 1200;
      interest += due;
      b = b + due - Math.min(monthlyPayment, b + due);
      n += 1;
    }
    return { interest, n };
  };
  const keep = run(balance, () => currentApr);
  const moved = balance * (1 + transferFeePercent / 100);
  const transfer = run(moved, (m) => (m <= introMonths ? introApr : postIntroApr));
  return { keepCost: balance + keep.interest, keepMonths: keep.n, transferCost: moved + transfer.interest, transferMonths: transfer.n };
}

test('matches an independent reference across 300 random offers', () => {
  let seed = 424242;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let checked = 0;
  for (let n = 0; n < 300; n += 1) {
    const balance = Math.round(500 + rand() * 25000);
    const currentApr = Math.round(12 + rand() * 18) + 0.99;
    const postIntroApr = Math.round(15 + rand() * 14) + 0.49;
    const minimum = balance * Math.max(currentApr, postIntroApr) / 1200 + 10;
    const input = {
      balance, currentApr, postIntroApr,
      monthlyPayment: Math.round(minimum + rand() * balance * 0.08),
      transferFeePercent: [0, 3, 4, 5][Math.floor(rand() * 4)],
      introApr: [0, 0, 1.99, 2.99][Math.floor(rand() * 4)],
      introMonths: [0, 6, 12, 15, 18, 21][Math.floor(rand() * 6)]
    };
    const r = calculateBalanceTransfer(input);
    const ref = reference(input);
    close(r.keep.totalCost, ref.keepCost, 1e-6 * ref.keepCost);
    close(r.transfer.totalCost, ref.transferCost, 1e-6 * ref.transferCost);
    assert.equal(r.keep.payoffMonths, ref.keepMonths);
    assert.equal(r.transfer.payoffMonths, ref.transferMonths);
    checked += 1;
  }
  assert.equal(checked, 300);
});

test('a high fee with a short promotion can cost more than keeping the card', () => {
  const r = calculateBalanceTransfer({ balance: 2000, currentApr: 18, monthlyPayment: 500, transferFeePercent: 5, introApr: 0, introMonths: 6, postIntroApr: 24.99 });
  assert.ok(r.netSavings < 0, `expected a loss, got ${r.netSavings}`);
});

test('invalid inputs and payments that never pay off are rejected', () => {
  assert.throws(() => calculateBalanceTransfer({ ...base, balance: 0 }), /greater than 0/);
  assert.throws(() => calculateBalanceTransfer({ ...base, introMonths: 1.5 }), /whole number/);
  assert.throws(() => calculateBalanceTransfer({ ...base, transferFeePercent: -1 }), /between 0 and 100/);
  // Covers the 0% promo but not the post-promo interest on the remaining balance.
  assert.throws(() => calculateBalanceTransfer({ balance: 20000, currentApr: 10, monthlyPayment: 180, transferFeePercent: 3, introApr: 0, introMonths: 12, postIntroApr: 29.99 }), /once the promotion ends/);
  // Doesn't cover the current card's interest.
  assert.throws(() => calculateBalanceTransfer({ ...base, monthlyPayment: 100 }));
});
