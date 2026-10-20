# Independent Zuvogo audit — provisional baseline

Audit date: 2026-10-18, approximately 15:00 IST (09:30 UTC). Auditor: Codex.
Status: **baseline inspected; expansion and completion approval withheld**.

## Identity, scope and protection

- Verified repository: https://github.com/pkray2012/web-calculator-engine (origin fetch/push).
- User-designated baseline: `de965bd1e6e35c1efa6cb0df73021e111f11ac88`, remote branch context `feat/zuvogo-brand`. Verified as a commit and inspected its files, not merely its message.
- Original checkout: `/workspace/web-calculator-engine`, branch `work`, HEAD `79798d8ac61837b390be169a5ed1551896927f81`, clean before audit.
- Isolated audit worktree: `/workspace/zuvogo-audit`, new branch `audit/codex-baseline-20261018`, created directly from the designated commit. Only these two audit documents are changed.
- Other existing checkout: `/workspace/Calculator`, branch `work`, HEAD `703b196ff06a1f36506cca62db6e41765bd0096b`, clean; origin https://github.com/pkray2012/Calculator.git. No application files edited there.
- Available branches and pull-request heads were fetched without resetting either checkout. Historical `eb95696ec0afa1d3698fb446e3d3665066449ba8` was not found in either repository's available objects. Do not infer its repository or content.
- `mydeisgn` is not an audit destination. No files or branding were placed there.
- Commands ran in the attached remote cloud VM, independently of the owner's Mac. Continuous execution after a chat ends is not guaranteed by that observation.
- No deployment, Netlify changes, production configuration changes, DNS changes or Search Console operations occurred. Build origins below are local or the reserved `audit.invalid` test origin.

## Baseline inventory and checks

`src/content/site.js` identifies **Zuvogo**, with `ads: false`. Its 41 entries are live, with 41 unique slugs and 41 unique paths. The build produces **44 HTML pages**: 41 calculators, home, about and 404. The sitemap contains **43 indexable URLs**; 404 is excluded. This is not the claimed 55-page package, and does not establish 18 Batch 3 pages.

Existing calculators span mortgage/loans/refinancing, credit, savings, pay, materials, fuel, sales tax, margin, percentages, tips, room AC sizing and dividends. Exact paths can be regenerated without a build:

```sh
node --input-type=module -e "import {CALCULATORS} from './src/content/site.js'; console.log(CALCULATORS.map(c=>c.path).join('\n'))"
```

Node `v24.19.0`, npm `11.9.0`, installed system Chromium. Node satisfies the repository's `>=22` requirement; Node 22 itself was not separately tested.

| Check | Observed result |
|---|---|
| `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` | Passed; 77 packages, lockfile unchanged. Initial default-cache attempt failed because `/home/agent/.npm` was unwritable; corrected with a supported cache override. |
| `npm run check` | Passed lint, TypeScript check, 552 tests (552 passed, 0 failed/cancelled/skipped), development build, site audit of 44 pages. |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` | Passed: 110 tests, 110 passed, 0 failed/cancelled/skipped; approximately 299 seconds. Includes axe, keyboard, responsive layout, functional and CSP checks. |
| Independent local HTTP smoke | Passed, 43 sitemap URLs, headers, cache directives, canonicals, robots/sitemap, 404 and redirects; zero problems. Built separately with `build({outDir:'/tmp/zuvogo-smoke-dist',origin:'https://audit.invalid'})`, served locally and called `smokeTest(localBase,{origin:'https://audit.invalid'})`. No request to a deployed website. |
| No-JavaScript browser inspection | All 41 calculator pages have readable static results and a visible noscript explanation. They require JavaScript to calculate custom values; this is accurately disclosed in `src/components/calculator-shell.js:20`. |
| Independent formula identities | Seven groups passed: discounted cash-flow identity for a loan; zero-rate limit; volume; inverse coverage; quarterly DRIP; taxed cash dividends; margin/break-even. Details below. |
| Additional boundary reproduction | **Failed**: accepted tiny loan rate yields `$∞` in the actual browser; ZA-001. Existing passing suites do not cover this defect. |
| Narrow credential-pattern scan | No matches in `src`, `scripts`, `netlify.toml` for private-key headers or selected token prefixes. This is not a comprehensive security certification; no credential values were printed. |

An initial smoke invocation against a development-origin build reported localhost URLs, as expected from that build mode. The separate reserved-origin build above passed the production-oriented smoke checks; this does not indicate a production-site defect.

## Formula and evidence audit

This is a focused independent mathematical audit, **not certification of every formula or every claim across all 41 calculators**. Existing tests exercised the broader baseline; source retrieval remains blocked.

- **Loans:** independently discounted the 60 monthly payments at 8% nominal annual rate and recovered the $25,000 principal within `1e-7`; zero rate gives $416.6666666666667. The ordinary annuity formula is mathematically correct, but its floating-point implementation is unstable near zero. See ZA-001.
- **Cubic yards:** `src/calculators/cubic-yard.js:92` computes area × depth(in)/12 ÷27 ×(1+allowance/100). A 12×9 ft rectangle, 3 in depth, 10% allowance gives 1.1 yd³. Inverse coverage at `:117` returns 108 ft². The allowance inversion is division by 1.1, consistent with markup rather than removing 10% of delivered volume. Bags/trucks round up (`:68-69`); geometric volume does not establish supplier density, settlement, price or structural suitability.
- **Dividends:** `src/calculators/dividend.js:43` explicitly models monthly price growth, contributions at month start, periodic dividends, annual dividend growth and flat payout tax. Independently verified $10,000 at 4% with quarterly reinvestment for 10 years against `10000×1.01^40`; without reinvestment and at 25% payout tax, 10-year cash is $3,000 and ending value $13,000. This verifies the illustrative model, not real tax eligibility or forecast returns. Current IRS/SEC source content was not verified.
- **Margin:** `src/calculators/margin.js:25` correctly distinguishes margin from markup. Cost $30, price $50 gives 40% margin; fixed costs $1,001 require 51 whole units. Do not create a duplicate basic break-even page without addressing existing functionality.
- **BTU:** inspected engine, adapter, chart, defaults and visible methodology/limits. The illustrative sunny 20×16 ft room with four people yields `8000×1.1+1200 = 10000 BTU/h`. Units distinguish cooling watts from electrical input. Boundary convention chooses the lower chart row at a shared endpoint; the page is limited to 100–1,000 ft² and excludes heating/whole-house load calculation. Current authoritative chart and ancillary claims still need external verification (ZA-003). No Manual J or electrical-code approval is implied.

### ZA-001 — HIGH: accepted rate produces an infinite payment

Location: `src/calculators/loan-payment.js:26-33`; adapter `src/adapters/loan-payment.js:91-104`.

From the audit worktree:

```js
import { monthlyPayment } from './src/calculators/loan-payment.js';
import { runLoanCalculator, LOAN_DEFAULTS } from './src/adapters/loan-payment.js';
monthlyPayment({principal:25000, annualRate:0.00000000000001, termMonths:60}); // Infinity
runLoanCalculator({...LOAN_DEFAULTS, annualRate:'0.00000000000001'}).ok; // true
```

Chromium reproduction: open the local `/calculators/loan-payment-calculator/`, enter `0.00000000000001` in `#annual-rate`, click Calculate. Primary result is `$∞`; engine schedule pays the whole loan in month 1. `1 + monthlyRate` rounds to 1, making the denominator zero. At `0.0000000001%`, payment is $416.9999654993515 instead of approximately $416.6666666666667. These are extreme inputs but accepted by the public form and adapter.

Recommendation to Claude: stable annuity evaluation using `log1p`/`expm1` or equivalent, finite-output checks, continuity and conservation regressions, and inspection of shared consumers. No implementation fix was merged by Codex. **Open; completion approval withheld.**

## Ranked opportunity shortlist — provisional, not market-validated

No search volume, CPC, traffic, revenue estimate or competitor feature claim is made. Ranking below is an **engineering and user-intent hypothesis**, subject to actual US search-result and competitor review. Effort estimates are rough person-days for implementation plus focused tests/content, excluding external data procurement and legal/code review. All new candidates are **DEFER** until source/competition verification succeeds; none is approved for BUILD.

### 1. Appliance Electricity Cost — `appliance-electricity-cost-calculator`

- Intent: estimate a device's monthly cost and compare two usage scenarios. Hypothesis: useful adjacent cluster to fuel cost and BTU; monetization fit with appliance research, not verified demand.
- Inputs: measured watts or kW, hours/day, days, user-entered marginal electricity rate ($/kWh). Outputs: kWh, dollars, scenario difference. Formula: `E=P_W/1000×hours×days`, `cost=E×rate`. Example dimensional check: 1,500 W ×2 h/day ×30 days =90 kWh; at an explicitly illustrative $0.20/kWh, $18.
- Differentiation to investigate: measured-use vs nameplate-use explanation, marginal vs average rate, daily/monthly comparison. No claim that competitors omit these.
- Competitors actually reviewed: **none**; attempted Calculator.net electricity calculator, blocked. Source target: DOE Energy Saver appliance-use article; optionally dated EIA tariff data only after verification. Units follow watt-hour definitions; publication-source validation pending.
- Dependencies/defaults: no credential or dataset needed if all prices entered by user. No invented US rate default. Hours 0–24; nonnegative finite power/rate/days; reject mixed units and impossible schedules. Nameplate maximum is not measured average use; exclude demand charges, tiered bills, taxes and standby unless explicitly modeled.
- Effort: 1–2 days. **DEFER** pending current evidence and SERP review.

### 2. EV vs Gas Energy Cost — `ev-vs-gas-energy-cost-calculator`

- Intent: compare energy cost per mile/month using the user's driving and charging mix. Hypothesis: commercial vehicle-shopping intent; organic potential unmeasured.
- Inputs: miles, gasoline MPG, $/gallon, EV kWh/100 mi with explicit wall/battery basis, home/public charging fractions and rates. Outputs: dollars/100 mi, period energy costs and difference. Formula: gas cost=`miles/MPG×$/gal`; wall-basis EV cost=`miles/100×kWhPer100mi×weightedRate`. Battery-basis consumption requires dividing by efficiency once; do not add losses to wall-basis label data again.
- Differentiation: transparent charging mix and consumption basis, clearly labeled **energy-only**, linking existing fuel-cost page. Do not claim full ownership savings without depreciation, insurance, financing and maintenance data.
- Competitors actually reviewed: **none**; AFDC Vehicle Cost Calculator request blocked. Source target: AFDC and EPA/FuelEconomy.gov methodology; consumption-basis verification is essential. No vehicle dataset required for manual inputs; no unsupported national vehicle/rate defaults.
- Risks: MPG>0, charging shares sum to 1, 0<efficiency≤1, finite nonnegative rates/mileage; preserve sign on savings. Effort: 2–3 days. **DEFER**.

### 3. AC Operating Cost Comparison — `air-conditioner-running-cost-calculator`

- Intent: translate cooling capacity and rated efficiency into a conditional operating-cost comparison. Hypothesis: adjacent to existing BTU sizing, appliance shopping; no measured demand.
- Inputs: preferably measured average electrical watts and hours; any BTU/h and EER/CEER route requires verified rating definitions. Outputs: electrical energy, cost and difference. Verified dimensional proposal only: if EER is in BTU/(W·h), rated `W=BTU/h ÷ EER`; `kWh=W×hours/1000`. **Do not use SEER2 as instantaneous EER or assume rated runtime equals actual load.**
- Competitors reviewed: **none**; general electricity calculator and ENERGY STAR requests blocked. Source targets: DOE/ENERGY STAR rating and test-method documentation, not just sizing guidance.
- Differentiate sizing from operating cost and seasonal from instantaneous efficiency. Data/defaults: user rates and runtime; no regional weather or seasonal-savings claims without datasets. Risks: cycling, part-load efficiency, humidity, zero efficiency, rating mismatch, duplicate intent with candidate 1. Effort: 2–4 days if evidence supports scope. **DEFER**, preferably merge into candidate 1 unless separate intent is established.

### 4. Solar Simple Payback Scenario — `solar-simple-payback-calculator`

- Intent: compare quoted net cost with bill-offset assumptions. Hypothesis: strong commercial relevance but substantial methodological burden and competition; not measured.
- Inputs: quoted installed cost, explicitly verified eligible incentives (or none), annual production kWh, self-consumption fraction, retail and export rates, annual operating cost. Outputs: first-year net savings and simple payback only. Formula: `savings=production×[selfShare×retail+(1-selfShare)×export]-annualOpex`; `payback=netCost/savings` only when savings>0. Zero savings => no finite payback; negative savings => no simple recovery.
- Competitors reviewed: **none**; PVWatts request blocked. Source targets: PVWatts documentation for production modeling; current utility tariffs and applicable incentive rules. No tax-credit percentage, production default or assumed full-retail export credit supplied.
- Differentiation: expose self-consumption/export assumptions and distinguish simple payback from NPV/IRR. Risks: tariffs, local rules, shading, degradation, battery replacement, financing, tax eligibility, demand charges and policy changes. User-entered production avoids inventing a location model; integration needs separate evidence/data review. Effort: 3–5 days plus tariff/policy research. **DEFER**.

### 5. Standalone Basic Break-even — `break-even-calculator`

- Intent: units/revenue needed to cover fixed costs. Inputs: fixed cost F, unit price p, unit variable cost v. Outputs: exact units F/(p−v), whole units rounded up, corresponding revenue. With p≤v and F>0 there is no positive contribution to recover fixed costs; F=0 needs a defined zero-unit result.
- Competitors reviewed: **none**; Calculator.net break-even request blocked. Source target: SBA break-even page, blocked. No pricing dataset needed. Hypothesis: small-business usefulness, but existing `margin-calculator` already implements basic break-even (`src/calculators/margin.js:31`).
- Differentiation would need a verified distinct scenario (e.g. multi-product mix with known fixed sales mix), not a renamed duplicate. Effort: 1–2 days for basic UI. **REJECT as a separate basic page** because verified overlap precedes speculative SEO benefits.

### 6. Generic Loan Payment Variant — `monthly-loan-payment-calculator`

- Intent: fixed monthly debt payments. Inputs: principal P, nominal annual percentage i, integer months n; outputs payment/interest/schedule. Formula: `r=i/1200`, `A=P*r/[1-(1+r)^(-n)]`, zero-rate P/n; evaluate stably.
- Competitors reviewed: **none**. Evidence: existing `loan-payment-calculator`, auto/personal/mortgage pages and shared amortization engine already serve this intent. Authoritative source target: CFPB loan-rate/APR guidance; do not treat APR including fees as the contractual interest rate.
- No extra dataset; reject negative/nonfinite inputs and test tiny rates. Effort: 1 day for a duplicate UI, unjustified. **REJECT**; prioritize ZA-001 and improve existing explanation instead.

**Excluded regardless of ranking:** Solar Panel Wire Size remains blocked until applicable code requirements and sufficient conductor data are independently verified. The five frozen insulation guides and frozen garage guide remain excluded; their requirement documents are not present in this baseline and are not reconstructed from memory.

## External research ledger

These are **attempted, not reviewed**. Each retrieval returned `Tunnel connection failed: 403 Forbidden` on 2026-10-18. No page body or search ranking was obtained; no inference about competitor functionality is justified.

- US-market query attempt: https://www.google.com/search?q=electricity+cost+calculator+US (no US geolocation/ranking verified).
- https://www.calculator.net/electricity-calculator.html
- https://www.calculator.net/break-even-calculator.html
- https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use
- https://www.energystar.gov/products/ask-the-experts/how-choose-right-sized-window-ac
- https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs/break-even-point
- https://afdc.energy.gov/calc/
- https://pvwatts.nrel.gov/

Source objects in `src/content/sources.js` were reviewed as repository content, not accepted as proof of current external content. Their publisher assertions require external confirmation. No fabricated search metrics, prices, technical rules or source review dates are supplied.

## SEO, accessibility and regression assessment

- Site audit passed checks for titles/descriptions, canonical and og:url consistency, structured data/breadcrumbs, local links, sitemap coverage and robots. Registry paths/slugs are unique. These checks do not prove rankings, rich-result eligibility or distinguishable intent on every existing financial page.
- Existing related-link and navigation generation includes live entries only. The site audit checks local links; manual exhaustive orphan/semantic-overlap analysis across all 41 pages remains outside this focused pass. Reject known duplicate opportunities above.
- Browser suite covers three widths (320, 390, 1280), keyboard navigation, alternate/error states, live calculations, strict CSP and automated axe WCAG 2.1 A/AA checks. Final runner outcome is recorded below; no manual screen-reader certification is claimed.
- All 41 pages retain static examples without JavaScript. Custom interactive calculations require JavaScript, as disclosed. No-JavaScript computing was not promised or implemented.
- No calculator implementation changes in this audit, so no implementation regression was introduced. A docs-only audit does not remove the pre-existing ZA-001 defect. Broad claim/source accuracy and regional finance/tax policies remain unverified.

## Claude handoff and remaining gates

Codex owns this report; Claude owns fixes and new calculators. Read these documents **before selecting or implementing a candidate**. Do not treat provisional hypotheses as approved specifications or current market research.

Safe handoff branch: `audit/codex-baseline-20261018`. Fetch it from origin and inspect its diff against `de965bd1e6e35c1efa6cb0df73021e111f11ac88`; cherry-pick the documentation commit if useful. No shared branch is reset or overwritten. Final response records the actual handoff commit and whether push succeeded.

Outstanding gates:

1. ZA-001 HIGH: Claude fixes numerical stability; Codex independently checks actual changed files, tiny-rate UI and final commit. Not yet resolved.
2. ZA-002 BLOCKER: enable required research destinations through cloud environment settings, retry authoritative and competitor pages, and complete real current-market research. Draft saves do not themselves apply runtime settings.
3. ZA-003 MEDIUM: verify current BTU chart and claims, or document a justified deferral. No false claim that tests establish authoritative methodology.
4. No new calculator was implemented or approved in this session. No final Claude implementation commit has been supplied or reviewed. Final implementation acceptance is pending, not complete.

Finding counts: **3 raised, 0 resolved, 1 deferred (MEDIUM); 1 open HIGH and 1 blocked research prerequisite (BLOCKER)**. Deferred evidence review is not an approval. JSON holds machine-readable evidence and recommendations.

## Final validation update

Browser runner completed with 110/110 passing and exit status 0. Independent near-zero-rate reproduction remains a failure despite that result. The saved startup command `PORT=4187 npm run serve` was also exercised: a local GET returned HTTP 200 and the expected BTU heading. Only the server started for that check was stopped.

Both original checkouts remained clean. Before this documentation commit the isolated worktree contained only these two new audit files; no tracked baseline file changed. JSON parsing/required-field/unique-ID checks and `git diff --check` passed. The handoff commit uses `[skip netlify] [skip ci]`; no pull request, merge or deployment command is part of the handoff.

Cloud onboarding draft persistence was confirmed for `install_script`, `start_skill` and additive research destinations (the prior custom list was empty; package-manager presets were preserved). The scripts use the tested writable npm cache and system Chromium, preserve source/lockfiles, and document how to restart local services. Review/save these changes in **cloud environment settings**, then publish the **cloud development environment** when ready; this is separate from deploying the website. Draft persistence does not establish runtime application, publication or restoration in a new task. Source access remains blocked in the tested instance.


## Remote Instabox follow-up — 2026-10-18T09:58:40.723305+00:00

This section supplements the historical audit above; its earlier environment paths and blockers describe that earlier run only.

### Verified state and independent review

- All operations for this follow-up ran through the Instabox API on `codex-api-machine`, host `instabox-codex-api-machine`, without the owner's Mac.
- New clone: `/data/workspace/zuvogo-isolated-20261018/repository`. Exact origin is `https://github.com/pkray2012/web-calculator-engine.git`. The clone was made with `--no-checkout`; its apparent staged deletions are the deliberately unpopulated index, not existing user edits. It is never used for implementation or commits.
- Existing hometree projects on both VMs contain uncommitted edits and were left untouched. No work was placed in mydeisgn.
- Provisional baseline `de965bd1e6e35c1efa6cb0df73021e111f11ac88` exists; it is an ancestor of Claude's reviewed `bdde12f82494c197c170ea4cf91dcef174e79815`. Batch 3 `eb95696ec0afa1d3698fb446e3d3665066449ba8` is absent from available objects; no historical claims inferred.
- Separate audit branch/worktree `audit/codex-vm-20261018` starts at prior audit `07c118e69bda409791c6e87fd3efaa620b3c32de`. Separate detached baseline and Claude review worktrees preserve all existing branches. Claude development branch remains `claude/compassionate-dirac-cv1ipd`.
- Read Claude's `docs/claude-status-for-codex.md` at `bdde12f`; it asks to independently review fix `a47af1e`. No new self-employment implementation files exist in that reviewed commit; its draft is described as in progress, not treated as delivered.
- Focused loan/mortgage/adapter tests: **32/32 pass**. Full baseline unit suite: **552/552 pass**. Claude reviewed head `npm run check`: **passed**, lint, typecheck, **557/557 tests**, development build and 44-page SEO/site audit, exit 0.
- Independent Python Decimal check at 80-digit precision: **84 cases** across principal 1/25,000/1,000,000, terms 1/12/60/360, rates 0/1e-14/1e-10/0.1/6.5/8/20 percent. Maximum absolute payment error `6.666666666666667e-11` dollars; principal conservation within $0.0051; tiny-rate adapter succeeds. Baseline same tiny-rate input returns Infinity. This supports the numerical ZA-001 fix at reviewed commit; browser verification is running and not yet claimed complete.
- Browser suite launched in the VM as an owned background process; log `/data/workspace/zuvogo-isolated-20261018/claude-review-browser.log`. No server on the owner's Mac and no production deployment.

### Research evidence obtained on the VM

Retrieved and read actual HTML, not search summaries, at this timestamp:

- `https://www.calculator.net/electricity-calculator.html`: HTTP 200. Existing competitor supports W/kW and other power units, capacity factor, numerous usage periods and user electricity price; it explicitly cautions cycling appliances. Do not claim these are unique features. Appliance comparison differentiation still requires stronger validation; no volume/CPC/revenue figures supplied.
- `https://www.irs.gov/instructions/i1040sse`: HTTP 200, current page explicitly **2025** instructions. Verified ordinary filing threshold $400, 2025 Social Security maximum $176,100, Additional Medicare thresholds $250,000 MFJ / $125,000 MFS / $200,000 other listed statuses. Church employee and other exceptions are material exclusions. This is not proof of 2026 constants.
- `https://www.irs.gov/instructions/i8959`: HTTP 200, **2025** instructions. Verified 0.9% additional Medicare rate and non-indexed status thresholds. Employer $200,000 withholding trigger is distinct from filing-status liability threshold; do not conflate them.
- SSA contribution-base page returns HTTP 403. The old DOE appliance and ENERGY STAR sizing URLs return HTTP 404 here; these are not evidence that all network research is blocked. Required conductor/code sources and frozen guides remain excluded.
- ZA-002 changes from blanket network blocker to **partially unblocked, source-specific verification still pending**. Source editions, 2026 wage base, full regular-method formulas, competitor/US-intent analysis and exclusions must be verified before a new calculator is approved. No new calculator approved or implemented by this audit.

### Execution and scheduling limitations

- Both VMs report running, no fixed timeout and autoSuspendAfterSeconds=1800. Background tasks and timers may not prevent platform idle suspension; no uptime guarantee, lifecycle change or external wakeup configured.
- User systemd is running; lingering is enabled; no existing user timers were listed. crontab is absent.
- Claude CLI auth reports loggedIn=false on both VMs; Codex reports Not logged in on both. No provider API credential was found in the ordinary execution environment (presence checks only). GitHub CLI is authenticated separately; that does not authenticate either model provider.
- ChatGPT automation minimum interval is hourly, which cannot satisfy requested 15/25-minute cadence. No hourly substitute was created.
- Therefore **Claude 25-minute and Codex 15-minute autonomous model cycles are NOT active**. Installing timers that repeatedly fail authentication would not meet the request; no such timers were installed. Current direct Codex review remains possible through this chat's VM tools.
- A repository handoff for Claude is being committed on this isolated audit branch, then explicitly pushed and notified via a comment on Claude's handoff commit. Delivery/acknowledgment will be reported separately; a written message is not proof Claude read it.

No previous calculator, implementation, test fixture, branding, existing branch/tag/PR, production setting or live page was modified. No deployment, merge or production branch push occurred.


### Additional independent findings and source checks — 2026-10-18T10:03:45.620233+00:00

- GitHub handoff delivery succeeded: https://github.com/pkray2012/web-calculator-engine/commit/bdde12f82494c197c170ea4cf91dcef174e79815#commitcomment-205502037 . Audit commit `32bdddfd8097eee4f089d20cf9e0331d6b064eaa` was pushed without force to the new audit branch. No acknowledgment by Claude is claimed.
- Browser baseline comparison confirmed the actual tiny-rate UI is `$∞` at de965bd and `$416.67` at reviewed bdde12f, at both 320 and 390 pixels. ZA-001 numerical/UI defect is resolved **on the reviewed development commit only**, not on main or production.
- **ZA-005 MEDIUM, pre-existing responsive failures:** reviewed browser suite fails compact-header assertion at 320 px (91.09375 px versus <=72 px) and DTI page has 5 px horizontal overflow at 390 px. Independent side-by-side baseline probe produces exactly the same header/overflow metrics. These are baseline/runtime reproducible issues, not introduced by the loan change. No styles/test thresholds were edited by Codex. Recommend Claude separately investigate font fallback/layout and min-width constraints with focused responsive regressions; do not approve the complete browser suite as passing. Linux system-ui stack is recorded; no unsupported causal claim that fonts alone cause this is made.
- Successfully retrieved and read the actual cited ENERGY STAR page `https://www.energystar.gov/products/ask-the-experts/how-choose-right-sized-window-ac` (article dated 2024-02-02). It supports -10% shade/+10% sun, 600 BTU per additional regular person beyond two and 4,000 BTU kitchen adjustment. It additionally recommends rounding down to nearest thousand for equipment selection; current calculator exposes the unrounded adjusted capacity. Clarify raw estimate versus equipment selection if citing that exact method. Table rows, 8-foot ceiling and portable-rating assertions are not fully verified from the extracted article. ZA-003 remains partially verified/deferred, not blanket approved.
- Successfully retrieved/read IRS Topic 751 `https://www.irs.gov/taxtopics/tc751`, page updated 2026-09-24: it explicitly gives **2026 Social Security wage base $184,500**. This verifies that constant independently even though SSA remains inaccessible. No 2027 value verified or approved.
- Successfully retrieved/read IRS Topic 554 `https://www.irs.gov/taxtopics/tc554`, page updated 2026-09-24: general 92.35% earnings factor, 12.4% Social Security, 2.9% Medicare, $400 earnings threshold and filing-status Additional Medicare thresholds are supported. Read together with the 2025 Schedule SE/Form 8959 instructions; do not present an entire 2026 return as certified by 2025 instructions. Full line-13 deduction and form-specific exclusions still require explicit evidence and implementation review. A current Schedule SE PDF was downloaded but its content was not inspected; download success is not cited as formula validation.
- Design review for a joint-filing self-employment calculator: clearly distinguish taxpayer-only Social Security wages/cap from combined-spouse wage/self-employment amounts used for Additional Medicare. If the inputs cannot express the intended joint case accurately, document/exclude it; this is a required design review question, not a confirmed implementation defect because the draft code is absent from reviewed bdde12f.
- US-parameter Google search returned HTTP 200 but contained only a redirect/interstitial, **not actual results**. No rankings, search volumes, US demand or competitor lists inferred. Calculator.net electricity remains the one directly inspected competitor. Expansion research is partial, and no new calculator approved/implemented by Codex.


### Final browser result — 2026-10-18T10:04:27.737881+00:00

Full VM Chromium runner completed with **110 tests: 108 pass, 2 fail, 0 cancelled/skipped**, exit 1, 240.313 seconds. Failures are exactly the baseline-reproduced compact-header and DTI-overflow cases in ZA-005. Both axe WCAG 2.1 A/AA sweeps (320/1280), functional checks and layout-shift/module-preload test passed. This does not establish manual screen-reader compliance. Source implementation and existing test fixtures were never edited by Codex. No implementation was merged or deployed. Audit and review worktrees are clean after this documentation commit; the original hometree change public/app.js remains untouched. Full recurring agent execution is blocked on model authentication; no active schedules are claimed.


## Independent follow-up 2026-10-20T02:56:56.226957+00:00
Reviewed 39e0cccf2883bd9bccc903dd3f5b6d36c2cc370e on isolated audit/codex-review-20261020. See [codex-review-20261020.md](codex-review-20261020.md). Five planned drafts; 666/666 unit tests and checks pass. New HIGH ZA-006 (estimated-tax credit/input mismatch), MEDIUM ZA-007 (invalid stair alternatives). HUD/ICC gates remain; no publication approval. Browser final result in dated report. No implementation change or deployment.


## Independent fix recheck: 7b0a0d11d6d8b85a6f7ec6b0d545ff0500556d7d — 2026-10-20T04:38:32.436525+00:00

Exact committed engine/adapter/form/results/page/test diffs reviewed in a new detached Instabox worktree /data/workspace/zuvogo-review-7b0a0d1. ZA-006 refundable-credit defect resolved on this development commit: actual form field currentYearRefundableCredits=400 with total tax1200 and withholding0 produces required quarterly0, balance at filing800. Exactly1000 adjusted balance does not qualify for under-minimum exception. Prior tax10000 minus2000 credits, high prior AGI200000, gives110% test8800. Other excluded-tax adjustments are explicitly stated outside modeled scope; this resolution is not universal tax-return certification.

ZA-007 resolved on this development commit: 24in rise with5in thickness retains only four-riser alternative and omits three invalid counts; thickness4in covers zero-cut case. Independent assertions verify all offered counts have positive bottom cuts and can be re-entered through the adapter.

42/42 focused tests pass. npm ci and npm run check pass:674/674 tests, lint,typecheck,49-page development build and site audit. No full browser suite rerun for this targeted recheck; Claude's111-browser-test and scratch-draft accessibility claims are not independently certified here. Previously recorded scrollbar failures remain open.

49 versus44 built pages is explained by intervening Contact, contact/thanks, Privacy,Terms,Disclaimer pages; all five calculator entries remain planned and excluded from build. Their intended paths are not live URLs. Claude's handoff states owner authorization for legal/contact additions, which this audit does not independently verify; no legal/privacy/contact-form compliance approval is made by this fix recheck.

No implementation files edited, no deployment/merge/production change. Prior worktrees untouched and reviewed worktree clean. Source verification gates remain; do not approve publication merely because these two findings are resolved. A small isolated development-only CSS correction with targeted scrollbar-width regression checks is reasonable for ZA-005, but no implementation/production action is performed by this audit.
