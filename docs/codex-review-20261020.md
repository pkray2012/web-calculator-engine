# Independent Codex audit: 2026-10-20

Timestamp 2026-10-20T02:56:56.226957+00:00. Repository https://github.com/pkray2012/web-calculator-engine.
Reviewed Claude commit `39e0cccf2883bd9bccc903dd3f5b6d36c2cc370e`, branch claude/compassionate-dirac-cv1ipd. Protected baseline de965bd1e6e35c1efa6cb0df73021e111f11ac88 verified as ancestor. Audit branch audit/codex-review-20261020, based on prior audit a6a58a7.

## Verdict and scope
Five new draft calculators exist and remain planned: Self-Employment Tax, Quarterly Estimated Tax, Rental Property, Stair and Rent Affordability. Their intended paths are `/calculators/self-employment-tax-calculator/`, `/calculators/estimated-tax-calculator/`, `/calculators/rental-property-calculator/`, `/calculators/stair-calculator/`, `/calculators/rent-affordability-calculator/`; these are not live URLs. Do not release yet: one new HIGH and one MEDIUM defect reproduced, and source gates remain. This focused audit is not certification of every input or tax/construction rule. Claude reviewer reports were inspected as claims, not accepted as independent Codex approval.

## ZA-006 HIGH: estimated-tax input/credit mismatch
Affected src/components/estimated-tax-form.js, src/calculators/estimated-tax.js, src/pages/estimated-tax-calculator.js. Form asks for Form 1040 total-tax line in both years; engine subtracts withholding only, with no refundable-credit or excluded-tax adjustment input. Yet page says the $1,000 exception is after refundable credits.

Reproduced through runEstimatedTaxCalculator: currentYearTax='1200', withholding='0', priorYearTax='', priorYearAgi='', marriedFilingSeparately=''. Accepted, paymentsRequired=true, safeHarborInstallment=270 and payInFullInstallment=300. For a taxpayer with those $1,200 total tax and $400 refundable credits, adjusted balance is $800: no estimated payment under the under-$1,000 exception. UI cannot represent those credits. This follows the actual total-tax field hint, not an assumption of adjusted-tax inputs.

Direct primary evidence: IRS Publication 505 (2026), Worksheet 2-1 and accompanying total-tax explanation; prior-year Form 1040 line 24 must be reduced by specified taxes and refundable credits. Form 2210 instructions line 3 includes refundable credits. Underpayment page defines tax shown as total tax minus refundable credits. Fix by modeling adjustments or requiring correctly adjusted worksheet tax amounts with accurate instructions and explicit exclusions. Regress current-year $1,000 boundaries and prior-year safe harbors with credits/excluded taxes. Keep blocked pending independent recheck.

## ZA-007 MEDIUM: impossible stair alternatives offered without warning
Affected src/calculators/stair.js options loop, src/components/stair-results.js alternatives table.
Reproduced through runStairCalculator(STAIR_DEFAULTS plus totalRise='24', treadThickness='5'). Accepted chosen four-riser layout has 6-inch risers and 1-inch bottom cut. Suggested 5/6/7-riser alternatives have bottom cuts -0.2/-1/-1.5714285716 inches. The alternatives show Within limit riser labels, without the invalid cut warning. These inputs are inside form bounds, thickness<=6. Apply the same thickness feasibility check to all alternatives; omit unusable options or label them clearly, and regress zero/negative cuts plus re-entering an offered option. This is not a finding about code compliance or independent validation of board sizing.

## Sources reviewed directly on remote VM
- https://www.irs.gov/publications/p505 : HTTP200, explicit 2026 edition. Confirms 90/100/110% rules, >$150,000/>$75,000 MFS AGI limits, all four 2026 payment dates, installment timing, adjusted tax and refundable-credit handling. Worksheet 2-3 line11 explicitly calculates expected SE deduction at 50% of SE tax: this closes the earlier basic half-deduction evidence gap for the standard modeled case.
- https://www.irs.gov/instructions/i2210 : HTTP200; line3 refundable credits and prior-tax adjustments verified.
- https://www.irs.gov/payments/underpayment-of-estimated-tax-by-individuals-penalty : HTTP200; general definition verified, but example years are stale 2023/2024. Use actual 2026 publication for 2026 rules.
- https://www.irs.gov/instructions/i1040sse : HTTP200, 2025 edition. Do not imply an entire 2026 return is certified by 2025 instructions. Separate SS/Medicare/spouse fields address earlier semantics concern; two SE spouses remain excluded by draft limitations.
- https://www.huduser.gov/portal/datasets/cp/CHAS/bg_chas.html : HTTP202 with zero-byte body. HUD content not verified, despite successful HTTP-level response.
- https://codes.iccsafe.org/content/IRC2021P2/chapter-3-building-planning : HTTP403. Stair code defaults/handrail claims remain unverified. No wire-size or frozen-guide approval.
Rental first-year revenue/expense/debt and break-even algebra inspected and internally consistent under stated conventions; capital reserves included in stated NOI convention should remain clearly qualified for cap-rate/DSCR comparisons. No lender-standard or competitive-demand endorsement. No search-volume/CPC/revenue datasets invented.

## Validation and preservation
All operations ran through Instabox codex-api-machine, independently of the owner's Mac. VM was suspended at start and resumed for execution; no continuous overnight claim. Fresh detached worktree /data/workspace/zuvogo-review-20261020; isolated audit worktree /data/workspace/zuvogo-audit-20261020. Existing projects/worktrees untouched.

npm ci and npm run check passed: lint, typecheck, **666/666 tests**, build and site audit of **44 pages**. Five planned drafts absent from built pages/sitemap. Unit success does not cover the independent failures above. No diff from baseline in .github, netlify.toml or scripts/build.js. Main remains 79798d8ac61837b390be169a5ed1551896927f81. Batch3 eb95696 remains absent. No implementation edits by Codex, no deployment/merge/production push or production configuration changes. This establishes repository state, not independently queried external hosting state.

Full live-page Chromium suite completed: **108/110 pass, 2 failures**, exit1, 273.281 seconds. Failures are the same pre-existing 320px header height and 390px DTI overflow; both axe sweeps, functional and layout-shift/module tests pass. It does not exercise planned pages interactively. Claude's scratch-draft browser claims were not independently rerun here.

ZA-005: Chromium **154.0.8037.57**, Debian13. Header boxes requested by Claude recorded. At viewport320/clientWidth305, nav wraps to90.09375px and header91.09375px. At viewport335/clientWidth320 header61px. DTI at viewport390/clientWidth375 has scrollWidth380; at viewport405/clientWidth390 overflow disappears. This strongly implicates 15px scrollbar/effective layout width in the environment disagreement, not a demonstrated font-only issue. Preserve assertions until effective widths are addressed. Metrics are in codex-evidence-20261020.json.

Claude acknowledged prior audit a6a58a7 in its handoff. Its external in-session/hourly scheduling claims are not independently verified here; no new scheduler configured. Next: Claude fixes ZA-006 then ZA-007, keeps drafts planned, completes authoritative source gates, and asks for independent recheck. Audit changes are shared by explicit commit/push and repository comment, not assumed worktree visibility.
