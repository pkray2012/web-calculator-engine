/**
 * Adapter between the Fence Calculator page and its engine. Parses raw form
 * values, calls calculateFence() and shapes the result for display. No
 * formulas live here.
 */

import { calculateFence } from '../calculators/fence.js';
import { numberField } from '../lib/validation.js';

export const FENCE_LIMITS = Object.freeze({ maxLength: 5_000, maxSpacing: 12, maxRails: 6, maxPicket: 24, maxGap: 12, maxPrice: 1_000 });

/**
 * Illustrative example values: 150 ft of 6 ft privacy-style fence with posts
 * 8 ft apart, three rails per section and nominal 1 × 6 pickets (5.5 in wide)
 * set with a small gap.
 */
export const FENCE_DEFAULTS = Object.freeze({
  lengthFeet: '150',
  postSpacingFeet: '8',
  railsPerSection: '3',
  picketWidthInches: '5.5',
  gapInches: '0.25',
  wastePercent: '5',
  pricePerPost: '',
  pricePerRail: '',
  pricePerPicket: ''
});

export function parseFenceForm(values) {
  const errors = {};
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  const lengthFeet = take('lengthFeet', numberField(values.lengthFeet, { label: 'Fence length', min: 0, minExclusive: true, max: FENCE_LIMITS.maxLength }));
  const postSpacingFeet = take('postSpacingFeet', numberField(values.postSpacingFeet, { label: 'Post spacing', min: 0, minExclusive: true, max: FENCE_LIMITS.maxSpacing }));
  const railsPerSection = take('railsPerSection', numberField(values.railsPerSection, { label: 'Rails per section', min: 1, max: FENCE_LIMITS.maxRails, integer: true }));
  const picketWidthInches = take('picketWidthInches', numberField(values.picketWidthInches, { label: 'Picket width', min: 0, minExclusive: true, max: FENCE_LIMITS.maxPicket }));
  const gapInches = take('gapInches', numberField(values.gapInches, { label: 'Gap between pickets', required: false, fallback: 0, min: 0, max: FENCE_LIMITS.maxGap }));
  const wastePercent = take('wastePercent', numberField(values.wastePercent, { label: 'Extra pickets', required: false, fallback: 0, min: 0, max: 50 }));
  const price = (field, label) => take(field, numberField(values[field], { label, required: false, fallback: 0, min: 0, max: FENCE_LIMITS.maxPrice }));
  const pricePerPost = price('pricePerPost', 'Price per post');
  const pricePerRail = price('pricePerRail', 'Price per rail');
  const pricePerPicket = price('pricePerPicket', 'Price per picket');
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { lengthFeet, postSpacingFeet, railsPerSection, picketWidthInches, gapInches, wastePercent, pricePerPost, pricePerRail, pricePerPicket } };
}

export function buildFenceView(input) {
  return { input, ...calculateFence(input) };
}

/** Parse, validate and calculate. */
export function runFenceCalculator(values) {
  const parsed = parseFenceForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildFenceView(parsed.input) };
}
