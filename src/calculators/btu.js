/**
 * Room air conditioner size (cooling capacity in BTU per hour) from the
 * ENERGY STAR room air conditioner sizing chart and its adjustments:
 *
 * - Base capacity by the area to be cooled, 100 to 1,000 square feet.
 * - Heavily shaded room: reduce capacity by 10%. Very sunny room: increase it
 *   by 10%.
 * - More than two people regularly in the room: add 600 BTU for each
 *   additional person.
 * - Unit used in a kitchen: add 4,000 BTU.
 *
 * The percentage adjustment applies to the chart capacity; the people and
 * kitchen additions are then added. Rooms over 1,000 square feet are outside
 * the chart and need a whole-house or professional load calculation.
 */

/** ENERGY STAR sizing chart: [area up to (sq ft), capacity (BTU per hour)]. */
export const SIZING_CHART = Object.freeze([
  Object.freeze({ fromSquareFeet: 100, toSquareFeet: 150, btu: 5000 }),
  Object.freeze({ fromSquareFeet: 150, toSquareFeet: 250, btu: 6000 }),
  Object.freeze({ fromSquareFeet: 250, toSquareFeet: 300, btu: 7000 }),
  Object.freeze({ fromSquareFeet: 300, toSquareFeet: 350, btu: 8000 }),
  Object.freeze({ fromSquareFeet: 350, toSquareFeet: 400, btu: 9000 }),
  Object.freeze({ fromSquareFeet: 400, toSquareFeet: 450, btu: 10000 }),
  Object.freeze({ fromSquareFeet: 450, toSquareFeet: 550, btu: 12000 }),
  Object.freeze({ fromSquareFeet: 550, toSquareFeet: 700, btu: 14000 }),
  Object.freeze({ fromSquareFeet: 700, toSquareFeet: 1000, btu: 18000 })
]);

export const MIN_SQUARE_FEET = SIZING_CHART[0].fromSquareFeet;
export const MAX_SQUARE_FEET = SIZING_CHART[SIZING_CHART.length - 1].toSquareFeet;
export const SUN_ADJUSTMENT = Object.freeze({ shaded: -0.1, average: 0, sunny: 0.1 });
export const BTU_PER_EXTRA_PERSON = 600;
export const PEOPLE_INCLUDED = 2;
export const KITCHEN_BTU = 4000;

function check(name, value, { min = 0, max = Infinity, integer = false } = {}) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min) throw new RangeError(`${name} must be at least ${min}`);
  if (value > max) throw new RangeError(`${name} must be at most ${max}`);
  if (integer && !Number.isInteger(value)) throw new RangeError(`${name} must be a whole number`);
}

/** The chart row for an area; a boundary value (e.g. 150) belongs to the smaller row. */
export function chartRow(squareFeet) {
  check('squareFeet', squareFeet, { min: MIN_SQUARE_FEET, max: MAX_SQUARE_FEET });
  return SIZING_CHART.find((row) => squareFeet <= row.toSquareFeet);
}

/**
 * @param {object} input
 * @param {number} input.squareFeet area to be cooled, 100 to 1,000
 * @param {'shaded'|'average'|'sunny'} [input.sun]
 * @param {number} [input.people] people who regularly use the room
 * @param {boolean} [input.kitchen]
 */
export function roomAcSize({ squareFeet, sun = 'average', people = PEOPLE_INCLUDED, kitchen = false }) {
  if (!Object.hasOwn(SUN_ADJUSTMENT, sun)) throw new RangeError(`unknown sun exposure: ${sun}`);
  check('people', people, { min: 0, max: 50, integer: true });
  const row = chartRow(squareFeet);
  const sunBtu = row.btu * SUN_ADJUSTMENT[sun];
  const extraPeople = Math.max(0, people - PEOPLE_INCLUDED);
  const peopleBtu = extraPeople * BTU_PER_EXTRA_PERSON;
  const kitchenBtu = kitchen ? KITCHEN_BTU : 0;
  const btu = row.btu + sunBtu + peopleBtu + kitchenBtu;
  return {
    row,
    baseBtu: row.btu,
    sunBtu,
    extraPeople,
    peopleBtu,
    kitchenBtu,
    btu,
    // Cooling capacity in tons of refrigeration (12,000 BTU per hour each).
    tons: btu / 12000,
    // Watts of heat removed (1 BTU per hour ≈ 0.29307107 W).
    watts: btu * 0.29307107017
  };
}
