/**
 * Calculator search ranking, shared by the home page search and its tests.
 * calculators: [{ name, text }] where text is the lower-case searchable text.
 */

/** Every token must appear; matches in the name rank above matches in the description. */
export function rankCalculators(query, calculators) {
  const tokens = query.toLowerCase().split(/[^a-z0-9%$.()]+/).filter(Boolean);
  if (!tokens.length) return [];
  return calculators
    .map((calc) => {
      const name = calc.name.toLowerCase();
      if (!tokens.every((token) => calc.text.includes(token))) return null;
      let score = 0;
      for (const token of tokens) {
        if (name.startsWith(token)) score += 4;
        else if (name.split(/\s+/).some((word) => word.startsWith(token))) score += 3;
        else if (name.includes(token)) score += 2;
      }
      return { calc, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.calc.name.localeCompare(b.calc.name))
    .map(({ calc }) => calc);
}
