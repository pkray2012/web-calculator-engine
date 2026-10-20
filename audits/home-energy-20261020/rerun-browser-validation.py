from pathlib import Path
import subprocess,json,os,time
b=Path(__file__).parent;repo=next((b/'verified-development-export').iterdir());runs=json.loads((b/'baseline-validation.json').read_text());first=next(r for r in runs if r['name']=='browser');first['note']='Initial npm wrapper timed out at300s; child completed114passing tests in364s, but wrapper exit was not captured.'
(b/'browser.log').rename(b/'browser-first-attempt.log');first['log']=str(b/'browser-first-attempt.log')
(b/'baseline-validation.json').write_text(json.dumps(runs,indent=2))
env=os.environ.copy();env['CHROMIUM_PATH']='/usr/bin/chromium';env['npm_config_cache']=str(b/'npm-cache');start=time.time()
with (b/'browser.log').open('w') as f:
 try:
  r=subprocess.run(['npm','run','test:browser'],cwd=repo,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=600);code=r.returncode;status='PASS' if code==0 else 'FAIL'
 except subprocess.TimeoutExpired:code=None;status='TIMEOUT'
result={'name':'browser-repeat','command':['npm','run','test:browser'],'cwd':str(repo),'exit_code':code,'status':status,'durationSeconds':round(time.time()-start,2),'log':str(b/'browser.log'),'reason':'Capture an actual command exit after diagnosing insufficient initial runner timeout; tests unchanged.'}
runs.append(result);(b/'baseline-validation.json').write_text(json.dumps(runs,indent=2));print(json.dumps(result))
