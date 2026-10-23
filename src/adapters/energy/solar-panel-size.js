/**
 * Adapter between the Solar Panel Size Calculator page and its engine. Parses
 * the form, calls calculateSolarPanelSize() and shapes the result for display.
 * No formulas live here.
 */

import { calculateSolarPanelSize, SIZE_LIMITS } from '../../calculators/energy/solar-panel-size.js';
import { SUN_LIMITS } from '../../calculators/energy/solar-sun-hours.js';
import { numberField } from '../../lib/validation.js';
import { ratioDecimal } from '../../lib/energy/format.js';
import { formatCount } from '../../lib/format.js';

export const HIGH_LOSSES_NOTE = 'Losses are unusually high; check the value.';

/** Sun hours and losses are the user's own: both are required and have no default (C-M7). */
export function parseSunAndLosses(values, errors) {
  const take = (field, result) => {
    if (result.error) errors[field] = result.error;
    return result.value;
  };
  return {
    sunHours: take('sunHours', numberField(values.sunHours, { label: 'Peak sun hours', ...SUN_LIMITS.sunHours })),
    losses: take('losses', numberField(values.losses, { label: 'System losses', ...SUN_LIMITS.losses }))
  };
}

/** Form values: example annual use and panel rating; sun hours and losses start blank (no default). */
export const SIZE_DEFAULTS = Object.freeze({
  annualKwh: '10800',
  sunHours: '',
  losses: '',
  panelWatts: '400'
});

/** The pre-rendered example. Illustrative values: 4.5 sun hours and 14% losses are example inputs, not defaults or typical values. */
export const SIZE_EXAMPLE = Object.freeze({ ...SIZE_DEFAULTS, sunHours: '4.5', losses: '14' });

export function parseSizeForm(values) {
  const errors = {};
  const annual = numberField(values.annualKwh, { label: 'Yearly electricity use', ...SIZE_LIMITS.annualKwh });
  if (annual.error) errors.annualKwh = annual.error;
  const { sunHours, losses } = parseSunAndLosses(values, errors);
  const panel = numberField(values.panelWatts, { label: 'Panel rating', required: false, fallback: null, ...SIZE_LIMITS.panelWatts });
  if (panel.error) errors.panelWatts = panel.error;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: { annualKwh: annual.value, sunHours, losses, panelWatts: panel.value } };
}

export function buildSizeView(input) {
  const result = calculateSolarPanelSize(input);
  return {
    input,
    result,
    sizeText: `${ratioDecimal(result.sizeKwRatio, 2)} kW`,
    panelsText: result.panels === null ? null : formatCount(result.panels),
    notes: result.highLosses ? [HIGH_LOSSES_NOTE] : []
  };
}

/** Parse, validate and calculate. */
export function runSizeCalculator(values) {
  const parsed = parseSizeForm(values);
  if (!parsed.ok) return parsed;
  return { ok: true, input: parsed.input, view: buildSizeView(parsed.input) };
}
