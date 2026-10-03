/**
 * Home, about and not-found pages.
 */

import { html } from '../lib/html.js';
import { SITE, CATEGORIES, POPULAR, liveCalculators, findCalculator } from '../content/site.js';

/** Words the home page search matches against: name, category and description. */
function searchText(calculator, category) {
  return `${calculator.name} ${category.name} ${calculator.description}`.toLowerCase();
}

export function homePage(origin, brand = {}) {
  const live = liveCalculators();
  const categories = Object.entries(CATEGORIES)
    .map(([key, category]) => ({ key, ...category, calculators: live.filter((calc) => calc.category === key) }))
    .filter((category) => category.calculators.length);
  const popular = POPULAR.map((slug) => findCalculator(slug)).filter((calc) => calc?.status === 'live');

  const body = html`<section class="home-hero" aria-labelledby="home-heading">
  <div class="container">
    <h1 id="home-heading">Free online calculators for money, home and everyday math</h1>
    <p class="home-hero__lede">${live.length} calculators for mortgages, loans, debt, savings, pay and home projects. Each one shows the formula and
    assumptions behind the answer, with no sign-up.</p>
    <form class="search" role="search" action="/" method="get" id="calc-search" data-total="${live.length}">
      <label class="search__label" for="search-input">Find a calculator</label>
      <div class="search__row">
        <input class="search__input" id="search-input" type="search" name="q" autocomplete="off" spellcheck="false"
          placeholder="Try “mortgage”, “concrete” or “tip”" aria-describedby="search-status">
        <button class="button search__button" type="submit">Search</button>
      </div>
      <p class="search__status" id="search-status" aria-live="polite"></p>
      <ul class="search__results" id="search-results" hidden></ul>
    </form>
  </div>
</section>

<div class="container">
<section class="home-section" aria-labelledby="popular-heading" id="popular">
  <h2 id="popular-heading">Popular calculators</h2>
  <ul class="tile-list">
    ${popular.map((calculator) => html`<li class="tile">
      <a class="tile__link" href="${calculator.path}">${calculator.name}</a>
      <p class="tile__text">${calculator.summary}</p>
    </li>`)}
  </ul>
</section>

<section class="home-section" aria-labelledby="calculators-heading" id="calculators">
  <h2 id="calculators-heading">All calculators by category</h2>
  <nav aria-label="Calculator categories">
    <ul class="category-nav">
      ${categories.map((category) => html`<li><a href="#${category.key}">${category.name} <span class="category-nav__count">${category.calculators.length}</span></a></li>`)}
    </ul>
  </nav>
  <div class="directory">
    ${categories.map((category) => html`<section class="directory__group" id="${category.key}" aria-labelledby="cat-${category.key}">
      <h3 id="cat-${category.key}">${category.name}</h3>
      <p class="directory__intro">${category.description}</p>
      <ul class="directory__list">
        ${category.calculators.map((calculator) => html`<li><a href="${calculator.path}" data-search="${searchText(calculator, category)}">${calculator.name}</a></li>`)}
      </ul>
    </section>`)}
  </div>
</section>

<section class="home-section home-trust" aria-labelledby="principles-heading">
  <h2 id="principles-heading">What you get with every ${SITE.name} calculator</h2>
  <ul class="trust-list">
    <li><strong>The whole picture.</strong> Totals, breakdowns and schedules where they matter, not just a single number.</li>
    <li><strong>Assumptions in plain sight.</strong> What is and is not included is written next to the results.</li>
    <li><strong>Tested math.</strong> Every formula is checked by automated tests against independent results.</li>
    <li><strong>Private by design.</strong> Calculations run in your browser, and your numbers are not sent anywhere.</li>
  </ul>
  <p><a href="/about/">How we build and test calculators</a></p>
</section>
</div>`;

  const url = new URL('/', origin).href;
  return {
    path: '/',
    title: `${SITE.name} — Free Online Calculators for Money, Home & More`,
    description: SITE.description,
    body,
    scripts: ['client/search.js'],
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      alternateName: `${SITE.name} Calculators`,
      url,
      inLanguage: SITE.locale
    }, {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url,
      ...(brand.mark ? { logo: new URL(brand.mark, origin).href } : {})
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
    description: `How ${SITE.name} calculators are built: separate tested calculation engines, stated assumptions, rounding rules and privacy. Estimates, not advice.`,
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
