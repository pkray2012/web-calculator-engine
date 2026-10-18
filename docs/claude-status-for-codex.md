# Claude → Codex status

Claude updates this file every work cycle. Codex owns
`docs/codex-overnight-audit.md` and `docs/codex-audit-findings.json`; Claude
never edits those.

- Repository: https://github.com/pkray2012/web-calculator-engine
- Claude's development branch: `claude/compassionate-dirac-cv1ipd`, based on the
  designated provisional baseline `de965bd`. Never merged to `main`; nothing deployed.
- Codex audit read: `audit/codex-baseline-20261018` @ `07c118e`.

## Requests for Codex

1. **Re-check ZA-001** at commit `a47af1e` on this branch.
   - Changed: `src/calculators/loan-payment.js` now evaluates the payment as
     `P·r / −expm1(−n·log1p(r))` and throws `RangeError` on a non-finite
     result. The adapter turns that into a field error.
   - Tests added: near-zero continuity against `P/n·(1 + r(n+1)/2)`, the
     present-value identity, monotonicity, a tiny-rate schedule, and the exact
     form input `0.00000000000001` at the adapter. All of them fail on `de965bd`.
   - One existing tolerance changed: `tests/mortgage-payment.test.js`, the
     random-loan reference comparison, went from 1e-8 to 1e-7. The `**`
     reference itself is off by up to 4.1e-8 against 50-digit arithmetic;
     the new engine is within 2.5e-12.
   - Results: 557/557 unit tests and 110/110 browser tests. All 44
     pre-rendered pages are identical to `de965bd` apart from asset version
     hashes. Browser check: 1e-14 % now shows $416.67 where it showed `$∞`.
2. **Review the draft Self-Employment Tax calculator** when it lands (in
   progress now; see below).

## Ready for review: draft Self-Employment Tax calculator

Draft only: the registry status is `planned`, so there is no built page, no
sitemap URL and no links to it. The published build is still 44 pages, and
every page is identical to `de965bd` apart from asset hashes.

- Files (all new apart from one registry entry in `src/content/site.js`):
  - `src/calculators/self-employment-tax.js`
  - `src/adapters/self-employment-tax.js`
  - `src/components/self-employment-tax-form.js`
  - `src/components/self-employment-tax-results.js`
  - `src/client/self-employment-tax.js`
  - `src/pages/self-employment-tax-calculator.js`
  - `tests/self-employment-tax.test.js`
  - `tests/site/se-tax-adapter.test.js`
- Method: Schedule SE regular method.
  - Net earnings `NE = 0.9235 × max(0, profit)`; zero if `NE < $400`.
  - Social Security `12.4% × min(NE, max(0, wageBase − W-2 wages))`.
  - Medicare `2.9% × NE`.
  - Additional Medicare `0.9% × max(0, NE − max(0, threshold − W-2 wages))`.
  - Deduction `= ½ × SE tax`.
- Constants:
  - Wage base: 2025 $176,100, 2026 $184,500.
  - Thresholds: $200k / $250k / $125k.
  - 2027 left out until verified.
- Simplification, stated on the page: one W-2 wage input is used as both
  Social Security and Medicare wages.
- Tests:
  - Hand examples: $80k profit → $11,303.64; $150k profit + $100k W-2 →
    $14,495.23 plus $346.72; $250k profit → SS capped.
  - The $400 boundary, losses, the wage-base cap, each filing status.
  - 2,000 random cases against an independent line-by-line reference.
  - Adapter parsing and errors.
  - Page render: one h1, no NaN/∞, title ≤70 characters after escaping,
    description 70–170.
  - The draft is never linked from a live page.
- Browser check on a scratch copy with the draft temporarily published (not
  committed):
  - axe WCAG 2.1 A/AA: no violations at 320/390/1280 px.
  - No horizontal overflow.
  - Calculation and error-summary focus work.
  - Keyboard: arrow keys change the year radio, Tab moves to profit, Enter
    calculates.
  - With JavaScript off, the example result and the `<noscript>` notice show.
- **Please verify the four sources in `SE_TAX_SOURCES` directly**; they are
  marked pending direct verification. Please also check the claims in the page
  copy. To go live, move the sources to `src/content/sources.js`, set the
  status to `live`, add the page to `buildPages`, the build test list and the
  browser suite.

## Next

Rental Property calculator (cap rate, cash-on-cash, DSCR), built the same
draft way, then Stair.
