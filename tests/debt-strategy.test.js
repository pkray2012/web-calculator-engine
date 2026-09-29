import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateDebtStrategies } from '../src/calculators/debt-strategy.js';

const DEBTS = [
  { name: 'Card A', balance: 5000, annualRate: 24, minimumPayment: 150 },
  { name: 'Card B', balance: 2500, annualRate: 18, minimumPayment: 80 },
  { name: 'Loan C', balance: 9000, annualRate: 9, minimumPayment: 220 }
];

function reference(debts, extraMonthly, strategy) {
  const accounts = debts.map((debt, index) => ({ ...debt, index, balance: debt.balance }));
  const order = [];
  let totalInterest = 0;
  let months = 0;
  let rolledMinimums = 0;
  while (accounts.some((debt) => debt.balance > 0.005)) {
    months += 1;
    assert.ok(months < 1200);
    const live = accounts.filter((debt) => debt.balance > 0.005);
    const compare = (a, b) => strategy === 'snowball'
      ? (a.balance - b.balance) || (b.annualRate - a.annualRate) || (a.index - b.index)
      : (b.annualRate - a.annualRate) || (a.balance - b.balance) || (a.index - b.index);
    const target = [...live].sort(compare)[0];
    if (order.at(-1) !== target.index) order.push(target.index);
    const interest = accounts.map((debt) => debt.balance > 0.005 ? debt.balance * debt.annualRate / 1200 : 0);
    let nextRolledMinimums = 0;
    for (const debt of accounts) {
      if (debt.balance <= 0.005) continue;
      const due = debt.balance + interest[debt.index];
      const payment = Math.min(debt.minimumPayment, due);
      debt.balance = due - payment;
      if (debt.balance <= 0.005) {
        debt.balance = 0;
        nextRolledMinimums += debt.minimumPayment;
      }
    }
    let pool = extraMonthly + rolledMinimums;
    while (pool > 0.005) {
      const next = accounts.filter((debt) => debt.balance > 0.005).sort(compare)[0];
      if (!next) break;
      const payment = Math.min(pool, next.balance);
      next.balance -= payment;
      pool -= payment;
    }
    rolledMinimums += nextRolledMinimums;
    totalInterest += interest.reduce((sum, value) => sum + value, 0);
  }
  return { months, totalInterest, order: order.map((index) => debts[index].name) };
}

test('snowball and avalanche match an independent simulation', () => {
  const result = calculateDebtStrategies({ debts: DEBTS, extraMonthly: 200 });
  for (const strategy of ['snowball', 'avalanche']) {
    const expected = reference(DEBTS, 200, strategy);
    const actual = result[strategy];
    assert.equal(actual.months, expected.months);
    assert.deepEqual(actual.payoffOrder, expected.order);
    assert.ok(Math.abs(actual.totalInterest - expected.totalInterest) < 1e-8);
  }
});

test('snowball starts with the smallest balance and avalanche with the highest rate', () => {
  const result = calculateDebtStrategies({ debts: DEBTS, extraMonthly: 0 });
  assert.equal(result.snowball.payoffOrder[0], 'Card B');
  assert.equal(result.avalanche.payoffOrder[0], 'Card A');
});

test('freed minimum payments roll into the next target and stay rolled', () => {
  const debts = [
    { name: 'Small', balance: 100, annualRate: 0, minimumPayment: 100 },
    { name: 'Large', balance: 1000, annualRate: 0, minimumPayment: 50 }
  ];
  const result = calculateDebtStrategies({ debts, extraMonthly: 0 });
  assert.equal(result.snowball.months, 8);
  assert.equal(result.snowball.totalPaid, 1100);
  assert.deepEqual(result.snowball.payoffOrder, ['Small', 'Large']);
});

test('zero-rate debts and deterministic ties are supported', () => {
  const debts = [
    { name: 'First', balance: 1000, annualRate: 0, minimumPayment: 100 },
    { name: 'Second', balance: 1000, annualRate: 0, minimumPayment: 100 }
  ];
  const result = calculateDebtStrategies({ debts, extraMonthly: 100 });
  assert.deepEqual(result.snowball.payoffOrder, ['First', 'Second']);
  assert.deepEqual(result.avalanche.payoffOrder, ['First', 'Second']);
  assert.equal(result.snowball.totalInterest, 0);
});

test('invalid minimum payments and extra amounts are rejected', () => {
  assert.throws(() => calculateDebtStrategies({ debts: [{ name: 'A', balance: 1000, annualRate: 24, minimumPayment: 10 }, { name: 'B', balance: 100, annualRate: 0, minimumPayment: 10 }] }), /interest/);
  assert.throws(() => calculateDebtStrategies({ debts: DEBTS, extraMonthly: -1 }), RangeError);
  assert.throws(() => calculateDebtStrategies({ debts: DEBTS.slice(0, 1) }), /2 to 10/);
});
