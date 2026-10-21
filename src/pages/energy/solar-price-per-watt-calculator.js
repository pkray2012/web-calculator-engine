/**
 * Solar Price Per Watt Calculator page (draft, Home Energy Batch 1). Not
 * imported by scripts/build.js until the owner releases it. Every figure in
 * the copy is computed from the engine at build time.
 */

import { html } from '../../lib/html.js';
import { formatCurrency } from '../../lib/format.js';
import { ppwForm } from '../../components/energy/solar-price-per-watt-form.js';
import { ppwResults, ppwQuickResult } from '../../components/energy/solar-price-per-watt-results.js';
import { relatedLinks, sourcesSection } from '../../components/layout.js';
import { calculatorShell } from '../../components/calculator-shell.js';
import { faqSection, faqStructuredData, directAnswer } from '../../components/faq.js';
import { PPW_DEFAULTS, parsePpwForm, buildPpwView, formatPerWatt } from '../../adapters/energy/solar-price-per-watt.js';
import { calculatePricePerWatt } from '../../calculators/energy/solar-price-per-watt.js';
import { findEnergyCalculator, relatedEnergyCalculators } from '../../content/energy-batch1.js';
import { ENERGY_SOURCES } from '../../content/energy-sources.js';

export function solarPricePerWattPage() {
  const calculator = findEnergyCalculator('solar-price-per-watt-calculator');
  const example = buildPpwView(parsePpwForm(PPW_DEFAULTS).input);
  const withIncentives = calculatePricePerWatt({ priceCents: 2_400_000, size: 8, unit: 'kW', incentivesCents: 200_000 });
  const price = formatCurrency(example.input.priceCents / 100).replace('.00', '');
  const gross = formatPerWatt(example.result.grossPerWatt);
  const net = formatPerWatt(withIncentives.netPerWatt);

  const faqs = [
    {
      question: 'How do I compare solar quotes?',
      answer: `Divide each quote's installed price by its system size in watts, using the DC rating on each quote, so every quote is on the same basis. A ${price} quote for an 8 kW (8,000 W) system is ${gross}.`
    },
    {
      question: 'What is net price per watt?',
      answer: `It is the price after the incentives you enter, divided by the same watts. With $2,000 of incentives, the ${price} quote for 8 kW is ${net}.`
    },
    {
      question: 'Does price per watt include batteries?',
      answer: 'It includes whatever the quote includes. If one quote has a battery and another doesn\'t, their prices per watt are not comparable; compare panel-only prices, or quotes with the same equipment.'
    }
  ];

  const body = html`<div class="container">
<header class="page-header">
  <h1>${calculator.name}</h1>
  ${directAnswer(html`<strong>Price per watt = total installed price ÷ system size in watts.</strong> A ${price} quote for an 8 kW (8,000 W) system is ${gross};
  with $2,000 of incentives, ${net}.`)}
  <p class="lede">Work out the price per watt of a solar quote, before and after incentives, to compare quotes of different sizes.
  Your inputs stay in your browser.</p>
</header>

${calculatorShell({
    inputsHeading: 'Your quote',
    form: ppwForm(PPW_DEFAULTS, {}, ppwQuickResult(example)),
    exampleNote: `Example: a ${price} quote for an 8 kW system (an illustrative price, not a typical one). Enter your quote to update.`,
    results: ppwResults(example)
  })}

<article class="content">
  <section class="content-section" aria-labelledby="ppw-how-heading">
    <h2 id="ppw-how-heading">How to work out price per watt</h2>
    <ol>
      <li><strong>Convert the size to watts:</strong> 8 kW × 1,000 = 8,000 W.</li>
      <li><strong>Divide the price by the watts:</strong> ${price} ÷ 8,000 W = ${gross}.</li>
      <li><strong>For the net price,</strong> subtract incentives first: ($24,000 − $2,000) ÷ 8,000 W = ${net}.</li>
    </ol>
    <p class="formula"><code>Price per watt = installed price ÷ (system size in kW × 1,000)</code></p>
  </section>

  <section class="content-section" aria-labelledby="ppw-assumptions-heading">
    <h2 id="ppw-assumptions-heading">Assumptions and limits</h2>
    <ul>
      <li>Use the DC rating on the quote: the total of the panels' watt ratings. Residential solar prices and sizes are usually quoted this way (<a href="${ENERGY_SOURCES.dcRating.url}">Annual Technology Baseline</a>). Some quotes also give an AC rating; compare every quote on the same rating.</li>
      <li>Only the incentives you enter are subtracted.</li>
      <li>Price per watt compares quotes; it does not tell you how much electricity a system will produce or how long it takes to pay back.</li>
    </ul>
  </section>

  <section class="content-section" aria-labelledby="ppw-method-heading">
    <h2 id="ppw-method-heading">Methodology and testing</h2>
    <p>The price and incentives are converted to whole cents; the size in kW is multiplied by 1,000. Results are rounded half up to the cent.
    Automated tests check the worked examples, sizes in W and kW, incentives up to the full price and the input limits.
    <a href="/about/">How we build and test calculators</a>.</p>
  </section>

  ${faqSection(faqs, 'ppw-faq')}

  ${sourcesSection([ENERGY_SOURCES.dcRating])}

  ${relatedLinks(relatedEnergyCalculators(calculator.slug))}
</article>
</div>`;

  return {
    path: calculator.path,
    title: calculator.title,
    description: calculator.description,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: calculator.name, path: calculator.path }],
    body,
    structuredData: [faqStructuredData(faqs)],
    scripts: ['client/energy/solar-price-per-watt.js']
  };
}
