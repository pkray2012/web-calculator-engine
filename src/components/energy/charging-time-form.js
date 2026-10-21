/**
 * Forms for the two charging-time pages: Solar Battery Charging Time and EV
 * Charging Time (which adds the vehicle's maximum AC charging rate). The
 * measurement point starts unselected and efficiency starts blank: neither
 * has a default. Rendered at build time and reused by the browser controller
 * for field ids.
 */

import { html } from '../../lib/html.js';
import { numberField } from '../fields.js';
import { choiceField } from './choice-field.js';
import { BATTERY_DEFAULTS, EV_TIME_DEFAULTS } from '../../adapters/energy/charging-time.js';

const fieldIds = (prefix, vehicle) => Object.freeze({
  capacity: `${prefix}-capacity`,
  startLevel: `${prefix}-start`,
  targetLevel: `${prefix}-target`,
  power: `${prefix}-power`,
  basis: `${prefix}-basis`,
  efficiency: `${prefix}-efficiency`,
  ...(vehicle ? { vehicleMax: `${prefix}-vehicle-max` } : {})
});

export const BATTERY_FIELD_IDS = fieldIds('battery', false);
export const EV_TIME_FIELD_IDS = fieldIds('evtime', true);

export const BASIS_HINT = 'Use "going into the battery" only if you know the figure is measured there, for example a battery monitor\'s or charge controller\'s reading of battery input. A charger\'s or station\'s displayed figure may not be measured there.';

/** The capacity and charge-level fields every charging form starts with. */
export function levelFields(ids, values, errors, { start = 'Current charge level' } = {}) {
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`${field('capacity', { label: 'Usable battery capacity', suffix: 'kWh', hint: 'Usable, not total, capacity.' })}
  ${field('startLevel', { label: start, suffix: '%' })}
  ${field('targetLevel', { label: 'Target charge level', suffix: '%' })}`;
}

function chargeForm(ids, values, errors, quick, { vehicle }) {
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${levelFields(ids, values, errors, { start: vehicle ? 'Start charge level' : 'Current charge level' })}
  ${field('power', { label: 'Charging power', suffix: 'kW', hint: vehicle ? 'The charger\'s power rating, or the power shown while charging.' : 'The charging power from your inverter, charger or monitor.' })}
  ${choiceField({
    id: ids.basis, name: 'basis', legend: 'Where is the power measured?', value: values.basis, hint: BASIS_HINT, error: errors.basis,
    options: [
      { value: 'wall', label: 'At the wall or source (before losses)' },
      { value: 'battery', label: 'Going into the battery (only if you know the figure is measured there)' }
    ]
  })}
  ${field('efficiency', { label: 'Charging efficiency', suffix: '%', optional: true, hint: 'Required when the power is measured at the wall or source. The share of that energy that ends up in the battery.' })}
  ${vehicle ? field('vehicleMax', { label: 'Vehicle\'s maximum AC charging rate', suffix: 'kW', optional: true, hint: 'From the vehicle\'s specifications. Used only when the power is measured at the wall.' }) : ''}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}

export function batteryForm(values = BATTERY_DEFAULTS, errors = {}, quick = null) {
  return chargeForm(BATTERY_FIELD_IDS, values, errors, quick, { vehicle: false });
}

export function evTimeForm(values = EV_TIME_DEFAULTS, errors = {}, quick = null) {
  return chargeForm(EV_TIME_FIELD_IDS, values, errors, quick, { vehicle: true });
}
