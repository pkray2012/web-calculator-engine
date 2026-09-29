import test from 'node:test';
import assert from 'node:assert/strict';
import { volumeNeeded, areaCovered, shapeArea, CUBIC_METERS_PER_YARD } from '../src/calculators/cubic-yard.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

// References from an independent Python calculation.
test('a 12 × 10 ft bed, 3 in deep, 5% extra, with bags, weight and cost', () => {
  const result = volumeNeeded({
    shape: 'rect', lengthFeet: 12, widthFeet: 10, depthInches: 3, extraPercent: 5,
    bagCubicFeet: 2, truckYards: 10, tonsPerYard: 1.1, pricePerYard: 35, deliveryFee: 60
  });
  close(result.area, 120);
  close(result.netCubicFeet, 30);
  close(result.cubicYards, 1.1666666666666667);
  close(result.cubicMeters, 0.8919806676480001);
  assert.equal(result.bags, 16);
  assert.equal(result.truckloads, 1);
  close(result.tons, 1.2833333333333334);
  close(result.pounds, 2566.6666666666665, 1e-6);
  close(result.cost, 100.83333333333334);
  close(result.squareFeetPerYard, 108);
});

test('several identical areas: three 8 × 6 ft triangles and three 6 ft circles', () => {
  close(shapeArea({ shape: 'triangle', baseFeet: 8, heightFeet: 6 }), 24);
  const triangles = volumeNeeded({ shape: 'triangle', baseFeet: 8, heightFeet: 6, depthInches: 4, count: 3 });
  close(triangles.area, 72);
  close(triangles.cubicYards, 0.8888888888888888);
  const circles = volumeNeeded({ shape: 'round', diameterFeet: 6, depthInches: 2, count: 3 });
  close(circles.area, 84.82300164692441);
  close(circles.cubicYards, 0.5235987755982988);
});

test('a cubic yard is 27 cubic feet: 9 × 9 ft at 4 in is exactly 1 yard and 0.764554857984 m³', () => {
  const result = volumeNeeded({ shape: 'rect', lengthFeet: 9, widthFeet: 9, depthInches: 4 });
  close(result.cubicYards, 1, 1e-12);
  close(result.cubicFeet, 27, 1e-12);
  close(result.cubicMeters, 0.764554857984, 1e-12);
  close(CUBIC_METERS_PER_YARD, 0.764554857984, 1e-15);
});

test('exact multiples do not round up an extra bag or truckload', () => {
  const result = volumeNeeded({ shape: 'rect', lengthFeet: 9, widthFeet: 9, depthInches: 8, bagCubicFeet: 2, truckYards: 2 });
  assert.equal(result.bags, 27);
  assert.equal(result.truckloads, 1);
});

test('optional conversions are null when not requested', () => {
  const result = volumeNeeded({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 3 });
  assert.equal(result.bags, null);
  assert.equal(result.truckloads, null);
  assert.equal(result.tons, null);
  assert.equal(result.pounds, null);
  assert.equal(result.cost, null);
});

test('coverage: 5 cubic yards at 3 in with 10% set aside', () => {
  const result = areaCovered({ cubicYards: 5, depthInches: 3, extraPercent: 10 });
  close(result.area, 490.9090909090909);
  close(result.squareFeetPerYard, 108);
  close(result.squareSideFeet, 22.156468376279893);
  close(result.cubicFeet, 135);
});

test('coverage and volume are inverses', () => {
  for (const [depthInches, extraPercent] of [[1, 0], [3, 10], [6, 5], [12, 25]]) {
    const covered = areaCovered({ cubicYards: 7.5, depthInches, extraPercent });
    const side = Math.sqrt(covered.area);
    const back = volumeNeeded({ shape: 'rect', lengthFeet: side, widthFeet: side, depthInches, extraPercent });
    close(back.cubicYards, 7.5);
  }
});

test('invalid inputs are rejected', () => {
  assert.throws(() => volumeNeeded({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 0 }), RangeError);
  assert.throws(() => volumeNeeded({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 3, count: 1.5 }), RangeError);
  assert.throws(() => volumeNeeded({ shape: 'hexagon', depthInches: 3 }), RangeError);
  assert.throws(() => volumeNeeded({ shape: 'triangle', baseFeet: 4, heightFeet: 0, depthInches: 3 }), RangeError);
  assert.throws(() => volumeNeeded({ shape: 'rect', lengthFeet: 10, widthFeet: 10, depthInches: 3, tonsPerYard: -1 }), RangeError);
  assert.throws(() => areaCovered({ cubicYards: 0, depthInches: 3 }), RangeError);
  assert.throws(() => areaCovered({ cubicYards: 1, depthInches: Number.NaN }), RangeError);
});
