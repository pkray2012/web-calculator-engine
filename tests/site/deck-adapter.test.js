import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDeckForm, runDeckCalculator, DECK_DEFAULTS } from '../../src/adapters/deck.js';
import { deckResults, deckQuickResult, deckAnnouncement } from '../../src/components/deck-results.js';
import { deckForm, DECK_FIELD_IDS } from '../../src/components/deck-form.js';

function view(values) {
  const result = runDeckCalculator({ ...DECK_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default example: 16 × 12 ft deck', () => {
  const result = view({});
  const markup = String(deckResults(result));
  assert.match(markup, /Deck boards/);
  assert.match(markup, /192 sq ft/);
  assert.match(markup, /26 rows of boards, 1 board per row: 416 linear feet/);
  assert.match(markup, /Add prices to estimate/);
  assert.doesNotMatch(markup, /is-selected/);
  assert.match(String(deckQuickResult(result)), /<strong>29 deck boards<\/strong>, 13 joists and 676 screws/);
  assert.equal(deckAnnouncement(result), '29 deck boards, 13 joists and 676 screws for a 192 square foot deck.');
});

test('prices add a total row', () => {
  const markup = String(deckResults(view({ pricePerBoard: '$30', pricePerJoist: '20' })));
  assert.match(markup, /\$870\.00/);
  assert.match(markup, /\$260\.00/);
  assert.match(markup, /class="is-selected" aria-current="true">\s*<th scope="row">Total<\/th>\s*<td class="num"><\/td>\s*<td class="num">\$1,130\.00/);
});

test('blank optional fields use their fallbacks', () => {
  const parsed = parseDeckForm({ ...DECK_DEFAULTS, gapInches: '', wastePercent: '', screwsPerCrossing: '' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.input.gapInches, 0);
  assert.equal(parsed.input.wastePercent, 0);
  assert.equal(parsed.input.screwsPerCrossing, 2);
});

test('validation messages', () => {
  const bad = parseDeckForm({ ...DECK_DEFAULTS, widthFeet: '', depthFeet: '0', joistSpacingInches: '2', screwsPerCrossing: '1.5', gapInches: '2' });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.widthFeet, 'Deck width is required.');
  assert.equal(bad.errors.depthFeet, 'Deck depth must be greater than 0.');
  assert.equal(bad.errors.joistSpacingInches, 'Joist spacing must be at least 4.');
  assert.equal(bad.errors.screwsPerCrossing, 'Screws per joist must be a whole number.');
  assert.equal(bad.errors.gapInches, 'Gap between boards must be 1 or less.');
});

test('form labels every field and shows errors inline', () => {
  const markup = String(deckForm(DECK_DEFAULTS, { widthFeet: 'Deck width is required.' }));
  for (const id of Object.values(DECK_FIELD_IDS)) assert.match(markup, new RegExp(`<label for="${id}"`));
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /Deck width is required\./);
});
