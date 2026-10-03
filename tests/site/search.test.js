import test from 'node:test';
import assert from 'node:assert/strict';

import { rankCalculators } from '../../src/lib/search.js';
import { CATEGORIES, liveCalculators } from '../../src/content/site.js';

const calculators = liveCalculators().map((calc) => ({
  name: calc.name,
  text: `${calc.name} ${CATEGORIES[calc.category].name} ${calc.description}`.toLowerCase()
}));
const names = (query) => rankCalculators(query, calculators).map((calc) => calc.name);

test('a calculator name ranks first for its own name', () => {
  assert.equal(names('mortgage')[0], 'Mortgage Calculator');
  assert.equal(names('concrete')[0], 'Concrete Calculator');
  assert.equal(names('tip')[0], 'Tip Calculator');
  assert.equal(names('Credit card')[0], 'Credit Card Payoff Calculator');
});

test('descriptions and categories also match, and every word must appear', () => {
  assert.ok(names('pmi').includes('Mortgage Calculator'));
  assert.ok(names('air conditioner').includes('BTU Calculator'));
  assert.ok(names('home construction').length >= 10);
  assert.deepEqual(names('mortgage zzzz'), []);
});

test('an empty query matches nothing', () => {
  assert.deepEqual(names(''), []);
  assert.deepEqual(names('   '), []);
});
