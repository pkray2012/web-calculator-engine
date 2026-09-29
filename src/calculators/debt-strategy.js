/**
 * Compare multi-debt payoff strategies with fixed minimums plus one extra
 * monthly budget. This models allocation/roll-forward, not a single loan.
 */

const MAX_MONTHS = 1200;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
}

function nonNegative(name, value) {
  finite(name, value);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function validateDebts(debts) {
  if (!Array.isArray(debts) || debts.length < 2 || debts.length > 10) {
    throw new RangeError('debts must contain 2 to 10 accounts');
  }
  return debts.map((debt, index) => {
    if (!debt || typeof debt !== 'object') throw new RangeError(`debt ${index + 1} is invalid`);
    const name = String(debt.name ?? `Debt ${index + 1}`).trim() || `Debt ${index + 1}`;
    finite(`${name} balance`, debt.balance);
    if (debt.balance <= 0) throw new RangeError(`${name} balance must be greater than 0`);
    nonNegative(`${name} annualRate`, debt.annualRate);
    finite(`${name} minimumPayment`, debt.minimumPayment);
    if (debt.minimumPayment <= 0) throw new RangeError(`${name} minimumPayment must be greater than 0`);
    if (debt.minimumPayment <= debt.balance * debt.annualRate / 1200) {
      throw new RangeError(`${name} minimum payment does not cover monthly interest`);
    }
    return { name, balance: debt.balance, annualRate: debt.annualRate, minimumPayment: debt.minimumPayment, index };
  });
}

function compareTargets(a, b, strategy) {
  if (strategy === 'snowball') {
    return (a.balance - b.balance) || (b.annualRate - a.annualRate) || (a.index - b.index);
  }
  return (b.annualRate - a.annualRate) || (a.balance - b.balance) || (a.index - b.index);
}

function simulate(debts, extraMonthly, strategy) {
  const accounts = debts.map((debt) => ({ ...debt, balance: debt.balance }));
  const order = [];
  const rows = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let rolledMinimums = 0;

  for (let month = 1; accounts.some((debt) => debt.balance > 0.005); month += 1) {
    if (month > MAX_MONTHS) throw new RangeError('plan does not pay off all debts');
    const live = accounts.filter((debt) => debt.balance > 0.005);
    const target = [...live].sort((a, b) => compareTargets(a, b, strategy))[0];
    if (order.at(-1) !== target.index) order.push(target.index);

    const interestByDebt = accounts.map((debt) => {
      if (debt.balance <= 0.005) return 0;
      return debt.balance * debt.annualRate / 1200;
    });
    let monthlyInterest = 0;
    let monthlyPayment = 0;
    let nextRolledMinimums = 0;

    // Pay every live account's required minimum. Once an account is cleared,
    // its minimum becomes part of the permanent roll-forward pool.
    for (const debt of accounts) {
      if (debt.balance <= 0.005) continue;
      const interest = interestByDebt[debt.index];
      const due = debt.balance + interest;
      const payment = Math.min(debt.minimumPayment, due);
      debt.balance = due - payment;
      monthlyInterest += interest;
      monthlyPayment += payment;
      if (debt.balance <= 0.005) {
        debt.balance = 0;
        nextRolledMinimums += debt.minimumPayment;
      }
    }

    // The original extra plus all previously freed minimums are available to
    // attack the current target. A minimum freed this month is also retained
    // for future months, so the total monthly budget never shrinks.
    let remainingPool = extraMonthly + rolledMinimums;
    while (remainingPool > 0.005) {
      const candidates = accounts.filter((debt) => debt.balance > 0.005).sort((a, b) => compareTargets(a, b, strategy));
      if (!candidates.length) break;
      const next = candidates[0];
      const payment = Math.min(remainingPool, next.balance);
      next.balance -= payment;
      remainingPool -= payment;
      monthlyPayment += payment;
    }

    rolledMinimums += nextRolledMinimums;
    totalInterest += monthlyInterest;
    totalPaid += monthlyPayment;
    rows.push({
      month,
      payment: monthlyPayment,
      interest: monthlyInterest,
      principal: monthlyPayment - monthlyInterest,
      balance: accounts.reduce((sum, debt) => sum + debt.balance, 0),
      balances: accounts.map((debt) => ({ name: debt.name, balance: debt.balance }))
    });
  }

  return {
    strategy,
    months: rows.length,
    totalInterest,
    totalPaid,
    payoffOrder: order.map((index) => debts[index].name),
    schedule: rows
  };
}

export function calculateDebtStrategies({ debts, extraMonthly = 0 }) {
  const validated = validateDebts(debts);
  nonNegative('extraMonthly', extraMonthly);
  const snowball = simulate(validated, extraMonthly, 'snowball');
  const avalanche = simulate(validated, extraMonthly, 'avalanche');
  return {
    input: { debts: validated.map(({ name, balance, annualRate, minimumPayment }) => ({ name, balance, annualRate, minimumPayment })), extraMonthly },
    snowball,
    avalanche,
    avalancheInterestSaved: snowball.totalInterest - avalanche.totalInterest,
    avalancheMonthsSaved: snowball.months - avalanche.months
  };
}
