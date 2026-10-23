/**
 * The figures in the twelve draft meta descriptions (energy-batch1.js and
 * energy-batch2.js) are typed text, so each one is recomputed here from the
 * engine with the inputs the description states (subagent audit C-M2). A
 * description that drifts from its calculator fails this test.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency } from '../../src/lib/format.js';
import { ENERGY_BATCH1 } from '../../src/content/energy-batch1.js';
import { ENERGY_BATCH2 } from '../../src/content/energy-batch2.js';
import { runUtilityCalculator } from '../../src/adapters/energy/utility-cost.js';
import { runPpwCalculator } from '../../src/adapters/energy/solar-price-per-watt.js';
import { runBillCalculator } from '../../src/adapters/energy/electric-bill.js';
import { runPaybackCalculator } from '../../src/adapters/energy/solar-payback.js';
import { runFinancingCalculator } from '../../src/adapters/energy/solar-financing.js';
import { runBatteryCalculator, runEvTimeCalculator } from '../../src/adapters/energy/charging-time.js';
import { runEvCostCalculator } from '../../src/adapters/energy/ev-charging-cost.js';
import { runElectricityCostCalculator } from '../../src/adapters/energy/electricity-cost.js';
import { runRateCalculator } from '../../src/adapters/energy/electricity-rate.js';
import { runPerMileCalculator } from '../../src/adapters/energy/ev-cost-per-mile.js';
import { runSavingsCalculator } from '../../src/adapters/energy/ev-gas-savings.js';

const whole = (dollars) => formatCurrency(dollars).replace(/\.00$/, '');
const view = (outcome) => {
  assert.equal(outcome.ok, true, JSON.stringify(outcome.errors));
  return outcome.view;
};

/** slug → the figures its description must contain, computed from the inputs the description states. */
const EXPECTED = {
  'utility-cost-calculator': () => [whole(view(runUtilityCalculator({ electricity: '120', gas: '60', water: '45', sewer: '30', trash: '25', internet: '70' })).result.monthly)],
  'electric-bill-calculator': () => [whole(view(runBillCalculator({ kwh: '900', rate: '0.16', fixed: '12', days: '30' })).result.billCents / 100)],
  'solar-price-per-watt-calculator': () => [view(runPpwCalculator({ price: '24000', size: '8', unit: 'kW', incentives: '' })).gross.replace('/W', ' per watt')],
  'solar-financing-calculator': () => [`${formatCurrency(view(runFinancingCalculator({ price: '20000', down: '', purchaseRebates: '', laterRebates: '', rate: '7', term: '10', termUnit: 'years', fees: '' })).result.payment)} a month`],
  'solar-payback-calculator': () => [`${view(runPaybackCalculator({ cost: '20000', incentives: '', savings: '1600', maintenance: '0' })).result.years} years`],
  'solar-battery-charge-time-calculator': () => {
    const v = view(runBatteryCalculator({ capacity: '10', startLevel: '30', targetLevel: '100', power: '1.5', basis: 'battery', efficiency: '' }));
    return [v.energyText.replace('.00', ''), v.timeText];
  },
  'ev-charging-time-calculator': () => {
    const v = view(runEvTimeCalculator({ capacity: '75', startLevel: '20', targetLevel: '80', power: '7.2', basis: 'wall', efficiency: '90', vehicleMax: '' }));
    return [v.energyText.replace('.00', ''), v.timeText];
  },
  'ev-charging-cost-calculator': () => {
    const v = view(runEvCostCalculator({ capacity: '75', startLevel: '20', targetLevel: '80', efficiency: '90', rate: '0.15', figureType: '', figure: '', milesPerMonth: '' }));
    return [v.meteredText.replace('.00', ''), formatCurrency(v.result.costPerCharge)];
  },
  'electricity-cost-calculator': () => [view(runElectricityCostCalculator({ watts: '200', hours: '4', days: '120', rate: '0.15' })).kwhText.replace('.00', '')],
  'electricity-rate-calculator': () => [view(runRateCalculator({ bill: '142.50', kwh: '950', fixed: '' })).averageText],
  'ev-cost-per-mile-calculator': () => [`${view(runPerMileCalculator({ rate: '0.15', figureType: 'epa', figure: '30', efficiency: '', annualMiles: '' })).perMileText.split(' ')[0]} a mile`],
  'ev-gas-savings-calculator': () => {
    const v = view(runSavingsCalculator({ miles: '12000', kwhPer100Miles: '30', rate: '0.15', mpg: '30', pricePerGallon: '3.50' }));
    return [`${whole(v.result.evCents / 100)} vs ${whole(v.result.gasCents / 100)}`];
  }
};

test('every draft description is covered', () => {
  assert.deepEqual(Object.keys(EXPECTED).sort(), [...ENERGY_BATCH1, ...ENERGY_BATCH2].map((entry) => entry.slug).sort());
});

for (const entry of [...ENERGY_BATCH1, ...ENERGY_BATCH2]) {
  test(`${entry.slug}: the figures in the description are what the engine computes`, () => {
    for (const figure of EXPECTED[entry.slug]()) assert.ok(entry.description.includes(figure), `"${figure}" not in: ${entry.description}`);
  });
}
