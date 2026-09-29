import test from 'node:test';
import assert from 'node:assert/strict';
import { roomAcSize, chartRow, SIZING_CHART } from '../src/calculators/btu.js';

test('chart rows follow the ENERGY STAR sizing chart, with boundaries in the smaller row', () => {
  assert.equal(chartRow(100).btu, 5000);
  assert.equal(chartRow(150).btu, 5000);
  assert.equal(chartRow(150.5).btu, 6000);
  assert.equal(chartRow(320).btu, 8000);
  assert.equal(chartRow(500).btu, 12000);
  assert.equal(chartRow(700).btu, 14000);
  assert.equal(chartRow(1000).btu, 18000);
  // Contiguous rows with rising capacity.
  for (let i = 1; i < SIZING_CHART.length; i += 1) {
    assert.equal(SIZING_CHART[i].fromSquareFeet, SIZING_CHART[i - 1].toSquareFeet);
    assert.ok(SIZING_CHART[i].btu > SIZING_CHART[i - 1].btu);
  }
});

// References from an independent Python calculation.
test('a sunny 320 sq ft room used by four people', () => {
  const result = roomAcSize({ squareFeet: 320, sun: 'sunny', people: 4 });
  assert.equal(result.baseBtu, 8000);
  assert.equal(result.sunBtu, 800);
  assert.equal(result.extraPeople, 2);
  assert.equal(result.peopleBtu, 1200);
  assert.equal(result.btu, 10000);
  assert.ok(Math.abs(result.watts - 2930.7107017) < 1e-6);
});

test('a shaded 500 sq ft room is 10% below the chart', () => {
  assert.equal(roomAcSize({ squareFeet: 500, sun: 'shaded' }).btu, 10800);
});

test('a kitchen adds 4,000 BTU; one or two people add nothing', () => {
  assert.equal(roomAcSize({ squareFeet: 120, kitchen: true, people: 1 }).btu, 9000);
  assert.equal(roomAcSize({ squareFeet: 120, people: 0 }).btu, 5000);
});

test('every adjustment together on the largest row', () => {
  const result = roomAcSize({ squareFeet: 900, sun: 'sunny', people: 5, kitchen: true });
  assert.equal(result.btu, 25600);
  assert.ok(Math.abs(result.tons - 25600 / 12000) < 1e-12);
});

test('areas outside the chart and invalid inputs are rejected', () => {
  assert.throws(() => roomAcSize({ squareFeet: 99 }), RangeError);
  assert.throws(() => roomAcSize({ squareFeet: 1001 }), RangeError);
  assert.throws(() => roomAcSize({ squareFeet: 300, people: 2.5 }), RangeError);
  assert.throws(() => roomAcSize({ squareFeet: 300, people: -1 }), RangeError);
  // @ts-expect-error unknown exposure
  assert.throws(() => roomAcSize({ squareFeet: 300, sun: 'partly' }), RangeError);
  assert.throws(() => roomAcSize({ squareFeet: Number.NaN }), RangeError);
});
