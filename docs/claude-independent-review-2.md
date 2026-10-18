# Independent review 2: draft Self-Employment Tax and Rental Property calculators

**Reviewer:** Claude, an independent reviewer agent from Anthropic, standing in while OpenAI Codex is offline. I am not Codex. I checked the code and math myself and did not rely on the implementer's claims.

**Commit reviewed:** 7952f57 on branch `claude/compassionate-dirac-cv1ipd`, based on de965bd. I worked read-only on a copy at `$S/review`.

**Date:** Sun Oct 18 20:56:32 UTC 2026

## Summary

- **BLOCKER:** 0
- **HIGH:** 0
- **MEDIUM:** 2 (A2-001, A2-002, both in Self-Employment Tax)
- **LOW:** 8

The core math is correct in both calculators.

- **Self-Employment Tax:** the engine matches Schedule SE (regular method) and Form 8959 Part II. That covers 92.35%, the $400 rule, the wage bases, Social Security reduced only by the taxpayer's own wages, joint Medicare wages combined, the filing-status thresholds and the deduction as half of SE tax.
- **Rental Property:** NOI, cap rate, debt service, cash flow, cash-on-cash, DSCR and GRM all match my independent recomputation. So does the break-even rent, which I derived by bisection.

Both MEDIUM findings are about inputs and copy in Self-Employment Tax, not the arithmetic.
- **A2-001:** the W-2 field asks for box 5 (Medicare wages), but the value is used as the Social Security wages on Schedule SE line 8a (box 3 + box 7).
- **A2-002:** Form 8959 Part I (Additional Medicare Tax on wages) is never computed, yet the result can say "None: under the threshold" when it applies.

## Registry and scope

- `git diff de965bd HEAD -- src/content/site.js` adds exactly two entries, `rental-property-calculator` and `self-employment-tax-calculator`, both `status: 'planned'`. No live entry changed. The count of planned entries went from 0 to 2.
- `npm run build:dev` built 44 pages with no draft page. Neither slug is referenced anywhere in `dist`. `npm run audit:site` passed.
- The range also contains a47af1e (the ZA-001 fix), which changed the shared `src/calculators/loan-payment.js` and loosened a tolerance in the mortgage tests. The change is benign; see A2-010. No other shared file changed (`git diff --stat`: 22 files).

## Findings

### A2-001 [MEDIUM] tax-semantics: self-employment-tax

- **Location:** `src/components/self-employment-tax-form.js:34`
- **Evidence:** The W-2 field asks for 'Medicare wages, W-2 box 5' and the adapter (src/adapters/self-employment-tax.js:147) passes it as socialSecurityWages, which reduces the wage base exactly like Schedule SE line 8a. Line 8a is W-2 boxes 3 + 7 (plus tier 1 railroad retirement compensation), with lines 8b/8c adding Form 4137 tips and Form 8919 wages (IRS Schedule SE, corroborated by search only). Box 5 can be much larger than box 3, e.g. Medicare-only state or local government employees (box 3 = 0). Reproduced: $100,000 of Medicare-only wages and $100,000 profit for 2026 give SS tax $10,478.00 from the calculator vs $11,451.40 correct (12.4% x 92,350), an understatement of $973.40. The page copy (src/pages/self-employment-tax-calculator.js:159-160) says results 'can differ slightly', which is not true in that case.
- **Recommendation:** Ask for Social Security wages (box 3 + box 7, plus tier 1 RRTA compensation) and Medicare wages (box 5) separately, defaulting Medicare wages to the SS figure, or at least change the hint to box 3 + box 7 and reword the assumption to name the Medicare-only employee case and its size.

### A2-002 [MEDIUM] misleading-copy: self-employment-tax

- **Location:** `src/components/self-employment-tax-results.js:15`
- **Evidence:** Only Form 8959 Part II (Additional Medicare Tax on SE income) is computed. Part I tax on wages above the threshold is ignored, yet when the Part II amount is 0 the card reads 'None: under the $200,000.00 threshold'. Reproduced: W-2 wages $300,000 with profit $0, and W-2 wages $250,000 with profit $433, both show 'None: under the $200,000.00 threshold' although 0.9% applies to the wages above $200,000 (Part I). The lede (src/pages/self-employment-tax-calculator.js:74) promises to show 'whether the 0.9% Additional Medicare Tax applies'.
- **Recommendation:** Label the figure 'Additional Medicare Tax on self-employment income' and replace the 'None: under the threshold' note with a condition-aware message, e.g. when Medicare wages exceed the threshold, say that Additional Medicare Tax on wages (Form 8959 Part I) applies and is not shown. Narrow the lede to match.

### A2-003 [LOW] rounding-display: self-employment-tax

- **Location:** `src/pages/self-employment-tax-calculator.js:121`
- **Evidence:** Exact half-cent values are rounded down by binary floating point at display: the W-2 example Additional Medicare 0.009 x 38,525 = 346.725 shows $346.72 (hand rounding $346.73); the table row for $150,000 shows SE tax $21,194.32 for an exact 21,194.325 ($21,194.33). Meanwhile Medicare 4,017.225 shows $4,017.23 and 277.875 shows $277.88, so a reader hand-checking sees inconsistent rounding. Independent Decimal recomputation in review-work/recompute.py.
- **Recommendation:** Round to cents with a decimal-safe half-up (e.g. Math.round((x + Number.EPSILON*x) * 100)/100 or scaled integer arithmetic) in formatCurrency or before display; or pick worked examples without half-cent results.

### A2-004 [LOW] boundary-copy: self-employment-tax

- **Location:** `src/components/self-employment-tax-results.js:19`
- **Evidence:** Profit $433.13 gives net earnings 399.996, displayed as 'Net earnings of $400.00 are under $400, so no self-employment tax is due.' The math is right (399.996 < 400) but the sentence contradicts itself on screen.
- **Recommendation:** Show net earnings with floor-to-cent in this message (e.g. $399.99), or phrase it 'are less than $400 ($399.996)'.

### A2-005 [LOW] source-provenance: self-employment-tax

- **Location:** `src/pages/self-employment-tax-calculator.js:21`
- **Evidence:** The page comment claims the sources were 'Read directly by the Codex audit on 2026-10-18', while src/content/site.js:287 says the page is not built 'until its IRS and SSA sources are verified directly (Codex audit ZA-002)'. No SSA source is cited; the 2026 $184,500 figure is attributed to IRS Topic 751. This reviewer could not open the IRS/SSA pages; web-search snippets corroborate $176,100 (2025), $184,500 (2026) and Topic 751 stating the 2026 cap, but that is not a direct read.
- **Recommendation:** Reconcile the two comments; record who read which page and when; consider citing SSA's contribution and benefit base page for the wage bases before going live.

### A2-006 [LOW] test-independence: self-employment-tax

- **Location:** `tests/self-employment-tax.test.js:12`
- **Evidence:** The 'independent line-by-line reference' mirrors the engine's own structure and constants (same 400 test on 0.9235 x profit, same min/max) and medicareWages is always >= socialSecurityWages in the random cases, so it cannot catch a shared semantic error such as A2-001. The page's methodology claim (src/pages/self-employment-tax-calculator.js:172-174) is literally true but overstates assurance.
- **Recommendation:** Add fixed cases taken from published IRS worked examples or a Schedule SE filled by hand, including medicareWages > socialSecurityWages with SS wages 0.

### A2-007 [LOW] format-consistency: rental-property

- **Location:** `src/components/rental-property-results.js:10`
- **Evidence:** Negative values use two different minus signs: cash flow and cost lines use U+2212 via signed(), but percentages use toFixed ('-0.70%', '-25.63%', '-1.70%') and the cap-rate note uses formatCurrency ('-$5,100.00 NOI'). Same on the page (src/pages/rental-property-calculator.js:21, cash-on-cash '-0.70%'). DSCR prints '-0.28'.
- **Recommendation:** Route percentages, ratios and the NOI note through one signed formatter so every negative uses the same sign.

### A2-008 [LOW] edge-case-copy: rental-property

- **Location:** `src/components/rental-property-results.js:16`
- **Evidence:** With 0% down and no closing or repair costs, cash invested is $0: the card shows '—' with the note 'First-year cash flow ÷ $0.00 invested'.
- **Recommendation:** When cashInvested is 0, use a note such as 'No cash invested, so cash-on-cash return is undefined'.

### A2-009 [LOW] copy-accuracy: rental-property

- **Location:** `src/pages/rental-property-calculator.js:53`
- **Evidence:** The NOI formula 'NOI = rent × 12 × (1 − vacancy) − operating costs' and the assumption at line 100 ('percentages of rent actually collected') omit other monthly income, which the engine includes in GSI/EGI and in the percentage-cost base (src/calculators/rental-property.js:79-91). Vacancy also applies to other income.
- **Recommendation:** Write '(rent + other income) × 12 × (1 − vacancy)' and 'percentages of income actually collected'.

### A2-010 [LOW] scope-shared-file: shared (loan-payment engine)

- **Location:** `src/calculators/loan-payment.js:35`
- **Evidence:** The branch range de965bd..HEAD also contains commit a47af1e (ZA-001 fix), which changes the shared monthlyPayment formula used by about 11 live calculators (mortgage, refinance, auto, personal, HELOC, home-equity, affordability, payoff, balance transfer, credit card payoff) and loosens the tolerance in tests/mortgage-payment.test.js:72,78 from 1e-8 to 1e-7. I checked the math: P·r/(−expm1(−n·log1p r)) equals the annuity formula; max |new − old| over P to $100M, rates 0.01–36%, terms 12–480 is $0.00006, and tiny rates now give finite P/n instead of Infinity. Behaviour change is benign and is a correctness improvement, but it is not part of the two drafts and touches live pages.
- **Recommendation:** Keep it, but report it as its own change (ZA-001) separately from the draft calculators, and have the live calculators' browser/visual tests rerun before the next deploy.

## Numbers I recomputed independently

I recomputed with Python Decimal, rounding half-up (`review-work/recompute.py`). These match the page:

- **SE tax, $80,000 example:** net earnings $73,880.00, Social Security $9,161.12, Medicare $2,142.52, SE tax $11,303.64, deductible half $5,651.82, share of profit 14.13%.
- **SE tax, W-2 example:** net earnings $138,525, base left $84,500, Social Security $10,478.00 (vs $17,177.10 uncapped), Medicare $4,017.23.
- **SE tax, $250,000 single:** Additional Medicare $277.88.
- **SE tax, $400 of profit:** $369.40 of net earnings.
- **SE tax table:** all 8 rows match except the 150k SE-tax cell; see A2-003.
- **Rental:**
  - Monthly payment $1,496.93 and annual debt service $17,963.17.
  - GSI $28,800, EGI $27,360, operating costs $10,024.80, NOI $17,335.20.
  - Cap rate 5.78%, cash flow −$627.97 a year (−$52.33 a month), cash-on-cash −0.70%, DSCR 0.97, GRM 10.42, expense ratio 36.6%.
  - All-cash cash-on-cash 5.50%.
  - Break-even rent $2,467.18. By bisection, and by the closed form (5,100 + 17,963.17) / (12 × 0.95 × 0.82).
  - All 15 sensitivity-table cells.

**Two rounding mismatches** (A2-003). These are half-cent float cases:
- Additional Medicare in the W-2 example: the page shows $346.72, exact rounding gives $346.73.
- SE tax at $150,000: the page shows $21,194.32, exact rounding gives $21,194.33.

## Edge cases I probed

Script: `review-work/probe.mjs`.

**Self-Employment Tax**

- Profit $433.13 owes $0 and $433.14 owes $61.20: correct, but see A2-004.
- W-2 wages equal to or above the wage base leave Medicare only.
- MFJ with spouse wages of $300k: the spouse's wages don't reduce Social Security, and Additional Medicare is 0.9% of all net earnings.
- MFS with $100k W-2: the $125k threshold minus wages leaves $25k of room.
- 2025 uses the $176,100 base.
- Negative profit gives $0; −$200M gives a field error.

**Rental Property**

- All-cash with a blank rate or term is accepted and shows DSCR "No loan".
- A down payment of 99.999% still requires a rate.
- 100% vacancy, or percentage costs summing to exactly 100%, gives break-even null with an explanatory note. A sum of 100.01% is a field error.
- Other income that covers all costs clamps break-even to $0.
- Zero rent gives GRM and expense ratio null.
- Negative NOI gives a negative DSCR and cap rate: the values are correct, but the sign formatting is inconsistent (A2-007).

## Tests I ran

All of these ran in the copy:

- `npm test` (node --test): 599 tests, 599 pass, 0 fail.
- `npm run lint`: clean.
- `npm run typecheck`: clean.
- `npm run build:dev`: 44 pages, no drafts.
- `npm run audit:site`: passed, 44 pages.
- `npm run build` without SITE_URL refuses by design.
- The browser suite was not run, as instructed.
- Scratch scripts in `review-work/`: `render.mjs` (page text), `recompute.py` (Decimal recomputation), `probe.mjs` (edge cases), `loan.mjs` (old vs new loan payment formula).

## What I could not verify

- **IRS and SSA pages:** I could not open them; only WebSearch was available.
  - Search results corroborate the 2026 wage base of $184,500 (2025: $176,100). Topic 751 states the 2026 cap.
  - Search results also corroborate that Schedule SE line 8a = W-2 boxes 3 + 7 plus tier 1 RRTA compensation, with 8b/8c for Form 4137 and Form 8919 amounts. This used the 2026 draft Schedule SE and the W-2/W-3 instructions.
  - These are search snippets, not direct reads.
- **Form 8959 thresholds and joint treatment:** the 200k/250k/125k thresholds, "not indexed" and the joint combining are from my knowledge of Form 8959. I did not re-read them this session.
- **The page's "Read directly by the Codex audit" claim:** I could not verify it.
- **Spouse losses on a joint Form 8959:** I did not confirm whether one spouse's SE loss offsets the other's SE income for Form 8959 when both spouses have SE income. The page already discloses that it does not combine two spouses' SE income.
- **Browser behavior:** not verified. That includes the client controllers and whether the spouse field shows or hides.
