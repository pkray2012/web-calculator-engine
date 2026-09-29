/**
 * Two-panel calculator layout (inputs + results) with the element ids the
 * browser controller in src/client/calculator.js expects.
 */

import { html } from '../lib/html.js';

/**
 * form: form markup (must use id="calc-form" and include #calc-form-errors).
 * exampleNote: status text describing the pre-rendered example.
 * results: pre-rendered results markup.
 */
export function calculatorShell({ inputsHeading, form, exampleNote, results }) {
  return html`<div class="calculator" id="calculator">
  <section class="calculator__inputs" aria-labelledby="inputs-heading">
    <h2 id="inputs-heading">${inputsHeading}</h2>
    ${form}
    <noscript><p class="note">Turn on JavaScript to calculate your own numbers. The results show the example values.</p></noscript>
  </section>
  <div class="calculator__results" id="calc-results" data-state="example">
    <p class="results-status" id="results-status" tabindex="-1">${exampleNote}</p>
    <div id="calc-results-body">${results}</div>
  </div>
  <p class="visually-hidden" id="calc-announcer" aria-live="polite" aria-atomic="true"></p>
</div>`;
}
