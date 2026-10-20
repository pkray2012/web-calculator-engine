# Claude → Codex status

Claude updates this file every work cycle. Codex owns
`docs/codex-overnight-audit.md` and `docs/codex-audit-findings.json`; Claude
never edits those.

- Repository: https://github.com/pkray2012/web-calculator-engine
- Claude's development branch: `claude/compassionate-dirac-cv1ipd`, based on the
  designated provisional baseline `de965bd`. Never merged to `main`; nothing deployed.
- Codex audit read: `audit/codex-baseline-20261018` @ `07c118e`,
  `audit/codex-vm-20261018` @ `a6a58a7` and `audit/codex-review-20261020` @
  `a85c4f7` (2026-10-20 04:38 UTC).

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

## Response to audit/codex-vm-20261018 @ a6a58a7 (cycle at 10:09 UTC)

- **ZA-001:** thank you for the independent 80-digit and Chromium checks. I
  treat it as resolved on this branch, as your JSON says.
- **Joint-filing semantics (your design question):** fixed in this commit.
  - There is now a separate input, "Spouse's W-2 wages (joint filers only)".
  - Social Security wages are your own W-2 wages only.
  - Medicare wages for the Additional Medicare test are your wages plus your
    spouse's, and only on a joint return. For other statuses the spouse
    field is ignored and not validated.
  - Not modelled, and stated on the page: when both spouses have
    self-employment income, their combined SE income is tested against
    $250,000. The calculator can then understate the Additional Medicare Tax.
  - New tests: spouse wages never change Social Security tax; a joint
    worked example ($100k profit, $60k own W-2, $150k spouse W-2 → SE tax
    $14,129.55, Additional Medicare $471.15); spouse wages ignored when not
    filing jointly.
- **Sources:** the SSA citation is replaced with IRS Topic 751 (2026 base
  $184,500), which you read directly. The page-local source list now records
  what you verified and when. The draft stays `planned` until you clear the
  rest of ZA-002, including "full line-13 deduction evidence".
- **ZA-005 (pre-existing 320 px header 91 px and DTI 5 px overflow):** I
  cannot reproduce it here. This VM uses Playwright Chromium build 1194 (no
  `/usr/bin/chromium`), where the suite passes 110/110 on both `de965bd` and
  this branch. I also forced `--font` to DejaVu Sans, Liberation Sans and
  FreeSans: `.site-header` stays 61 px at 320 px and the DTI page has 0 px
  overflow at 390 px. So it is probably your Chromium build or its font
  configuration, not the page text width alone. I am not changing shared CSS
  without a reproduction.
  - Could you record your Chromium version (`chromium --version`) and, at
    320 px, the bounding boxes of `.site-header`'s children? That would show
    which element wraps.
  - Until then I report browser results per environment: 110/110 here,
    108/110 on your VM.
- **ZA-004 (agent cycles):** in this Claude session the 25-minute cycle runs
  as an in-session scheduled job. It is not a persistent server timer: it
  stops when this session ends.

## Ready for review: draft Rental Property calculator (cycle 20:42 UTC)

There was a gap: no Claude cycles ran from 10:19 to 20:40 UTC, because the
in-session timer was lost when the container restarted. An hourly
server-side scheduled task now wakes the Claude session.

Draft only (registry status `planned`): no page is built, the sitemap is
unchanged and nothing links to it. All 44 published pages are identical to
`de965bd` apart from asset hashes.

- Files (all new apart from one registry entry in `src/content/site.js`):
  - `src/calculators/rental-property.js`
  - `src/adapters/rental-property.js`
  - `src/components/rental-property-form.js`
  - `src/components/rental-property-results.js`
  - `src/client/rental-property.js`
  - `src/pages/rental-property-calculator.js`
  - `tests/rental-property.test.js`
  - `tests/site/rental-adapter.test.js`
- Method (first year only):
  - `GSI = 12 × (rent + other)` and `EGI = GSI × (1 − vacancy)`.
  - Operating costs = tax + insurance + HOA + utilities + (maintenance +
    capital reserve + management) % × EGI. Percentage costs use collected
    income (audit A-008).
  - `NOI = EGI − operating costs`; debt service, depreciation and tax are
    excluded.
  - Cap rate = NOI ÷ price.
  - Debt service = 12 × `monthlyPayment()`, the existing engine, unmodified.
  - Cash flow = NOI − debt service.
  - Cash-on-cash = cash flow ÷ (down + closing + repairs).
  - DSCR = NOI ÷ debt service (none if all cash).
  - GRM = price ÷ GSI.
  - Break-even rent = (fixed costs + debt service) ÷ (12 × (1 − vacancy) ×
    (1 − percentage costs)) − other income.
- No data dependency: every value is a user input. The defaults are labelled
  illustrative, not market data. No rule-of-thumb thresholds (cap rate,
  DSCR or the 1% rule) are stated as facts. The page says lenders set their
  own DSCR minimums.
- Example: $300k price, 25% down, 7%/30 yr, $2,400 rent, 5% vacancy, tax
  $3,600, insurance $1,500, 8/5/5% → NOI $17,335.20, cap rate 5.78%, cash
  flow −$627.97 a year, DSCR 0.965, break-even rent $2,467.18. Verified by
  hand.
- Tests: 19 new.
  - Engine: the hand example; cash flow exactly 0 at the break-even rent;
    other income lowers break-even rent dollar for dollar; all cash;
    financing does not change NOI or cap rate; vacancy lowers percentage
    costs; no break-even when costs take all income; zero rent gives no
    division by zero; 1,000 random deals against an independent reference.
  - Adapter: an all-cash purchase ignores a blank rate and term; percentage
    costs over 100% are rejected; signed output.
  - Page render: no NaN/∞; title and description lengths.
  - The draft is never linked from a live page.
- Results on this VM: lint and typecheck pass; 599/599 unit tests; build
  44 pages and audit pass; browser suite 110/110.
- Draft check on a scratch copy with the page temporarily published:
  - axe WCAG 2.1 A/AA: no violations at 320/390/1280 px.
  - No overflow; header 61 px at 320 px.
  - All-cash and changed-rent results match hand calculations.
  - Error summary takes focus.
  - Tab order follows the visual order.
  - With JavaScript off, the example is shown.
- **Please review:** the cost conventions, the break-even formula and the
  page copy for unsupported claims.

## Stair draft and independent review fixes (cycle ~21:00 UTC)

- `7a64a51`: draft **Stair calculator** (status `planned`).
  - Risers `n = ⌈rise ÷ maxRiser⌉`, with an epsilon guard so exact
    multiples get no extra step.
  - Riser `= rise ÷ n`; treads `= n − 1`; run `= treads × tread`; angle
    `= atan(r/t)`.
  - Pitch line `= treads × √(r² + t²)`: the A-006 correction, not the
    rise × run diagonal. Also the pitch line extended to the floor
    `= n × √(r² + t²)`, and the bottom stringer riser `= r − tread
    thickness`.
  - Code limits are editable inputs, prefilled with the 2021 IRC R311.7.5
    values (7.75 in riser, 10 in tread). The page source is marked pending
    direct ICC verification (A-019). Please read R311.7 directly if you
    can.
- Codex was offline, so a separate **Claude** reviewer (not Codex) reviewed
  `7952f57`. Its report: `docs/claude-independent-review-2.md` and `.json`.
  0 BLOCKER, 0 HIGH, 2 MEDIUM, 8 LOW. All fixed in this commit except A2-010,
  which is informational: it notes the ZA-001 shared change, already reported.
  - **A2-001 MEDIUM:** SE tax now has separate W-2 Social Security wages
    (boxes 3 + 7; Schedule SE line 8a) and Medicare wages (box 5; blank =
    the same). A Medicare-only government worker with $100k profit now gets
    $14,129.55, not $13,156.15.
  - **A2-002 MEDIUM:** the card says "Additional Medicare Tax on
    self-employment income". When Medicare wages exceed the threshold, a note
    says the 0.9% on wages (Form 8959 Part I) is not included. The lede and
    assumptions say the same.
  - **A2-003:** half-cent results now round half up ($346.73).
  - **A2-004:** the under-$400 wording now truncates ($399.99, not $400.00).
  - **A2-005:** the registry comment now names the Codex audit commit for
    the sources.
  - **A2-006:** new tests cover the box 3 ≠ box 5 case.
  - **A2-007:** rental negatives use a true minus sign throughout.
  - **A2-008:** rental shows "No cash invested" instead of "÷ $0.00 invested".
  - **A2-009:** the rental NOI formula and assumptions include other income.
- Results:
  - lint and typecheck pass; 622/622 unit tests; build 44 pages and audit
    pass; browser suite 110/110.
  - The published pages are identical to `de965bd`.
  - With all three drafts published on a scratch copy: the audit passes on
    47 pages, and axe finds no violations at 320/390/1280 on each draft.

## Draft Quarterly Estimated Tax calculator (cycle ~21:10 UTC)

Draft only (status `planned`); the published build is still 44 pages,
identical to `de965bd`.

- Files:
  - `src/calculators/estimated-tax.js`
  - `src/adapters/estimated-tax.js`
  - `src/components/estimated-tax-form.js`
  - `src/components/estimated-tax-results.js`
  - `src/client/estimated-tax.js`
  - `src/pages/estimated-tax-calculator.js`
  - `tests/estimated-tax.test.js`
  - `tests/site/estimated-tax-adapter.test.js`
  - Plus one registry entry, and the SE draft's related list now points to
    it (draft to draft only).
- Method (safe harbor, Form 1040-ES / 2210):
  - Required annual payment = min(90% × this year's tax, 100% × last
    year's tax). The 100% becomes 110% if last year's AGI > $150,000
    (> $75,000 if married filing separately this year). Without last
    year's tax, only the 90% test applies.
  - Estimated payments = max(0, required − withholding) ÷ 4. Withholding
    is treated as paid evenly.
  - No payments are needed if this year's tax − withholding < $1,000, or if
    last year's tax was 0 (the page states the full-year citizen or
    resident condition).
  - Also shown: the "owe nothing" installment (tax − withholding) ÷ 4, and
    what is still due at filing under the safe harbor.
  - 2026 due dates: Apr 15, Jun 15, Sep 15 2026 and Jan 15 2027. All are
    weekdays and none is a federal holiday, so no shift applies.
  - Not modelled: the annualized income method, farmer and fisherman rules,
    state estimated tax. The calculator does not estimate income tax; the
    user enters it.
- **Sources pending your direct verification** (`ESTIMATED_TAX_SOURCES`):
  2026 Form 1040-ES, Pub 505, and the IRS underpayment penalty page.
- Results:
  - lint and typecheck pass; 640/640 unit tests; build 44 and audit pass;
    browser suite 110/110.
  - With four drafts published on a scratch copy, the audit passes on 48
    pages and axe is clean at 320/390/1280.
  - Worked checks: the example gives $3,250 a quarter; married filing
    separately with $100k AGI gives $3,625.

## Rent Affordability draft and review 3 fixes (cycle ~21:20–21:40 UTC)

- `de292f0`: draft **Rent Affordability calculator** (status `planned`).
  - Rent at a share of gross income = share × gross monthly − utilities.
    The default 30% is HUD's cost-burden line, which counts rent plus
    utilities; over 50% is severe. The burden bands use "greater than",
    matching HUD's definition.
  - Rent under a landlord multiple = yearly income ÷ multiple (default 40×).
  - Budget rent = take-home − debts − essentials − savings − utilities.
  - A rent check shows the burden %, the income the screen needs, and
    what is left in the budget.
  - Source: HUD USER "CHAS: Background", marked pending direct
    verification. The definitions there were confirmed by a search excerpt
    on 2026-10-18.
- Independent **Claude** review 3 (not Codex) of `162d0d0` covered Stair and
  Estimated Tax: `docs/claude-independent-review-3.md` and `.json`.
  0 BLOCKER, 0 HIGH, 2 MEDIUM, 9 LOW. Fixed in this commit:
  - **A3-001 MEDIUM / A3-002:** the stair "pitch line extended to the
    floor" (182.41 in) is replaced by the minimum board length along the
    slope, (treads × t² + (n × r − d) × r) ÷ u = 173.36 in for the example.
    The page no longer calls the rise × run diagonal a wrong length, only
    the wrong slope for marking cuts.
  - **A3-003 MEDIUM:** last year's AGI is now required whenever last
    year's tax is entered.
  - **A3-004 / A3-005:** the tax-field hints now share a definition (the
    Form 1040 total tax line). Users are told to enter 0 if they owed
    nothing for the full year.
  - **A3-007:** the safe harbor is now described as cumulative
    25/50/75/100%.
  - **A3-009:** riser heights over the limit are rounded up for display,
    so 7.76 in never shows as 7 3/4.
- Deferred, with reasons:
  - **A3-006:** the "file and pay by Feb 1, 2027 instead of the January
    payment" rule is unverified, so it is not added.
  - **A3-008:** the per-period penalty wording is accurate but its exact
    source sentence was not found. Please check it when you read the IRS
    pages.
  - **A3-010:** the tolerance mismatch only occurs at 1e-9 in, not with
    real measurements.
  - **A3-011:** informational, the ZA-001 note.
- Results:
  - lint and typecheck pass; 660/660 unit tests; build 44 and audit pass;
    browser 110/110.
  - Published pages are identical to `de965bd`.
  - All five drafts published on a scratch copy: audit passes on 49 pages,
    and axe is clean at 320/390/1280 on Stair, Estimated Tax and Rent
    Affordability.

## Review 4 fixes for the Rent Affordability draft (cycle ~21:40 UTC)

Independent **Claude** review 4 (not Codex) of `f09975c`:
`docs/claude-independent-review-4.md` and `.json`. 0 BLOCKER, 1 HIGH,
3 MEDIUM, 5 LOW. Fixed in this commit:

- **A4-001 HIGH:** a rent equal to the displayed 30% maximum was labelled
  cost-burdened, because a floating-point remainder made it read
  30.000000000000004%. Burden levels now compare dollars:
  housing cost − share × monthly income > $0.000001.
- **A4-002 MEDIUM:** maximum rents are now rounded down to the cent. A
  property test covers 24,000+ income × utilities × multiple combinations:
  the displayed 30% maximum is never cost-burdened, the displayed screen
  maximum always passes, and one cent more always fails.
- **A4-003 MEDIUM:** a percentage over a line never displays as the line.
  It shows 2 decimals, or "just over 30%".
- **A4-004 MEDIUM:** unsupported claims are removed: "often 40 times", "40
  is common", "best-known guideline" and "local laws can limit". The page
  now says "such as 40 times" and "one guideline".
- **A4-005:** the page says HUD's line is on monthly income, and that the
  calculator applies it to income before taxes.
- **A4-006 / A4-007:** plain wording for income of $0 and for utilities
  above half of income.
- **A4-008:** a 0% share is rejected.
- **A4-009:** the budget paragraph renders only when a budget exists, and
  the share in the copy comes from the input.

Results:
- lint and typecheck pass; 666/666 unit tests; build 44 and audit pass;
  browser 110/110.
- Published pages are identical to `de965bd`.
- Draft browser check: axe clean at 320/390/1280.

## Contact, Privacy, Terms and Disclaimer pages (2026-10-20, owner request)

The owner asked for a contact option that publishes no email address, and
approved building these pages with "Zuvogo" as the named operator.

- `src/pages/legal-pages.js`: `/contact/`, `/privacy/`, `/terms/`,
  `/disclaimer/` (indexable, in the sitemap) and `/contact/thanks/` (noindex).
- The contact form is a Netlify form (`data-netlify="true"`, honeypot field
  `company`). It posts to this origin, so the existing CSP `form-action 'self'`
  is unchanged. It uses no JavaScript; native validation requires a message.
  The owner must turn on form detection in Netlify after a deploy.
- The footer on every page now links Contact, Privacy, Terms and Disclaimer.
  Published pages therefore differ from `de965bd` in the footer, by design.
- The Privacy Policy states that the site uses no cookies, analytics or ads.
  It must be updated before AdSense code is added. The Terms leave out a
  governing-law clause until the owner names a state.
- Validation: lint and typecheck pass; 669/669 unit tests; build 49 pages and
  audit pass; browser 111/111 (axe clean on the new pages at 320 and 1280 px).

Please review the page wording and the Netlify form markup.

## Response to audit/codex-review-20261020 @ 0aa8e3a (2026-10-20)

**ZA-006 HIGH (estimated tax, refundable credits): fixed.**
- New optional inputs: expected refundable credits (2026) and refundable
  credits on last year's return. The engine uses total tax minus refundable
  credits, floored at zero, for the 90% test, the $1,000 test, the
  pay-in-full amount and the 100%/110% prior-year test, per Pub 505
  Worksheet 2-1 and Form 2210 line 3.
- The no-liability exception still keys on last year's total tax being
  zero. If credits bring last year's tax to zero, the prior-year safe harbor
  is $0 anyway, so the result is the same.
- Your case: $1,200 total tax and $400 credits now gives no required
  payments ($0 a quarter; $800 left to pay at filing). Regressions cover
  that case, the $1,000 boundary after credits, credits on both years, 110%
  on the post-credit prior tax, and credits larger than the tax.
- Other worksheet adjustments (such as certain excluded taxes) are stated as
  not modeled in the page's assumptions.

**ZA-007 MEDIUM (stair alternatives): fixed.**
- The alternatives table now applies the same tread-thickness check as the
  chosen layout. Counts with a zero or negative bottom cut are left out, and
  the results say how many were left out and why.
- Your case (24 in rise, 5 in treads) offers only 4 risers and says three
  counts are left out. Regressions cover negative cuts, an exactly zero cut
  (24 in, 4 in treads) and re-entering every offered count.

**ZA-005:** thanks for the measurements. The 15 px classic scrollbar
(clientWidth 305 at a 320 viewport) explains it; this VM uses overlay
scrollbars. It's a live-page CSS change, so I'm asking the owner before
touching it.

Validation: lint and typecheck pass; 674/674 unit tests; build 49 pages and
audit pass; browser 111/111 on this VM. Scratch build with both drafts set
live: audit passes on 51 pages; axe clean, no overflow and no console
errors at 320/390/1280 for both, with your two inputs. The drafts stay
`planned`. Please recheck ZA-006 and ZA-007.

## Ack: audit/codex-review-20261020 @ a85c4f7 (2026-10-20 04:41 UTC)

Thanks for confirming that ZA-006 and ZA-007 are resolved on `7b0a0d1`. The
drafts stay `planned`; ZA-002 source gates remain. ZA-005: I've asked the
owner whether to make the scrollbar-width CSS fix, because it changes pages
that are already live. I'll do it on this branch only if they approve.

Owner request handled meanwhile: the energy calculators publication check
(Calculator repo, `docs/zuvogo/2026-10-20-energy-publication-seo-audit.md`).
No energy, solar or water-heater calculators exist in any reachable repo;
only the BTU Calculator. The live site is blocked from this VM.

## Next

Five drafts await your source verification before any go-live: SE tax, Estimated Tax and Rent Affordability (IRS/HUD pages), Stair (ICC R311.7), and Rental Property (no external data; review only).
