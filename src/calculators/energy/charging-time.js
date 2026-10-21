/**
 * Charging time for a battery (home solar battery or electric vehicle), at
 * constant power. Shared by the Solar Battery Charging Time and EV Charging
 * Time calculators.
 *
 * - Energy to add (kWh) = usable capacity × (target % − start %) ÷ 100.
 * - Power measured at the wall or source (before losses):
 *     time = energy ÷ (power × efficiency), and the energy drawn from the
 *     wall = energy ÷ efficiency. A vehicle's maximum AC charging rate, if
 *     entered, caps the power.
 * - Power measured going into the battery (after losses): time = energy ÷ power.
 *   Efficiency is then optional and only used for the energy drawn.
 * Efficiency is applied once. Real charging slows as the battery fills and
 * with temperature; that is not modeled (time = energy ÷ power is derived
 * under a constant-power assumption).
 */

export const CHARGE_LIMITS = Object.freeze({
  capacity: { min: 0.01, max: 10_000 },
  power: { min: 0.01, max: 1000 },
  efficiency: { min: 1, max: 100 }
});

export const LONG_CHARGE_HOURS = 168; // one week
export const LOW_EFFICIENCY_PERCENT = 50;

function range(name, value, { min, max }) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < min || value > max) throw new RangeError(`${name} must be ${min} to ${max}`);
}

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} is too extreme to calculate`);
  return value;
}

/**
 * @param {object} input
 * @param {number} input.capacityKwh usable capacity
 * @param {number} input.startPercent current charge level, 0–100
 * @param {number} input.targetPercent target charge level, start–100
 * @param {number} input.powerKw charging power
 * @param {'wall' | 'battery'} input.basis where the power is measured
 * @param {number | null} [input.efficiencyPercent] required for 'wall'
 * @param {number | null} [input.vehicleMaxKw] vehicle's maximum AC charging rate
 */
export function calculateChargeTime({ capacityKwh, startPercent, targetPercent, powerKw, basis, efficiencyPercent = null, vehicleMaxKw = null }) {
  range('capacityKwh', capacityKwh, CHARGE_LIMITS.capacity);
  range('startPercent', startPercent, { min: 0, max: 100 });
  range('targetPercent', targetPercent, { min: 0, max: 100 });
  if (targetPercent < startPercent) throw new RangeError('targetPercent cannot be below startPercent');
  range('powerKw', powerKw, CHARGE_LIMITS.power);
  if (basis !== 'wall' && basis !== 'battery') throw new RangeError('basis must be wall or battery');
  if (basis === 'wall' && efficiencyPercent === null) throw new RangeError('efficiencyPercent is required when power is measured at the wall');
  if (efficiencyPercent !== null) range('efficiencyPercent', efficiencyPercent, CHARGE_LIMITS.efficiency);
  if (vehicleMaxKw !== null) range('vehicleMaxKw', vehicleMaxKw, CHARGE_LIMITS.power);

  const energyKwh = finite('capacityKwh', (capacityKwh * (targetPercent - startPercent)) / 100);
  const efficiency = efficiencyPercent === null ? null : efficiencyPercent / 100;
  const effectivePowerKw = basis === 'wall' && vehicleMaxKw !== null ? Math.min(powerKw, vehicleMaxKw) : powerKw;
  const hours = finite('powerKw', basis === 'wall' ? energyKwh / (effectivePowerKw * efficiency) : energyKwh / effectivePowerKw);
  return {
    energyKwh,
    effectivePowerKw,
    hours,
    sourceKwh: efficiency === null ? null : finite('efficiencyPercent', energyKwh / efficiency),
    vehicleCapApplied: basis === 'wall' && vehicleMaxKw !== null && vehicleMaxKw < powerKw,
    vehicleCapIgnored: basis === 'battery' && vehicleMaxKw !== null,
    nothingToCharge: energyKwh === 0,
    unusuallyLong: hours > LONG_CHARGE_HOURS,
    lowEfficiency: efficiencyPercent !== null && efficiencyPercent < LOW_EFFICIENCY_PERCENT
  };
}
