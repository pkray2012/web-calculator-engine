from pathlib import Path
import subprocess,json,time,os
b=Path(__file__).parent;repo=next((b/'verified-development-export').iterdir())
results=[]
for name,args,timeout in [('lint',['npm','run','lint'],90),('typecheck',['npm','run','typecheck'],90),('unit',['npm','test'],120),('build',['npm','run','build:dev'],90),('site-audit',['npm','run','audit:site'],90),('browser',['npm','run','test:browser'],300)]:
 start=time.time();env=os.environ.copy();env['CHROMIUM_PATH']='/usr/bin/chromium';env['npm_config_cache']=str(b/'npm-cache');log=b/(name+'.log')
 with log.open('w') as f:
  try:r=subprocess.run(args,cwd=repo,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=timeout);exit=r.returncode;status='PASS' if exit==0 else 'FAIL'
  except subprocess.TimeoutExpired:exit=None;status='TIMEOUT'
 results.append(dict(name=name,command=args,cwd=str(repo),exit_code=exit,status=status,durationSeconds=round(time.time()-start,2),log=str(log)))
 (b/'baseline-validation.json').write_text(json.dumps(results,indent=2))
 print(name,status,exit,flush=True)
