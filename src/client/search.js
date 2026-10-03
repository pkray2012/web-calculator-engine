/**
 * Home page calculator search. Filters the calculator directory already in
 * the page (links carrying data-search), so there is no index to download and
 * the directory below still works without JavaScript.
 */

import { rankCalculators } from '../lib/search.js';

const MAX_RESULTS = 8;

const form = /** @type {HTMLFormElement | null} */ (document.getElementById('calc-search'));
const input = /** @type {HTMLInputElement | null} */ (document.getElementById('search-input'));
const list = document.getElementById('search-results');
const status = document.getElementById('search-status');

if (form && input && list && status) {
  const calculators = [...document.querySelectorAll('#calculators a[data-search]')].map((link) => ({
    name: link.textContent.trim(),
    href: link.getAttribute('href'),
    text: link.getAttribute('data-search')
  }));

  let matches = [];

  const render = () => {
    const query = input.value.trim();
    matches = rankCalculators(query, calculators);
    list.replaceChildren(...matches.slice(0, MAX_RESULTS).map((calc) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = calc.href;
      link.textContent = calc.name;
      item.append(link);
      return item;
    }));
    list.hidden = matches.length === 0;
    if (!query) status.textContent = '';
    else if (!matches.length) status.textContent = `No calculator matches “${query}”. Browse every calculator by category below.`;
    else status.textContent = `${matches.length} ${matches.length === 1 ? 'calculator matches' : 'calculators match'}.`;
  };

  input.addEventListener('input', render);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      render();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render();
    if (matches.length) window.location.assign(matches[0].href);
  });

  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {
    input.value = initial;
    render();
  }
}
