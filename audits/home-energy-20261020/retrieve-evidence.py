from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
import urllib.request,json,hashlib
base=Path(__file__).parent;raw=base/'evidence';raw.mkdir(exist_ok=True)
urls={
'repository':'https://codeload.github.com/pkray2012/web-calculator-engine/tar.gz/098571906afd98b0fdf04ad6a57f784cd8ea8db8',
'nist':'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b8',
'eia':'https://www.eia.gov/energyexplained/electricity/measuring-electricity.php',
'cfpb':'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/',
'doe-payback':'https://www.energy.gov/femp/energy-and-cost-savings-calculators-energy-efficient-products',
'nrel':'https://www.nrel.gov/docs/fy24osti/87303.pdf',
'afdc':'https://afdc.energy.gov/fuels/electricity-infrastructure-trends',
'epa':'https://www.epa.gov/automotive-trends/download-automotive-trends-report',
'irs':'https://www.irs.gov/instructions/i5695',
'virginia':'https://www.pubs.ext.vt.edu/2908/2908-9011/2908-9011.html'}
def get(item):
 key,url=item;record={'id':key,'requestedURL':url,'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'claimStatus':'Unresolved'}
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Energy-Audit/1.0'}),timeout=25) as r:
   data=r.read(20000001)
   if len(data)>20000000:raise ValueError('Evidence exceeded20MB limit')
   ext='.tar.gz' if key=='repository' else '.pdf' if data.startswith(b'%PDF') else '.html'
   p=raw/(key+ext);p.write_bytes(data)
   record.update(httpStatus=r.status,finalURL=r.url,contentType=r.headers.get('content-type'),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),localPath=str(p),claimStatus='Partial',limitation='Retrieved body; specific claim and applicability require inspection.')
 except Exception as e:record.update(httpStatus=getattr(e,'code',None),error=str(e),claimStatus='Failed',limitation='This retrieval failed; no conclusion about previously verified sources.')
 return record
records=list(ThreadPoolExecutor(max_workers=6).map(get,urls.items()))
(base/'source-retrievals.json').write_text(json.dumps(records,indent=2))
for r in records:print(r['id'],r.get('httpStatus'),r['claimStatus'],r.get('bytes'),r.get('error',''))
