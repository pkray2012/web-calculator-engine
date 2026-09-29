/**
 * Adapter between the Board Foot Calculator page and its engine. Parses raw
 * form values (thickness may be written in the quarter system, e.g. "5/4"),
 * calls calculateBoardFeet() and shapes the result for display. No formulas
 * live here.
 */

import { calculateBoardFeet } from '../calculators/board-foot.js';
import { numberField } from '../lib/validation.js';

export const BOARD_FOOT_ROWS = Object.freeze([1, 2, 3, 4]);

/** Illustrative stacks: ten 4/4 × 6 in × 8 ft boards and four 5/4 × 8 in × 10 ft boards. */
export const BOARD_FOOT_DEFAULTS = Object.freeze({
  row1Quantity: '10', row1Thickness: '4/4', row1Width: '6', row1Length: '8',
  row2Quantity: '4', row2Thickness: '5/4', row2Width: '8', row2Length: '10',
  row3Quantity: '', row3Thickness: '', row3Width: '', row3Length: '',
  row4Quantity: '', row4Thickness: '', row4Width: '', row4Length: '',
  wastePercent: '15',
  pricePerBoardFoot: ''
});

/** "5/4" → 1.25 inches (quarters of an inch), "1.5" → 1.5. */
export function parseThickness(raw, label) {
  const text = String(raw ?? '').trim();
  if (text === '') return { error: `${label} is required.` };
  const quarter = /^(\d+)\s*\/\s*4$/.exec(text);
  if (quarter) {
    const value = Number(quarter[1]) / 4;
    if (value <= 0 || value > 24) return { error: `${label} must be between 1/4 and 96/4.` };
    return { value };
  }
  return numberField(text, { label, min: 0, minExclusive: true, max: 24 });
}

export function parseBoardFootForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const blank = (field) => String(values[field] ?? '').trim() === '';
  const pieces = [];
  for (const n of BOARD_FOOT_ROWS) {
    const keys = ['Quantity', 'Thickness', 'Width', 'Length'].map((part) => `row${n}${part}`);
    if (n > 1 && keys.every(blank)) continue;
    const quantity = take(keys[0], numberField(values[keys[0]], { label: `Row ${n} quantity`, min: 1, max: 10_000, integer: true }));
    const thicknessInches = take(keys[1], parseThickness(values[keys[1]], `Row ${n} thickness`));
    const widthInches = take(keys[2], numberField(values[keys[2]], { label: `Row ${n} width`, min: 0, minExclusive: true, max: 120 }));
    const lengthFeet = take(keys[3], numberField(values[keys[3]], { label: `Row ${n} length`, min: 0, minExclusive: true, max: 100 }));
    pieces.push({ row: n, quantity, thicknessInches, widthInches, lengthFeet });
  }
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra for waste', required: false, fallback: 0, min: 0, max: 100 }));
  const pricePerBoardFoot = take('pricePerBoardFoot', numberField(values.pricePerBoardFoot, { label: 'Price per board foot', required: false, fallback: 0, min: 0, max: 1_000 }));
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { pieces, wastePercent, pricePerBoardFoot } };
}

export function buildBoardFootView(input) {
  return { input, ...calculateBoardFeet(input) };
}

/** Parse, validate and calculate. */
export function runBoardFootCalculator(values) {
  const parsed = parseBoardFootForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildBoardFootView(parsed.input) };
}
