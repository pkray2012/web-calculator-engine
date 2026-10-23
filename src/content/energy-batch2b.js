/**
 * Home Energy Batch 2b: a separate registry of draft calculators (owner
 * approval of the specs, 2026-10-23; B2-18 Water Heating Wattage is parked).
 *
 * Every entry is "planned". This file is not imported by src/content/site.js
 * or scripts/build.js, so none of these pages is built, linked from a live
 * page, listed in navigation or added to the sitemap until the owner decides
 * to release them. Page modules render from here in unit tests and in the
 * draft browser harness (tests/energy/batch2b/browser/harness.mjs). Related
 * links stay among these four drafts; links to Batch 1 pages (Solar Payback,
 * Price Per Watt) are a proposal only.
 */

export const ENERGY_BATCH2B = Object.freeze([
  {
    slug: 'solar-roi-calculator',
    path: '/energy/solar/solar-roi-calculator/',
    name: 'Solar ROI Calculator',
    status: 'planned',
    batch: '2b',
    cluster: 'solar',
    updated: '2026-10-23',
    title: 'Solar ROI Calculator: Simple Return on a Solar Investment',
    description: 'Estimate the simple return on solar: savings over the years you pick minus the net cost, as a % of that cost. Example: $20,000 saving $1,600 a year for 25 years: 100.0%.',
    summary: 'The simple return on a solar system over the years you choose.',
    related: ['solar-savings-calculator']
  },
  {
    slug: 'solar-savings-calculator',
    path: '/energy/solar/solar-savings-calculator/',
    name: 'Solar Savings Calculator',
    status: 'planned',
    batch: '2b',
    cluster: 'solar',
    updated: '2026-10-23',
    title: 'Solar Savings Calculator: Yearly Bill Savings From Solar',
    description: 'Estimate yearly bill savings from solar: kWh used at home at your retail rate plus kWh exported at your credit. Example: 10,000 kWh, 60% used at 16¢, 5¢ export: $1,160.',
    summary: 'Yearly bill savings from the solar kWh you use and the kWh you export.',
    related: ['solar-panel-output-calculator', 'solar-roi-calculator']
  },
  {
    slug: 'solar-panel-size-calculator',
    path: '/energy/solar/solar-panel-size-calculator/',
    name: 'Solar Panel Size Calculator',
    status: 'planned',
    batch: '2b',
    cluster: 'solar',
    updated: '2026-10-23',
    title: 'Solar Panel Size Calculator: System Size in kW and Panels',
    description: 'Find the solar system size you need: yearly kWh ÷ (sun hours × 365 × (1 − losses)). Example: 10,800 kWh, 4.5 sun hours, 14% losses: 7.65 kW, or 20 panels of 400 W.',
    summary: 'The system size in kW, and the number of panels, to cover your yearly use.',
    related: ['solar-panel-output-calculator']
  },
  {
    slug: 'solar-panel-output-calculator',
    path: '/energy/solar/solar-panel-output-calculator/',
    name: 'Solar Panel Output Calculator',
    status: 'planned',
    batch: '2b',
    cluster: 'solar',
    updated: '2026-10-23',
    title: 'Solar Panel Output Calculator: kWh per Day, Month & Year',
    description: 'Estimate solar output: kW × sun hours × (1 − losses). Example: a 7.6 kW system with 4.5 sun hours and 14% losses makes 29.41 kWh a day, 10,735.38 kWh a year.',
    summary: 'The kWh a solar system makes per day, month and year.',
    related: ['solar-panel-size-calculator', 'solar-savings-calculator']
  }
]);

export function findEnergyBatch2bCalculator(slug) {
  const entry = ENERGY_BATCH2B.find((calc) => calc.slug === slug);
  if (!entry) throw new Error(`Unknown Batch 2b energy calculator: ${slug}`);
  return entry;
}

/** Related pages among the four drafts (they resolve only once the pages are live). */
export function relatedEnergyBatch2bCalculators(slug) {
  return findEnergyBatch2bCalculator(slug).related.map(findEnergyBatch2bCalculator);
}
