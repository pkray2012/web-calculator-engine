/**
 * Drywall for one rectangular room: wall area (perimeter × height) less doors
 * and windows, plus the ceiling if it is being covered, a waste allowance for
 * cuts, and whole sheets of a chosen size. It also compares the standard
 * 4 × 8, 4 × 10 and 4 × 12 ft sheet sizes, and optionally prices the sheets.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

/** Standard sheet sizes sold in the US, width × length in feet. */
export const DRYWALL_SHEETS = Object.freeze([
  Object.freeze({ id: '4x8', widthFeet: 4, lengthFeet: 8 }),
  Object.freeze({ id: '4x10', widthFeet: 4, lengthFeet: 10 }),
  Object.freeze({ id: '4x12', widthFeet: 4, lengthFeet: 12 })
]);

const sheetsFor = (area, sheetArea) => Math.ceil(area / sheetArea - 1e-9);

export function calculateDrywall({
  lengthFeet,
  widthFeet,
  heightFeet,
  includeCeiling = false,
  doors = 0,
  doorArea = 0,
  windows = 0,
  windowArea = 0,
  wastePercent = 0,
  sheet = '4x8',
  pricePerSheet = 0
}) {
  positive('lengthFeet', lengthFeet);
  positive('widthFeet', widthFeet);
  positive('heightFeet', heightFeet);
  for (const [name, value] of Object.entries({ doors, windows })) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`${name} must be a whole number of 0 or more`);
  }
  nonNegative('doorArea', doorArea);
  nonNegative('windowArea', windowArea);
  nonNegative('wastePercent', wastePercent);
  nonNegative('pricePerSheet', pricePerSheet);
  const size = DRYWALL_SHEETS.find((option) => option.id === sheet);
  if (!size) throw new RangeError('sheet must be 4x8, 4x10 or 4x12');

  const grossWallArea = 2 * (lengthFeet + widthFeet) * heightFeet;
  const openingsArea = doors * doorArea + windows * windowArea;
  if (openingsArea >= grossWallArea) throw new RangeError('doors and windows must be smaller than the wall area');
  const wallArea = grossWallArea - openingsArea;
  const ceilingArea = includeCeiling ? lengthFeet * widthFeet : 0;
  const area = wallArea + ceilingArea;
  const areaWithWaste = area * (1 + wastePercent / 100);
  const sheetArea = size.widthFeet * size.lengthFeet;
  const sheets = sheetsFor(areaWithWaste, sheetArea);

  return {
    grossWallArea,
    openingsArea,
    wallArea,
    ceilingArea,
    area,
    areaWithWaste,
    sheetArea,
    sheets,
    purchased: sheets * sheetArea,
    cost: pricePerSheet > 0 ? sheets * pricePerSheet : null,
    options: DRYWALL_SHEETS.map((option) => {
      const optionArea = option.widthFeet * option.lengthFeet;
      return { id: option.id, sheetArea: optionArea, sheets: sheetsFor(areaWithWaste, optionArea) };
    })
  };
}
