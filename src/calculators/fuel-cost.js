/**
 * Fuel cost for a trip, and fuel economy from a fill-up.
 *
 * - Trip: gallons = miles ÷ MPG; cost = gallons × price per gallon. A round
 *   trip doubles the distance. The cost can be split evenly between people.
 *   Cost per mile = price ÷ MPG.
 * - Optional comparison vehicle: the same trip at a second MPG, and the
 *   difference in cost.
 * - Fill-up: MPG = miles driven ÷ gallons to refill the tank.
 * - Metric: L/100 km = 100 × 3.785411784 ÷ (1.609344 × MPG), from the exact
 *   definitions of the US gallon (231 cubic inches) and the mile.
 */

const LITERS_PER_GALLON = 3.785411784;
const KM_PER_MILE = 1.609344;

function positive(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

/** MPG → liters per 100 kilometers. */
export const litersPer100Km = (mpg) => (100 * LITERS_PER_GALLON) / (KM_PER_MILE * mpg);

/**
 * @param {object} input
 * @param {number} input.distanceMiles one-way distance
 * @param {number} input.mpg
 * @param {number} input.pricePerGallon
 * @param {boolean} [input.roundTrip]
 * @param {number} [input.people] people sharing the cost
 * @param {number | null} [input.compareMpg] a second vehicle's MPG
 */
export function calculateTripFuelCost({ distanceMiles, mpg, pricePerGallon, roundTrip = false, people = 1, compareMpg = null }) {
  positive('distanceMiles', distanceMiles);
  positive('mpg', mpg);
  nonNegative('pricePerGallon', pricePerGallon);
  if (!Number.isInteger(people) || people < 1) throw new RangeError('people must be a whole number of 1 or more');
  if (compareMpg !== null) positive('compareMpg', compareMpg);

  const miles = distanceMiles * (roundTrip ? 2 : 1);
  const trip = (economy) => {
    const gallons = miles / economy;
    return { mpg: economy, gallons, cost: gallons * pricePerGallon, costPerMile: pricePerGallon / economy };
  };
  const main = trip(mpg);
  const compare = compareMpg === null ? null : trip(compareMpg);
  return {
    miles,
    ...main,
    costPerPerson: main.cost / people,
    compare: compare && { ...compare, difference: compare.cost - main.cost }
  };
}

/**
 * @param {object} input
 * @param {number} input.milesDriven miles since the last fill-up
 * @param {number} input.gallonsUsed gallons to refill the tank
 * @param {number} [input.pricePerGallon]
 */
export function calculateMpg({ milesDriven, gallonsUsed, pricePerGallon = 0 }) {
  positive('milesDriven', milesDriven);
  positive('gallonsUsed', gallonsUsed);
  nonNegative('pricePerGallon', pricePerGallon);
  const mpg = milesDriven / gallonsUsed;
  return { mpg, litersPer100Km: litersPer100Km(mpg), costPerMile: pricePerGallon > 0 ? pricePerGallon / mpg : null, fillCost: gallonsUsed * pricePerGallon };
}
