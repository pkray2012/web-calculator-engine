import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSquareFootage, shapeArea } from '../src/calculators/square-footage.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test('12 × 14 ft room is 168 sq ft = 18.67 sq yd = 15.61 m² = 24,192 sq in', () => {
  const r = calculateSquareFootage({ shape: 'rect', dims: { length: 12, width: 14 } });
  assert.equal(r.squareFeet, 168);
  close(r.squareYards, 168 / 9);
  close(r.squareMeters, 15.60771072);
  assert.equal(r.squareInches, 24192);
  close(r.acres, 168 / 43560);
  assert.equal(r.cost, null);
});

test('shapes: circle, triangle, trapezoid', () => {
  close(shapeArea('circle', { diameter: 10 }), 25 * Math.PI);
  assert.equal(shapeArea('tri', { base: 8, height: 6 }), 24);
  assert.equal(shapeArea('trap', { sideA: 10, sideB: 14, height: 8 }), 96);
  // A trapezoid with equal sides is a rectangle; a zero-width side makes a triangle.
  assert.equal(shapeArea('trap', { sideA: 5, sideB: 5, height: 4 }), shapeArea('rect', { length: 5, width: 4 }));
});

test('units: the same floor in inches, yards, meters and centimeters', () => {
  const ft = calculateSquareFootage({ shape: 'rect', dims: { length: 12, width: 14 } }).squareFeet;
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 144, width: 168 }, unit: 'in' }).squareFeet, ft);
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 4, width: 14 / 3 }, unit: 'yd' }).squareFeet, ft);
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 12 * 0.3048, width: 14 * 0.3048 }, unit: 'm' }).squareFeet, ft);
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 12 * 30.48, width: 14 * 30.48 }, unit: 'cm' }).squareFeet, ft);
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 4, width: 5 }, unit: 'm' }).squareMeters, 20);
});

test('one acre is 43,560 sq ft; count and cost multiply', () => {
  close(calculateSquareFootage({ shape: 'rect', dims: { length: 43560, width: 1 } }).acres, 1);
  const r = calculateSquareFootage({ shape: 'rect', dims: { length: 10, width: 12 }, count: 3, pricePerSquareFoot: 4.5 });
  assert.equal(r.eachSquareFeet, 120);
  assert.equal(r.squareFeet, 360);
  assert.equal(r.cost, 1620);
});

test('random: m² from meters matches the direct product', () => {
  let seed = 17;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 2000; i++) {
    const a = 0.1 + rand() * 100;
    const b = 0.1 + rand() * 100;
    close(calculateSquareFootage({ shape: 'rect', dims: { length: a, width: b }, unit: 'm' }).squareMeters, a * b, 1e-9);
    close(calculateSquareFootage({ shape: 'tri', dims: { base: a, height: b } }).squareFeet * 2, calculateSquareFootage({ shape: 'rect', dims: { length: a, width: b } }).squareFeet, 1e-9);
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => calculateSquareFootage({ shape: 'rect', dims: { length: 0, width: 5 } }), RangeError);
  assert.throws(() => calculateSquareFootage({ shape: 'hexagon', dims: {} }), RangeError);
  assert.throws(() => calculateSquareFootage({ shape: 'rect', dims: { length: 1, width: 1 }, unit: 'mi' }), RangeError);
  assert.throws(() => calculateSquareFootage({ shape: 'rect', dims: { length: 1, width: 1 }, count: 0 }), RangeError);
  assert.throws(() => calculateSquareFootage({ shape: 'circle', dims: { diameter: NaN } }), RangeError);
});
