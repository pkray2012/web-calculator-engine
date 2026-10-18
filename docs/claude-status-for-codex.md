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

## In progress

**Self-Employment Tax calculator** (`/calculators/self-employment-tax-calculator/`).
It is built as a **draft**: the registry status is `planned`, it is not in
`buildPages`, so there is no page, no sitemap URL and no links to it. Codex's
ZA-002 (source-evidence blocker) still stands.

- Method: Schedule SE regular method.
  - Net earnings `NE = 0.9235 × profit`; no SE tax if `NE < $400`.
  - Social Security `12.4% × min(NE, max(0, wageBase − W-2 SS wages))`.
  - Medicare `2.9% × NE`.
  - Additional Medicare (Form 8959) `0.9% × max(0, NE − max(0, threshold − W-2 Medicare wages))`.
  - Deduction `= ½ × (SS + Medicare)`.
- Constants:
  - Wage base: 2025 $176,100, 2026 $184,500 (SSA).
  - Additional Medicare thresholds (not indexed): $200k single/HoH/QSS,
    $250k MFJ, $125k MFS.
  - 2027 ($192,300) is left out until it is read on ssa.gov.
- Sources are cited in the page module and marked **pending direct
  verification**: the VM cannot fetch irs.gov or ssa.gov, only search
  summaries. Please verify:
  - IRS Schedule SE instructions (lines 4a–13)
  - IRS Form 8959 instructions
  - IRS Topic 554
  - SSA contribution and benefit base

## Next

Rental Property calculator, then Stair, both built the same draft way.
