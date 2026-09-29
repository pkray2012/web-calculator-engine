import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFuelForm, runFuelCalculator, FUEL_DEFAULTS } from '../../src/adapters/fuel-cost.js';
import { fuelResults, fuelQuickResult, fuelAnnouncement } from '../../src/components/fuel-cost-results.js';
import { fuelForm, FUEL_FIELD_IDS } from '../../src/components/fuel-cost-form.js';

function view(values) {
  const result = runFuelCalculator({ ...FUEL_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default trip: 250 miles at 28 MPG and $3.50 is $31.25', () => {
  const result = view({});
  const markup = String(fuelResults(result));
  assert.match(markup, /Fuel cost of your trip/);
  assert.match(markup, /\$31\.25/);
  assert.match(markup, /8\.9 gal/);
  assert.match(markup, /12\.5¢/);
  assert.doesNotMatch(markup, /Per person/);
  assert.doesNotMatch(markup, /fuel-compare/);
  assert.match(String(fuelQuickResult(result)), /<strong>\$31\.25<\/strong> in fuel for 250 miles \(8\.9 gallons\)/);
  assert.equal(fuelAnnouncement(result), 'Fuel cost $31.25 for 250 miles, 8.9 gallons.');
});

test('round trip, split and comparison', () => {
  const markup = String(fuelResults(view({ roundTrip: 'on', people: '2', compareMpg: '20' })));
  assert.match(markup, /500 miles round trip/);
  assert.match(markup, /Per person/);
  assert.match(markup, /\$31\.25/);
  assert.match(markup, /id="fuel-compare"/);
  assert.match(markup, /The 20 MPG vehicle costs \$25\.00 more for this trip\./);
});

test('MPG mode ignores trip fields and works without a price', () => {
  const parsed = parseFuelForm({ ...FUEL_DEFAULTS, mode: 'mpg', distanceMiles: '', mpg: 'x', pricePerGallon: '' });
  assert.deepEqual(parsed, { ok: true, input: { mode: 'mpg', milesDriven: 320, gallonsUsed: 11.2, pricePerGallon: 0 } });
  const result = view({ mode: 'mpg', pricePerGallon: '' });
  const markup = String(fuelResults(result));
  assert.match(markup, /28\.6 MPG/);
  assert.match(markup, /8\.2 L\/100 km/);
  assert.match(markup, /Add the gas price/);
  assert.match(String(fuelQuickResult(result)), /<strong>28\.6 MPG<\/strong>/);
  assert.match(String(fuelResults(view({ mode: 'mpg' }))), /\$39\.20/);
});

test('validation messages', () => {
  const trip = parseFuelForm({ ...FUEL_DEFAULTS, distanceMiles: '', mpg: '0', pricePerGallon: '', people: '1.5', compareMpg: '-2' });
  assert.equal(trip.ok, false);
  assert.equal(trip.errors.distanceMiles, 'Distance is required.');
  assert.equal(trip.errors.mpg, 'Fuel economy must be greater than 0.');
  assert.equal(trip.errors.pricePerGallon, 'Gas price is required.');
  assert.equal(trip.errors.people, 'People sharing must be a whole number.');
  assert.equal(trip.errors.compareMpg, 'Compare with must be greater than 0.');
  const mpg = parseFuelForm({ ...FUEL_DEFAULTS, mode: 'mpg', gallonsUsed: '' });
  assert.equal(mpg.errors.gallonsUsed, 'Gallons to fill up is required.');
});

test('form labels every field, both modes, and shows errors', () => {
  const markup = String(fuelForm(FUEL_DEFAULTS, { distanceMiles: 'Distance is required.' }));
  for (const [name, id] of Object.entries(FUEL_FIELD_IDS)) if (name !== 'mode') assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /id="fuel-mode-trip"[^>]*checked/);
  assert.match(markup, /class="calc-form calc-form--fuel"/);
  assert.match(markup, /aria-invalid="true"/);
});
