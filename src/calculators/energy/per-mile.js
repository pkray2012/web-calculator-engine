/**
 * Electricity cost per mile of an electric vehicle, shared by the EV Charging
 * Cost (B1-25), EV Cost Per Mile (B2-20) and EV Gas Savings (B2-19) engines.
 *
 * - EPA label kWh per 100 miles: kWh/100 mi ÷ 100 × rate. The label is
 *   measured at the wall, so it already includes charging losses and no
 *   charging efficiency is applied.
 * - Dashboard miles per kWh: rate ÷ (mi/kWh × efficiency). The figure is
 *   treated as energy from the battery, so the efficiency (a fraction) is
 *   applied once.
 * Callers validate their inputs and guard the result for finiteness.
 */

/** @param {number} kwhPer100Miles @param {number} rate dollars per kWh */
export const epaCostPerMile = (kwhPer100Miles, rate) => (kwhPer100Miles / 100) * rate;

/** @param {number} milesPerKwh @param {number} efficiency fraction, 0.01–1 @param {number} rate dollars per kWh */
export const dashboardCostPerMile = (milesPerKwh, efficiency, rate) => rate / (milesPerKwh * efficiency);
