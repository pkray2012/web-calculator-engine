/**
 * Tip and bill splitting.
 *
 * - The tip is a percentage of the bill, or of the bill before tax when the
 *   tax is entered and tipping on the pre-tax amount is chosen.
 * - Total = bill + tip. Split evenly, each share is rounded up to the cent so
 *   the shares always cover the total; the extra cents are reported.
 * - Optionally each share is rounded up to a whole dollar; the extra goes to
 *   the tip and the effective tip percentage is shown.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

const EPSILON = 1e-9;
const centsUp = (value) => Math.ceil(value * 100 - EPSILON) / 100;

export function calculateTip({ bill, tipPercent, people = 1, tax = 0, tipOnPreTax = false, roundUp = false }) {
  nonNegative('bill', bill);
  nonNegative('tipPercent', tipPercent);
  nonNegative('tax', tax);
  if (!Number.isInteger(people) || people < 1) throw new RangeError('people must be a whole number of 1 or more');
  if (tax > bill) throw new RangeError('tax cannot be more than the bill');

  const tipBase = tipOnPreTax ? bill - tax : bill;
  let tip = Math.round(tipBase * tipPercent + EPSILON) / 100; // tip to the cent, half up
  let total = bill + tip;
  let perPerson = centsUp(total / people);
  if (roundUp) {
    perPerson = Math.ceil(perPerson - EPSILON);
    total = perPerson * people;
    tip = total - bill;
  }
  const collected = Math.round(perPerson * people * 100) / 100;
  return {
    bill,
    tax,
    tipBase,
    tipPercent,
    tip: Math.round(tip * 100) / 100,
    total: Math.round(total * 100) / 100,
    people,
    perPerson,
    collected,
    extra: Math.round((collected - total) * 100) / 100,
    effectiveTipPercent: tipBase > 0 ? (tip / tipBase) * 100 : 0
  };
}
