import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSquareFootageForm, runSquareFootageCalculator, SQFT_DEFAULTS } from '../../src/adapters/square-footage.js';
import { squareFootageResults, squareFootageQuickResult, squareFootageAnnouncement } from '../../src/components/square-footage-results.js';
import { squareFootageForm, SQFT_FIELD_IDS } from '../../src/components/square-footage-form.js';

function view(values) {
  const result = runSquareFootageCalculator({ ...SQFT_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: 12 × 14 ft', () => {
  const result = view({});
  const markup = String(squareFootageResults(result));
  assert.match(markup, /168 sq ft/);
  assert.match(markup, /15\.61 m²/);
  assert.match(markup, /18\.67/);
  assert.match(markup, /24,192/);
  assert.match(String(squareFootageQuickResult(result)), /<strong>168 sq ft<\/strong> \(15\.61 m²\)/);
  assert.equal(squareFootageAnnouncement(result), '168 square feet, 15.61 square meters.');
});

test('other shapes, units, count and price', () => {
  assert.match(String(squareFootageQuickResult(view({ shape: 'circle' }))), /78\.54 sq ft/);
  assert.match(String(squareFootageQuickResult(view({ shape: 'tri' }))), /<strong>24 sq ft/);
  assert.match(String(squareFootageQuickResult(view({ shape: 'trap' }))), /<strong>96 sq ft/);
  assert.match(String(squareFootageQuickResult(view({ unit: 'm', length: '4', width: '5' }))), /215\.28 sq ft<\/strong> \(20 m²\)/);
  const markup = String(squareFootageResults(view({ count: '3', price: '4.50' })));
  assert.match(markup, /3 areas of 168 sq ft/);
  assert.match(markup, /504 sq ft/);
  assert.match(markup, /\$2,268\.00/);
});

test('each shape validates only its own dimensions; unknown shape and unit fall back', () => {
  assert.deepEqual(parseSquareFootageForm({ ...SQFT_DEFAULTS, shape: 'circle', length: '' }).input, { shape: 'circle', unit: 'ft', dims: { diameter: 10 }, count: 1, pricePerSquareFoot: 0 });
  assert.equal(parseSquareFootageForm({ ...SQFT_DEFAULTS, width: '0' }).errors.width, 'Width must be greater than 0.');
  assert.equal(parseSquareFootageForm({ ...SQFT_DEFAULTS, shape: 'trap', sideB: '' }).errors.sideB, 'Side b is required.');
  const odd = parseSquareFootageForm({ ...SQFT_DEFAULTS, shape: 'star', unit: 'mi' }).input;
  assert.equal(odd.shape, 'rect');
  assert.equal(odd.unit, 'ft');
  assert.equal(parseSquareFootageForm({ ...SQFT_DEFAULTS, count: '1.5' }).errors.count, 'Number of areas must be a whole number.');
});

test('form labels every field', () => {
  const markup = String(squareFootageForm(SQFT_DEFAULTS, { length: 'Length is required.' }));
  for (const [name, id] of Object.entries(SQFT_FIELD_IDS)) if (name !== 'shape') assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /<option value="ft" selected>feet<\/option>/);
  assert.match(markup, /aria-invalid="true"/);
});
