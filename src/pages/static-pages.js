/**
 * Home, about and not-found pages.
 */

import { html } from '../lib/html.js';
import { SITE, CATEGORIES, liveCalculators } from '../content/site.js';

export function homePage(origin) {
  const live = liveCalculators();
  const categories = Object.entries(CATEGORIES)
    .map(([key, category]) => ({ key, ...category, calculators: live.filter((calc) => calc.category === key) }))
    .filter((category) => category.calculators.length);

  const body = html`<div class="container">
<header class="page-header">
  <h1>Calculators that show their work</h1>
  <p class="lede">Clear answers for money decisions, home projects and everyday math. Each calculator shows the result, how it
  was worked out and the assumptions it makes, with no sign-up. Calculations run in your browser.</p>
</header>

<section class="content-section" aria-labelledby="calculators-heading" id="calculators">
  <h2 id="calculators-heading">Calculators</h2>
  ${categories.map((category) => html`<section class="category" aria-labelledby="cat-${category.key}">
    <h3 id="cat-${category.key}">${category.name}</h3>
    <p class="note">${category.description}</p>
    <ul class="card-list">
      ${category.calculators.map((calculator) => html`<li class="card">
        <a class="card__link" href="${calculator.path}">${calculator.name}</a>
        <p>${calculator.summary}</p>
      </li>`)}
    </ul>
  </section>`)}
</section>

<section class="content-section" aria-labelledby="principles-heading">
  <h2 id="principles-heading">What you can expect from every calculator</h2>
  <ul>
    <li><strong>The whole picture:</strong> totals, breakdowns and schedules where they matter, not just a single number.</li>
    <li><strong>Stated assumptions:</strong> what is and is not included is written next to the results.</li>
    <li><strong>Tested math:</strong> formulas are checked by automated tests against known results.</li>
    <li><strong>Private by design:</strong> your numbers stay in your browser.</li>
  </ul>
  <p><a href="/about/">How we build and test calculators</a></p>
</section>
</div>`;

  return {
    path: '/',
    title: `Money, Home Project & Everyday Calculators | ${SITE.name}`,
    description: SITE.description,
    body,
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: new URL('/', origin).href,
      inLanguage: SITE.locale
    }]
  };
}

export function aboutPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>How we build and test calculators</h1>
  <p class="lede">A calculator is only useful if you can trust its numbers and understand its limits. Here is how ours are made.</p>
</header>
<article class="content">
  <section class="content-section" aria-labelledby="engines-heading">
    <h2 id="engines-heading">Separate, tested calculation engines</h2>
    <p>The math for each calculator lives in its own small module, separate from the web page that displays it.
    The same module runs in automated tests and in your browser, so the numbers you see are the numbers that were tested.</p>
    <p>Tests cover normal cases, zero and boundary values, invalid inputs and published reference results.
    Amortization schedules must pay the balance to zero, and principal plus interest must equal each payment.</p>
  </section>
  <section class="content-section" aria-labelledby="assumptions-about-heading">
    <h2 id="assumptions-about-heading">Assumptions are part of the answer</h2>
    <p>Every calculator page lists what it includes and what it leaves out, such as fees, taxes or insurance.
    Precision is kept throughout the calculation, and amounts are rounded to cents only when they are displayed.</p>
  </section>
  <section class="content-section" aria-labelledby="not-advice-heading">
    <h2 id="not-advice-heading">Estimates, not advice</h2>
    <p>Results are estimates based on the numbers you enter. They are not loan offers, approvals or financial advice,
    and a lender, bank or tax authority may calculate differently. We do not recommend specific lenders or products.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-heading">
    <h2 id="privacy-heading">Your inputs stay in your browser</h2>
    <p>Calculations run on your device. The calculators do not send the numbers you enter to a server and do not require an account.</p>
  </section>
</article>
</div>`;

  return {
    path: '/about/',
    title: `How We Build and Test Calculators | ${SITE.name}`,
    description: 'How our financial calculators are built: separate tested calculation engines, stated assumptions, rounding rules and privacy. Estimates, not financial advice.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'How we build calculators', path: '/about/' }],
    body
  };
}

export function notFoundPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Page not found</h1>
  <p class="lede">That page does not exist or has moved.</p>
</header>
<p><a href="/">Browse all calculators</a></p>
</div>`;

  return {
    path: '/404.html',
    title: `Page not found | ${SITE.name}`,
    description: 'The page you requested could not be found.',
    noindex: true,
    body
  };
}
