/**
 * Home Energy Batch 2: a separate registry of draft calculators.
 *
 * Every entry is "planned". This file is not imported by src/content/site.js
 * or scripts/build.js, so none of these pages is built, linked from a live
 * page, listed in navigation or added to the sitemap until the owner decides
 * to release them. Page modules render from here in unit tests and in the
 * draft browser harness (tests/energy/batch2/browser/harness.mjs). Related
 * links stay among these four drafts; links to Batch 1 or live pages are a
 * proposal only (Phase 6 overlap review).
 */

export const ENERGY_BATCH2 = Object.freeze([
  {
    slug: 'electricity-cost-calculator',
    path: '/energy/electricity/electricity-cost-calculator/',
    name: 'Electricity Cost Calculator',
    status: 'planned',
    batch: 2,
    cluster: 'electricity',
    updated: '2026-10-22',
    title: 'Electricity Cost Calculator: Cost to Run an Appliance',
    description: 'Find what an appliance costs to run from its watts, hours of use per day, days and your rate per kWh. 200 W for 4 hours a day for 120 days is 96 kWh.',
    summary: 'What an appliance costs to run from its watts, hours of use and your rate.',
    related: ['electricity-rate-calculator']
  },
  {
    slug: 'electricity-rate-calculator',
    path: '/energy/electricity/electricity-rate-calculator/',
    name: 'Electricity Rate Calculator',
    status: 'planned',
    batch: 2,
    cluster: 'electricity',
    updated: '2026-10-22',
    title: 'Electricity Rate Calculator: Your Cost per kWh From a Bill',
    description: 'Divide your electric bill by the kWh used to find your average cost per kWh, and the rate left after the fixed charges you exclude. $142.50 for 950 kWh is 15.00¢.',
    summary: 'Your average cost per kWh from a bill, and the rate after the charges you exclude.',
    related: ['electricity-cost-calculator']
  },
  {
    slug: 'ev-cost-per-mile-calculator',
    path: '/energy/ev/ev-cost-per-mile-calculator/',
    name: 'EV Cost Per Mile Calculator',
    status: 'planned',
    batch: 2,
    cluster: 'ev',
    updated: '2026-10-22',
    title: 'EV Cost Per Mile Calculator: Electric Car Cost per Mile',
    description: 'Find an electric car\'s cost per mile and per 100 miles from its EPA kWh per 100 miles or dashboard mi/kWh and your rate. 30 kWh/100 mi at 15¢ is 4.50¢ a mile.',
    summary: 'An electric car\'s cost per mile, per 100 miles and per year.',
    related: ['ev-gas-savings-calculator']
  },
  {
    slug: 'ev-gas-savings-calculator',
    path: '/energy/ev/ev-gas-savings-calculator/',
    name: 'EV Gas Savings Calculator',
    status: 'planned',
    batch: 2,
    cluster: 'ev',
    updated: '2026-10-22',
    title: 'EV vs Gas Savings Calculator: Fuel Cost Savings per Year',
    description: 'Compare a year of charging an electric car with buying gas for a gas car, from miles, kWh per 100 miles, MPG and prices. 12,000 miles: $540 vs $1,400.',
    summary: 'A year of electricity for an EV against gas for a gas car.',
    related: ['ev-cost-per-mile-calculator']
  }
]);

export function findEnergyBatch2Calculator(slug) {
  const entry = ENERGY_BATCH2.find((calc) => calc.slug === slug);
  if (!entry) throw new Error(`Unknown Batch 2 energy calculator: ${slug}`);
  return entry;
}

/** Related pages among the four drafts (they resolve only once the pages are live). */
export function relatedEnergyBatch2Calculators(slug) {
  return findEnergyBatch2Calculator(slug).related.map(findEnergyBatch2Calculator);
}
