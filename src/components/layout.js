/**
 * Document shell and site-wide navigation. Server/build-time only.
 */

import { html, jsonLd } from '../lib/html.js';

/**
 * page: { path, title, description, noindex?, structuredData?: object[],
 *         breadcrumbs?: [{ name, path }], body: SafeHtml,
 *         scripts?: string[],    module entry points relative to the JS root, e.g. "client/auto-loan.js"
 *         preload?: string[] }   the rest of their module graph, preloaded so it downloads in parallel
 * ctx.assets: { css, js, brand } public paths; js is the fingerprinted module root and
 * brand holds the fingerprinted logo and icon files (see BRAND_FILES in scripts/build.js).
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
<meta property="og:image" content="${new URL(ctx.assets.brand.og, ctx.origin).href}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${ctx.site.name}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="${ctx.assets.brand.icon32}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${ctx.assets.brand.appleTouch}">
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
${ctx.site.ads ? adSlot('page-end') : ''}
</main>
${siteFooter(ctx)}
${(page.scripts ?? []).map((src) => html`<script type="module" src="${ctx.assets.js}${src}"></script>`)}
</body>
</html>`}
`;
}

/** The logo, served at 1x, 2x and 3x from the same source image. */
function logo(ctx, className) {
  const { logo40, logo80, logo120 } = ctx.assets.brand;
  return html`<img class="${className}" src="${logo40}" srcset="${logo40} 1x, ${logo80} 2x, ${logo120} 3x" width="167" height="40" alt="${ctx.site.name}">`;
}

function siteHeader(page, ctx) {
  return html`<header class="site-header">
  <div class="container site-header__inner">
    <a class="site-logo" href="/">${logo(ctx, 'site-logo__img')}</a>
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
    <nav aria-label="All calculators" class="footer-directory">
      ${(ctx.directory ?? []).map((group) => html`<div class="footer-directory__group">
        <p class="footer-directory__title">${group.name}</p>
        <ul>${group.calculators.map((calc) => html`<li><a href="${calc.path}">${calc.name}</a></li>`)}</ul>
      </div>`)}
    </nav>
    <div class="footer-bottom">
      <a class="footer-logo" href="/">${logo(ctx, 'footer-logo__img')}</a>
      <nav aria-label="Footer">
        <ul class="footer-nav">
          <li><a href="/#calculators">All calculators</a></li>
          <li><a href="/about/">How we build calculators</a></li>
        </ul>
      </nav>
    </div>
    <p class="footer-note"><strong>Estimates, not advice.</strong> Results are mathematical estimates based on the numbers you enter.
    They are not loan offers or financial, tax or legal advice, and a lender's or tax authority's figures may differ.
    Calculations run in your browser; the numbers you enter are not sent anywhere.</p>
  </div>
</footer>`;
}

/**
 * A reserved display-ad placement. Rendered only when SITE.ads is on; it keeps
 * its height before the ad loads, so nothing on the page moves when it fills.
 */
export function adSlot(name) {
  return html`<aside class="ad-slot ad-slot--${name}" aria-label="Advertisement" data-ad-slot="${name}"></aside>`;
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
