/**
 * Results panel for the Stair Calculator. Pure function of the view model
 * from src/adapters/stair.js.
 */

import { html } from '../lib/html.js';
import { statGrid, dataTable } from './results.js';

/**
 * 7.7143 → "7 11/16 in"; 169.38 → "14 ft 1 3/8 in". Rounded to the nearest
 * 1/16 in for a tape measure, or up with { up: true } so a value over a limit
 * never displays as the limit itself.
 */
export function formatInches(value, { feet = false, up = false } = {}) {
  let sixteenths = up ? Math.ceil(value * 16 - 1e-9) : Math.round(value * 16);
  const sign = sixteenths < 0 ? '−' : '';
  sixteenths = Math.abs(sixteenths);
  let whole = Math.floor(sixteenths / 16);
  let fraction = sixteenths % 16;
  let denominator = 16;
  while (fraction > 0 && fraction % 2 === 0) {
    fraction /= 2;
    denominator /= 2;
  }
  const fractionText = fraction ? `${fraction}/${denominator}` : '';
  if (feet && whole >= 12) {
    const ft = Math.floor(whole / 12);
    whole %= 12;
    const inches = [whole || (fraction ? '' : '0'), fractionText].filter(Boolean).join(' ');
    return `${sign}${ft} ft ${inches || '0'} in`;
  }
  return `${sign}${[whole || (fraction ? '' : '0'), fractionText].filter(Boolean).join(' ')} in`;
}

const decimal = (value) => `${value.toFixed(2)} in`;
const check = (ok) => (ok ? 'Within limit' : 'Over limit');

export function stairResults({ result: s }) {
  const stats = [
    { label: 'Riser height', value: formatInches(s.riserHeight, { up: !s.riserOk }), primary: true, note: `${s.risers} risers of ${decimal(s.riserHeight)} · ${check(s.riserOk)} (${s.maxRiser} in max)` },
    { label: 'Treads', value: String(s.treads), note: `${formatInches(s.treadDepth)} deep · ${s.treadOk ? 'Within limit' : 'Under the minimum'} (${s.minTread} in min)` },
    { label: 'Total run', value: formatInches(s.totalRun, { feet: true }), note: `${s.treads} × ${formatInches(s.treadDepth)}` },
    { label: 'Stair angle', value: `${s.angleDegrees.toFixed(1)}°`, note: 'atan(riser ÷ tread)' }
  ];
  const problems = [];
  if (!s.riserOk) problems.push(`each riser is taller than the ${s.maxRiser} in limit: use more risers`);
  if (!s.treadOk) problems.push(`the tread is shallower than the ${s.minTread} in minimum`);
  const note = problems.length
    ? `Check this layout: ${problems.join(', and ')}.`
    : 'All risers are equal and within the limits you entered. Confirm the rules your building department uses before you cut.';
  return html`<section class="result-block" aria-labelledby="summary-heading">
  <h2 id="summary-heading">Your stair layout</h2>
  ${statGrid(stats)}
  <p class="note">${note}</p>
</section>
<section class="result-block" aria-labelledby="stringer-heading">
  <h2 id="stringer-heading">Stringer</h2>
  ${dataTable({
    id: 'stair-stringer',
    title: 'Stringer layout',
    columns: [{ key: 'item', label: 'Measurement' }, { key: 'value', label: 'Length', numeric: true }],
    rows: [
      { item: 'Rise and run of each step (framing square settings)', value: `${formatInches(s.riserHeight)} × ${formatInches(s.treadDepth)}` },
      { item: 'One step along the slope', value: formatInches(s.stepUnit) },
      { item: `Pitch line, bottom nosing to top nosing (${s.treads} steps)`, value: formatInches(s.pitchLength, { feet: true }) },
      { item: 'Minimum stringer board length along the slope', value: formatInches(s.minimumBoardLength, { feet: true, up: true }) },
      { item: 'Bottom riser cut on the stringer (riser − tread thickness)', value: formatInches(s.bottomStringerRiser) }
    ]
  })}
  <p class="note">The minimum board length covers the stringer from the floor to the top riser; buy longer stock to leave room for the top
  connection and the cuts.
  ${s.handrailExpected ? `With ${s.risers} risers, plan for a handrail; the IRC requires one on flights with four or more risers.` : ''}</p>
</section>
<section class="result-block" aria-labelledby="options-heading">
  <h2 id="options-heading">Other riser counts</h2>
  ${dataTable({
    id: 'stair-options',
    title: 'Layouts with more risers',
    columns: [
      { key: 'risers', label: 'Risers' },
      { key: 'riser', label: 'Riser height', numeric: true },
      { key: 'run', label: 'Total run', numeric: true },
      { key: 'angle', label: 'Angle', numeric: true },
      { key: 'ok', label: 'Riser limit' }
    ],
    rows: s.options.map((option) => ({
      risers: `${option.risers}${option.risers === s.risers ? ' (shown above)' : ''}`,
      riser: formatInches(option.riserHeight, { up: !option.riserOk }),
      run: formatInches(option.totalRun, { feet: true }),
      angle: `${option.angleDegrees.toFixed(1)}°`,
      ok: check(option.riserOk)
    }))
  })}
</section>`;
}

export function stairQuickResult({ result: s }) {
  return html`<strong>${s.risers} risers of ${formatInches(s.riserHeight)}</strong>, ${s.treads} treads, ${formatInches(s.totalRun, { feet: true })} total run. <a href="#summary-heading">See full results</a>`;
}

export function stairAnnouncement({ result: s }) {
  return `${s.risers} risers of ${formatInches(s.riserHeight)}, ${s.treads} treads, total run ${formatInches(s.totalRun, { feet: true })}.`;
}
