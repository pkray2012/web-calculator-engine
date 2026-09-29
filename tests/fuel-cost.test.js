import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTripFuelCost, calculateMpg, litersPer100Km } from '../src/calculators/fuel-cost.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('250 miles at 28 MPG and $3.50 a gallon is 8.93 gallons and $31.25', () => {
  const trip = calculateTripFuelCost({ distanceMiles: 250, mpg: 28, pricePerGallon: 3.5 });
  assert.equal(trip.miles, 250);
  close(trip.gallons, 250 / 28);
  close(trip.cost, 31.25);
  close(trip.costPerMile, 0.125);
  close(trip.costPerPerson, 31.25);
  assert.equal(trip.compare, null);
});

test('a round trip doubles the distance; the cost splits evenly', () => {
  const trip = calculateTripFuelCost({ distanceMiles: 300, mpg: 25, pricePerGallon: 4, roundTrip: true, people: 3 });
  assert.equal(trip.miles, 600);
  close(trip.gallons, 24);
  close(trip.cost, 96);
  close(trip.costPerPerson, 32);
});

test('comparison vehicle: difference is its cost minus the main cost', () => {
  const trip = calculateTripFuelCost({ distanceMiles: 1000, mpg: 30, pricePerGallon: 3.6, compareMpg: 20 });
  close(trip.cost, 120);
  close(trip.compare.cost, 180);
  close(trip.compare.difference, 60);
  const better = calculateTripFuelCost({ distanceMiles: 1000, mpg: 30, pricePerGallon: 3.6, compareMpg: 40 });
  close(better.compare.difference, 90 - 120);
});

test('zero price is allowed and costs nothing', () => {
  assert.equal(calculateTripFuelCost({ distanceMiles: 10, mpg: 20, pricePerGallon: 0 }).cost, 0);
});

test('MPG from a fill-up: 320 miles on 11.2 gallons is 28.6 MPG, 8.23 L/100 km', () => {
  const result = calculateMpg({ milesDriven: 320, gallonsUsed: 11.2, pricePerGallon: 3.5 });
  close(result.mpg, 320 / 11.2);
  assert.equal(result.mpg.toFixed(1), '28.6');
  assert.equal(result.litersPer100Km.toFixed(2), '8.23');
  close(result.costPerMile, 3.5 / (320 / 11.2));
  close(result.fillCost, 39.2);
  assert.equal(calculateMpg({ milesDriven: 300, gallonsUsed: 10 }).costPerMile, null);
});

test('metric conversion: 23.5215 MPG is 10 L/100 km, and the conversion is its own inverse', () => {
  close(litersPer100Km(235.2145833333333 / 10), 10, 1e-9);
  for (const mpg of [10, 25, 33.3, 50, 120]) close(litersPer100Km(litersPer100Km(mpg)), mpg, 1e-9);
});

test('trip cost is consistent with MPG from the same numbers', () => {
  let seed = 5;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 1000; i++) {
    const distanceMiles = 1 + rand() * 3000;
    const mpg = 5 + rand() * 100;
    const pricePerGallon = rand() * 8;
    const trip = calculateTripFuelCost({ distanceMiles, mpg, pricePerGallon });
    close(calculateMpg({ milesDriven: trip.miles, gallonsUsed: trip.gallons }).mpg, mpg, 1e-9 * mpg);
    close(trip.cost, trip.costPerMile * trip.miles, 1e-9 * Math.max(1, trip.cost));
  }
});

test('invalid inputs throw', () => {
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 0, mpg: 25, pricePerGallon: 3 }), RangeError);
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 10, mpg: 0, pricePerGallon: 3 }), RangeError);
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 10, mpg: 25, pricePerGallon: -1 }), RangeError);
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 10, mpg: 25, pricePerGallon: 3, people: 0 }), RangeError);
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 10, mpg: 25, pricePerGallon: 3, people: 1.5 }), RangeError);
  assert.throws(() => calculateTripFuelCost({ distanceMiles: 10, mpg: 25, pricePerGallon: 3, compareMpg: 0 }), RangeError);
  assert.throws(() => calculateMpg({ milesDriven: 100, gallonsUsed: 0 }), RangeError);
  assert.throws(() => calculateMpg({ milesDriven: NaN, gallonsUsed: 3 }), RangeError);
});
