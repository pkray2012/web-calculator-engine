/**
 * Home Energy Batch 1: a separate registry of draft calculators.
 *
 * Every entry is "planned". This file is not imported by src/content/site.js
 * or scripts/build.js, so none of these pages is built, linked from a live
 * page, listed in navigation or added to the sitemap until the owner decides
 * to release them. Page modules render from here in unit tests and in the
 * draft browser harness (tests/energy/batch1/browser/harness.mjs).
 */

export const ENERGY_BATCH1 = Object.freeze([
  {
    slug: 'utility-cost-calculator',
    path: '/energy/electricity/utility-cost-calculator/',
    name: 'Utility Cost Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'electricity',
    updated: '2026-10-21',
    title: 'Utility Cost Calculator: Add Up Your Monthly Utility Bills',
    description: 'Add up electricity, gas, water, sewer, trash and internet bills to see your monthly utility total and each bill\'s share. $120 + $60 + $45 + $30 + $25 + $70 = $350.',
    summary: 'Your monthly utility total and each bill\'s share of it.',
    related: ['electric-bill-calculator']
  },
  {
    slug: 'electric-bill-calculator',
    path: '/energy/electricity/electric-bill-calculator/',
    name: 'Electric Bill Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'electricity',
    updated: '2026-10-21',
    title: 'Electric Bill Calculator: Estimate Your Monthly Power Bill',
    description: 'Estimate an electric bill from kWh used, your per-kWh rate and fixed monthly charges, with daily cost and average cents per kWh. 900 kWh at 16¢ plus $12 is $156.',
    summary: 'An electric bill from kWh used, your rate and fixed charges.',
    related: ['utility-cost-calculator', 'ev-charging-cost-calculator']
  },
  {
    slug: 'solar-price-per-watt-calculator',
    path: '/energy/solar/solar-price-per-watt-calculator/',
    name: 'Solar Price Per Watt Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'solar',
    updated: '2026-10-21',
    title: 'Solar Price Per Watt Calculator: Gross & Net $/W',
    description: 'Divide a solar quote by the system size in watts to get price per watt, before and after incentives. A $24,000 quote for 8 kW is $3.00 per watt.',
    summary: 'Price per watt of a solar quote, before and after incentives.',
    related: ['solar-payback-calculator', 'solar-financing-calculator']
  },
  {
    slug: 'solar-financing-calculator',
    path: '/energy/solar/solar-financing-calculator/',
    name: 'Solar Financing Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'solar',
    updated: '2026-10-21',
    title: 'Solar Financing Calculator: Solar Loan Payment & Total Cost',
    description: 'Estimate a solar loan payment from price, down payment, rebates, interest rate and term, plus total interest. $20,000 at 7% for 10 years is $232.22 a month.',
    summary: 'A solar loan\'s monthly payment, total interest and total cost.',
    related: ['solar-payback-calculator', 'solar-price-per-watt-calculator']
  },
  {
    slug: 'solar-payback-calculator',
    path: '/energy/solar/solar-payback-calculator/',
    name: 'Solar Payback Period Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'solar',
    updated: '2026-10-21',
    title: 'Solar Payback Period Calculator: Simple Payback in Years',
    description: 'Find the simple payback period for solar panels: net cost divided by yearly bill savings. A $20,000 system that saves $1,600 a year pays back in 12.5 years.',
    summary: 'Simple payback in years: net cost divided by yearly bill savings.',
    related: ['solar-price-per-watt-calculator', 'solar-financing-calculator']
  },
  {
    slug: 'solar-battery-charge-time-calculator',
    path: '/energy/solar/solar-battery-charge-time-calculator/',
    name: 'Solar Battery Charging Time Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'solar',
    updated: '2026-10-21',
    title: 'Solar Battery Charge Time Calculator: Hours to Charge',
    description: 'Estimate how long a solar battery takes to charge from its usable capacity, charge levels and charging power. Charging 7 kWh at 1.5 kW takes about 4 h 40 min.',
    summary: 'Hours to charge a home battery from its capacity, charge levels and power.',
    related: ['ev-charging-time-calculator']
  },
  {
    slug: 'ev-charging-time-calculator',
    path: '/energy/ev/ev-charging-time-calculator/',
    name: 'EV Charging Time Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'ev',
    updated: '2026-10-21',
    title: 'EV Charging Time Calculator: How Long to Charge an Electric Car',
    description: 'Estimate how long an electric car takes to charge from battery size, charge levels, charger power and efficiency. 45 kWh at 7.2 kW and 90% efficiency is about 6 h 57 min.',
    summary: 'Hours to charge an electric car from battery size, charge levels and charger power.',
    related: ['ev-charging-cost-calculator', 'solar-battery-charge-time-calculator']
  },
  {
    slug: 'ev-charging-cost-calculator',
    path: '/energy/ev/ev-charging-cost-calculator/',
    name: 'EV Charging Cost Calculator',
    status: 'planned',
    batch: 1,
    cluster: 'ev',
    updated: '2026-10-21',
    title: 'EV Charging Cost Calculator: Cost per Charge & per Mile',
    description: 'Calculate what it costs to charge an electric car at home: per charge from battery size and efficiency, and per mile from the EPA label. 50 kWh at 15¢ is $7.50.',
    summary: 'The cost of charging an electric car at home, per charge and per mile.',
    related: ['ev-charging-time-calculator', 'electric-bill-calculator']
  }
]);

export function findEnergyCalculator(slug) {
  const entry = ENERGY_BATCH1.find((calc) => calc.slug === slug);
  if (!entry) throw new Error(`Unknown energy calculator: ${slug}`);
  return entry;
}

/** Related pages among the eight drafts (they resolve only once the pages are live). */
export function relatedEnergyCalculators(slug) {
  return findEnergyCalculator(slug).related.map(findEnergyCalculator);
}
