from pathlib import Path
import json,re,hashlib,tarfile
b=Path(__file__).parent;inv=json.loads((b/'inventory.json').read_text());calc=json.loads((b/'independent-calculation-results.json').read_text());probe=json.loads((b/'repository-probes.json').read_text());retrievals=json.loads((b/'source-retrievals.json').read_text());runs=json.loads((b/'baseline-validation.json').read_text());repo=next((b/'verified-development-export').iterdir());head=inv['targetCommit']
# Verify that permitted tests/install/build did not modify any original exported file.
changed=[];checked=0
with tarfile.open(b/'evidence/repository.tar.gz') as t:
 for m in t.getmembers():
  if m.isfile():
   checked+=1;p=repo/Path(*Path(m.name).parts[1:])
   if not p.is_file() or p.read_bytes()!=t.extractfile(m).read():changed.append(str(p.relative_to(repo)))
(b/'export-integrity.json').write_text(json.dumps({'originalFilesChecked':checked,'modifiedOriginalFiles':changed,'scope':'Generated dist and installed node_modules are additional files in the isolated audit export only.'},indent=2))
assert not changed,changed
boundary='No application source, tests, package manifests, original workbooks or actual checkout modified. No branch/worktree, commit, push, merge, deployment, production change, job change, machine wake/suspend, ZA-009 repair or owner approval. All audit artifacts and generated test output are outside the actual repository.'
findings=[
('F01','P2','Seven Claude source documents unavailable','inventory.json: expected /home/user/*.md; remote-document-search.json','Supply exact original revisions; do not infer decisions, statuses or corrections to unseen text.','BLOCKED'),
('F02','P2','Claude reference script/vectors unavailable','inventory.json: two /tmp/claude-0/... paths','Supply originals with hashes. No original expected values or counterexamples have been tested.','BLOCKED'),
('F03','P2','Build browser allowlist excludes energy/','scripts/build.js:70–72,279–298; repository-probes.json energyFolderProbe','If the actual plan proposes browser-imported src/energy/, either use allowed calculators/ for pure engines or propose an explicitly reviewed minimal allowlist extension. Do not claim the missing plan is broken without reading it.','CONFIRMED CONSTRAINT; plan comparison blocked'),
('F04','P1','Accepted sub-cent loan principal yields no repayment','src/calculators/loan-payment.js:55; src/adapters/loan-payment.js; repository-probes.json','For new finance compatibility, define supported money precision/principal domain or request separate baseline correction. Do not reuse schedule totals blindly below0.005.','REPRODUCED; application unchanged'),
('F05','P2','Fuel Cost finite inputs can produce infinite outputs','src/calculators/fuel-cost.js:45–49; repository-probes.json','Proposed adapters/engines must reject nonfinite intermediate/results, or define finite domain. Existing baseline correction is not authorized here.','REPRODUCED; application unchanged'),
('F06','P3','Loan engine comment calls nominal-rate input APR','src/calculators/loan-payment.js:24,34; evidence/cfpb.txt','Clarify nominal annual note interest in proposed finance contract. APR includes fees and must not silently replace note rate. Do not edit frozen baseline in this audit.','CONFIRMED terminology ambiguity'),
('F07','P2','EPA loss boundary not verified from requested AppendixE','source-retrievals.json; evidence/epa-label.txt','Obtain2024AutomotiveTrends AppendixE exact passage before presenting the label metric as verified wall energy. Label page confirms kWh/100mi, not the charging-loss boundary.','PARTIAL; no upgraded evidence'),
('F08','P2','Original source statuses/approval provenance unavailable','All seven missing source documents','Preserve original Confirmed/Partial/Conditional/Failed/Unresolved statuses when supplied; fresh retrieval failures do not overturn prior verified evidence. No candidate promoted to approved/ready.','BLOCKED'),
('F09','P2','Ancestry cannot be established from archive alone','commands.json; immutable export has no .git','Remote branch tip matches requested HEAD. Obtain read-only commit-parent/compare evidence to verify de965bd... ancestor; neither matching branch labels nor tarballs prove ancestry.','UNVERIFIED')]
rows='\n'.join('| '+' | '.join(r)+' |' for r in findings)
counts='; '.join(f"{r['name']}: {r['status']} (exit {r['exit_code']})" for r in runs)
browser=next((r for r in reversed(runs) if r['name'].startswith('browser')),None)
browser_note=('Browser repeat completed with exit0; the initial300second wrapper timeout is retained as a superseded attempt, not an application failure.' if browser and browser['status']=='PASS' else 'Browser repeat is pending or blocked; do not describe the initial wrapper timeout as a clean command exit.')
summary=f'''# Independent Home Energy audit — October20,2026

Scope: the uploaded audit-request.txt, not implementation authorization. **PARTIAL AUDIT — missing Claude documents and vectors prevent full reconciliation/readiness review.**

## Verified

- Remote claude/compassionate-dirac-cv1ipd tip matches `{head}`. A commit-addressed source archive was preserved and exported only inside this audit directory.
- Actual local `/workspace/mydeisgn` is a different repository at `ff4933d2fd81e8d16df82057c839a6ba1d848470`, clean, containing only README.md. It was not replaced.
- Registry has **{probe['liveCalculators']} live baseline calculators**, no registered Home Energy candidates. Site audit checks49existing pages.
- Original workbooks contain25roadmap rows each:75total; Batch3detailed scope is5calculators+20guides. The Batch3overview says7calculators+18blogs, while the detailed roadmap says5calculators+20guides; both are preserved in research-inventory.json, not silently reconciled. Neither inventory authorizes this eight-candidate intake.
- {calc['passed']} synthetic arithmetic illustrations pass. These are not Claude vectors and not tests of proposed Home Energy code.
- Existing baseline: {counts}. Unit log contains681passed tests. Browser results are baseline-only, never candidate acceptance. {browser_note}
- {checked} original exported files remain byte-identical after install/testing/build; export-integrity.json records the check.

## Findings

| ID | Severity | Finding | Evidence/file/section | Correction | Status |
| --- | --- | --- | --- | --- | --- |
{rows}

No P0 was established from accessible evidence. F04 is P1 under the requested incorrect-financial-output criterion, with impact limited to the demonstrated accepted sub-cent domain; ordinary consumer inputs were not shown defective. Fuel overflow is P2. No defect is attributed to unseen candidate implementations. Module-folder compatibility is conditional on the actual missing plan.

## Owner summary

Verified: repository branch/head,41calculator registry, current baseline checks,25independent illustrations, selected original-source passages and75report rows. Failed retrievals: exact URLs/errors in source-evidence.md. Unknown: seven Claude revisions, all original vectors, plan architecture, approval provenance, requested source passages and baseline ancestry.

**None of the eight candidates is established implementation-ready by this audit.** This does not declare the mathematical identities incorrect; candidate contracts/source boundaries/tests remain unavailable. Supply the seven documents and two reference files and preserve their revisions. Clarify unresolved measurement and financial ledgers before any implementation request. Four hubs, navigation changes, Batch2, merges, frozen pages, tax-credit guide andZA-009 remain excluded. No owner's approval is inferred.

Read-only baseline review is complete for executed checks; full Claude proposal/document review is not complete. {boundary}
'''
(b/'codex-full-audit.md').write_text(summary)
recon=['# Document reconciliation','', 'No file-by-file or revision-by-revision inconsistency can be asserted for unavailable text. Missing is not stale, incorrect, or deleted. Original statuses and approvals remain unknown.','', '| Expected file | Inspection | Required correction/handoff |','| --- | --- | --- |']
for row in inv['expectedFiles']:recon.append(f"| `{row['path']}` | {'Present' if row['exists'] else 'MISSING'} | Supply original revision and SHA256; no content judgment until inspected. |")
recon+=['','The current development export and all three advertised audit-branch archives were inspected for named Home Energy/proposal/reference files; no matches found (remote-document-search.json). This is not evidence that private /home/user workspace documents were deleted.','', 'Research workbooks are available and original bytes unchanged. They do not replace Claude source documents.75roadmap rows are research scope, not75implemented or approved pages. Batch3 detailed5/20 versus overview counts must not be silently reconciled.','', 'No output claims that the eight candidates, four hubs, later batches, navigation or release are owner-approved. Existing historical681/other test claims are not imported: fresh outcomes are separately logged.']
(b/'document-reconciliation.md').write_text('\n'.join(recon)+'\n')
models=[
('Utility Cost','Supplied energyE in kWh; ratep in USD/kWh; separately entered fixed chargeF in USD','C=E×p+F; effective C/E only ifE>0','No universal tariff. Billing period and whether a residual includes fixed charges need exact contract. Zero energy does not imply zero fixed bill.'),
('Solar Price Per Watt','Gross costUSD; rated DCcapacityW or kW; optional explicit receiptUSD','grossUSD/W; kW×1000→W; optional scenario netUSD/W','DC watts, not ACkWh. Positive capacity; no automatic eligibility or price defaults.'),
('Solar Financing','Cash price, purchase rebate, down payment, financed/upfront feesUSD; nominal note rate%; integer months; later receiptUSD','P=price−purchaseRebate−down+financedFees; r=annualPercent/100/12; M=P/n at0rate else P×r/(1−(1+r)^−n)','P=0must be explicitly handled before existing engine (which requiresP>0). Later receipts do not reduce initial principal without an explicit prepayment model. No APR substitution. Exact fee/discount categories need original contract.'),
('Solar Payback — simple only','Net upfrontUSD; constant annual savings/maintenanceUSD/year','netUpfront/(annualSaving−annualMaintenance) when denominator>0','Nonpositive denominator→undefined simple payback, not “never.” Fractional years assume uniform accrual and are not year-end crossing; adjusted/discounted/degradation models excluded.'),
('Solar Battery Charging Time','Usable capacitykWh; start/targetSOC%; supplied constant powerkW; explicit efficiency fraction','ΔE=capacity×(target−start)/100; source-side t=ΔE/(P×η); battery-side t=ΔE/P','ηonce, never twice. EqualSOC→0; target belowstart invalid. Positive need at0power undefined. No solar weather, taper or auxiliaries inferred.'),
('EV Charging Time','Same battery/SOC inputs; source-side charger and vehicle power caps if supplied','Use same-boundary min(caps) then ΔE/(Psource×η), or battery-side ΔE/Pbattery','Do not compare unlike AC/DC or wall/battery caps. Capacity is usable, not automatically nameplate. No guaranteed charge time or taper model.'),
('EV Charging Cost','Either battery energykWh andη or already measured/rated wall energy; USD/kWh; optional mileage and verified wallkWh/100mi','battery mode: ΔE/η×rate; verified wall metric: miles/100×wallkWhPer100mi×rate','No second charging-loss correction for an already wall-side metric. EPA2024AppendixE exact boundary remains unverified here; numerical illustration is conditional, not source confirmation.'),
('Electric Bill','PeriodkWh, entered rateUSD/kWh, fixed chargesUSD and explicit day counts','C=E×rate+fixed; daily/annual energy only using supplied compatible schedule','No universal tariff, automatic month×12, guessed annual operating days or division by0. Label period bill, energy-only charge and effective/residual rates distinctly.')]
f=['# Formula validation','', '**25synthetic illustrations;0Claude vectors tested. No proposed candidate implementation exists in the verified baseline.** Mathematics below describes transparent audit scenarios, not newly approved product contracts.','', '| Candidate | Inputs/units | Formula | Bounds/assumptions/limitations |','| --- | --- | --- | --- |']
for row in models:f.append('| '+' | '.join(row)+' |')
f+=['','## Independent results','', '| Illustration | Entered inputs | Independently computed actual | Expected | Outcome |','| --- | --- | --- | --- | --- |']
for r in calc['cases']:f.append(f"| {r['name']} | `{json.dumps(r['inputs'])}` | {r['actual'] or 'undefined'} | {r['expected'] or 'undefined'} | PASS, synthetic only |")
f += ['', 'Independent positive-rate financing oracle: '+calc['financeIndependentOracle']['monthlyPayment']+'USD/month forP10000,n12,note12%. Decimal60-digit closed form is reconciled with balance recurrence. Existing monthlyPayment normal result agrees within floating precision; repository-probes.json retains the actual result.', '', '## Boundary findings', '', f"- Existing zero-rate schedule sums interest directly: exampleP={probe['floatCounterexample']['principal']},n={probe['floatCounterexample']['termMonths']} reports0interest. Naive M×n−P produces{probe['floatCounterexample']['naiveInterest']}; do not copy that subtraction as a zero-rate implementation.", '- Existing loan principal0.001 passes the adapter but the balance>0.005schedule loop returns0payments/0repayment. This is an existing boundary issue, not a demonstrated defect in absent Solar Financing code.', '- Existing Fuel Cost with distanceMiles=Number.MAX_VALUE,mpg1,price1,roundTriptrue produces Infinity; finite-input validation alone is insufficient for new output contracts.', '- Original negative/missing/unit/error-message/rounding/cap assertions cannot be validated without original candidate adapters/vectors. Audit helper/domain classifications are not evidence of UI validation.', '- Reject negative/nonfinite inputs; constrain SOC0..100, target≥start, efficiency0<η≤1, matched power units, positive integer loan term and positive DCcapacity. Exact upper bounds/display policy remain contract decisions; no arbitrary engineering defaults introduced.', '- Monetary outputs should retain full precision then use explicit display rounding. Simple payback fraction interpretation and fee/receipt timing require original contracts. No assumption here authorizes a scope change.']
(b/'formula-validation.md').write_text('\n'.join(f)+'\n')
# Source-specific status is assigned only to inspected supported claims, never an entire domain.
support={
'eia':('Confirmed','EIA body:40W(0.04kW)×5h=200Wh=0.2kWh; validates power/time dimensional identity, not a universal tariff.','Publisher date not established in this inspection.'),
'cfpb':('Confirmed','“The Annual Percentage Rate (APR) is a measure of the interest rate plus the additional fees charged with the loan.” Supports note-rate/APR distinction, not this candidate loan-fee ledger.','Visible last modified August31,2026.'),
'irs':('Confirmed','Instructions state residential clean-energy credits cannot be claimed for expenditures made after December31,2025, and distinguish2026carryforward. Does not establish automatic individual eligibility.','2025Form5695instruction context; exact page revision date not established.'),
'nist-pdf':('Confirmed','NIST SP8112008Edition, AppendixB tables:1kWh=3.6×10^6J=3.6MJ; SI unit conventions. Text lines3571–3572. Printed gallon table is rounded; do not silently replace exact shared constants with its rounded display.','2008Edition printed in PDF.'),
'afdc':('Partial','Retrieved infrastructure-trends page is not the charging-equipment methodology source; no power/efficiency assumptions verified from this page.','Publisher date not established.'),
'afdc-legacy':('Confirmed','Redirects to electricity-stations. Body says charging times vary withSOC,capacity,battery,internal charger and charging-equipment power. Supports limitations, not chosen efficiency defaults or detailed taper model.','Publisher date not established.'),
'epa-label':('Partial','Official label page confirms kWh/100miles and a240Vempty-to-full charge-time basis. Inspected body does not state the charging-loss boundary; does not replace requested2024AutomotiveTrends AppendixE.','Publisher date not established.')}
s=['# Source evidence','', 'Checked October20,2026; exact UTCtimestamps, response URLs, errors and body hashes are preserved in source-retrievals.json. Original Claude individual source statuses unavailable: preserve them when supplied; do not retroactively overwrite them with these fresh observations. Confirmed below applies only to the stated claim. A successful HTTP response alone is not confirmed evidence.','', '| Source ID | Exact requested URL | Fresh status | Evidence or exact error | Date/limitation |','| --- | --- | --- | --- | --- |']
for r in retrievals:
 if r['id']=='repository':continue
 if r['id'] in support:status,evidence,date=support[r['id']]
 elif r.get('httpStatus')==200:status='Partial';evidence='Body retrieved; relevant claim not independently confirmed.';date='Publisher date not established.'
 else:status='Failed';evidence=r.get('error','Retrieval unavailable');date='Failure of this attempt only; not evidence that an earlier verified source is invalid. Candidate discovery URL, not necessarily the missing original audit URL.'
 r['claimStatus']=status;r['supportScope']=evidence
 s.append('| '+' | '.join([r['id'],r['requestedURL'],status,evidence.replace('|','/'),date])+' |')
s += ['', '**Conditional:** EPA-style cost illustration remains conditional on verified wall-side energy; no double-loss adjustment is accepted merely because arithmetic passes.', '', '**Unresolved:** exact original DOE simple-payback document, VirginiaCooperativeExtension example passage, NRELUSD/W convention, EPA2024AppendixE and eCFRdefinition URLs/clauses require original references or accessible source bodies. No dates, page numbers or quotations invented. Failed discovery URLs are explicitly distinct from the missing original source list.', '', 'No current-policy claim modifies the frozen tax-credit guide; no incentive calculation or individual eligibility determination is authorized.']
(b/'source-evidence.md').write_text('\n'.join(s)+'\n');(b/'source-retrievals.json').write_text(json.dumps(retrievals,indent=2))
compat=f'''# Repository compatibility

Verified advertised branch: claude/compassionate-dirac-cv1ipd → {head}. Source retrieved by immutable codeload URL, SHA256 in source-retrievals.json. Exact export: `{repo}`. It is an isolated audit export, not the original checkout or a restored October7implementation. The actual Claude development checkout and its working-tree state are inaccessible; an archive does not expose its uncommitted files or prove that checkout clean. No Git fetch/clone/branch/worktree was performed.

Production baseline ancestor requested:de965bd1e6e35c1efa6cb0df73021e111f11ac88. Its named branch tip is advertised, but **ancestry is not verified**: the export has no Git graph. No inference from similar source or names.

Actual registry:src/content/site.js,CALCULATORS;41live calculators, no HomeEnergy candidates. Build produces49audited baseline pages. Layout is src/calculators(pure),adapters,components,lib,client plus server-only content/pages. npmcheck/test results apply only to this baseline.

scripts/build.js:70browser directory allowlist is calculators/adapters/components/lib/client; components/layout.js explicitly server-only. moduleGraph follows static relative imports and rejects anything outside the allowlist. Existing loan graph is recorded in repository-probes.json. Audit-only client→energy fixture reproducibly throws “client/probe.js imports energy/probe.js, which is not a browser module”. **If** Claude proposes src/energy/, minimum options are preserve pure engines under allowed calculators/, or propose a separately reviewed narrow allowlist extension. Missing plan prevents a final compatibility verdict. No production code changed.

Loan engine src/calculators/loan-payment.js:monthlyPayment uses nominal annualPercent/100/12 and stable log1p/expm1; requires positive principal/integer positive term. Zero-principal new scenarios need a defined adapter/engine branch; do not call this positive-principal API blindly. Subcent schedule threshold and APR comment findings are documented separately. No existing-loan engine modification authorized.

Fuel Cost src/calculators/fuel-cost.js computes trip distance/MPG×USDpergallon, supports explicit round trip/comparison and exact constants in source. It is not an EV wall-energy API. Existing input guard and overflow boundary were inspected; do not claim automatic EV compatibility or use a fuel metric as battery input without the approved boundary.

Original file integrity: {checked} archived original files byte-identical after safe validation (export-integrity.json). Generateddist and node_modules exist only in the export. Actual mydeisgn stays initial/clean. {boundary}
'''
(b/'repository-compatibility.md').write_text(compat)
corrections='''# Precise correction instructions for Claude

These are audit feedback, not owner approvals and not changes to Claude source documents.

1. Supply original seven /home/user documents and two reference artifacts with revision timestamps/SHA256. Missing document sections cannot be quoted or corrected as if inspected. Put an explicit scope/authorization ledger at the start: eight candidates only; four hubs/navigation/Batch2/merges/frozen pages/tax-credit guide/ZA-009 excluded.
2. In the proposal/decision-sheet/approval-package formula sections, explicitly distinguish mathematically verified identities, source-backed methods, chosen assumptions and owner-approved scope. Preserve original per-source Confirmed/Partial/Conditional/Failed/Unresolved and old/new test dates.
3. In implementation-plan architecture, compare proposed browser imports with scripts/build.js:70,279–298. If using src/energy/, explain the required narrow build change or keep pure engines in calculators/. Do not silently modify existing code during review.
4. In financing contract, label nominal annual note rate, not APR; list purchase rebates, later receipts, down payment and financed/upfront fees exactly once. Specify P=0behavior, valid currency precision and engine domain. Zero-rate interest must not be naive M×n−P when that yields negative floating noise. Add independent recurrence and tiny-rate fixtures. Existing schedule has a subcent threshold; request separate authorization before changing it.
5. In simple-payback section, net annual savings must state maintenance treatment. Nonpositive denominator is undefined simple payback, not “never”. Explain fractional continuous-accrual versus year-end crossing. Keep adjusted payback outside the eight-candidate scope.
6. In charging sections, record usable battery energy and SOC, power-side boundary, efficiency applied once and same-boundary charger/vehicle caps. Equal SOC=0time; lower target invalid; positive need with0power unavailable. Disclose constant-power/no taper/noauxiliary assumptions. Provide requested EPA2024AppendixE evidence before claiming a label metric includes losses; no double-loss correction.
7. In Utility/ElectricBill sections, define period, annual operating days, separately supplied fixed charges and effective/residual labels. No automatic month×12 or universal tariff claim. Handle zero totals and zero denominators. No source-driven preset rates inferred from aggregateEIA tables.
8. Preserve75research rows separately from implementation inventory and Batch3overview/detailed conflicts. Three original workbooks have25roadmap rows each; Batch3detailed is5calculators+20guides. The eight-candidate intake is not a release of that75entry backlog.
9. Add finite-result guards/fixtures to proposed new calculator contracts and valid-domain declarations; the existing FuelCost overflow example is a boundary to avoid, not authorization to modify it.
10. Reconcile every source/expected value to an exact passage/date/units and independent fixture. Never report681baseline tests or synthetic25illustrations as tests of absent HomeEnergy code. Re-submit corrected documents and originals for an actual file-by-file review; no readiness/implementation approval from this audit.
'''
(b/'claude-correction-instructions.md').write_text(corrections)
log=['# Validation log','', 'Date:October20,2026(Asia/Kolkata owner context); detailed network check timestamps in UTC in source-retrievals.json. Container:f99c2bcfa4cf. Managed runtime returned the historical environment identifier, but the currently mounted mydeisgn still contains only its initial commit; an environment identifier alone does not recover prior /tmp contents.','', 'Original instruction copy:audit-request.txt; SHA256:'+inv['requestSHA256'], '', '| Command | Location | Exit/status | Evidence |','| --- | --- | --- | --- |']
for r in json.loads((b/'commands.json').read_text()):log.append(f"| `{' '.join(r['command'])}` | {r['cwd']} | {r['exit_code']} | commands.json |")
for r in runs:log.append(f"| `{' '.join(r['command'])}` | isolated verified export | {r['exit_code']} / {r['status']} | {Path(r['log']).name} |")
log += ['', 'Dependency installation: initial npmci--ignore-scripts failedENOENT while trying the default read-only home cache (install.log). Retried with a writable audit-directory cache, succeeded (install-retry.log), locked checksums and TLS retained. No lifecycle scripts enabled. No package/lock/source edits.', '', 'Source retrieval scripts recorded exact errors and hashes. pdftotext converted the inspected NISTPDF to audit text. Missing documents searched locally and in three commit-addressed audit-branch archives: no matching named files. No raw credential or personal-file inspection.', '', 'Independent-calculations.py: exit0;25synthetic illustrations pass. Separate Node readonly probes execute baseline loan/FuelCost exports and moduleGraph; repository-probes.json stores actual values. These are audit helpers, not application implementation.', '', 'Original file integrity check passed for'+str(checked)+'files. Actual repository checked clean before/after. '+boundary]
(b/'validation-log.md').write_text('\n'.join(log)+'\n')
print('Wrote seven required audit reports; original exported files verified:',checked)
