# Independent recheck of classic-scrollbar CSS fix

Audited 6cc1cc67322f5e3bf3155b3a11cfb3590c4722a5 on claude/compassionate-dirac-cv1ipd; CSS change682664e. Timestamp 2026-10-20T06:42:00.191250+00:00. Repository https://github.com/pkray2012/web-calculator-engine. Isolated detached review worktree /data/workspace/zuvogo-review-6cc1cc6; existing work preserved. Baseline de965bd remains the protected historical baseline.

## Verdict
Original ZA-005 reproductions fixed on this development commit. No new HIGH implementation defect found in this focused diff. New MEDIUM test-portability defect ZA-008 and a LOW pre-existing boundary overflow ZA-009 are recorded below. Full-suite approval remains withheld pending correct test setup. Draft source gates remain unchanged.

## Independent before/after evidence
Compared actual Chromium154.0.8037.57 default-font DTI renders at7b0a0d1 and6cc1cc6 with viewport widths320,379,380,390,420,900, each with native classic scrollbar and explicitly hidden scrollbar (test-only injected CSS, not implementation). Raw24 measurements in codex-css-evidence-20261020.json.
- Native320/client305: header91.09375px before,61px after.
- Native380/client365: overflow10px before,0after; native390/client375:5px before,0after.
- Native420/client405 remains two stat columns;900 remains three.
- Explicit no-scrollbar379/client379 stays one column;380/client380 stays two;390/client390 stays two. No visual/formula change assumed merely from column count.
- Two focused regression tests for real classic scrollbars/default+DejaVu pass on this VM. The test framework checks DejaVu installation, so these are not silently substituted fonts.

## ZA-008 MEDIUM: new test incorrectly assumes the default browser has overlay scrollbars
Affected tests/browser/site.browser.mjs:1825-1829, test `ZA-005: result cards switch to one column by the space the results panel has`.
Reproduction: CHROMIUM_PATH=/usr/bin/chromium node --test --test-name-pattern=ZA-005 tests/browser/site.browser.mjs.2/3pass; third fails expected2actual1 at380px. Our default Chromium leaves365px document width at380px viewport and333px result content. New container query correctly chooses one column; test blindly expects two because it assumes default browser is scrollbar-free. This is a test fixture/environment assumption, not evidence of broken CSS at that width.
Recommendation: explicitly establish and assert both scrollbar modes, or derive expectation from measured layout width. Keep real classic-scrollbar coverage; do not disable the test or broadly loosen layout assertions. Require no horizontal overflow, not just a column count.

## ZA-009 LOW: existing no-scrollbar380px DTI overflow remains
Same independent measurement with scrollbars explicitly hidden: viewport/client380, result content348, two columns, scrollWidth382 (2px overflow). Reproduces before and after, so NOT introduced by the CSS fix. At379 and390 no-scrollbar overflow is0. Current347px container breakpoint preserves this existing narrow boundary defect. Consider a content-safe card breakpoint, wrapping or sizing improvement with a regression at this exact effective width. Do not call all narrow widths overflow-free based on320/390/1280tests. No implementation edited by Codex.

## Scope, source and regression checks
- npm ci/npm run check pass:675/675 unit tests, lint,typecheck,49-page development build and site SEO audit.
- No delta since7b0a0d1 in calculator engines,adapters,netlify.toml or.github configuration.
-49built HTML files before/after. After normalizing only CSS asset hashes, privacy/index.html is the sole HTML difference; the privacy disclosure update is separate5c82d09. Other calculator examples/content unchanged in those rendered files. This does not prove pixel equivalence.
- Privacy text now mentions Netlify performance monitoring instead of blanket no-analytics language; code and output verified. Actual live-host telemetry behavior/privacy compliance not independently inspected or certified in this recheck.
-675unit tests do not validate privacy truth or every screen width. Full browser suite completed: **113/114 pass, one failure**, exit 1, 270.530 seconds. The sole failure is ZA-008 at tests/browser/site.browser.mjs:1828. Both original mobile layout checks now pass, both full-site axe sweeps pass, and the explicit classic-scrollbar tests pass. Prior resolved ZA-006/007 remain resolved; no implementation modification here. Five calculator drafts remain planned, no release approval.
- All commands, inspection and QA run inside the remote Instabox VM; no Mac dependency. No merge/deploy/production changes or existing user-file overwrites. Audit output only.

## Claude next action
Fetch the audit branch after explicit push. Fix ZA-008 environment setup first; optionally repair pre-existing ZA-009 independently with targeted tests. Do not change unrelated CSS or production. Source requirements for hidden drafts remain.


Sitemap, robots.txt and generated _headers were byte-identical to the prior reviewed build. Rendered privacy page changed as described; other HTML matched after CSS hash normalization. Reviewed worktree remained clean. Audit changes only; nothing deployed or merged.
