/**
 * Overtime Calculator form: the pay rate, the rule and the hours for each day
 * of the workweek. The federal overtime rate is hidden for California (CSS :has).
 */

import { html } from '../lib/html.js';
import { numberField, radioField } from './fields.js';
import { OVERTIME_DEFAULTS, DAY_NAMES, DAY_FIELDS } from '../adapters/overtime.js';
import { RULES } from '../calculators/overtime.js';

export const OVERTIME_FIELD_IDS = Object.freeze({
  hourlyRate: 'ot-rate',
  rule: 'ot-rule',
  overtimeMultiplier: 'ot-multiplier',
  weeks: 'ot-weeks',
  ...Object.fromEntries(DAY_FIELDS.map((field) => [field, `ot-${field.slice(5).toLowerCase()}`]))
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function overtimeForm(values = OVERTIME_DEFAULTS, errors = {}, quick = null) {
  const ids = OVERTIME_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form calc-form--ot" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  ${field('hourlyRate', { label: 'Regular hourly rate', prefix: '$' })}
  ${radioField({
    id: ids.rule, name: 'rule', legend: 'Overtime rule', value: values.rule,
    options: Object.entries(RULES).map(([value, label]) => ({ value, label, id: `ot-rule-${value}` }))
  })}
  <div class="mode-ot-federal">
    ${field('overtimeMultiplier', { label: 'Overtime rate', suffix: '× regular', optional: true, hint: '1.5 is the federal minimum; some employers pay more.' })}
  </div>
  <h3 class="form-group-title">Hours worked this workweek</h3>
  <p class="note">Start with the first day of your employer's workweek. Leave days off blank.</p>
  ${DAY_FIELDS.map((name, i) => field(name, { label: DAY_NAMES[i], suffix: 'hours', optional: true }))}
  ${field('weeks', { label: 'Weeks like this', suffix: 'weeks', inputmode: 'numeric', optional: true, hint: 'For example, 2 for a biweekly paycheck.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
