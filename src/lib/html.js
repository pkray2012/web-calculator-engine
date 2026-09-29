/**
 * Minimal HTML templating shared by the static build and the browser.
 * Interpolated values are escaped unless they are already SafeHtml.
 */

export class SafeHtml {
  constructor(value) {
    this.value = String(value);
  }

  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

function render(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

/** Tagged template: html`<p>${userText}</p>` escapes userText. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += render(values[i]) + strings[i + 1];
  }
  return new SafeHtml(out);
}

/** Mark trusted markup (e.g. JSON-LD or prebuilt fragments) as safe. */
export function raw(value) {
  return new SafeHtml(value);
}

/** Serialize JSON for a <script type="application/ld+json"> block. */
export function jsonLd(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return raw(`<script type="application/ld+json">${json}</script>`);
}
