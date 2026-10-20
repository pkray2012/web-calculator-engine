from pathlib import Path
from decimal import Decimal
import hashlib,json,subprocess
b=Path(__file__).parent
required=['codex-full-audit.md','document-reconciliation.md','formula-validation.md','source-evidence.md','repository-compatibility.md','claude-correction-instructions.md','validation-log.md']
for n in required:assert (b/n).is_file() and (b/n).stat().st_size>0,n
request=Path('/workspace/attachments/06cd2d05-82de-4931-8c93-ee98cadd4953/Pasted text.txt');assert (b/'audit-request.txt').read_bytes()==request.read_bytes()
r=subprocess.run(['python',str(b/'independent-calculations.py')],capture_output=True,text=True);(b/'independent-formula-run.log').write_text(r.stdout+r.stderr);assert r.returncode==0
c=json.loads((b/'independent-calculation-results.json').read_text());assert c['passed']==25 and c['notClaudeVectors']
p=json.loads((b/'repository-probes.json').read_text());delta=abs(Decimal(str(p['normalLoan']['monthlyPayment']))-Decimal(c['financeIndependentOracle']['monthlyPayment']));assert delta<Decimal('1e-10')
assert p['liveCalculators']==41 and len(p['plannedEnergy'])==0
assert p['smallLoan']['scheduledPayments']==0 and p['smallPrincipalAdapter']['ok']
assert p['overflowFuel']['miles']=='Infinity'
assert 'not a browser module' in p['energyFolderProbe']['error']
assert p['floatCounterexample']['naiveInterest']<0 and p['floatCounterexample']['actualEngineInterest']==0
assert len(json.loads((b/'research-inventory.json').read_text())['entries'])==75
records=json.loads((b/'source-retrievals.json').read_text());verified=0
for x in records:
 if x.get('localPath'):
  assert hashlib.sha256(Path(x['localPath']).read_bytes()).hexdigest()==x['sha256'];verified+=1
result={'reportsPresent':7,'syntheticIllustrationsPassed':25,'candidateImplementationsValidated':0,'originalClaudeVectorsAvailable':0,'liveBaselineCalculators':41,'researchRows':75,'evidenceBodiesHashVerified':verified,'loanOracleAbsoluteDifference':str(delta),'result':'PASS','scope':'Audit artifacts only; does not approve missing proposed calculator implementations'}
(b/'audit-artifact-validation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
