/**
 * Document shell and site-wide navigation. Server/build-time only.
 */

import { html, jsonLd } from '../lib/html.js';

/**
 * page: { path, title, description, noindex?, structuredData?: object[],
 *         breadcrumbs?: [{ name, path }], body: SafeHtml,
 *         scripts?: string[],    module entry points relative to the JS root, e.g. "client/auto-loan.js"
 *         preload?: string[] }   the rest of their module graph, preloaded so it downloads in parallel
 * ctx.assets: { css, js } public paths; js is the fingerprinted module root.
 * ctx: { site, origin, nav: [{ name, path }], directory: [{ name, calculators: [{ name, path }] }], assets }
 */
export function renderDocument(page, ctx) {
  const canonical = page.noindex ? null : new URL(page.path, ctx.origin).href;
  const structured = [...(page.structuredData ?? [])];
  if (page.breadcrumbs?.length) structured.push(breadcrumbData(page.breadcrumbs, ctx.origin));

  return `<!doctype html>
${html`<html lang="${ctx.site.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
${page.noindex ? html`<meta name="robots" content="noindex">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${ctx.site.name}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
<meta name="theme-color" content="#0b5cad">
<link rel="stylesheet" href="${ctx.assets.css}">
${(page.preload ?? []).map((src) => html`<link rel="modulepreload" href="${ctx.assets.js}${src}">`)}
${structured.map((data) => jsonLd(data))}
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
${siteHeader(page, ctx)}
<main id="main" tabindex="-1">
${page.breadcrumbs?.length ? breadcrumbNav(page.breadcrumbs) : ''}
${page.body}
</main>
${siteFooter(ctx)}
${(page.scripts ?? []).map((src) => html`<script type="module" src="${ctx.assets.js}${src}"></script>`)}
</body>
</html>`}
`;
}

function siteHeader(page, ctx) {
  return html`<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-name" href="/">${ctx.site.name}</a>
    <nav aria-label="Main">
      <ul class="site-nav">
        ${ctx.nav.map((item) => html`<li><a href="${item.path}"${item.path === page.path ? html` aria-current="page"` : ''}>${item.name}</a></li>`)}
      </ul>
    </nav>
  </div>
</header>`;
}

function siteFooter(ctx) {
  return html`<footer class="site-footer">
  <div class="container">
    <p><strong>Estimates, not advice.</strong> Results are mathematical estimates based on the numbers you enter.
    They are not loan offers or financial advice, and a lender's figures may differ.</p>
    <nav aria-label="All calculators" class="footer-directory">
      ${(ctx.directory ?? []).map((group) => html`<div class="footer-directory__group">
        <p class="footer-directory__title">${group.name}</p>
        <ul>${group.calculators.map((calc) => html`<li><a href="${calc.path}">${calc.name}</a></li>`)}</ul>
      </div>`)}
    </nav>
    <nav aria-label="Footer">
      <ul class="footer-nav">
        <li><a href="/">All calculators</a></li>
        <li><a href="/about/">How we build calculators</a></li>
      </ul>
    </nav>
    <p class="footer-meta">${ctx.site.name}. Calculations run in your browser; inputs are not sent anywhere.</p>
  </div>
</footer>`;
}

function breadcrumbNav(crumbs) {
  return html`<nav class="breadcrumbs container" aria-label="Breadcrumb">
  <ol>
    ${crumbs.map((crumb, index) => index === crumbs.length - 1
    ? html`<li><span aria-current="page">${crumb.name}</span></li>`
    : html`<li><a href="${crumb.path}">${crumb.name}</a></li>`)}
  </ol>
</nav>`;
}

function breadcrumbData(crumbs, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.path, origin).href
    }))
  };
}

/** Links to live related calculators; renders nothing when there are none. */
export function relatedLinks(calculators) {
  if (!calculators.length) return html``;
  return html`<section class="content-section" aria-labelledby="related-heading">
  <h2 id="related-heading">Related calculators</h2>
  <ul class="card-list">
    ${calculators.map((calculator) => html`<li class="card">
      <a class="card__link" href="${calculator.path}">${calculator.name}</a>
      <p>${calculator.summary}</p>
    </li>`)}
  </ul>
</section>`;
}

/**
 * Official sources behind the factual claims on a page, each with the claim it
 * supports. Renders nothing when a page cites none.
 */
export function sourcesSection(sources) {
  if (!sources.length) return html``;
  return html`<section class="content-section" aria-labelledby="sources-heading">
  <h2 id="sources-heading">Sources</h2>
  <ul class="sources">
    ${sources.map((source) => html`<li><a href="${source.url}">${source.title}</a>, ${source.publisher}. <span class="note">${source.supports}</span></li>`)}
  </ul>
</section>`;
}
