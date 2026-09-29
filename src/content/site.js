/**
 * Site-wide identity and the calculator registry.
 *
 * Only entries with status "live" produce pages, navigation, related links
 * and sitemap URLs. "planned" entries document intended cluster links without
 * publishing thin placeholder pages.
 */

export const SITE = Object.freeze({
  // Working name; set the site name for your deployment here.
  name: 'US Calculators',
  locale: 'en-US',
  description: 'Free US calculators for loans, mortgages, savings, pay, home projects and everyday math, with transparent formulas and stated assumptions.'
});

export const CATEGORIES = Object.freeze({
  loans: { name: 'Loans', description: 'Payments, total interest and payoff schedules for fixed-rate loans, from cars and personal loans to refinancing a mortgage.' },
  credit: { name: 'Debt and credit', description: 'How long a balance takes to pay off and what it costs in interest.' },
  savings: { name: 'Savings', description: 'How much to set aside each month, and how long a goal or emergency fund takes to reach.' },
  homeImprovement: { name: 'Home improvement', description: 'Materials for projects around the house, with the math shown.' },
  work: { name: 'Work and pay', description: 'Hours worked, overtime and gross pay, from a time card or an hourly wage converted to a salary.' },
  driving: { name: 'Driving costs', description: 'What it costs in fuel to drive, per trip and per mile, and your real fuel economy.' },
  everyday: { name: 'Everyday money', description: 'Everyday math for shopping and money, such as sales tax, percentages and discounts, with the formula shown.' },
  business: { name: 'Small business', description: 'Pricing, profit margin and break-even math for a small business.' },
  // Reserved category: not shown until a live calculator uses it.
  home: { name: 'Home loans', description: 'Mortgage decisions compared on total cost, not just the monthly payment.' }
});

export const CALCULATORS = Object.freeze([
  {
    slug: 'mortgage-calculator',
    path: '/calculators/mortgage-calculator/',
    name: 'Mortgage Calculator',
    navName: 'Mortgage',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Mortgage Calculator — Payment with Taxes, Insurance & PMI',
    description: 'Estimate your full monthly mortgage payment with property tax, insurance, PMI and HOA dues, when PMI can be removed, and the total cost of the loan.',
    summary: 'Full monthly payment with taxes, insurance, PMI and HOA, the dates PMI can be dropped or ends, and lifetime cost.',
    related: ['home-affordability-calculator', 'mortgage-refinance-calculator', 'mortgage-points-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'home-affordability-calculator',
    path: '/calculators/home-affordability-calculator/',
    name: 'Home Affordability Calculator',
    navName: 'Home affordability',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Home Affordability Calculator — How Much House Can I Afford?',
    description: 'Estimate how much house you can afford from your income, debts and down payment, which debt-to-income limit sets your budget, and how rates change it.',
    summary: 'Maximum home price from income, debts and down payment, the debt-to-income limit that binds, and the price at other rates.',
    related: ['mortgage-calculator', 'debt-to-income-calculator', 'rent-vs-buy-calculator', 'loan-payoff-calculator', 'mortgage-points-calculator']
  },
  {
    slug: 'rent-vs-buy-calculator',
    path: '/calculators/rent-vs-buy-calculator/',
    name: 'Rent vs. Buy Calculator',
    navName: 'Rent vs. buy',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Rent vs. Buy Calculator — Should You Rent or Buy a Home?',
    description: 'Compare renting with buying over the years you plan to stay: net worth on each path, the break-even year and every cost of owning, with your own assumptions.',
    summary: 'Net worth from renting vs. buying year by year, the break-even year, and the full costs of owning, with explicit assumptions.',
    related: ['home-affordability-calculator', 'mortgage-calculator', 'mortgage-points-calculator']
  },
  {
    slug: 'loan-payment-calculator',
    path: '/calculators/loan-payment-calculator/',
    name: 'Loan Payment Calculator',
    navName: 'Loan payment',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Loan Payment Calculator — Monthly Payment & Amortization',
    description: 'Calculate the monthly payment, total interest and amortization schedule for a fixed-rate loan, compare terms, and see how extra payments shorten payoff.',
    summary: 'Monthly payment, total interest, term comparison, extra-payment savings and a full amortization schedule.',
    related: ['auto-loan-calculator', 'personal-loan-calculator', 'mortgage-refinance-calculator', 'heloc-payment-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'auto-loan-calculator',
    path: '/calculators/auto-loan-calculator/',
    name: 'Auto Loan Calculator',
    navName: 'Auto loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Auto Loan Calculator — Car Payment with Tax, Trade-In & Fees',
    description: 'Estimate a car payment with sales tax, fees and trade-in, or how much car you can afford on a monthly budget. See the amount financed, interest and schedule.',
    summary: 'Car payment with tax, fees and trade-in, or the car price a monthly budget affords; amount financed, term comparison and amortization.',
    related: ['car-lease-calculator', 'auto-loan-refinance-calculator', 'loan-payment-calculator', 'personal-loan-calculator', 'loan-payoff-calculator']
  },
  {
    slug: 'car-lease-calculator',
    path: '/calculators/car-lease-calculator/',
    name: 'Car Lease Calculator',
    navName: 'Car lease',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Car Lease Calculator — Payment, Money Factor & Lease vs. Buy',
    description: 'Estimate a car lease payment from price, residual and money factor, what is due at signing and the total lease cost, and compare leasing with buying.',
    summary: 'Lease payment built from depreciation and rent charge, due at signing, total lease cost, and a lease-vs-buy comparison over the term.',
    related: ['auto-loan-calculator', 'auto-loan-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'auto-loan-refinance-calculator',
    path: '/calculators/auto-loan-refinance-calculator/',
    name: 'Auto Loan Refinance Calculator',
    navName: 'Auto refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Auto Loan Refinance Calculator — Savings After Fees',
    description: 'Compare keeping your car loan with refinancing: new payment, total savings after fees, when refinancing comes out ahead, and what a longer term costs.',
    summary: 'New car payment, total savings after fees and penalties, true break-even counting the balance owed, and the cost of a longer term.',
    related: ['auto-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'personal-loan-calculator',
    path: '/calculators/personal-loan-calculator/',
    name: 'Personal Loan Calculator',
    navName: 'Personal loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Personal Loan Calculator — Payment, Origination Fee & APR',
    description: 'Calculate a personal loan payment, the cash you receive after an origination fee, the fee-adjusted APR and the total cost of borrowing, with a full schedule.',
    summary: 'Payment, cash received after an origination fee, fee-adjusted APR, cost of borrowing, term comparison and amortization.',
    related: ['loan-payment-calculator', 'auto-loan-calculator', 'credit-card-payoff-calculator', 'student-loan-refinance-calculator']
  },
  {
    slug: 'student-loan-refinance-calculator',
    path: '/calculators/student-loan-refinance-calculator/',
    name: 'Student Loan Refinance Calculator',
    navName: 'Student loan refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Student Loan Refinance Calculator — Savings & Trade-Offs',
    description: 'Compare keeping your student loans with a refinance offer: new payment, total savings after fees, the cost of a longer term, and what federal borrowers give up.',
    summary: 'New payment, total savings after fees, the new rate over common terms, and a clear warning on federal benefits lost.',
    related: ['loan-payment-calculator', 'personal-loan-calculator']
  },
  {
    slug: 'mortgage-refinance-calculator',
    path: '/calculators/mortgage-refinance-calculator/',
    name: 'Mortgage Refinance Calculator',
    navName: 'Refinance',
    category: 'loans',
    status: 'live',
    updated: '2026-09-27',
    title: 'Mortgage Refinance Calculator — True Break-Even & Savings',
    description: 'Compare keeping your mortgage with refinancing: new payment, true break-even counting the balance owed, savings if you sell early, and lifetime cost.',
    summary: 'New payment, true break-even that counts the balance owed, savings if you sell after N years, and a full-term comparison.',
    related: ['mortgage-calculator', 'mortgage-points-calculator', 'loan-payment-calculator', 'heloc-payment-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'home-equity-loan-calculator',
    path: '/calculators/home-equity-loan-calculator/',
    name: 'Home Equity Loan Calculator',
    navName: 'Home equity loan',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Home Equity Loan Calculator — Payment & Borrowing Limit',
    description: 'Estimate a home equity loan payment, how much you might borrow at 80%, 85% or 90% CLTV, the cash you receive after closing costs and total interest.',
    summary: 'Monthly payment, borrowing limit at common CLTV caps, cash received after closing costs, term comparison and amortization.',
    related: ['heloc-payment-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'mortgage-points-calculator',
    path: '/calculators/mortgage-points-calculator/',
    name: 'Mortgage Points Calculator',
    navName: 'Mortgage points',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Mortgage Points Calculator — Is Buying Points Worth It?',
    description: 'Compare a mortgage with and without discount points: cost of the points, monthly savings, the month they pay for themselves, and savings if you sell early.',
    summary: 'Cost of discount points, monthly savings, true break-even month, and net savings if you sell or refinance after N years.',
    related: ['mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'heloc-payment-calculator',
    path: '/calculators/heloc-payment-calculator/',
    name: 'HELOC Payment Calculator',
    navName: 'HELOC',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'HELOC Payment Calculator — Draw vs. Repayment Payment',
    description: 'Estimate your HELOC payment during the draw period, the higher payment when repayment starts, and how much a rate rise would add, with a year-by-year schedule.',
    summary: 'Draw-period and repayment payments, the payment jump when repayment starts, rate what-ifs and a yearly schedule.',
    related: ['home-equity-loan-calculator', 'mortgage-refinance-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'credit-card-payoff-calculator',
    path: '/calculators/credit-card-payoff-calculator/',
    name: 'Credit Card Payoff Calculator',
    navName: 'Credit card payoff',
    category: 'credit',
    status: 'live',
    updated: '2026-09-27',
    title: 'Credit Card Payoff Calculator — Time to Pay Off & Interest',
    description: 'See how long it takes to pay off a credit card, the interest it costs, and the monthly payment needed to be debt-free by a set date, with a payoff schedule.',
    summary: 'Months to pay off, total interest, extra-payment savings, the payment needed for a debt-free date, and a payoff schedule.',
    related: ['balance-transfer-calculator', 'personal-loan-calculator', 'loan-payment-calculator']
  },
  {
    slug: 'balance-transfer-calculator',
    path: '/calculators/balance-transfer-calculator/',
    name: 'Balance Transfer Calculator',
    navName: 'Balance transfer',
    category: 'credit',
    status: 'live',
    updated: '2026-09-28',
    title: 'Balance Transfer Calculator — Savings After the Fee',
    description: 'See whether a balance transfer saves money after the fee, how much is left when the intro APR ends, and the monthly payment that clears it in time.',
    summary: 'Net savings after the transfer fee, the balance left when the intro rate ends, and the payment that clears it in time.',
    related: ['credit-card-payoff-calculator', 'personal-loan-calculator']
  },
  {
    slug: 'loan-payoff-calculator',
    path: '/calculators/loan-payoff-calculator/',
    name: 'Loan Payoff Calculator',
    navName: 'Loan payoff',
    category: 'loans',
    status: 'live',
    updated: '2026-09-28',
    title: 'Loan Payoff Calculator — Extra Payments & Payoff Date',
    description: 'See how much sooner extra monthly, yearly or one-time payments pay off a mortgage or loan, the interest saved, and the extra needed to be debt-free by a date.',
    summary: 'Payoff date and interest saved with monthly, yearly or lump-sum extras, and the extra needed to be debt-free by a set time.',
    related: ['loan-payment-calculator', 'mortgage-refinance-calculator', 'auto-loan-calculator']
  },
  {
    slug: 'savings-goal-calculator',
    path: '/calculators/savings-goal-calculator/',
    name: 'Savings Goal Calculator',
    navName: 'Savings goal',
    category: 'savings',
    status: 'live',
    updated: '2026-09-28',
    title: 'Savings Goal Calculator — How Much to Save Each Month',
    description: 'Find how much to save each month to reach a goal or emergency fund by a date, or how long a set monthly deposit takes, with interest at your APY.',
    summary: 'Monthly amount to reach a goal or emergency fund by a date, or time to reach it with a set deposit, with APY growth by year.',
    related: ['cd-calculator', 'credit-card-payoff-calculator', 'loan-payoff-calculator', 'home-affordability-calculator']
  },
  {
    slug: 'hourly-to-salary-calculator',
    path: '/calculators/hourly-to-salary-calculator/',
    name: 'Hourly to Salary Calculator',
    navName: 'Hourly to salary',
    category: 'work',
    status: 'live',
    updated: '2026-09-29',
    title: 'Hourly to Salary Calculator — Hourly, Weekly & Monthly Pay',
    description: 'Convert an hourly wage to an annual salary or a salary to an hourly rate, with weekly, biweekly and monthly pay, overtime, and paid or unpaid time off.',
    summary: 'Hourly wage to salary and back, with pay per day, week, paycheck and month, overtime, and paid or unpaid time off.',
    related: ['time-card-calculator', 'debt-to-income-calculator', 'savings-goal-calculator', 'home-affordability-calculator']
  },
  {
    slug: 'debt-to-income-calculator',
    path: '/calculators/debt-to-income-calculator/',
    name: 'Debt-to-Income Ratio Calculator',
    navName: 'Debt-to-income',
    category: 'credit',
    status: 'live',
    updated: '2026-09-28',
    title: 'Debt-to-Income Ratio Calculator — What Is My DTI?',
    description: 'Calculate your debt-to-income ratio from gross income and monthly debt payments: housing and total ratios, each payment\'s share, and room to a target.',
    summary: 'Housing and total debt-to-income ratios, each payment\'s share of income, and the room or cut needed to reach a target.',
    related: ['home-affordability-calculator', 'loan-payoff-calculator', 'credit-card-payoff-calculator']
  },
  {
    slug: 'concrete-calculator',
    path: '/calculators/concrete-calculator/',
    name: 'Concrete Calculator',
    navName: 'Concrete',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-28',
    title: 'Concrete Calculator — Yards & Bags for Slabs and Post Holes',
    description: 'Calculate concrete for a slab, patio, footing or post holes in cubic yards and 40, 60 or 80 lb bags, with waste, and compare bags with ready-mix.',
    summary: 'Cubic yards and bags of concrete for slabs, footings and post holes, with a waste allowance and a bags-vs-ready-mix cost check.',
    related: ['gravel-calculator', 'asphalt-calculator', 'mulch-calculator', 'deck-calculator', 'cubic-yard-calculator']
  },
  {
    slug: 'gravel-calculator',
    path: '/calculators/gravel-calculator/',
    name: 'Gravel Calculator',
    navName: 'Gravel',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-28',
    title: 'Gravel Calculator — How Many Tons and Cubic Yards You Need',
    description: 'Calculate gravel for a driveway, path, patio base or bed in cubic yards and tons, with a compaction allowance and cost by the ton or by the yard.',
    summary: 'Cubic yards and tons of gravel for rectangular or round areas, with density, compaction allowance and cost.',
    related: ['concrete-calculator', 'asphalt-calculator', 'mulch-calculator', 'home-equity-loan-calculator', 'cubic-yard-calculator']
  },
  {
    slug: 'mulch-calculator',
    path: '/calculators/mulch-calculator/',
    name: 'Mulch Calculator',
    navName: 'Mulch',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-28',
    title: 'Mulch Calculator — Cubic Yards and Bags of Mulch Needed',
    description: 'Calculate mulch for garden beds and tree rings in cubic yards and 2 or 3 cubic foot bags, with coverage by depth, and compare bags with bulk delivery.',
    summary: 'Cubic yards and bags of mulch for rectangular and round beds, coverage by depth, and bags vs. bulk cost.',
    related: ['gravel-calculator', 'concrete-calculator', 'square-footage-calculator', 'cubic-yard-calculator']
  },
  {
    slug: 'flooring-calculator',
    path: '/calculators/flooring-calculator/',
    name: 'Flooring Calculator',
    navName: 'Flooring',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-28',
    title: 'Flooring Calculator — How Many Boxes of Flooring You Need',
    description: 'Calculate square footage for up to four rooms, add waste for cuts and patterns, and find how many boxes of flooring to buy, the leftover and the cost.',
    summary: 'Square footage for several rooms, waste by layout, boxes from carton coverage, leftover and cost.',
    related: ['square-footage-calculator', 'drywall-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'drywall-calculator',
    path: '/calculators/drywall-calculator/',
    name: 'Drywall Calculator',
    navName: 'Drywall',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-28',
    title: 'Drywall Calculator — How Many Sheets of Drywall You Need',
    description: 'Calculate drywall sheets for a room\'s walls and ceiling, minus doors and windows, with waste for cuts. Compare 4×8, 4×10 and 4×12 sheets and cost.',
    summary: 'Wall and ceiling area less doors and windows, waste, and sheets for 4×8, 4×10 and 4×12 ft sizes, with cost.',
    related: ['flooring-calculator', 'roofing-calculator', 'square-footage-calculator']
  },
  {
    slug: 'roofing-calculator',
    path: '/calculators/roofing-calculator/',
    name: 'Roofing Calculator',
    navName: 'Roofing',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Roofing Calculator — Roof Area, Squares and Shingle Bundles',
    description: 'Estimate roof area from the house footprint and roof pitch, convert it to roofing squares, and find how many bundles of shingles to buy with waste.',
    summary: 'Roof area from footprint and pitch, roofing squares, waste, and shingle bundles with cost.',
    related: ['drywall-calculator', 'home-equity-loan-calculator', 'heloc-payment-calculator']
  },
  {
    slug: 'fence-calculator',
    path: '/calculators/fence-calculator/',
    name: 'Fence Calculator',
    navName: 'Fence',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Fence Calculator — Posts, Rails and Pickets for a Wood Fence',
    description: 'Calculate how many posts, rails and pickets a wood or picket fence needs from its length, post spacing and board width, with extra for waste and cost.',
    summary: 'Sections, posts, rails and pickets from fence length, post spacing and board width, with waste and cost.',
    related: ['board-foot-calculator', 'deck-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'cd-calculator',
    path: '/calculators/cd-calculator/',
    name: 'CD Calculator',
    navName: 'CD',
    category: 'savings',
    status: 'live',
    updated: '2026-09-29',
    title: 'CD Calculator — CD Interest Earned and Maturity Value',
    description: 'Calculate what a CD is worth at maturity from its APY or interest rate, compare compounding, see interest after tax, and check the cost of early withdrawal.',
    summary: 'Maturity value and interest from APY or rate, compounding comparison, after-tax interest and the early-withdrawal penalty.',
    related: ['compound-interest-calculator', 'savings-goal-calculator', 'credit-card-payoff-calculator']
  },
  {
    slug: 'compound-interest-calculator',
    path: '/calculators/compound-interest-calculator/',
    name: 'Compound Interest Calculator',
    navName: 'Compound interest',
    category: 'savings',
    status: 'live',
    updated: '2026-09-29',
    title: 'Compound Interest Calculator — With Monthly Contributions',
    description: 'Compound interest on a deposit plus monthly contributions, with daily, monthly or annual compounding, simple vs. compound interest and the rule of 72.',
    summary: 'Future value with monthly contributions and any compounding, year-by-year growth, simple vs. compound interest, inflation and doubling time.',
    related: ['cd-calculator', 'savings-goal-calculator', 'loan-payoff-calculator', 'dividend-calculator']
  },
  {
    slug: 'time-card-calculator',
    path: '/calculators/time-card-calculator/',
    name: 'Time Card Calculator',
    navName: 'Time card',
    category: 'work',
    status: 'live',
    updated: '2026-09-29',
    title: 'Time Card Calculator — Hours Worked, Breaks and Overtime',
    description: 'Add up hours worked from start and end times with lunch breaks for each day, in hours:minutes and decimal hours, with weekly overtime and gross pay.',
    summary: 'Hours worked per day and week from start and end times less breaks, decimal hours, overtime past 40 hours and gross pay.',
    related: ['hourly-to-salary-calculator', 'debt-to-income-calculator', 'savings-goal-calculator']
  },
  {
    slug: 'board-foot-calculator',
    path: '/calculators/board-foot-calculator/',
    name: 'Board Foot Calculator',
    navName: 'Board feet',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Board Foot Calculator — Lumber Board Feet and Cost',
    description: 'Calculate board feet for several stacks of lumber from thickness, width and length, including 4/4 and 8/4 hardwood sizes, with waste and price per board foot.',
    summary: 'Board feet for up to four stacks of lumber, quarter-size thickness, waste allowance and cost per board foot.',
    related: ['fence-calculator', 'deck-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'deck-calculator',
    path: '/calculators/deck-calculator/',
    name: 'Deck Calculator',
    navName: 'Deck',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Deck Calculator — Deck Boards, Joists and Screws',
    description: 'Calculate how many deck boards, joists and screws a rectangular deck needs from its size, board width and length, gap and joist spacing, with waste and cost.',
    summary: 'Deck boards, joists and screws from deck size, board size, gap and joist spacing, with waste and cost.',
    related: ['board-foot-calculator', 'fence-calculator', 'square-footage-calculator', 'home-equity-loan-calculator']
  },
  {
    slug: 'fuel-cost-calculator',
    path: '/calculators/fuel-cost-calculator/',
    name: 'Fuel Cost Calculator',
    navName: 'Fuel cost',
    category: 'driving',
    status: 'live',
    updated: '2026-09-29',
    title: 'Fuel Cost Calculator — Gas Cost of a Trip and Your Real MPG',
    description: 'Calculate the gas cost of a trip from distance, MPG and price per gallon, split it between passengers, compare two cars, or work out your MPG.',
    summary: 'Gas cost of a trip from distance, MPG and gas price, cost per mile, split and compare cars, or your MPG from a fill-up.',
    related: ['auto-loan-calculator', 'car-lease-calculator', 'auto-loan-refinance-calculator']
  },
  {
    slug: 'sales-tax-calculator',
    path: '/calculators/sales-tax-calculator/',
    name: 'Sales Tax Calculator',
    navName: 'Sales tax',
    category: 'everyday',
    status: 'live',
    updated: '2026-09-29',
    title: 'Sales Tax Calculator — Add Tax, Remove Tax or Find the Rate',
    description: 'Add sales tax to a price, work out the price before tax from a total, or find the tax rate from a receipt, with the formula and rounding shown.',
    summary: 'Add sales tax to a price, take it out of a total, or find the rate from a receipt.',
    related: ['percentage-calculator', 'tip-calculator', 'margin-calculator', 'auto-loan-calculator']
  },
  {
    slug: 'margin-calculator',
    path: '/calculators/margin-calculator/',
    name: 'Profit Margin Calculator',
    navName: 'Profit margin',
    category: 'business',
    status: 'live',
    updated: '2026-09-29',
    title: 'Profit Margin Calculator — Margin, Markup and Selling Price',
    description: 'Calculate profit margin and markup from cost and price, or the selling price for a target margin or markup, with a break-even point for fixed costs.',
    summary: 'Margin and markup from cost and price, the price for a target margin or markup, and break-even units.',
    related: ['sales-tax-calculator', 'percentage-calculator', 'personal-loan-calculator']
  },
  {
    slug: 'percentage-calculator',
    path: '/calculators/percentage-calculator/',
    name: 'Percentage Calculator',
    navName: 'Percentage',
    category: 'everyday',
    status: 'live',
    updated: '2026-09-29',
    title: 'Percentage Calculator — Percent Of, Change and Percent Off',
    description: 'Find a percentage of a number, what percent one number is of another, the percent increase or decrease, or a sale price after percent off.',
    summary: 'Percent of a number, what percent X is of Y, percent increase or decrease, and percent off a price.',
    related: ['sales-tax-calculator', 'tip-calculator', 'margin-calculator', 'savings-goal-calculator']
  },
  {
    slug: 'tip-calculator',
    path: '/calculators/tip-calculator/',
    name: 'Tip Calculator',
    navName: 'Tip',
    category: 'everyday',
    status: 'live',
    updated: '2026-09-29',
    title: 'Tip Calculator — Tip, Total and Split the Bill',
    description: 'Calculate the tip and total for a bill at any percentage, split it between any number of people, tip before tax, and round each share up.',
    summary: 'Tip and total at any percentage, split evenly, tip before tax, and round each share up to a dollar.',
    related: ['percentage-calculator', 'sales-tax-calculator', 'hourly-to-salary-calculator']
  },
  {
    slug: 'square-footage-calculator',
    path: '/calculators/square-footage-calculator/',
    name: 'Square Footage Calculator',
    navName: 'Square footage',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Square Footage Calculator — Sq Ft, Sq Yd, m² and Acres',
    description: 'Calculate square footage for rectangles, circles, triangles and trapezoids from feet, inches, yards or meters, with square yards, square meters, acres and cost.',
    summary: 'Square feet of a rectangle, circle, triangle or trapezoid in any unit, with square yards, square meters, acres and cost.',
    related: ['flooring-calculator', 'drywall-calculator', 'concrete-calculator', 'home-affordability-calculator', 'btu-calculator']
  },
  {
    slug: 'asphalt-calculator',
    path: '/calculators/asphalt-calculator/',
    name: 'Asphalt Calculator',
    navName: 'Asphalt',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-29',
    title: 'Asphalt Calculator — Tons of Asphalt for a Driveway or Lot',
    description: 'Estimate the tons and cubic yards of asphalt for a driveway, path or parking area from its size and thickness, with waste and cost per ton.',
    summary: 'Tons and cubic yards of asphalt from length, width and thickness, with waste and cost.',
    related: ['gravel-calculator', 'concrete-calculator', 'square-footage-calculator', 'home-equity-loan-calculator', 'cubic-yard-calculator']
  },
  {
    slug: 'cubic-yard-calculator',
    path: '/calculators/cubic-yard-calculator/',
    name: 'Cubic Yard Calculator',
    navName: 'Cubic yards',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-30',
    title: 'Cubic Yard Calculator — Yards of Soil, Fill, Sand & Mulch',
    description: 'Calculate cubic yards for any area and depth, or how much a yard covers, with cubic feet, bags, truckloads and cost for soil, fill, sand, gravel and mulch.',
    summary: 'Cubic yards for rectangles, circles and triangles, or the area a delivery covers, in cubic feet, cubic meters, bags and truckloads.',
    related: ['gravel-calculator', 'mulch-calculator', 'concrete-calculator', 'square-footage-calculator']
  },
  {
    slug: 'btu-calculator',
    path: '/calculators/btu-calculator/',
    name: 'BTU Calculator',
    navName: 'BTU (AC size)',
    category: 'homeImprovement',
    status: 'live',
    updated: '2026-09-30',
    title: 'BTU Calculator — What Size Air Conditioner Do I Need?',
    description: 'Find the right size room or window air conditioner in BTU per hour from your room area, sun, shade, people and kitchen use, using the ENERGY STAR sizing chart.',
    summary: 'Room air conditioner size in BTU per hour from the ENERGY STAR chart, adjusted for sun, shade, people and kitchens.',
    related: ['square-footage-calculator', 'home-equity-loan-calculator', 'roofing-calculator']
  },
  {
    slug: 'dividend-calculator',
    path: '/calculators/dividend-calculator/',
    name: 'Dividend Calculator',
    navName: 'Dividends',
    category: 'savings',
    status: 'live',
    updated: '2026-09-30',
    title: 'Dividend Calculator — Dividend Income, Yield & DRIP Growth',
    description: 'Project dividend income and portfolio value with or without reinvestment (DRIP), monthly contributions, dividend growth, price growth and tax on dividends.',
    summary: 'Dividend income and value over time, reinvested or taken as cash, with contributions, dividend and price growth, and tax.',
    related: ['compound-interest-calculator', 'savings-goal-calculator', 'cd-calculator']
  }
]);

export function liveCalculators(registry = CALCULATORS) {
  return registry.filter((calculator) => calculator.status === 'live');
}

export function findCalculator(slug, registry = CALCULATORS) {
  return registry.find((calculator) => calculator.slug === slug) ?? null;
}

/** Related calculators that are live; planned ones are never linked. */
export function relatedCalculators(slug, registry = CALCULATORS) {
  const calculator = findCalculator(slug, registry);
  if (!calculator) return [];
  return (calculator.related ?? [])
    .map((relatedSlug) => findCalculator(relatedSlug, registry))
    .filter((related) => related && related.status === 'live');
}
