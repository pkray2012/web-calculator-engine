/**
 * Privacy, terms, disclaimer and contact pages.
 *
 * The contact form is a Netlify form: Netlify detects it at deploy time (form
 * detection must be on in the site settings) and stores submissions, so no
 * email address is published. It posts to this origin, which the CSP's
 * form-action 'self' allows, and works without JavaScript.
 */

import { html } from '../lib/html.js';
import { SITE } from '../content/site.js';

export const LEGAL_UPDATED = '2026-10-20';
export const CONTACT_FORM_NAME = 'contact';
export const CONTACT_THANKS_PATH = '/contact/thanks/';

const updatedLine = html`<p class="lede">Last updated: October 20, 2026</p>`;
const contactLink = html`<a href="/contact/">contact form</a>`;

export function privacyPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Privacy policy</h1>
  ${updatedLine}
</header>
<article class="content">
  <section class="content-section" aria-labelledby="privacy-inputs-heading">
    <h2 id="privacy-inputs-heading">The numbers you enter stay on your device</h2>
    <p>${SITE.name} is a free collection of calculators. Every calculator runs in your browser. We do not send the values you type to a
    server, we do not store them, and you never need an account.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-host-heading">
    <h2 id="privacy-host-heading">Information our host processes</h2>
    <p>The site is hosted by Netlify. Like any web host, Netlify processes the technical information needed to deliver pages, such as
    your IP address, browser type and the page requested, and may keep it briefly in server logs for security and reliability.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-contact-heading">
    <h2 id="privacy-contact-heading">If you contact us</h2>
    <p>When you send a message through the ${contactLink}, we receive what you type: your message and, if you add them, your name, your
    email address and the page you are writing about. Netlify processes and stores the form for us. We use what you send only to read
    and answer your message. We do not sell it, share it for advertising or add you to a mailing list, and we keep messages only as long
    as we need them to deal with your request.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-cookies-heading">
    <h2 id="privacy-cookies-heading">Cookies, performance monitoring and advertising</h2>
    <p>${SITE.name} does not set its own cookies and does not show advertising or use third-party analytics trackers. Netlify adds a
    small script to each page that measures how quickly pages load and respond, so we can monitor site performance. If we add advertising
    or analytics, we will update this policy before it happens and explain what is collected and how to opt out.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-rights-heading">
    <h2 id="privacy-rights-heading">Your choices</h2>
    <p>Depending on where you live, you may have the right to ask what personal information we hold about you, or to have it corrected or
    deleted. In practice the only personal information we may hold is a message you sent us. To make a request, use the ${contactLink}.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-children-heading">
    <h2 id="privacy-children-heading">Children</h2>
    <p>This site is not directed to children under 13, and we do not knowingly collect personal information from them.</p>
  </section>
  <section class="content-section" aria-labelledby="privacy-changes-heading">
    <h2 id="privacy-changes-heading">Changes to this policy</h2>
    <p>We will update this page when our practices change and revise the date at the top.</p>
  </section>
</article>
</div>`;

  return {
    path: '/privacy/',
    title: `Privacy Policy | ${SITE.name}`,
    description: `How ${SITE.name} handles your information: calculator inputs stay in your browser, what our host processes, and what happens to contact form messages.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Privacy policy', path: '/privacy/' }],
    body
  };
}

export function termsPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Terms of use</h1>
  ${updatedLine}
</header>
<article class="content">
  <p>By using this website you agree to these terms. If you do not agree, please do not use the site.</p>
  <section class="content-section" aria-labelledby="terms-estimates-heading">
    <h2 id="terms-estimates-heading">Estimates only</h2>
    <p>Calculators produce estimates from the numbers you enter and the assumptions stated on each page. Results are not financial, tax,
    legal, engineering or other professional advice, and they are not offers of credit. A lender, tax authority, contractor or other
    provider may calculate differently. Check important decisions with a qualified professional. See the <a href="/disclaimer/">disclaimer</a>.</p>
  </section>
  <section class="content-section" aria-labelledby="terms-warranty-heading">
    <h2 id="terms-warranty-heading">No warranty</h2>
    <p>The site is provided “as is” and “as available”, without warranties of any kind. We work to keep every formula correct and tested,
    but we do not guarantee that any result is accurate, complete or current, or that the site will always be available.</p>
  </section>
  <section class="content-section" aria-labelledby="terms-liability-heading">
    <h2 id="terms-liability-heading">Limitation of liability</h2>
    <p>To the extent the law allows, ${SITE.name} is not liable for any loss or damage arising from your use of the site or your reliance
    on its results.</p>
  </section>
  <section class="content-section" aria-labelledby="terms-use-heading">
    <h2 id="terms-use-heading">Acceptable use</h2>
    <p>Do not use the site unlawfully, try to disrupt it, or access it automatically at a rate that degrades the service for others.</p>
  </section>
  <section class="content-section" aria-labelledby="terms-content-heading">
    <h2 id="terms-content-heading">Content and links</h2>
    <p>The text, design and code of this site belong to ${SITE.name} unless stated otherwise. Links to other websites, such as government
    sources, are provided for reference. We do not control or endorse those sites.</p>
  </section>
  <section class="content-section" aria-labelledby="terms-changes-heading">
    <h2 id="terms-changes-heading">Changes and questions</h2>
    <p>We may update these terms and will revise the date at the top when we do. Questions about these terms can be sent through the
    ${contactLink}.</p>
  </section>
</article>
</div>`;

  return {
    path: '/terms/',
    title: `Terms of Use | ${SITE.name}`,
    description: `The terms for using ${SITE.name} calculators: results are estimates, not advice, the site comes without warranty, and how to reach us with questions.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Terms of use', path: '/terms/' }],
    body
  };
}

export function disclaimerPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Disclaimer</h1>
  <p class="lede">${SITE.name} calculators give mathematical estimates, not advice.</p>
</header>
<article class="content">
  <section class="content-section" aria-labelledby="disclaimer-estimates-heading">
    <h2 id="disclaimer-estimates-heading">What the results are</h2>
    <p>Each calculator turns the numbers you enter into an estimate using the formula and assumptions shown on its page. The calculators do
    not know your credit profile, local taxes and fees, a lender's terms, building codes or the conditions of your project, and each page
    lists what it includes and what it leaves out.</p>
  </section>
  <section class="content-section" aria-labelledby="disclaimer-advice-heading">
    <h2 id="disclaimer-advice-heading">What they are not</h2>
    <p>Results are not financial, tax, legal, engineering or other professional advice, and they are not loan offers, quotes or approvals.
    We do not recommend specific lenders, products or contractors.</p>
  </section>
  <section class="content-section" aria-labelledby="disclaimer-check-heading">
    <h2 id="disclaimer-check-heading">Check before you decide</h2>
    <p>For lending, tax, legal or structural decisions, confirm the numbers with the lender, the tax authority or a licensed professional.
    If a result looks wrong, please tell us through the ${contactLink} so we can check it. Read more about
    <a href="/about/">how we build and test calculators</a>.</p>
  </section>
</article>
</div>`;

  return {
    path: '/disclaimer/',
    title: `Disclaimer | ${SITE.name}`,
    description: `${SITE.name} calculator results are mathematical estimates from your inputs, not financial, tax, legal or professional advice, quotes or approvals.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Disclaimer', path: '/disclaimer/' }],
    body
  };
}

const TOPICS = [
  ['calculation', 'A calculation looks wrong'],
  ['suggestion', 'Suggest a calculator'],
  ['other', 'Something else']
];

export function contactPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Contact ${SITE.name}</h1>
  <p class="lede">Found a result that looks wrong, or a calculator you would like to see? Send us a message.</p>
</header>
<article class="content">
  <form class="calc-form contact-form" name="${CONTACT_FORM_NAME}" method="post" action="${CONTACT_THANKS_PATH}"
    data-netlify="true" netlify-honeypot="company">
    <input type="hidden" name="form-name" value="${CONTACT_FORM_NAME}">
    <p hidden><label for="contact-company">Leave this field empty</label> <input id="contact-company" name="company" tabindex="-1" autocomplete="off"></p>
    <div class="field">
      <label for="contact-topic">What is it about?</label>
      <select id="contact-topic" name="topic">
        ${TOPICS.map(([value, label]) => html`<option value="${value}">${label}</option>`)}
      </select>
    </div>
    <div class="field">
      <label for="contact-message">Message</label>
      <p class="field__hint" id="contact-message-hint">For a calculation problem, include the numbers you entered and the result you expected.</p>
      <div class="input input--textarea">
        <textarea id="contact-message" name="message" rows="7" maxlength="5000" required aria-describedby="contact-message-hint"></textarea>
      </div>
    </div>
    <div class="field">
      <label for="contact-page">Page address <span class="field__optional">(optional)</span></label>
      <div class="input">
        <input id="contact-page" name="page" type="text" inputmode="url" autocomplete="off" spellcheck="false" maxlength="300">
      </div>
    </div>
    <div class="field">
      <label for="contact-name">Your name <span class="field__optional">(optional)</span></label>
      <div class="input">
        <input id="contact-name" name="name" type="text" autocomplete="name" maxlength="200">
      </div>
    </div>
    <div class="field">
      <label for="contact-email">Your email <span class="field__optional">(optional)</span></label>
      <p class="field__hint" id="contact-email-hint">Only if you would like a reply.</p>
      <div class="input">
        <input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="contact-email-hint">
      </div>
    </div>
    <button class="button" type="submit">Send message</button>
  </form>
  <section class="content-section" aria-labelledby="contact-notes-heading">
    <h2 id="contact-notes-heading">Before you write</h2>
    <ul>
      <li>We read every message, but we cannot give personal financial, tax or legal advice.</li>
      <li>We use what you send only to answer you. See the <a href="/privacy/">privacy policy</a>.</li>
    </ul>
  </section>
</article>
</div>`;

  return {
    path: '/contact/',
    title: `Contact Us | ${SITE.name}`,
    description: `Send ${SITE.name} a message: report a calculation that looks wrong, suggest a new calculator or ask a question about the site.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact/' }],
    body
  };
}

export function contactThanksPage() {
  const body = html`<div class="container">
<header class="page-header">
  <h1>Thanks, your message was sent</h1>
  <p class="lede">We read every message. If you left an email address and asked a question, we will reply there.</p>
</header>
<p><a href="/">Back to all calculators</a></p>
</div>`;

  return {
    path: CONTACT_THANKS_PATH,
    title: `Message sent | ${SITE.name}`,
    description: 'Your message to us was sent.',
    noindex: true,
    body
  };
}
