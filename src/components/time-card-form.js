/**
 * Time Card Calculator form: one row per day with start, end and break.
 * Rendered at build time and reused by the browser controller for field ids.
 */

import { html } from '../lib/html.js';
import { numberField, timeField } from './fields.js';
import { TIME_CARD_DEFAULTS, TIME_CARD_DAYS } from '../adapters/time-card.js';

export const TIME_CARD_FIELD_IDS = Object.freeze({
  ...Object.fromEntries(TIME_CARD_DAYS.flatMap(({ key }) => [
    [`${key}Start`, `tc-${key}-start`], [`${key}End`, `tc-${key}-end`], [`${key}Break`, `tc-${key}-break`]
  ])),
  hourlyRate: 'tc-rate',
  overtimeAfterHours: 'tc-ot-after',
  overtimeMultiplier: 'tc-ot-rate'
});

/**
 * @param {Record<string, string>} [values] raw form values
 * @param {Record<string, string>} [errors] messages by field
 * @param {unknown} [quick] optional pre-rendered quick-result markup
 */
export function timeCardForm(values = TIME_CARD_DEFAULTS, errors = {}, quick = null) {
  const ids = TIME_CARD_FIELD_IDS;
  const field = (name, options) => numberField({ id: ids[name], name, value: values[name], error: errors[name], ...options });
  return html`<form class="calc-form" id="calc-form" action="" method="get" novalidate>
  <div class="error-slot" id="calc-form-errors"></div>
  <h3 class="form-group-title">Hours by day</h3>
  <p class="field__hint">Leave days off blank. A shift that ends after midnight counts toward the day it started.</p>
  ${TIME_CARD_DAYS.map(({ key, name }) => html`<fieldset class="time-row">
    <legend>${name}</legend>
    <div class="time-row__cells">
      ${timeField({ id: ids[`${key}Start`], name: `${key}Start`, label: 'Start', value: values[`${key}Start`], error: errors[`${key}Start`] })}
      ${timeField({ id: ids[`${key}End`], name: `${key}End`, label: 'End', value: values[`${key}End`], error: errors[`${key}End`] })}
      <div class="time-cell${errors[`${key}Break`] ? ' field--invalid' : ''}" data-field="${ids[`${key}Break`]}">
        <label for="${ids[`${key}Break`]}">Break (min)</label>
        <div class="input"><input id="${ids[`${key}Break`]}" name="${key}Break" type="text" inputmode="numeric" autocomplete="off" value="${values[`${key}Break`]}" aria-describedby="${ids[`${key}Break`]}-error"${errors[`${key}Break`] ? html` aria-invalid="true"` : ''}></div>
        <p class="field__error" id="${ids[`${key}Break`]}-error"${errors[`${key}Break`] ? '' : ' hidden'}>${errors[`${key}Break`] ?? ''}</p>
      </div>
    </div>
  </fieldset>`)}
  <h3 class="form-group-title">Pay (optional)</h3>
  ${field('hourlyRate', { label: 'Hourly rate', prefix: '$', optional: true })}
  ${field('overtimeAfterHours', { label: 'Overtime after', suffix: 'hours a week', optional: true, hint: '40 hours under the federal rule; some employers and states differ.' })}
  ${field('overtimeMultiplier', { label: 'Overtime pay rate', suffix: '× regular', optional: true, hint: '1.5 is "time and a half".' })}
  <button class="button" type="submit">Calculate</button>
  <p class="quick-result" id="quick-result"${quick ? '' : ' hidden'}>${quick ?? ''}</p>
</form>`;
}
