# Formula validation

**25synthetic illustrations;0Claude vectors tested. No proposed candidate implementation exists in the verified baseline.** Mathematics below describes transparent audit scenarios, not newly approved product contracts.

| Candidate | Inputs/units | Formula | Bounds/assumptions/limitations |
| --- | --- | --- | --- |
| Utility Cost | Supplied energyE in kWh; ratep in USD/kWh; separately entered fixed chargeF in USD | C=E×p+F; effective C/E only ifE>0 | No universal tariff. Billing period and whether a residual includes fixed charges need exact contract. Zero energy does not imply zero fixed bill. |
| Solar Price Per Watt | Gross costUSD; rated DCcapacityW or kW; optional explicit receiptUSD | grossUSD/W; kW×1000→W; optional scenario netUSD/W | DC watts, not ACkWh. Positive capacity; no automatic eligibility or price defaults. |
| Solar Financing | Cash price, purchase rebate, down payment, financed/upfront feesUSD; nominal note rate%; integer months; later receiptUSD | P=price−purchaseRebate−down+financedFees; r=annualPercent/100/12; M=P/n at0rate else P×r/(1−(1+r)^−n) | P=0must be explicitly handled before existing engine (which requiresP>0). Later receipts do not reduce initial principal without an explicit prepayment model. No APR substitution. Exact fee/discount categories need original contract. |
| Solar Payback — simple only | Net upfrontUSD; constant annual savings/maintenanceUSD/year | netUpfront/(annualSaving−annualMaintenance) when denominator>0 | Nonpositive denominator→undefined simple payback, not “never.” Fractional years assume uniform accrual and are not year-end crossing; adjusted/discounted/degradation models excluded. |
| Solar Battery Charging Time | Usable capacitykWh; start/targetSOC%; supplied constant powerkW; explicit efficiency fraction | ΔE=capacity×(target−start)/100; source-side t=ΔE/(P×η); battery-side t=ΔE/P | ηonce, never twice. EqualSOC→0; target belowstart invalid. Positive need at0power undefined. No solar weather, taper or auxiliaries inferred. |
| EV Charging Time | Same battery/SOC inputs; source-side charger and vehicle power caps if supplied | Use same-boundary min(caps) then ΔE/(Psource×η), or battery-side ΔE/Pbattery | Do not compare unlike AC/DC or wall/battery caps. Capacity is usable, not automatically nameplate. No guaranteed charge time or taper model. |
| EV Charging Cost | Either battery energykWh andη or already measured/rated wall energy; USD/kWh; optional mileage and verified wallkWh/100mi | battery mode: ΔE/η×rate; verified wall metric: miles/100×wallkWhPer100mi×rate | No second charging-loss correction for an already wall-side metric. EPA2024AppendixE exact boundary remains unverified here; numerical illustration is conditional, not source confirmation. |
| Electric Bill | PeriodkWh, entered rateUSD/kWh, fixed chargesUSD and explicit day counts | C=E×rate+fixed; daily/annual energy only using supplied compatible schedule | No universal tariff, automatic month×12, guessed annual operating days or division by0. Label period bill, energy-only charge and effective/residual rates distinctly. |

## Independent results

| Illustration | Entered inputs | Independently computed actual | Expected | Outcome |
| --- | --- | --- | --- | --- |
| Utility Cost: supplied charge ledger | `{"energyKWh": "100", "rateUSDperKWh": "0.20", "fixedUSD": "5"}` | 25.0 | 25 | PASS, synthetic only |
| Utility Cost: zero energy effective rate | `{"energyKWh": "0", "fixedUSD": "5"}` | undefined | undefined | PASS, synthetic only |
| Solar Price Per Watt: gross | `{"grossUSD": "20000", "capacityKW": "5"}` | 4 | 4 | PASS, synthetic only |
| Solar Price Per Watt: entered receipt scenario | `{"grossUSD": "20000", "enteredReceiptUSD": "2000", "capacityW": "5000"}` | 3.6 | 3.6 | PASS, synthetic only |
| Solar Financing: principal ledger | `{"purchaseUSD": "12000", "purchaseRebateUSD": "500", "downPaymentUSD": "1000", "financedFeeUSD": "500"}` | 11000 | 11000 | PASS, synthetic only |
| Solar Financing: zero-rate payment | `{"principalUSD": "11000", "months": "11", "noteRatePercent": "0"}` | 1000 | 1000 | PASS, synthetic only |
| Solar Financing: cash paid after later receipt | `{"downPaymentUSD": "1000", "loanPaymentsUSD": "11000", "upfrontFeeUSD": "100", "laterReceiptUSD": "1000"}` | 11100 | 11100 | PASS, synthetic only |
| Solar Payback: simple maintenance model | `{"upfrontUSD": "10000", "purchaseReceiptUSD": "2000", "annualSavingUSD": "1200", "annualMaintenanceUSD": "200"}` | 8 | 8 | PASS, synthetic only |
| Solar Payback: nonpositive net savings 1200 | `{"annualSavingUSD": "1200", "annualMaintenanceUSD": "1200"}` | undefined | undefined | PASS, synthetic only |
| Solar Payback: nonpositive net savings 1500 | `{"annualSavingUSD": "1200", "annualMaintenanceUSD": "1500"}` | undefined | undefined | PASS, synthetic only |
| Solar Payback: fractional simple model | `{"netUpfrontUSD": "8000", "netAnnualSavingUSD": "1200"}` | 6.66666666666666666666666666666666666666666666666666666666667 | 6.66666666666666666666666666666666666666666666666666666666667 | PASS, synthetic only |
| Solar Battery Charging Time: battery energy | `{"usableKWh": "60", "startSOC": "20", "targetSOC": "80"}` | 36 | 36 | PASS, synthetic only |
| Solar Battery Charging Time: source-side power | `{"batteryEnergyKWh": "36", "sourceKW": "8", "efficiencyFraction": "0.9"}` | 5 | 5 | PASS, synthetic only |
| Solar Battery Charging Time: battery-side power | `{"batteryEnergyKWh": "36", "batteryKW": "7.2"}` | 5 | 5 | PASS, synthetic only |
| Solar Battery Charging Time: equal SOC and zero power | `{"startSOC": "20", "targetSOC": "20", "powerKW": "0"}` | 0 | 0 | PASS, synthetic only |
| EV Charging Time: battery energy | `{"usableKWh": "60", "startSOC": "20", "targetSOC": "80"}` | 36 | 36 | PASS, synthetic only |
| EV Charging Time: source-side power | `{"batteryEnergyKWh": "36", "sourceKW": "8", "efficiencyFraction": "0.9"}` | 5 | 5 | PASS, synthetic only |
| EV Charging Time: battery-side power | `{"batteryEnergyKWh": "36", "batteryKW": "7.2"}` | 5 | 5 | PASS, synthetic only |
| EV Charging Time: equal SOC and zero power | `{"startSOC": "20", "targetSOC": "20", "powerKW": "0"}` | 0 | 0 | PASS, synthetic only |
| EV Charging Time: explicit power caps | `{"sourceKW": "11", "chargerLimitKW": "7", "vehicleLimitKW": "6", "efficiency": "0.9", "needKWh": "36"}` | 6.66666666666666666666666666666666666666666666666666666666667 | 6.66666666666666666666666666666666666666666666666666666666667 | PASS, synthetic only |
| EV Charging Cost: battery-energy mode | `{"needBatteryKWh": "36", "efficiency": "0.9", "USDperKWh": "0.2"}` | 8 | 8 | PASS, synthetic only |
| EV Charging Cost: EPA-style label scenario | `{"wallKWhPer100mi": "30", "miles": "100", "USDperKWh": "0.2"}` | 6.0 | 6 | PASS, synthetic only |
| Electric Bill: period | `{"periodKWh": "300", "rate": "0.2", "periodFixedUSD": "10"}` | 70.0 | 70 | PASS, synthetic only |
| Electric Bill: explicit daily energy charge | `{"periodKWh": "300", "rate": "0.2", "billingDays": "30"}` | 2.0 | 2 | PASS, synthetic only |
| Electric Bill: explicit annual operating days | `{"dailyKWh": "10", "annualOperatingDays": "200"}` | 2000 | 2000 | PASS, synthetic only |

Independent positive-rate financing oracle: 888.487886783417073399878312278865289804486116263367759572541USD/month forP10000,n12,note12%. Decimal60-digit closed form is reconciled with balance recurrence. Existing monthlyPayment normal result agrees within floating precision; repository-probes.json retains the actual result.

## Boundary findings

- Existing zero-rate schedule sums interest directly: exampleP=1,n=49 reports0interest. Naive M×n−P produces-1.1102230246251565e-16; do not copy that subtraction as a zero-rate implementation.
- Existing loan principal0.001 passes the adapter but the balance>0.005schedule loop returns0payments/0repayment. This is an existing boundary issue, not a demonstrated defect in absent Solar Financing code.
- Existing Fuel Cost with distanceMiles=Number.MAX_VALUE,mpg1,price1,roundTriptrue produces Infinity; finite-input validation alone is insufficient for new output contracts.
- Original negative/missing/unit/error-message/rounding/cap assertions cannot be validated without original candidate adapters/vectors. Audit helper/domain classifications are not evidence of UI validation.
- Reject negative/nonfinite inputs; constrain SOC0..100, target≥start, efficiency0<η≤1, matched power units, positive integer loan term and positive DCcapacity. Exact upper bounds/display policy remain contract decisions; no arbitrary engineering defaults introduced.
- Monetary outputs should retain full precision then use explicit display rounding. Simple payback fraction interpretation and fee/receipt timing require original contracts. No assumption here authorizes a scope change.
