/**
 * Materials for a straight run of board or picket fence: the run is split
 * into sections no longer than the post spacing, with a post at each end of
 * every section (sections + 1 posts), a set number of rails per section, and
 * pickets set side by side with an optional gap. n pickets with n − 1 gaps
 * cover n × width + (n − 1) × gap, so covering a length L takes
 * ⌈(L + gap) ÷ (width + gap)⌉ pickets. A waste allowance is added to the
 * pickets only; posts and rails are counted exactly.
 */

function nonNegative(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number`);
  if (value < 0) throw new RangeError(`${name} cannot be negative`);
}

function positive(name, value) {
  nonNegative(name, value);
  if (value <= 0) throw new RangeError(`${name} must be greater than 0`);
}

const EPSILON = 1e-9;

export function calculateFence({
  lengthFeet,
  postSpacingFeet,
  railsPerSection,
  picketWidthInches,
  gapInches = 0,
  wastePercent = 0,
  pricePerPost = 0,
  pricePerRail = 0,
  pricePerPicket = 0
}) {
  positive('lengthFeet', lengthFeet);
  positive('postSpacingFeet', postSpacingFeet);
  if (!Number.isInteger(railsPerSection) || railsPerSection < 1) throw new RangeError('railsPerSection must be a whole number of 1 or more');
  positive('picketWidthInches', picketWidthInches);
  for (const [name, value] of Object.entries({ gapInches, wastePercent, pricePerPost, pricePerRail, pricePerPicket })) nonNegative(name, value);

  const sections = Math.ceil(lengthFeet / postSpacingFeet - EPSILON);
  const posts = sections + 1;
  const rails = sections * railsPerSection;
  const lengthInches = lengthFeet * 12;
  const picketsExact = Math.ceil((lengthInches + gapInches) / (picketWidthInches + gapInches) - EPSILON);
  const pickets = Math.ceil(picketsExact * (1 + wastePercent / 100) - EPSILON);
  const costs = { posts: posts * pricePerPost, rails: rails * pricePerRail, pickets: pickets * pricePerPicket };
  const totalCost = costs.posts + costs.rails + costs.pickets;
  return {
    sections,
    sectionLengthFeet: lengthFeet / sections,
    posts,
    rails,
    picketsExact,
    pickets,
    costs,
    totalCost: totalCost > 0 ? totalCost : null
  };
}
