/**
 * The /energy/ev/ hub (D13, limited to the EV cluster on this integration
 * branch): a short introduction and the released EV calculators. There is no
 * /energy/ root page.
 */

import { html } from '../../lib/html.js';
import { ENERGY_RELEASED, EV_HUB } from '../../content/energy-release.js';

export function evHubPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>${EV_HUB.name}</h1>
  <p class="lede">What it costs to charge and drive an electric car, from your own electricity rate and your car's figures.
  Each calculator shows its formula and assumptions, and your inputs stay in your browser.</p>
</header>

<article class="content">
  <section class="content-section" aria-labelledby="ev-hub-list-heading">
    <h2 id="ev-hub-list-heading">Calculators</h2>
    <ul class="card-list">
      ${ENERGY_RELEASED.map((calculator) => html`<li class="card">
        <a class="card__link" href="${calculator.path}">${calculator.name}</a>
        <p>${calculator.summary}</p>
      </li>`)}
    </ul>
  </section>
</article>
</div>`;

  return {
    path: EV_HUB.path,
    title: 'Electric Vehicle Calculators: EV Charging Cost & Cost per Mile',
    description: 'Calculators for the cost of charging an electric car, its electricity cost per mile and its fuel savings against a gas car, from your own rate and figures.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: EV_HUB.name, path: EV_HUB.path }],
    body,
    structuredData: [],
    scripts: []
  };
}

/** A released EV page with the hub in its breadcrumb trail: Home → EV calculators → page. */
export function underEvHub(page) {
  const [home, ...rest] = page.breadcrumbs;
  return { ...page, breadcrumbs: [home, { name: EV_HUB.name, path: EV_HUB.path }, ...rest] };
}
