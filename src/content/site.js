/**
 * Site-wide identity and the calculator registry.
 *
 * Only entries with status "live" produce pages, navigation, related links
 * and sitemap URLs. "planned" entries document intended cluster links without
 * publishing thin placeholder pages.
 */

export const SITE = Object.freeze({
  // Working name; set the site name for your deployment here.
  name: 'US Calculators',
  locale: 'en-US',
  description: 'Free US financial calculators with transparent formulas, stated assumptions and full payment schedules. Calculations run in your browser.'
});

export const CATEGORIES = Object.freeze({
  loans: { name: 'Loans', description: 'Payments, total interest and payoff schedules for fixed-rate loans, from cars and personal loans to refinancing a mortgage.' },
  credit: { name: 'Debt and credit', description: 'How long a balance takes to pay off and what it costs in interest.' },
  savings: { name: 'Savings', description: 'How much to set aside each month, and how long a goal or emergency fund takes to reach.' },
  // Reserved category: not shown until a live calculator uses it.
  home: { name: 'Home loans', description: 'Mortgage decisions compared on total cost, not just the monthly payment.' }
});

export const CALCULATORS = Object.freeze([
  {
    slug: 'mortgage-calculator',
    path: '/calculators/mortgage-calculator/',
    name: 'Mortgage Calculator',
    navName: 'Mortgage',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Mortgage Calculator — Monthly Payment with Taxes, Insurance & PMI',
    description: 'Estimate your full monthly mortgage payment with property tax, insurance, PMI and HOA dues, when PMI can be removed, and the total cost of the loan.',
    summary: 'Full monthly payment with taxes, insurance, PMI and HOA, the dates PMI can be dropped or ends, and lifetime cost.',
    related: ['home-affordability-calculator', 'mortgage-refinance-calculator', 'mortgage-points-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'home-affordability-calculator',
    path: '/calculators/home-affordability-calculator/',
    name: 'Home Affordability Calculator',
    navName: 'Home affordability',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Home Affordability Calculator — How Much House Can I Afford?',
    description: 'Estimate how much house you can afford from your income, debts and down payment, which debt-to-income limit sets your budget, and how rates change it.',
    summary: 'Maximum home price from income, debts and down payment, the debt-to-income limit that binds, and the price at other rates.',
    related: ['mortgage-calculator', 'debt-to-income-calculator', 'rent-vs-buy-calculator', 'loan-payoff-calculator', 'mortgage-points-calculator']
  },
  {
    slug: 'rent-vs-buy-calculator',
    path: '/calculators/rent-vs-buy-calculator/',
    name: 'Rent vs. Buy Calculator',
    navName: 'Rent vs. buy',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Rent vs. Buy Calculator — Is It Better to Rent or Buy a Home?',
    description: 'Compare renting with buying over the years you plan to stay: net worth on each path, the break-even year and every cost of owning, with your own assumptions.',
    summary: 'Net worth from renting vs. buying year by year, the break-even year, and the full costs of owning, with explicit assumptions.',
    related: ['home-affordability-calculator', 'mortgage-calculator', 'mortgage-points-calculator']
  },
  {
    slug: 'loan-payment-calculator',
    path: '/calculators/loan-payment-calculator/',
    name: 'Loan Payment Calculator',
    navName: 'Loan payment',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Loan Payment Calculator — Monthly Payment, Interest & Schedule',
    description: 'Calculate the monthly payment, total interest and amortization schedule for a fixed-rate loan, compare terms, and see how extra payments shorten payoff.',
    summary: 'Monthly payment, total interest, term comparison, extra-payment savings and a full amortization schedule.',
    related: ['auto-loan-calculator', 'personal-loan-calculator', 'mortgage-refinance-calculator', 'heloc-payment-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'auto-loan-calculator',
    path: '/calculators/auto-loan-calculator/',
    name: 'Auto Loan Calculator',
    navName: 'Auto loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Auto Loan Calculator — Car Payment with Tax, Trade-In & Fees',
    description: 'Estimate a car payment with sales tax, fees and trade-in, or how much car you can afford on a monthly budget. See the amount financed, interest and schedule.',
    summary: 'Car payment with tax, fees and trade-in, or the car price a monthly budget affords; amount financed, term comparison and amortization.',
    related: ['car-lease-calculator', 'auto-loan-refinance-calculator', 'loan-payment-calculator', 'personal-loan-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'car-lease-calculator',
    path: '/calculators/car-lease-calculator/',
    name: 'Car Lease Calculator',
    navName: 'Car lease',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Car Lease Calculator — Lease Payment, Money Factor & Lease vs. Buy',
    description: 'Estimate a car lease payment from price, residual and money factor, what is due at signing and the total lease cost, and compare leasing with buying.',
    summary: 'Lease payment built from depreciation and rent charge, due at signing, total lease cost, and a lease-vs-buy comparison over the term.',
    related: ['auto-loan-calculator', 'auto-loan-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'auto-loan-refinance-calculator',
    path: '/calculators/auto-loan-refinance-calculator/',
    name: 'Auto Loan Refinance Calculator',
    navName: 'Auto refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Auto Loan Refinance Calculator — Savings After Fees',
    description: 'Compare keeping your car loan with refinancing: new payment, total savings after fees, when refinancing comes out ahead, and what a longer term costs.',
    summary: 'New car payment, total savings after fees and penalties, true break-even counting the balance owed, and the cost of a longer term.',
    related: ['auto-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'personal-loan-calculator',
    path: '/calculators/personal-loan-calculator/',
    name: 'Personal Loan Calculator',
    navName: 'Personal loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Personal Loan Calculator — Payment, Origination Fee & APR',
    description: 'Calculate a personal loan payment, the cash you receive after an origination fee, the fee-adjusted APR and the total cost of borrowing, with a full schedule.',
    summary: 'Payment, cash received after an origination fee, fee-adjusted APR, cost of borrowing, term comparison and amortization.',
    related: ['loan-payment-calculator', 'auto-loan-calculator', 'credit-card-payoff-calculator', 'student-loan-refinance-calculator']
  },
  {
    slug: 'student-loan-refinance-calculator',
    path: '/calculators/student-loan-refinance-calculator/',
    name: 'Student Loan Refinance Calculator',
    navName: 'Student loan refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Student Loan Refinance Calculator — Savings & What You Give Up',
    description: 'Compare keeping your student loans with a refinance offer: new payment, total savings after fees, the cost of a longer term, and what federal borrowers give up.',
    summary: 'New payment, total savings after fees, the new rate over common terms, and a clear warning on federal benefits lost.',
    related: ['loan-payment-calculator', 'personal-loan-calculator']
  },
  {
    slug: 'mortgage-refinance-calculator',
    path: '/calculators/mortgage-refinance-calculator/',
    name: 'Mortgage Refinance Calculator',
    navName: 'Refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Mortgage Refinance Calculator — True Break-Even & Savings',
    description: 'Compare keeping your mortgage with refinancing: new payment, true break-even counting the balance owed, savings if you sell early, and lifetime cost.',
    summary: 'New payment, true break-even that counts the balance owed, savings if you sell after N years, and a full-term comparison.',
    related: ['mortgage-calculator', 'mortgage-points-calculator', 'loan-payment-calculator', 'heloc-payment-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'home-equity-loan-calculator',
    path: '/calculators/home-equity-loan-calculator/',
    name: 'Home Equity Loan Calculator',
    navName: 'Home equity loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Home Equity Loan Calculator — Payment & How Much You Can Borrow',
    description: 'Estimate a home equity loan payment, how much you might borrow at 80%, 85% or 90% CLTV, the cash you receive after closing costs and total interest.',
    summary: 'Monthly payment, borrowing limit at common CLTV caps, cash received after closing costs, term comparison and amortization.',
    related: ['heloc-payment-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'mortgage-points-calculator',
    path: '/calculators/mortgage-points-calculator/',
    name: 'Mortgage Points Calculator',
    navName: 'Mortgage points',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Mortgage Points Calculator — Is Buying Points Worth It?',
    description: 'Compare a mortgage with and without discount points: cost of the points, monthly savings, the month they pay for themselves, and savings if you sell early.',
    summary: 'Cost of discount points, monthly savings, true break-even month, and net savings if you sell or refinance after N years.',
    related: ['mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'heloc-payment-calculator',
    path: '/calculators/heloc-payment-calculator/',
    name: 'HELOC Payment Calculator',
    navName: 'HELOC',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'HELOC Payment Calculator — Draw vs. Repayment Payment',
    description: 'Estimate your HELOC payment during the draw period, the higher payment when repayment starts, and how much a rate rise would add, with a year-by-year schedule.',
    summary: 'Draw-period and repayment payments, the payment jump when repayment starts, rate what-ifs and a yearly schedule.',
    related: ['home-equity-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'credit-card-payoff-calculator',
    path: '/calculators/credit-card-payoff-calculator/',
    name: 'Credit Card Payoff Calculator',
    navName: 'Credit card payoff',
    category: 'credit',
    status: 'live',
    updated: '2026-09-27',
    title: 'Credit Card Payoff Calculator — Time to Pay Off & Interest',
    description: 'See how long it takes to pay off a credit card, the interest it costs, and the monthly payment needed to be debt-free by a set date, with a payoff schedule.',
    summary: 'Months to pay off, total interest, extra-payment savings, the payment needed for a debt-free date, and a payoff schedule.',
    related: ['balance-transfer-calculator', 'personal-loan-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'balance-transfer-calculator',
    path: '/calculators/balance-transfer-calculator/',
    name: 'Balance Transfer Calculator',
    navName: 'Balance transfer',
    category: 'credit',
    status: 'live',
    updated: '2026-09-28',
    title: 'Balance Transfer Calculator — Savings After the Fee',
    description: 'See whether a balance transfer saves money after the fee, how much is left when the intro APR ends, and the monthly payment that clears it in time.',
    summary: 'Net savings after the transfer fee, the balance left when the intro rate ends, and the payment that clears it in time.',
    related: ['credit-card-payoff-calculator', 'personal-loan-calculator']
  },
  {
    slug: 'loan-payoff-calculator',
    path: '/calculators/loan-payoff-calculator/',
    name: 'Loan Payoff Calculator',
    navName: 'Loan payoff',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Loan Payoff Calculator — Extra Payments & Payoff Date',
    description: 'See how much sooner extra monthly, yearly or one-time payments pay off your mortgage or loan, the interest saved, and the extra needed to be debt-free by a date.',
    summary: 'Payoff date and interest saved with monthly, yearly or lump-sum extras, and the extra needed to be debt-free by a set time.',
    related: ['loan-payment-calculator', 'mortgage-refinance-calculator', 'auto-loan-calculator']
  },
  {
    slug: 'savings-goal-calculator',
    path: '/calculators/savings-goal-calculator/',
    name: 'Savings Goal Calculator',
    navName: 'Savings goal',
    category: 'savings',
    status: 'live',
    updated: '2026-09-28',
    title: 'Savings Goal Calculator — How Much to Save Each Month',
    description: 'Find how much to save each month to reach a goal or emergency fund by a date, or how long a set monthly deposit takes, with interest at your APY.',
    summary: 'Monthly amount to reach a goal or emergency fund by a date, or time to reach it with a set deposit, with APY growth by year.',
    related: ['credit-card-payoff-calculator', 'loan-payoff-calculator', 'home-affordability-calculator']
  },
  {
    slug: 'debt-to-income-calculator',
    path: '/calculators/debt-to-income-calculator/',
    name: 'Debt-to-Income Ratio Calculator',
    navName: 'Debt-to-income',
    category: 'credit',
    status: 'live',
    updated: '2026-09-28',
    title: 'Debt-to-Income Ratio Calculator — What Is My DTI?',
    description: 'Calculate your debt-to-income ratio from gross income and monthly debt payments: housing and total ratios, each payment\'s share, and room to a target.',
    summary: 'Housing and total debt-to-income ratios, each payment\'s share of income, and the room or cut needed to reach a target.',
    related: ['home-affordability-calculator', 'loan-payoff-calculator', 'credit-card-payoff-calculator']
  }
]);

export function liveCalculators(registry = CALCULATORS) {
  return registry.filter((calculator) => calculator.status === 'live');
}

export function findCalculator(slug, registry = CALCULATORS) {
  return registry.find((calculator) => calculator.slug === slug) ?? null;
}

/** Related calculators that are live; planned ones are never linked. */
export function relatedCalculators(slug, registry = CALCULATORS) {
  const calculator = findCalculator(slug, registry);
  if (!calculator) return [];
  return (calculator.related ?? [])
    .map((relatedSlug) => findCalculator(relatedSlug, registry))
    .filter((related) => related && related.status === 'live');
}
