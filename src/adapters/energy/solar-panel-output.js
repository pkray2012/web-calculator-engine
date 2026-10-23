/**
 * Adapter between the Solar Panel Output Calculator page and its engine.
 * Parses the form, calls calculateSolarPanelOutput() and shapes the result
 * for display. No formulas live here.
 */

import { calculateSolarPanelOutput, OUTPUT_LIMITS } from '../../calculators/energy/solar-panel-output.js';
import { numberField } from '../../lib/validation.js';
import { formatKwhRatio } from '../../lib/energy/format.js';
import { parseSunAndLosses, HIGH_LOSSES_NOTE } from './solar-panel-size.js';

/** Form values: an example size; sun hours and losses start blank (no default). */
export const OUTPUT_DEFAULTS = Object.freeze({
  sizeKw: '7.6',
  sunHours: '',
  losses: ''
});

/** The pre-rendered example. Illustrative values: 4.5 sun hours and 14% losses are example inputs, not defaults or typical values. */
export const OUTPUT_EXAMPLE = Object.freeze({ ...OUTPUT_DEFAULTS, sunHours: '4.5', losses: '14' });

export function parseOutputForm(values) {
  const errors = {};
  const size = numberField(values.sizeKw, { label: 'System size', ...OUTPUT_LIMITS.sizeKw });
  if (size.error) errors.sizeKw = size.error;
  const { sunHours, losses } = parseSunAndLosses(values, errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { sizeKw: size.value, sunHours, losses } };
}

export function buildOutputView(input) {
  const result = calculateSolarPanelOutput(input);
  return {
    input,
    result,
    dailyText: formatKwhRatio(result.exact.daily),
    annualText: formatKwhRatio(result.exact.annual),
    monthlyText: formatKwhRatio(result.exact.monthly),
    notes: result.highLosses ? [HIGH_LOSSES_NOTE] : []
  };
}

/** Parse, validate and calculate. */
export function runOutputCalculator(values) {
  const parsed = parseOutputForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildOutputView(parsed.input) };
}
