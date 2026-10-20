/**
 * Frequently asked questions and the direct-answer block that opens a
 * calculator page. Build-time only.
 *
 * An FAQ is a list of { question, answer } pairs with plain-text answers, so
 * the visible section and its FAQPage structured data come from the same
 * strings and cannot drift apart. Questions must be ones the page genuinely
 * answers, with figures computed from the engine.
 */

import { html } from '../lib/html.js';

/** @typedef {{ question: string, answer: string }} Faq */

/** @param {Faq[]} faqs */
export function faqSection(faqs, idPrefix = 'faq') {
  if (!faqs.length) return html``;
  return html`<section class="content-section faq" aria-labelledby="${idPrefix}-heading">
  <h2 id="${idPrefix}-heading">Frequently asked questions</h2>
  ${faqs.map((faq) => html`<h3>${faq.question}</h3>
  <p>${faq.answer}</p>`)}
</section>`;
}

/** @param {Faq[]} faqs */
export function faqStructuredData(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };
}

/**
 * One or two sentences under the H1 that answer the page's question directly
 * and state the formula, for readers and for answer engines.
 */
export function directAnswer(content) {
  return html`<p class="callout direct-answer">${content}</p>`;
}
