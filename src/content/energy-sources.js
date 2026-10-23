/**
 * Sources cited by the Home Energy draft pages (Batch 1, Batch 2 and Batch 2b). Only
 * confirmed sources (or partly confirmed, where the page claims only the
 * confirmed part) are listed, each with the claim it supports. The status is
 * noted beside each entry; ENERGY_SOURCE_RETRIEVALS (end of file) records
 * the date each one was last retrieved and checked.
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
  // E7: PARTIAL. Cited only for the factors that affect charging time. The passage is on the charging stations page
  // (subagent audit S-H1, 2026-10-22: the home-charging page no longer contains it).
  homeCharging: {
    title: 'Electric Vehicle Charging Stations',
    publisher: 'U.S. Department of Energy, Alternative Fuels Data Center',
    url: 'https://afdc.energy.gov/fuels/electricity-stations',
    supports: 'Charging time depends on how depleted the battery is, its capacity, the vehicle\'s onboard charger and the charging equipment.'
  },
  // E5: CONFIRMED; X11 closed by the owner on 2026-10-23 (Codex has reviewed E5). Cited only for residential prices and sizes being quoted on the DC rating.
  dcRating: {
    title: '2024 Electricity Annual Technology Baseline (ATB): Residential PV',
    publisher: 'National Laboratory of the Rockies (NLR), U.S. Department of Energy',
    url: 'https://atb.nlr.gov/electricity/2024/residential_pv',
    supports: 'Residential solar prices and capacities are quoted in kW DC, the panels\' rated capacity, which is the unit most of the residential industry uses.'
  },
  // E8: CONFIRMED (EPA-420-R-24-022, Appendix E). Linked through EPA's download page for the report; the old direct PDF URL returns 404.
  epaLabelLosses: {
    title: 'The 2024 EPA Automotive Trends Report (EPA-420-R-24-022), Appendix E',
    publisher: 'U.S. Environmental Protection Agency',
    url: 'https://www.epa.gov/automotive-trends/download-2024-automotive-trends-report',
    supports: 'The kWh per 100 miles on an electric vehicle\'s label is based on the electricity drawn from an electric outlet, so it already includes charging losses.'
  },
  // E1: CONFIRMED.
  kilowattHour: {
    title: 'NIST Guide to the SI, Appendix B.8: Factors for units listed alphabetically',
    publisher: 'National Institute of Standards and Technology',
    url: 'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8',
    supports: 'A kilowatt-hour is 3.6 million joules: one kilowatt of power for one hour.'
  },
  // E2: CONFIRMED (Codex); re-confirmed by the builder 2026-10-22 (Batch 2, Electricity Cost). Cited only for the formula and its worked example.
  applianceEnergy: {
    title: 'Energy Series: Estimating Appliance and Home Electronic Energy Use (2901-9014)',
    publisher: 'Virginia Cooperative Extension, Virginia Tech',
    url: 'https://www.pubs.ext.vt.edu/2901/2901-9014/2901-9014.html',
    supports: 'An appliance\'s daily kWh is its wattage × hours used per day ÷ 1,000, multiplied by the days it is used; appliances such as refrigerators cycle on and off.'
  },
  // E3: PARTIAL (no bill or tariff structure). Cited only for the 2025 state averages behind the "more than $1 per kWh" note.
  eiaStateAverages: {
    title: 'Electricity explained: prices and factors affecting prices',
    publisher: 'U.S. Energy Information Administration',
    url: 'https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php',
    supports: 'In 2025 the average retail electricity price for all customer types ranged from 8.20¢ per kWh (North Dakota) to 35.72¢ per kWh (Hawaii), so every state averaged well under $1 per kWh.'
  }
});

/**
 * When each source was last retrieved and its cited passage checked (UTC date),
 * and its status. Builder and subagent retrievals are context-independent
 * Claude checks, not vendor-independent; Codex re-verification is pending.
 */
export const ENERGY_SOURCE_RETRIEVALS = Object.freeze({
  aprVsRate: { retrieved: '2026-10-22', status: 'E4a CONFIRMED (CFPB); subagent re-retrieval 2026-10-22' },
  simplePayback: { retrieved: '2026-10-22', status: 'E6 CONFIRMED (simple payback definition); PDF hash unchanged' },
  homeCharging: { retrieved: '2026-10-22', status: 'E7 PARTIAL; passage on the stations page' },
  dcRating: { retrieved: '2026-10-22', status: 'E5 CONFIRMED; X11 closed by the owner 2026-10-23 (Codex reviewed E5)' },
  epaLabelLosses: { retrieved: '2026-10-22', status: 'E8 CONFIRMED; passage re-read in a live EPA copy of EPA-420-R-24-022' },
  kilowattHour: { retrieved: '2026-10-20', status: 'E1 CONFIRMED; HTML page unreachable through the proxy on 2026-10-22, PDF hash unchanged' },
  applianceEnergy: { retrieved: '2026-10-22', status: 'E2 CONFIRMED; page hash unchanged since 2026-10-20' },
  eiaStateAverages: { retrieved: '2026-10-22', status: 'E3 PARTIAL; the state-average sentence quoted above' }
});
