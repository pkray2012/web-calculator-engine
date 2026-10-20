"""Independent audit illustrations only: not Claude's missing vectors or application code."""
from decimal import Decimal, localcontext
from pathlib import Path
import json
D=Decimal;cases=[]
def check(name,inputs,actual,expected,assumptions):
 if expected is None:assert actual is None
 else:assert abs(actual-D(expected))<D('1e-40'),(name,actual,expected)
 cases.append(dict(name=name,inputs=inputs,actual=None if actual is None else str(actual),expected=expected,result='PASS',assumptions=assumptions,scope='Synthetic audit illustration; not a proposed-tool validation'))
with localcontext() as ctx:
 ctx.prec=60
 check('Utility Cost: supplied charge ledger',{'energyKWh':'100','rateUSDperKWh':'0.20','fixedUSD':'5'},D(100)*D('.2')+5,'25','Single supplied energy charge and separate fixed charge; not a universal tariff')
 check('Utility Cost: zero energy effective rate',{'energyKWh':'0','fixedUSD':'5'},None,None,'No total/energy division at zero energy')
 check('Solar Price Per Watt: gross',{'grossUSD':'20000','capacityKW':'5'},D(20000)/(D(5)*1000),'4','DC rated watts; explicit unit normalization')
 check('Solar Price Per Watt: entered receipt scenario',{'grossUSD':'20000','enteredReceiptUSD':'2000','capacityW':'5000'},(D(20000)-2000)/5000,'3.6','Entered scenario only; not incentive eligibility')
 check('Solar Financing: principal ledger',{'purchaseUSD':'12000','purchaseRebateUSD':'500','downPaymentUSD':'1000','financedFeeUSD':'500'},D(12000)-500-1000+500,'11000','Purchase rebate reduces cash price once; financed fee adds once; later receipts do not reduce initial principal')
 check('Solar Financing: zero-rate payment',{'principalUSD':'11000','months':'11','noteRatePercent':'0'},D(11000)/11,'1000','Positive integer term; nominal note rate, not fee-inclusive APR')
 check('Solar Financing: cash paid after later receipt',{'downPaymentUSD':'1000','loanPaymentsUSD':'11000','upfrontFeeUSD':'100','laterReceiptUSD':'1000'},D(1000)+11000+100-1000,'11100','Cash-flow ledger, no present-value or ROI model; receipt counted once')
 principal=D(10000);rate=D(12)/100/12;n=12;payment=principal*rate/(1-(1+rate)**(-n));balance=principal;interest=D(0)
 for _ in range(n):
  i=balance*rate;interest+=i;balance=balance+i-payment
 assert abs(balance)<D('1e-50');assert abs(interest-(payment*n-principal))<D('1e-50')
 finance=dict(principal='10000',noteRatePercent='12',months=12,monthlyPayment=str(payment),totalInterest=str(interest),finalBalance=str(balance),result='PASS',method='60-digit Decimal closed form independently reconciled with balance recurrence')
 check('Solar Payback: simple maintenance model',{'upfrontUSD':'10000','purchaseReceiptUSD':'2000','annualSavingUSD':'1200','annualMaintenanceUSD':'200'},(D(10000)-2000)/(D(1200)-200),'8','Constant net annual saving, simple undiscounted model only')
 for maintenance in ['1200','1500']:
  check('Solar Payback: nonpositive net savings '+maintenance,{'annualSavingUSD':'1200','annualMaintenanceUSD':maintenance},None,None,'Undefined simple payback, not a prediction that recovery never occurs')
 check('Solar Payback: fractional simple model',{'netUpfrontUSD':'8000','netAnnualSavingUSD':'1200'},D(8000)/1200,str(D(20)/3),'Fractional years assume uniform accrual; not equivalent to a year-end cash-flow crossing')
 for name in ['Solar Battery Charging Time','EV Charging Time']:
  energy=D(60)*(D(80)-20)/100
  check(name+': battery energy',{'usableKWh':'60','startSOC':'20','targetSOC':'80'},energy,'36','Usable capacity, percentage-point SOC interval')
  check(name+': source-side power',{'batteryEnergyKWh':'36','sourceKW':'8','efficiencyFraction':'0.9'},energy/(D(8)*D('.9')),'5','Constant power; efficiency once; no taper/auxiliaries')
  check(name+': battery-side power',{'batteryEnergyKWh':'36','batteryKW':'7.2'},energy/D('7.2'),'5','Already battery-side: do not apply charging efficiency a second time')
  check(name+': equal SOC and zero power',{'startSOC':'20','targetSOC':'20','powerKW':'0'},D(0),'0','No energy transfer required; positive need at zero power would be undefined')
 check('EV Charging Time: explicit power caps',{'sourceKW':'11','chargerLimitKW':'7','vehicleLimitKW':'6','efficiency':'0.9','needKWh':'36'},D(36)/(min(D(11),D(7),D(6))*D('.9')),str(D(20)/3),'All supplied power caps use the same source-side boundary; do not mix battery and wall ratings')
 check('EV Charging Cost: battery-energy mode',{'needBatteryKWh':'36','efficiency':'0.9','USDperKWh':'0.2'},D(36)/D('.9')*D('.2'),'8','Source energy40kWh; efficiency applied once')
 check('EV Charging Cost: EPA-style label scenario',{'wallKWhPer100mi':'30','miles':'100','USDperKWh':'0.2'},D(30)*100/100*D('.2'),'6','Only if the verified metric already includes charging losses; no further loss adjustment')
 check('Electric Bill: period',{'periodKWh':'300','rate':'0.2','periodFixedUSD':'10'},D(300)*D('.2')+10,'70','Supplied period tariff subset only')
 check('Electric Bill: explicit daily energy charge',{'periodKWh':'300','rate':'0.2','billingDays':'30'},D(300)*D('.2')/30,'2','Energy-only daily charge; fixed fees remain separately labeled')
 check('Electric Bill: explicit annual operating days',{'dailyKWh':'10','annualOperatingDays':'200'},D(10)*200,'2000','Explicit supplied schedule, not automatic month-times12')
# Demonstrate domain classification without pretending to validate unavailable UI.
invalid=[{'case':x,'result':'Audit-domain rejection required; proposed implementation untested'} for x in ['negative energy/price/capacity','NaN/Infinity','SOC outside0..100','targetSOC below startSOC','nonpositive efficiency or efficiency above1','negative/unknown charge power','positive required energy at zero power','zero/noninteger loan term','down payment/rebate exceeding eligible purchase basis','zero/nonfinite DC capacity','billing days zero when computing a daily rate']]
report={'illustrationCount':len(cases),'passed':len(cases),'candidateCount':8,'notClaudeVectors':True,'candidateReadiness':'BLOCKED: exact candidate contracts and original vectors unavailable','cases':cases,'financeIndependentOracle':finance,'requiredInvalidClassifications':invalid}
Path(__file__).with_name('independent-calculation-results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'syntheticIllustrationsPassed':len(cases),'candidateCount':8,'financeMonthlyPayment':str(payment),'originalClaudeVectorsTested':0}))
