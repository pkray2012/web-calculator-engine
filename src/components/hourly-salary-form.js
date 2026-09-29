/**
 * Hourly to Salary Calculator form: pay for one period, then the work
 * schedule that links hourly pay to a salary. Rendered at build time and
 * reused by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField } from './fields.js';
import { HOURLY_SALARY_DEFAULTS } from '../adapters/hourly-salary.js';
import { PAY_PERIODS } from '../calculators/hourly-salary.js';

export const HOURLY_SALARY_FIELD_IDS = Object.freeze({
  amount: 'hs-amount',
  period: 'hs-period',
  hoursPerWeek: 'hs-hours',
  daysPerWeek: 'hs-days',
  weeksPerYear: 'hs-weeks',
  overtimeHours: 'hs-ot-hours',
  overtimeMultiplier: 'hs-ot-rate',
  paidDaysOff: 'hs-days-off'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function hourlySalaryForm(values = HOURLY_SALARY_DEFAULTS, errors = {}, quick = null) {
  const ids = HOURLY_SALARY_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <fieldset class="field field--group${errors.amount ? ' field--invalid' : ''}" data-field="${ids.amount}">
    <legend>Your pay</legend>
    <p class="field__hint" id="${ids.amount}-hint">Gross pay before taxes, for one hour, day, week, paycheck or year.</p>
    <div class="field__row">
      <div class="input input--prefix">
        <span class="input__affix" aria-hidden="true">$</span>
        <label class="visually-hidden" for="${ids.amount}">Pay amount</label>
        <input id="${ids.amount}" name="amount" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${values.amount}"
          aria-describedby="${ids.amount}-hint ${ids.amount}-error"${errors.amount ? html` aria-invalid="true"` : ''} required>
      </div>
      <label class="visually-hidden" for="${ids.period}">Pay period</label>
      <select id="${ids.period}" name="period">
        ${Object.entries(PAY_PERIODS).map(([value, { per }]) => html`<option value="${value}"${value === values.period ? ' selected' : ''}>${per}</option>`)}
      </select>
    </div>
    <p class="field__error" id="${ids.amount}-error"${errors.amount ? '' : ' hidden'}>${errors.amount ?? ''}</p>
  </fieldset>
  <h3 class="form-group-title">Your schedule</h3>
  ${field('hoursPerWeek', { label: 'Hours a week', suffix: 'hours', optional: true, hint: '40 is full time. Regular hours, not counting overtime.' })}
  ${field('daysPerWeek', { label: 'Days a week', suffix: 'days', optional: true })}
  ${field('weeksPerYear', { label: 'Paid weeks a year', suffix: 'weeks', optional: true, hint: '52 if you are paid all year, including paid vacation. Fewer if you take unpaid time off.' })}
  <h3 class="form-group-title">Optional</h3>
  ${field('overtimeHours', { label: 'Overtime hours', suffix: 'a week', optional: true })}
  ${field('overtimeMultiplier', { label: 'Overtime pay rate', suffix: '× regular', optional: true, hint: '1.5 is "time and a half".' })}
  ${field('paidDaysOff', { label: 'Paid days off', suffix: 'days a year', optional: true, hint: 'Paid vacation and holidays. Shows what you earn per hour actually worked.' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
