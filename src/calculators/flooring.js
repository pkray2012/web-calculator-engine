/**
 * Flooring for one or more rectangular rooms: total square feet, a waste
 * allowance for cuts, whole boxes at the coverage printed on the carton, the
 * square feet those boxes cover and what is left over, and optional cost by
 * the square foot or by the box.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

/** rooms: [{ lengthFeet, widthFeet }] (at least one). */
export function calculateFlooring({ rooms, wastePercent = 0, boxCoverage, pricePerSquareFoot = 0, pricePerBox = 0 }) {
  if (!Array.isArray(rooms) || rooms.length === 0) throw new RangeError('at least one room is required');
  nonNegative('wastePercent', wastePercent);
  positive('boxCoverage', boxCoverage);
  nonNegative('pricePerSquareFoot', pricePerSquareFoot);
  nonNegative('pricePerBox', pricePerBox);

  const roomAreas = rooms.map((room, index) => {
    positive(`room ${index + 1} length`, room.lengthFeet);
    positive(`room ${index + 1} width`, room.widthFeet);
    return room.lengthFeet * room.widthFeet;
  });
  const area = roomAreas.reduce((sum, value) => sum + value, 0);
  const areaWithWaste = area * (1 + wastePercent / 100);
  const boxes = Math.ceil(areaWithWaste / boxCoverage - 1e-9);
  const purchased = boxes * boxCoverage;
  return {
    roomAreas,
    area,
    areaWithWaste,
    boxes,
    purchased,
    leftover: purchased - area,
    // Buying whole boxes means paying for everything purchased.
    costBySquareFoot: pricePerSquareFoot > 0 ? purchased * pricePerSquareFoot : null,
    costByBox: pricePerBox > 0 ? boxes * pricePerBox : null
  };
}
