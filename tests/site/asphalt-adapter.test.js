import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAsphaltForm, runAsphaltCalculator, ASPHALT_DEFAULTS } from '../../src/adapters/asphalt.js';
import { asphaltResults, asphaltQuickResult, asphaltAnnouncement } from '../../src/components/asphalt-results.js';
import { asphaltForm, ASPHALT_FIELD_IDS } from '../../src/components/asphalt-form.js';

function view(values) {
  const result = runAsphaltCalculator({ ...ASPHALT_DEFAULTS, ...values });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result.view;
}

test('default: 40 × 12 × 3 in', () => {
  const result = view({});
  const markup = String(asphaltResults(result));
  assert.match(markup, /9\.14 tons/);
  assert.match(markup, /4\.44 cu yd/);
  assert.match(markup, /480 sq ft/);
  assert.match(markup, /class="is-selected" aria-current="true">\s*<th scope="row">3 in/);
  assert.doesNotMatch(markup, /Cost/);
  assert.match(String(asphaltQuickResult(result)), /<strong>9\.14 tons<\/strong> of asphalt \(4\.44 cu yd\)/);
  assert.equal(asphaltAnnouncement(result), '9.14 tons of asphalt to order, 4.44 cubic yards.');
});

test('price adds cost; blank optional fields use defaults', () => {
  assert.match(String(asphaltResults(view({ pricePerTon: '100' }))), /\$913\.50/);
  const parsed = parseAsphaltForm({ ...ASPHALT_DEFAULTS, densityLbPerCuFt: '', wastePercent: '' });
  assert.equal(parsed.input.densityLbPerCuFt, 145);
  assert.equal(parsed.input.wastePercent, 0);
});

test('validation messages', () => {
  const bad = parseAsphaltForm({ ...ASPHALT_DEFAULTS, lengthFeet: '', thicknessInches: '30', densityLbPerCuFt: '10' });
  assert.equal(bad.errors.lengthFeet, 'Length is required.');
  assert.equal(bad.errors.thicknessInches, 'Thickness must be 24 or less.');
  assert.equal(bad.errors.densityLbPerCuFt, 'Density must be at least 50.');
});

test('form labels every field', () => {
  const markup = String(asphaltForm(ASPHALT_DEFAULTS, { lengthFeet: 'Length is required.' }));
  for (const id of Object.values(ASPHALT_FIELD_IDS)) assert.match(markup, new RegExp(`for="${id}"`));
  assert.match(markup, /aria-invalid="true"/);
});
