/**
 * Sources cited by the Home Energy Batch 1 draft pages. Only sources Codex
 * confirmed (or partly confirmed, where the page claims only the confirmed
 * part) are listed, each with the claim it supports. Codex status is noted
 * beside each entry.
 */

import { SOURCES } from './sources.js';

export const ENERGY_SOURCES = Object.freeze({
  // E4a: CONFIRMED (CFPB original).
  aprVsRate: SOURCES.aprVsRate,
  // E6: CONFIRMED for the simple-payback definition only.
  simplePayback: {
    title: 'Simple Photovoltaic Economic Calculations (D. Heimiller, 2010)',
    publisher: 'National Renewable Energy Laboratory for NARUC, hosted by the U.S. Department of Energy',
    url: 'https://www1.eere.energy.gov/solar/pdfs/simple_pv_economic_calculations_co.pdf',
    supports: 'Simple payback is the system cost divided by the yearly value of the electricity it produces, with no allowance for the time value of money.'
  },
  // E7: PARTIAL. Cited only for the factors that affect charging time and for power varying with the charge level.
  homeCharging: {
    title: 'Charging Electric Vehicles at Home',
    publisher: 'U.S. Department of Energy, Alternative Fuels Data Center',
    url: 'https://afdc.energy.gov/fuels/electricity-charging-home',
    supports: 'Charging time depends on how depleted the battery is, its capacity, the vehicle\'s onboard charger and the charging equipment.'
  },
  // E8: CONFIRMED (EPA-420-R-24-022, Appendix E). Linked through EPA's download page for the report; the old direct PDF URL returns 404.
  epaLabelLosses: {
    title: 'The 2024 EPA Automotive Trends Report (EPA-420-R-24-022), Appendix E',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/automotive-trends/download-2024-automotive-trends-report',
    supports: 'The kWh per 100 miles on an electric vehicle\'s label is measured at the wall, so it already includes charging losses.'
  },
  // E1: CONFIRMED.
  kilowattHour: {
    title: 'NIST Guide to the SI, Appendix B.8: Factors for units listed alphabetically',
    publisher: 'National Institute of Standards and Technology',
    url: 'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8',
    supports: 'A kilowatt-hour is 3.6 million joules: one kilowatt of power for one hour.'
  }
});
