/**
 * Straight stair layout from the total rise.
 *
 * - Risers n: the fewest that keep each riser at or under the maximum,
 *   n = ceil(totalRise ÷ maxRiser), unless a riser count is chosen.
 * - Riser height r = totalRise ÷ n (all risers equal).
 * - Treads = n − 1: the upper floor serves as the top step.
 * - Total run = treads × tread depth t.
 * - Angle = atan(r ÷ t).
 * - Step unit (one riser and one tread along the slope) u = √(r² + t²).
 * - Pitch-line length from the first to the top nosing = treads × u.
 * - Minimum stringer board length along the slope: the stringer spans a run
 *   of treads × t and a rise of n × r − tread thickness, so its length along
 *   the slope is (treads × t² + (n × r − d) × r) ÷ u. Add material for the
 *   top connection and cuts.
 * - Bottom stringer riser = r − tread thickness, so the first step is not
 *   taller than the rest once treads are fastened on top.
 * All lengths are inches; precision is kept and rounded only for display.
 */

function positive(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

function layout({ totalRise, treadDepth, treadThickness, risers, maxRiser, minTread }) {
  const riserHeight = totalRise / risers;
  const treads = risers - 1;
  const unit = Math.hypot(riserHeight, treadDepth);
  return {
    risers,
    treads,
    riserHeight,
    totalRun: treads * treadDepth,
    angleDegrees: Math.atan2(riserHeight, treadDepth) * 180 / Math.PI,
    stepUnit: unit,
    pitchLength: treads * unit,
    minimumBoardLength: (treads * treadDepth * treadDepth + (risers * riserHeight - treadThickness) * riserHeight) / unit,
    bottomStringerRiser: riserHeight - treadThickness,
    riserOk: riserHeight <= maxRiser + 1e-9,
    treadOk: treadDepth >= minTread - 1e-9,
    handrailExpected: risers >= 4
  };
}

export function calculateStairs({
  totalRise,
  treadDepth,
  treadThickness = 0,
  maxRiser = 7.75,
  minTread = 10,
  risers = null
}) {
  positive('totalRise', totalRise);
  positive('treadDepth', treadDepth);
  positive('maxRiser', maxRiser);
  positive('minTread', minTread);
  if (!Number.isFinite(treadThickness) || treadThickness < 0) throw new RangeError('treadThickness cannot be negative');

  // Guard against 108 / 7.75 landing a hair above an integer from binary rounding.
  const minimumRisers = Math.max(2, Math.ceil(totalRise / maxRiser - 1e-9));
  if (risers !== null && (!Number.isInteger(risers) || risers < 2)) throw new RangeError('risers must be a whole number of 2 or more');
  const chosenRisers = risers ?? minimumRisers;
  const common = { totalRise, treadDepth, treadThickness, maxRiser, minTread };
  const chosen = layout({ ...common, risers: chosenRisers });
  if (chosen.bottomStringerRiser <= 0) throw new RangeError('treadThickness must be less than the riser height');

  const options = [];
  for (let n = minimumRisers; n <= minimumRisers + 3; n += 1) options.push(layout({ ...common, risers: n }));

  return { totalRise, treadDepth, treadThickness, maxRiser, minTread, minimumRisers, ...chosen, options };
}
