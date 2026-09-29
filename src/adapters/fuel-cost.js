/**
 * Adapter between the Fuel Cost Calculator page and its engine. Parses raw
 * form values, calls calculateTripFuelCost() or calculateMpg() and shapes the
 * result for display. No formulas live here.
 */

import { calculateTripFuelCost, calculateMpg } from '../calculators/fuel-cost.js';
import { numberField } from '../lib/validation.js';

/**
 * Illustrative example values, not current prices: a 250-mile drive in a car
 * that gets 28 MPG with gas at $3.50 a gallon; for the MPG mode, 320 miles on
 * an 11.2-gallon fill-up.
 */
export const FUEL_DEFAULTS = Object.freeze({
  mode: 'trip',
  distanceMiles: '250',
  mpg: '28',
  pricePerGallon: '3.50',
  roundTrip: '',
  people: '1',
  compareMpg: '',
  milesDriven: '320',
  gallonsUsed: '11.2'
});

export function parseFuelForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const mode = values.mode === 'mpg' ? 'mpg' : 'trip';
  if (mode === 'mpg') {
    const milesDriven = take('milesDriven', numberField(values.milesDriven, { label: 'Miles driven', min: 0, minExclusive: true, max: 10_000 }));
    const gallonsUsed = take('gallonsUsed', numberField(values.gallonsUsed, { label: 'Gallons to fill up', min: 0, minExclusive: true, max: 500 }));
    const pricePerGallon = take('pricePerGallon', numberField(values.pricePerGallon, { label: 'Gas price', required: false, fallback: 0, min: 0, max: 50 }));
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, input: { mode, milesDriven, gallonsUsed, pricePerGallon } };
  }
  const distanceMiles = take('distanceMiles', numberField(values.distanceMiles, { label: 'Distance', min: 0, minExclusive: true, max: 1_000_000 }));
  const mpg = take('mpg', numberField(values.mpg, { label: 'Fuel economy', min: 0, minExclusive: true, max: 500 }));
  const pricePerGallon = take('pricePerGallon', numberField(values.pricePerGallon, { label: 'Gas price', min: 0, minExclusive: true, max: 50 }));
  const people = take('people', numberField(values.people, { label: 'People sharing', required: false, fallback: 1, min: 1, max: 100, integer: true }));
  const compareMpg = take('compareMpg', numberField(values.compareMpg, { label: 'Compare with', required: false, fallback: null, min: 0, minExclusive: true, max: 500 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { mode, distanceMiles, mpg, pricePerGallon, roundTrip: values.roundTrip === 'on', people, compareMpg } };
}

export function buildFuelView(input) {
  if (input.mode === 'mpg') return { input, mpgResult: calculateMpg(input), trip: null };
  return { input, trip: calculateTripFuelCost(input), mpgResult: null };
}

/** Parse, validate and calculate. */
export function runFuelCalculator(values) {
  const parsed = parseFuelForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildFuelView(parsed.input) };
}
