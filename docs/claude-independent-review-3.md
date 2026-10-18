# Independent review 3: Stair and Quarterly Estimated Tax drafts

**Reviewer:** Claude (Anthropic), an independent reviewer standing in while OpenAI Codex is offline. I am not Codex.
**Repository:** pkray2012/web-calculator-engine, branch claude/compassionate-dirac-cv1ipd
**Commit reviewed:** 162d0d0 (my own copy from `git archive` at `/tmp/claude-0/-home-user/0eb0960d-32a8-560e-86a2-5f50c83d47e1/scratchpad/review3`; the live working tree was not used)
**Date:** Sun Oct 18 21:22:05 UTC 2026

## Summary

- **Counts:** 0 BLOCKER, 0 HIGH, 2 MEDIUM, 9 LOW.
- **Engine math:** both engines match my independent recomputation. Every worked number on both pages is correct.
- **MEDIUM findings:** a stair page claim that the rise/run diagonal "gives the wrong length" (A3-001), and a silent 100% fallback when prior-year AGI is blank (A3-003).

## Scope checks

- **Registry:** `git diff de965bd 162d0d0 -- src/content/site.js` contains only additions. There are four new entries, all `status: 'planned'`: rental-property, estimated-tax, self-employment-tax and stair. No live entry was changed.
- **Not built:** `scripts/build.js` builds only `liveCalculators()`. `relatedCalculators` filters to live entries. The draft page modules are imported only by their own adapter tests.
- **Changes to existing files:** the only modified (non-added) files in de965bd..162d0d0 are `src/calculators/loan-payment.js` (the documented ZA-001 log1p/expm1 fix), `tests/loan-payment.test.js`, `tests/site/loan-adapter.test.js`, `tests/mortgage-payment.test.js` (tolerance 1e-8 to 1e-7, see A3-011) and `src/content/site.js`. No other existing calculator file changed. Rental-property and self-employment-tax are new draft files and were outside this review.

## Stair calculator: verification

- **Riser count:** `max(2, ceil(rise/maxRiser - 1e-9))` is correct. Exact multiples k = 2, 3, 7, 13, 14, 20 and 50 of 7.75 get no extra step. The epsilon edge is in A3-010.
- **Riser, tread, run and angle:** riser = rise/n, treads = n-1, run = (n-1)t and angle = atan(r/t) are all correct.
- **Pitch line:** the pitch line from the bottom nosing (0, r) to the top nosing ((n-1)t, nr) is (n-1)u, which is correct. The pitch line extended to the floor is n*u. I confirmed it by coordinates: it hits y = 0 at x = -t, and the length is 182.40888 in for both methods. Whether that is the right board length is covered in A3-001 and A3-002.
- **Bottom stringer riser:** r - tread thickness is correct for treads fastened on top of the stringer. Validation rejects thickness >= riser in both the adapter (stair.js:105) and the engine (stair.js:64).
- **Formatting:** formatInches rounds to the nearest 1/16, reduces the fraction correctly, and carries feet at 12 (11.99 in becomes "1 ft 0 in", 143.97 in becomes "12 ft 0 in").
- **Worked numbers I recomputed independently:**
  - 108/7.75 = 13.94, so 14 risers.
  - 7.714 in, shown as 7 11/16 in.
  - 13 treads; run 11 ft 4 1/2 in.
  - Angle 36.3 degrees.
  - Unit 13.029 in, shown as 13 in.
  - Pitch line 14 ft 1 3/8 in; extended to the floor 15 ft 2 7/16 in.
  - Naive diagonal 14 ft 6 1/16 in.
  - Bottom riser 6 11/16 in.
  - The options rows (15/16/17 risers) and the common-heights table (24 to 120 in) all match.
- **IRC claims:**
  - **Corroborated by WebSearch, through secondary sources only:** riser at most 7 3/4 in (R311.7.5.1), tread at least 10 in (R311.7.5.2), 3/8 in maximum variation for risers and for treads, headroom 6 ft 8 in (R311.7.2), and a handrail on flights with 4 or more risers (R311.7.8). The sources were local building-department guides (Boise, Tucson, Albany GA, Wells ME, Knox County, South Carolina regulation).
  - **Not confirmed:** the ICC 2021 IRC text itself; it was not readable here. The page already marks these sources as pending direct verification.

## Estimated tax calculator: verification

- **Required annual payment:** the smaller of 90% of current-year tax and 100% of prior-year tax (110% if prior AGI > $150,000) is correct. The comparison is strictly "over": AGI of exactly $150,000 gives 100%.
- **Married filing separately:** the $75,000 MFS limit is keyed to "married filing separately this year". A search summary of the 2026 Form 1040-ES gives "$75,000 if your filing status for 2026 is married filing separately", so the current-year status governs and the label is right. The joint/separate prior-year combination rules are not covered.
- **Withholding:** withholding is treated as paid evenly, and payments = max(0, required - withholding)/4. This is correct.
- **$1,000 threshold:** it is tested on current tax minus withholding (999.99 means not required; 1,000 means required). This matches "after withholding and refundable credits" only if the user's tax is already net of refundable credits (see A3-004).
- **Zero-prior-year exception:** `priorYearTax === 0` gives no payments. The conditions (full 12-month year, U.S. citizen or resident) are disclosed on the page and corroborated by an IRS estimated-taxes page summary. That same summary says "no liability" includes not being required to file (A3-005).
- **2026 due dates:** Apr 15 2026 is a Wednesday, Jun 15 2026 a Monday, Sep 15 2026 a Tuesday and Jan 15 2027 a Friday (computed). None falls on a weekend. Emancipation Day (Thu Apr 16, 2026) does not affect Apr 15. Secondary sources corroborate the dates; the IRS PDF itself was not read.
- **Owe-nothing figure:** (tax - withholding)/4 is correct.
- **Worked numbers I recomputed independently:**
  - 90% of $20,000 = $18,000; required payment $15,000.
  - Estimated payments $13,000, or $3,250 a quarter.
  - Due at filing $5,000.
  - Owe nothing: $4,500 a quarter ($18,000 total).
  - At AGI $200,000: 110% = $16,500, giving $3,625 a quarter.
  - All of these match the rendered page.
- **Per-period penalty sentence:** accurate, not overstated (see A3-008 for its sourcing).

## Findings

### A3-001 [MEDIUM] stair-calculator: content-accuracy

- Location: `src/pages/stair-calculator.js:71`
- Evidence: Page says the total-rise x total-run diagonal "is not the stringer's slope ... and gives the wrong length". The slope part is true, but as a board length the diagonal is close to the geometric minimum. Projecting every vertex of the cut stringer polygon (top edge through the nosing corners, plumb/level bottom cut at the first riser, plumb top cut) onto the pitch direction gives minimum board length L = ((n-1)t^2 + n r^2 - d r)/u. Example (n=14, r=7.7143, t=10.5, d=1): L = 173.36 in (173.95 in with d=0); the diagonal is 174.06 in (14 ft 6 1/16 in); the page's "pitch line extended to the floor" is 182.41 in (15 ft 2 7/16 in). Script: review3-work/stringer-geometry.mjs. (Test tests/stair.test.js:26 correctly asserts only that the pitch length differs from the diagonal.)
- Recommendation: Drop "gives the wrong length". Either say the diagonal is a close estimate of board length but not the cutting slope, or show the computed minimum board length ((n-1)t^2 + n r^2 - d r)/u plus an allowance for the top connection.
- Status: open

### A3-002 [LOW] stair-calculator: content-accuracy

- Location: `src/components/stair-results.js:192`
- Evidence: "Buy stringer boards longer than the pitch line extended to the floor" uses risers x unit (182.41 in in the example). That line meets the floor one tread in front of the first riser, outside the stringer, so it is longer than the board needs to be by t^2/u (8.46 in here). The error makes the board longer, so it causes waste, not a short board. The geometry of the value itself (n*u) is correct: it matches a coordinate check to full precision.
- Recommendation: Label it as a generous upper figure, or replace it with the minimum board length from A3-001 plus a stated allowance.
- Status: open

### A3-003 [MEDIUM] estimated-tax-calculator: tax-rule-coverage

- Location: `src/calculators/estimated-tax.js:53`
- Evidence: Prior-year AGI is optional (src/adapters/estimated-tax.js:124). When last year's tax is entered but the AGI is left blank, highIncome is false and the 100% test is used without comment. A filer with prior AGI over $150,000 ($75,000 MFS) then gets a required payment that is too low, which is the exact case the calculator exists to prevent. Example: $50,000 tax now, $30,000 last year, AGI blank -> $30,000 required instead of $33,000.
- Recommendation: When priorYearTax is entered, require priorYearAgi or ask a yes/no "Was last year's AGI over $150,000 ($75,000 MFS)?". Otherwise show a visible warning in the results that 110% may apply.
- Status: open

### A3-004 [LOW] estimated-tax-calculator: input-definition

- Location: `src/components/estimated-tax-form.js:251`
- Evidence: The current-year hint (line 248) says tax "minus credits", but the prior-year hint says "The total tax line on your 2025 Form 1040". Form 1040 total tax (line 24) is before refundable credits, which appear in the payments section. Form 2210 figures both years' tax net of certain refundable credits (UNVERIFIED: I recall this from the Form 2210 instructions but could not confirm the line 8 wording by search). With the prior-year field as worded, filers with EIC/ACTC/PTC overstate the 100% test and overpay, which is the safe direction.
- Recommendation: Define both fields the same way. Say whether refundable credits are subtracted, and point to the matching Form 2210 lines once the instructions have been read directly.
- Status: open

### A3-005 [LOW] estimated-tax-calculator: tax-rule-coverage

- Location: `src/components/estimated-tax-form.js:251`
- Evidence: "Leave blank if you did not file." The IRS estimated-taxes page, as summarized in a search result, says you had no tax liability if your total tax was zero OR you did not have to file. A filer who did not file because they were not required to gets only the 90% test from a blank field, and loses the zero-liability exception that entering 0 would give (calculateEstimatedTax noPriorYearTax).
- Recommendation: Reword: "Enter 0 if you had no tax or did not have to file (full-year U.S. citizen or resident). Leave blank only if you were required to file but did not, or last year was shorter than 12 months."
- Status: open

### A3-006 [LOW] estimated-tax-calculator: content-completeness

- Location: `src/pages/estimated-tax-calculator.js:92`
- Evidence: The due-dates section does not mention the rule that you need not make the January installment if you file the 2026 return and pay all tax due by January 31, 2027. Jan 31, 2027 is a Sunday, so this computes to Monday Feb 1, 2027 (weekday computed). UNVERIFIED: the search did not return the IRS wording; this is from reviewer knowledge.
- Recommendation: After direct verification in the 2026 Form 1040-ES, add one sentence. Otherwise leave it out and say other exceptions exist.
- Status: open

### A3-007 [LOW] estimated-tax-calculator: content-precision

- Location: `src/pages/estimated-tax-calculator.js:77`
- Evidence: "by each due date, withholding and estimated payments together cover a quarter of the smaller of" can be read as each installment standing alone. Form 2210 tests cumulative payments of 25/50/75/100% of the required annual payment, and an overpayment carries forward to later periods.
- Recommendation: Say "together reach 25%, 50%, 75% and 100% of the smaller of ... by the four due dates".
- Status: open

### A3-008 [LOW] estimated-tax-calculator: sourcing

- Location: `src/pages/estimated-tax-calculator.js:43`
- Evidence: The source entry claims the IRS underpayment-penalty page supports "paying late in the year does not fully cure an earlier shortfall". The rule is correct in substance: IRS pages say the penalty depends on the period the underpayment was due and underpaid. But a search did not find the specific wording on that page. The page text at line 92 ("does not fully make up for skipping April") is accurate and not overstated: a later payment stops further penalty on the earlier shortfall but does not remove what has already accrued.
- Recommendation: Before going live, confirm the statement on the cited page, or cite the Form 2210 instructions / Pub 505 passage that says it.
- Status: open

### A3-009 [LOW] stair-calculator: display

- Location: `src/components/stair-results.js:162`
- Evidence: formatInches rounds to the nearest 1/16 in, so an over-limit riser such as 7.76 in shows as "7 3/4 in" next to "Over limit". The decimal in the note (7.76 in) resolves it, but the main stat looks compliant.
- Recommendation: For over-limit risers, show the decimal in the main value too, or round away from the limit when flagging.
- Status: open

### A3-010 [LOW] stair-calculator: numerical-edge

- Location: `src/calculators/stair.js:59`
- Evidence: The ceil guard subtracts 1e-9 from the ratio, while riserOk adds 1e-9 inches. For totalRise 15.500000005 the engine picks the minimum of 2 risers (7.7500000025 in) and then flags it "Over limit", and the options table offers no compliant count, which is inconsistent. This cannot happen with realistic inputs.
- Recommendation: Use one tolerance: compare riserHeight to maxRiser with the same relative epsilon, or compute n with the check riserHeight <= maxRiser*(1+1e-12).
- Status: open

### A3-011 [LOW] loan-payment (ZA-001): test-change

- Location: `tests/mortgage-payment.test.js:72`
- Evidence: An existing calculator's test tolerance was relaxed from 1e-8 to 1e-7 as part of the documented ZA-001 loan-payment fix (src/calculators/loan-payment.js now uses log1p/expm1). The justification comment is reasonable, and the tolerance is still far below a cent. Noted for traceability only.
- Recommendation: None required. Optionally keep a 1e-9 check against a high-precision reference for a few fixed loans.
- Status: open

## Tests run

- **Full suite:** `npm test` in `/tmp/claude-0/-home-user/0eb0960d-32a8-560e-86a2-5f50c83d47e1/scratchpad/review3` (node --test, node_modules symlinked): 640 tests, 640 pass, 0 fail.
- **Draft tests:** `node --test tests/stair.test.js tests/site/stair-adapter.test.js tests/estimated-tax.test.js tests/site/estimated-tax-adapter.test.js`: 35 tests, 35 pass.
- **Browser suite:** not run, as instructed.
- **Reviewer scripts** in `/tmp/claude-0/-home-user/0eb0960d-32a8-560e-86a2-5f50c83d47e1/scratchpad/review3-work/`:
  - `stair-check.mjs`: independent figures, formatting edges, validation and rendered page text.
  - `stringer-geometry.mjs`: polygon projection for the minimum board length.
  - `esttax-check.mjs`: example, edge cases, weekdays and rendered page text.
  - `build-report.mjs`: builds the JSON and checks it with JSON.parse.

## What I could not verify

- **ICC 2021 IRC R311.7 text:** I relied on WebSearch summaries of local-government guides only. Section numbers and values agree across them, but local amendments exist.
- **IRS primary texts:** I could not read the 2026 Form 1040-ES PDF, Pub 505 or the Form 2210 instructions directly. These points rest on search-result summaries:
  - the MFS "filing status for 2026" wording
  - the due dates
  - "after withholding and refundable credits"
  - the zero-liability definition
- **Not found by search:**
  - the Form 2210 line 8 prior-year tax definition (A3-004)
  - the January 31 filing exception (A3-006)
  - the "withholding treated as paid evenly" sentence in Pub 505
  - the exact "earlier due date" wording on the underpayment page (A3-008)
- **Calendar:** IRS holiday/weekend shifts are computed from the calendar only. No 2026 disaster-relief postponements were checked.
