/**
 * The Home Energy pages released on this integration branch (owner,
 * 2026-10-23): the EV cluster only. scripts/build.js builds these three and
 * the /energy/ev/ hub; they are not listed in src/content/site.js, so the home
 * page, footer directory and llms.txt are unchanged until D7 is decided. Every
 * other Batch 1 and Batch 2 draft stays planned and unlinked. Links between
 * energy pages are kept only when both ends are released, so no live page
 * links to an unbuilt one.
 */

import { ENERGY_BATCH1 } from './energy-batch1.js';
import { ENERGY_BATCH2 } from './energy-batch2.js';

export const ENERGY_RELEASED_SLUGS = Object.freeze([
  'ev-gas-savings-calculator',
  'ev-cost-per-mile-calculator',
  'ev-charging-cost-calculator'
]);

const released = (slug) => ENERGY_RELEASED_SLUGS.includes(slug);

/** The released entries, in release order, with related links limited to released pages. */
export const ENERGY_RELEASED = Object.freeze(ENERGY_RELEASED_SLUGS
  .map((slug) => [...ENERGY_BATCH1, ...ENERGY_BATCH2].find((entry) => entry.slug === slug))
  .map((entry) => ({ ...entry, related: entry.related.filter(released) })));

/** Keep only the released calculators from a draft page's related list. */
export const releasedOnly = (calculators) => calculators.filter((calculator) => released(calculator.slug));

/** The hub every released page sits under (D13, limited to /energy/ev/). */
export const EV_HUB = Object.freeze({ name: 'Electric Vehicle Calculators', path: '/energy/ev/' });
