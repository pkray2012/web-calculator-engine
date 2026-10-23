/**
 * Electricity cost per mile of an electric vehicle, shared by the EV Charging
 * Cost (B1-25), EV Cost Per Mile (B2-20) and EV Gas Savings (B2-19) engines.
 *
 * - EPA label kWh per 100 miles: kWh/100 mi ÷ 100 × rate. The label is
 *   based on the electricity drawn from the outlet, so it already includes
 *   charging losses and no charging efficiency is applied.
 * - Trip-computer miles per kWh: rate ÷ (mi/kWh × efficiency). The figure is
 *   used as the vehicle reports it, and the efficiency (a fraction) the user
 *   enters is applied once; where the vehicle measures it is not assumed.
 * Callers validate their inputs and guard the result for finiteness. The
 * *Ratio versions give the same quantity exactly, for displays rounded half
 * up once from the decimals as entered (see roundRatio in lib/energy/money.js).
 */

import { exactRatio } from '../../lib/energy/money.js';

/** @param {number} kwhPer100Miles @param {number} rate dollars per kWh */
export const epaCostPerMile = (kwhPer100Miles, rate) => (kwhPer100Miles / 100) * rate;

/** @param {number} milesPerKwh @param {number} efficiency fraction, 0.01–1 @param {number} rate dollars per kWh */
export const dashboardCostPerMile = (milesPerKwh, efficiency, rate) => rate / (milesPerKwh * efficiency);

/** Exact EPA cost per mile, in dollars: kWh/100 mi × rate ÷ 100. */
export const epaPerMileRatio = (kwhPer100Miles, rate) => exactRatio([kwhPer100Miles, rate], [100]);

/** Exact trip-computer cost per mile, in dollars: rate × 100 ÷ (mi/kWh × efficiency %). */
export const dashboardPerMileRatio = (milesPerKwh, efficiencyPercent, rate) => exactRatio([rate, 100], [milesPerKwh, efficiencyPercent]);
