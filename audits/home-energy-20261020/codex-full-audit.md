# Independent Home Energy audit — October20,2026

Scope: the uploaded audit-request.txt, not implementation authorization. **PARTIAL AUDIT — missing Claude documents and vectors prevent full reconciliation/readiness review.**

## Verified

- Remote claude/compassionate-dirac-cv1ipd tip matches `098571906afd98b0fdf04ad6a57f784cd8ea8db8`. A commit-addressed source archive was preserved and exported only inside this audit directory.
- Actual local `/workspace/mydeisgn` is a different repository at `ff4933d2fd81e8d16df82057c839a6ba1d848470`, clean, containing only README.md. It was not replaced.
- Registry has **41 live baseline calculators**, no registered Home Energy candidates. Site audit checks49existing pages.
- Original workbooks contain25roadmap rows each:75total; Batch3detailed scope is5calculators+20guides. The Batch3overview says7calculators+18blogs, while the detailed roadmap says5calculators+20guides; both are preserved in research-inventory.json, not silently reconciled. Neither inventory authorizes this eight-candidate intake.
- 25 synthetic arithmetic illustrations pass. These are not Claude vectors and not tests of proposed Home Energy code.
- Existing baseline: lint: PASS (exit 0); typecheck: PASS (exit 0); unit: PASS (exit 0); build: PASS (exit 0); site-audit: PASS (exit 0); browser: TIMEOUT (exit None); browser-repeat: PASS (exit 0); production-format-build: PASS (exit 0); production-format-site-audit: PASS (exit 0). Unit log contains681passed tests. Browser results are baseline-only, never candidate acceptance. Browser repeat completed with exit0; the initial300second wrapper timeout is retained as a superseded attempt, not an application failure.
- 425 original exported files remain byte-identical after install/testing/build; export-integrity.json records the check.

## Findings

| ID | Severity | Finding | Evidence/file/section | Correction | Status |
| --- | --- | --- | --- | --- | --- |
| F01 | P2 | Seven Claude source documents unavailable | inventory.json: expected /home/user/*.md; remote-document-search.json | Supply exact original revisions; do not infer decisions, statuses or corrections to unseen text. | BLOCKED |
| F02 | P2 | Claude reference script/vectors unavailable | inventory.json: two /tmp/claude-0/... paths | Supply originals with hashes. No original expected values or counterexamples have been tested. | BLOCKED |
| F03 | P2 | Build browser allowlist excludes energy/ | scripts/build.js:70–72,279–298; repository-probes.json energyFolderProbe | If the actual plan proposes browser-imported src/energy/, either use allowed calculators/ for pure engines or propose an explicitly reviewed minimal allowlist extension. Do not claim the missing plan is broken without reading it. | CONFIRMED CONSTRAINT; plan comparison blocked |
| F04 | P1 | Accepted sub-cent loan principal yields no repayment | src/calculators/loan-payment.js:55; src/adapters/loan-payment.js; repository-probes.json | For new finance compatibility, define supported money precision/principal domain or request separate baseline correction. Do not reuse schedule totals blindly below0.005. | REPRODUCED; application unchanged |
| F05 | P2 | Fuel Cost finite inputs can produce infinite outputs | src/calculators/fuel-cost.js:45–49; repository-probes.json | Proposed adapters/engines must reject nonfinite intermediate/results, or define finite domain. Existing baseline correction is not authorized here. | REPRODUCED; application unchanged |
| F06 | P3 | Loan engine comment calls nominal-rate input APR | src/calculators/loan-payment.js:24,34; evidence/cfpb.txt | Clarify nominal annual note interest in proposed finance contract. APR includes fees and must not silently replace note rate. Do not edit frozen baseline in this audit. | CONFIRMED terminology ambiguity |
| F07 | P2 | EPA loss boundary not verified from requested AppendixE | source-retrievals.json; evidence/epa-label.txt | Obtain2024AutomotiveTrends AppendixE exact passage before presenting the label metric as verified wall energy. Label page confirms kWh/100mi, not the charging-loss boundary. | PARTIAL; no upgraded evidence |
| F08 | P2 | Original source statuses/approval provenance unavailable | All seven missing source documents | Preserve original Confirmed/Partial/Conditional/Failed/Unresolved statuses when supplied; fresh retrieval failures do not overturn prior verified evidence. No candidate promoted to approved/ready. | BLOCKED |
| F09 | P2 | Ancestry cannot be established from archive alone | commands.json; immutable export has no .git | Remote branch tip matches requested HEAD. Obtain read-only commit-parent/compare evidence to verify de965bd... ancestor; neither matching branch labels nor tarballs prove ancestry. | UNVERIFIED |

No P0 was established from accessible evidence. F04 is P1 under the requested incorrect-financial-output criterion, with impact limited to the demonstrated accepted sub-cent domain; ordinary consumer inputs were not shown defective. Fuel overflow is P2. No defect is attributed to unseen candidate implementations. Module-folder compatibility is conditional on the actual missing plan.

## Owner summary

Verified: repository branch/head,41calculator registry, current baseline checks,25independent illustrations, selected original-source passages and75report rows. Failed retrievals: exact URLs/errors in source-evidence.md. Unknown: seven Claude revisions, all original vectors, plan architecture, approval provenance, requested source passages and baseline ancestry.

**None of the eight candidates is established implementation-ready by this audit.** This does not declare the mathematical identities incorrect; candidate contracts/source boundaries/tests remain unavailable. Supply the seven documents and two reference files and preserve their revisions. Clarify unresolved measurement and financial ledgers before any implementation request. Four hubs, navigation changes, Batch2, merges, frozen pages, tax-credit guide andZA-009 remain excluded. No owner's approval is inferred.

Read-only baseline review is complete for executed checks; full Claude proposal/document review is not complete. No application source, tests, package manifests, original workbooks or actual checkout modified. No branch/worktree, commit, push, merge, deployment, production change, job change, machine wake/suspend, ZA-009 repair or owner approval. All audit artifacts and generated test output are outside the actual repository.
