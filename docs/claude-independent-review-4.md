# Independent review 4: draft Rent Affordability Calculator

Reviewer: Claude (Anthropic). I am a separate Claude agent standing in while OpenAI Codex is offline; I am not Codex.
Repository: pkray2012/web-calculator-engine, branch claude/compassionate-dirac-cv1ipd
Commit: f09975c
Reviewed at: 2026-10-18T21:32:27Z (`date -u`)
Method: read-only. The code was reviewed in a `git archive` copy, not the working tree. No edits, commits or pushes were made to either repository.

Counts: BLOCKER: 0, HIGH: 1, MEDIUM: 3, LOW: 5

## Summary
The engine math is correct for the stated formulas, and every worked figure on the page matches independent recomputation (see below). The main defect is floating-point classification at the 30%/50% edges: a rent equal to the calculator's own "rent at 30%" can be labelled "cost-burdened (over 30%)". Display rounding causes related contradictions. Landlord-screen prevalence claims are unsourced. The page makes no NYC or legal-limit claims, and it says it is "a planning estimate, not financial advice". site.js adds only `status: 'planned'` entries, and the draft is not emitted by the build.

## Findings

### A4-001 [HIGH] calculation-correctness
- Location: src/calculators/rent-affordability.js:65
- Evidence: burdenPercent = (rentConsidered + monthlyUtilities) / grossMonthly * 100 is compared with costBurdenLevel(), which uses a strict > 30. Floating-point residue pushes exact-30% cases over the line. Reproduced through the adapter: annualGrossIncome '12400', utilities '0', rentConsidered '310'. The results show 'Rent at 30% of income: $310.00' and then 'Rent plus utilities would take 30.0% of gross income: cost-burdened (over 30%).' (310/(12400/12)*100 = 30.000000000000004). Typing the displayed 30% rent back in is classed as burdened in 1,532 of 9,524 income and utility combinations tested (incomes $12,000 to $250,000 in $100 steps; utilities 0, 75, 150 and 233). The 50% edge has the same exposure. tests/rent-affordability.test.js:54-59 only call costBurdenLevel(30) directly, so the page's claim (page line 108) that tests check 'the 30% and 50% band edges' does not cover the end-to-end path.
- Recommendation: Classify without floating division: compare (rent + utilities) * 100 against share * grossMonthly in integer cents, or snap burdenPercent (for example Math.round(x * 1e9) / 1e9) before comparing. Add end-to-end tests: $12,400 income with $310 rent gives 'none', and rent equal to the engine's guidelineRent/severeRent gives 'none'/'burdened' across a sweep of incomes.

### A4-002 [MEDIUM] rounding-display
- Location: src/components/rent-affordability-results.js:17
- Evidence: Maximum-rent figures are rounded half-up to cents for display (roundCents), so a displayed maximum can be slightly above the true maximum. With income $60,001 and 40x, screenRent = 1500.025, shown as $1,500.03. Entering $1,500.03 as the considered rent gives 'A 40x screen asks for $60,001.20 a year; your income is $0.20 short.' It is also classed as cost-burdened (over 30%). With $12,000 and 45x, the displayed $266.67 gives '$0.15 short'.
- Recommendation: Floor the 'rent you can afford' figures (guideline, screen, budget, lowest, severe) to the cent before display, or compare the considered rent against limits with a half-cent tolerance. Add a test that entering any displayed maximum passes its own test.

### A4-003 [MEDIUM] rounding-display
- Location: src/components/rent-affordability-results.js:28
- Evidence: burdenPercent.toFixed(1) can show '30.0%' next to 'cost-burdened (over 30%)'. Defaults with rentConsidered '1352' (30.04%) render 'Rent plus utilities would take 30.0% of gross income: cost-burdened (over 30%).' The same happens with '1350.01'. The page then contradicts itself in a single line.
- Recommendation: When the value is above 30 or 50 but rounds to it, show more decimals or 'just over 30%'. Alternatively, round up to one decimal for display when above a band edge.

### A4-004 [MEDIUM] content-sourcing
- Location: src/pages/rent-affordability-calculator.js:69
- Evidence: The page states 'Many landlords ask for yearly income of a set multiple of the monthly rent, often 40 times' (line 69). The form hint says '40 is common; ask the landlord.' (src/components/rent-affordability-form.js:43). The page description says 'a landlord's 40x income screen'. Line 59 says 'The best-known guideline is to keep housing costs at or below 30% of gross income.' Line 100 says 'local laws can limit what they may require.' The sources section cites only HUD CHAS, which supports none of these claims. The page makes no NYC-specific or legal-limit-specific claim (good). The general local-law sentence is unverified.
- Recommendation: Either cite a reliable source for the prevalence of the 40x screen, or soften to neutral wording such as 'Some landlords use an income multiple, such as 40 times the monthly rent'. Remove 'best-known', or source it. Keep the local-law sentence generic (or drop it) unless it is sourced.

### A4-005 [LOW] content-sourcing
- Location: src/pages/rent-affordability-calculator.js:28
- Evidence: RENT_AFFORD_SOURCES.hudCostBurden is marked as pending direct verification. Through WebSearch, this reviewer could also corroborate only via a search excerpt of https://www.huduser.gov/portal/datasets/cp/CHAS/bg_chas.html. The excerpt matches: cost burden is housing costs including utilities exceeding 30% of monthly income; severe is exceeding 50%. The 'supports' text and the bands ('none' at 30% or less, over 30% to 50%, over 50%) match that excerpt. However, the page (line 59-60) ties HUD to '30% of gross income', and HUD's wording is 'monthly income'. CHAS's income concept and its renter housing-cost definition (gross rent = contract rent + utilities) were not read directly.
- Recommendation: Read the HUD page directly before go-live (as the code comment already requires). In the HUD sentence, say 'income' (or confirm 'gross') to match HUD's wording.

### A4-006 [LOW] copy-accuracy
- Location: src/components/rent-affordability-results.js:37
- Evidence: The note reads 'Above ${severeRent} rent would take more than half of gross income with utilities.' severeRent is clamped to 0. With income $12,000 and utilities $700, it reads 'Above $0.00 rent would take more than half...', yet even $0 rent is already 70% (severe). With income 0, it also prints 'Above $0.00'.
- Recommendation: When severeRent is 0, say that utilities alone already exceed half of income (or that no income was entered) instead of 'Above $0.00'.

### A4-007 [LOW] copy-accuracy
- Location: src/components/rent-affordability-results.js:28
- Evidence: With annualGrossIncome '0' (entered, not blank: the field is required), the considered-rent check says 'With no income entered, the share of income cannot be worked out.'
- Recommendation: Use 'With zero income, ...'.

### A4-008 [LOW] validation
- Location: src/adapters/rent-affordability.js:39
- Evidence: housingSharePercent accepts 0 (min: 0), which gives a guideline rent of $0.00 and 'The lowest of these, $0.00 a month, fits every test you entered.' Shares above 50 are accepted with no notice. For example, at 60% the headline shows 'Rent at 60% of income $2,850.00', above the $2,350 severe line stated in the same panel. The considered-rent bands always stay at HUD's 30/50, regardless of the custom share, which is correct but unexplained.
- Recommendation: Require a share greater than 0 (or say why 0 is allowed). When the share is above 30, add a line saying HUD's cost-burden bands stay at 30% and 50%.

### A4-009 [LOW] maintainability
- Location: src/pages/rent-affordability-calculator.js:61
- Evidence: The worked example hardcodes '30% of' (line 61) and assumes r.budget is non-null (line 78). It is correct for the current defaults ($5,000 x 30% = $1,500; minus $150 = $1,350; $3,900 - 400 - 1,200 - 500 = $1,800; $1,650 after utilities; $60,000 / 40 = $1,500). However, it would break or mislead if RENT_AFFORD_DEFAULTS changed (blank take-home throws a TypeError at build).
- Recommendation: Use input.housingSharePercent in the copy, and guard the budget paragraph, or add a test asserting that the defaults include take-home.

## Independent recomputation (review4-work/recompute.mjs, display.mjs, typed-edge.mjs)
- Defaults: gross monthly is 60,000/12 = 5,000. 30% of that is 1,500, minus 150 utilities = **1,350**. 50% is 2,500, minus 150 = **2,350**. The screen gives 60,000/40 = **1,500**. Budget: 3,900 - 400 - 1,200 - 500 = **1,800**, minus 150 = **1,650**. Lowest = **1,350**. All match the engine and page.
- 12 months / 40 = 0.30, so the claim that 40x and 30% agree with no utilities is correct.
- Table (30% / 50%, no utilities): 30k 750 / 1,250.00; 40k 1,000 / 1,666.67; 50k 1,250 / 2,083.33; 60k 1,500 / 2,500; 75k 1,875 / 3,125; 100k 2,500 / 4,166.67; 125k 3,125 / 5,208.33; 150k 3,750 / 6,250. All match after cent rounding. The raw floats 1250.0000000000002 and 2500.0000000000005 display correctly.
- Test example: rent 1,700, giving (1,700+150)/5,000 = 37.0%, burdened. The 40x screen needs 68,000, so the user is 8,000 short. The budget leaves 1,800 - 150 - 1,700 = -50, displayed as "−$50.00", "does not fit". Correct.
- Bands vs HUD (search excerpt): "exceeding 30%" maps to >30 = burdened, and "exceeding 50%" maps to >50 = severe. 30 and 50 exactly fall in the lower band. This is consistent; the exception is the float defect in A4-001.
- Validation: blank utilities, debts, essentials and savings fall back to 0. Blank take-home and blank rent fall back to null (the view is skipped). Blank share and multiple fall back to 30 and 40. A negative value gives a field error. Multiple below 1 is rejected. Zero income gives no division by zero (burdenPercent null). A negative budget is clamped to $0 rent, with the remainder shown as a signed "−$800.00 left for housing". All of this was verified.

## Tests and checks run (in the copy)
- `npm test`: 660 tests, 660 pass, 0 fail. No regressions in the earlier fixes in this range (loan-payment ZA-001, SE tax, rental, stair, estimated tax).
- `npm run typecheck`: clean. eslint on the rent-affordability files: clean.
- `node scripts/build.js --dev`: 44 pages built, and no rent-affordability page or reference appears in dist. The draft is not built.
- `git diff de965bd f09975c -- src/content/site.js`: additions only. Five entries were added (rent-affordability, rental-property, estimated-tax, self-employment-tax, stair), all `status: 'planned'`. No existing entry was modified.
- The browser suite was not run, as instructed.

## Not verified
- I did not read the HUD CHAS background page directly. Only a WebSearch summary excerpt was available, and it matched the definitions. HUD's income concept (gross vs other) and its renter housing-cost definition were not confirmed.
- How common 40x landlord screens are, and any local-law limits on income requirements: no source was checked, and none is claimed.
- Client-side behaviour in a real browser (src/client/rent-affordability.js only wires the shared mountCalculator, which was not re-reviewed).
