/**
 * Adapter between the Deck Calculator page and its engine. Parses raw form
 * values, calls calculateDeck() and shapes the result for display. No
 * formulas live here.
 */

import { calculateDeck } from '../calculators/deck.js';
import { numberField } from '../lib/validation.js';

export const DECK_LIMITS = Object.freeze({ maxSide: 200, maxBoardWidth: 12, maxGap: 1, maxBoardLength: 24, maxSpacing: 24, maxScrews: 4, maxPrice: 1_000 });

/**
 * Illustrative example values: a 16 × 12 ft deck of 5.5-inch boards with a
 * 1/8-inch gap, 16-foot boards, joists 16 inches on center and 10% extra.
 */
export const DECK_DEFAULTS = Object.freeze({
  widthFeet: '16',
  depthFeet: '12',
  boardWidthInches: '5.5',
  gapInches: '0.125',
  boardLengthFeet: '16',
  joistSpacingInches: '16',
  wastePercent: '10',
  screwsPerCrossing: '2',
  pricePerBoard: '',
  pricePerJoist: ''
});

export function parseDeckForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const L = DECK_LIMITS;
  const widthFeet = take('widthFeet', numberField(values.widthFeet, { label: 'Deck width', min: 0, minExclusive: true, max: L.maxSide }));
  const depthFeet = take('depthFeet', numberField(values.depthFeet, { label: 'Deck depth', min: 0, minExclusive: true, max: L.maxSide }));
  const boardWidthInches = take('boardWidthInches', numberField(values.boardWidthInches, { label: 'Board width', min: 0, minExclusive: true, max: L.maxBoardWidth }));
  const gapInches = take('gapInches', numberField(values.gapInches, { label: 'Gap between boards', required: false, fallback: 0, min: 0, max: L.maxGap }));
  const boardLengthFeet = take('boardLengthFeet', numberField(values.boardLengthFeet, { label: 'Board length', min: 0, minExclusive: true, max: L.maxBoardLength }));
  const joistSpacingInches = take('joistSpacingInches', numberField(values.joistSpacingInches, { label: 'Joist spacing', min: 4, max: L.maxSpacing }));
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra boards', required: false, fallback: 0, min: 0, max: 50 }));
  const screwsPerCrossing = take('screwsPerCrossing', numberField(values.screwsPerCrossing, { label: 'Screws per joist', required: false, fallback: 2, min: 0, max: L.maxScrews, integer: true }));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: L.maxPrice }));
  const pricePerBoard = price('pricePerBoard', 'Price per board');
  const pricePerJoist = price('pricePerJoist', 'Price per joist');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { widthFeet, depthFeet, boardWidthInches, gapInches, boardLengthFeet, joistSpacingInches, wastePercent, screwsPerCrossing, pricePerBoard, pricePerJoist } };
}

export function buildDeckView(input) {
  return { input, ...calculateDeck(input) };
}

/** Parse, validate and calculate. */
export function runDeckCalculator(values) {
  const parsed = parseDeckForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildDeckView(parsed.input) };
}
