# Enhanced SAP Simulator - Complete Business Guide

## Overview
The Solution Order Simulator has been significantly enhanced to provide **business users and SAP professionals** with detailed, real-world context for a complex multi-product bundled deal that combines three different revenue models under a single IFRS 15 compliant contract.

## 9-Step Business Walkthrough

### **Step 1: Customer Qualifies & Creates Quote (SFDC-CPQ)**
**For Business Users:**
Acme Corp, a mid-market manufacturing company, needs to modernize their ERP. The sales team creates a bundled quote in Salesforce CPQ containing:
- 1 perpetual CRM software license ($50K one-time)
- 36 months of cloud hosting ($2K/month = $72K)
- 4-phase implementation services (480 hours @ $150/hr = $72K)
- **Total Contract Value: $125K over 3 years**

**What You'll See in the Simulator:**
- **Business Context:** Why bundling is important and what pain points it solves
- **Field Mapping Table:** Each Salesforce field (Account.Name, Quote.TotalAmount, etc.) mapped to SAP tables (KNA1, ZEST, MARA) with explanations of WHY each field matters
- **Master Data Summary:** What data is created/updated (Customer Master, Material Master, Pricing, Custom Contract Table)

---

### **Step 2: Order Transmitted to SAP (ZAPI-001)**
**For Business Users:**
The order flows from Salesforce to SAP via a REST API on SAP's cloud platform (BTP). This integration ensures:
- No manual data entry errors
- Real-time validation against master data
- Automatic document number assignment
- Complete audit trail (SFDC → API → SAP)

**What You'll See in the Simulator:**
- **Business Context:** Why integrations matter and what problems they solve
- **API Endpoint:** `POST /sap/opu/odata/sap/ZECHS_SO_SRV/SolutionOrders`
- **Request/Response Samples:** Shows exactly what data flows between systems
- **Process Flow:** 6 steps from SFDC sending → API validation → SAP document creation → Confirmation back to SFDC
- **Validation Checks:** Customer exists, materials exist, pricing is correct, no duplicates

---

### **Step 3: Create Solution Order Master (ZEST-001)**
**For Business Users:**
SAP creates a parent "Solution Order" that consolidates all three products as a single contract. This is critical because:
- Customer signed ONE deal, not three separate orders
- Revenue must be consolidated for reporting
- IFRS 15 compliance requires single contract view
- Audit trail shows everything flows from one parent document

**Key Concept: The Initial GL Entry**
When the Solution Order is created, SAP immediately records:
- **Debit $125K** to Accounts Receivable (what customer will owe)
- **Credit $125K** to Deferred Revenue (reserve, not revenue yet)

This entry represents the obligation - as we deliver products, we'll "release" this deferred amount to actual revenue.

**What You'll See in the Simulator:**
- **Business Context:** Why parent contracts matter
- **ZEST Table Fields:** 10+ key fields with explanations (customer, dates, contract terms, currency)
- **GL Posting Explanation:** Detailed explanation of the debit/credit entry and what it means
- **GL Impact:** Shows this is a Balance Sheet entry (Assets = Liabilities), not yet an Income Statement entry

---

### **Step 4: Determine Billing Models (ROUTING-001)**
**For Business Users:**
This is THE critical configuration step. Each product has a different billing lifecycle:

**License (Item Category: TAN - Tangible)**
- Billing: One-time invoice upon delivery
- Revenue: Recognized immediately (May 1)
- Invoices Created: 1 total
- GL Account: 4100 (License Revenue)

**SaaS (Item Category: CBAO - Consumption-Based)**
- Billing: Monthly subscription for 36 months
- Revenue: $2K recognized each month (evenly spread)
- Invoices Created: 36 total (1 per month)
- GL Account: 4200 (SaaS Revenue)

**Services (Item Category: ZSRV - Custom Service)**
- Billing: Milestone-based (one invoice per phase)
- Revenue: $18K per phase (upon phase completion)
- Invoices Created: 4 total (1 per phase)
- GL Account: 4300 (Service Revenue)

**Why This Matters:**
If you assign the WRONG item category, billing breaks completely:
- ❌ License with CBAO → Invoiced monthly (customer expects one invoice!)
- ❌ SaaS with TAN → Invoiced all upfront (customer expects monthly!)
- ❌ Services with TAN → Invoiced immediately (services haven't been delivered!)

**What You'll See in the Simulator:**
- **Business Context:** Why different billing models matter
- **Routing Matrix:** Shows the 3-way mapping (Item Type → SAP Item Category → Billing Behavior)
- **Module Involvement:** Which SAP modules control which aspects

---

### **Step 5: Sales Order #1 - Perpetual License (SO-2026-001567)**
**For Business Users:**
The simplest sales order - one-time software license, one-time invoice.

**What Happens:**
1. SO created with 1 unit of license product, $50K price
2. Invoice auto-created immediately (because TAN item category)
3. GL entry posts: AR $50K, Revenue $50K (immediate)
4. Customer receives invoice same day

**Acme Corp's Perspective:**
- Receives license on May 1, 2026
- Can use the software immediately
- Gets one invoice for $50K
- Owns the software forever (perpetual = unlimited time)

**Company's Financial Perspective:**
- Records $50K revenue immediately (IFRS 15: control transferred immediately)
- Shows $50K asset in AR (right to collect)
- Increases profit by $50K in this quarter

**What You'll See in the Simulator:**
- **Business Context:** The perpetual license scenario
- **VBAK Table:** 10+ header fields with SAP field names and explanations
- **VBAP Table:** 9+ line item fields
- **Billing Process:** 5-step flow from SO creation → invoice → GL posting → payment
- **GL Posting Table:** Shows the AR and Revenue accounts with explanations
- **Balance Sheet Impact:** Assets up $50K, Equity up $50K

---

### **Step 6: Sales Order #2 - SaaS Cloud Subscription (SO-2026-001568)**
**For Business Users:**
Monthly subscription for cloud hosting. This is the "recurring revenue" model - predictable, repeatable, scalable.

**Key Metric: MRR (Monthly Recurring Revenue)**
- MRR = $2,000/month
- ARR = $2,000 × 12 = $24,000/year
- Total Contract Value = $2,000 × 36 months = $72,000

**What Happens Each Month:**
1. Billing scheduler automatically creates one invoice
2. Invoice is for $2K (one month's hosting)
3. GL entry posts: AR $2K, Deferred Revenue -$2K, Revenue +$2K
4. Process repeats for 36 months

**Why SaaS Companies Love This Model:**
- Predictable, recurring revenue (no surprises)
- Cash flows monthly (not lumpy like projects)
- High gross margins (cloud infrastructure is scalable)
- Customer lock-in (they use the service every month)

**What You'll See in the Simulator:**
- **Business Context:** The SaaS scenario and why recurring revenue matters
- **Billing Schedule:** Shows all 36 months (May 2026 - Apr 2029) with invoice dates and status
- **Recurring Revenue Metrics:** MRR, ARR, Contract Value, Customer Lifetime Value
- **VBAK/VBAP Tables:** Subscription-specific fields (billing start date, end date, quantity=36 months)
- **GL Posting (Monthly):** Shows the 3-account entry that repeats 36 times

---

### **Step 7: Sales Order #3 - Professional Services (SO-2026-001569)**
**For Business Users:**
4-phase implementation project tracked in Workday PSA (project management system).

**The 4 Phases:**
1. **Discovery & Design** (May-Jun, 120 hours, $18K billing, $9K cost)
   - Outcomes: Requirements doc, system design, gap analysis
   - Approval Gate: Customer signs off on design

2. **Development & Testing** (Jul-Sep, 160 hours, $18K billing, $12K cost)
   - Outcomes: Code built, unit tests passed, QA completed
   - Approval Gate: Development lead certifies code quality

3. **UAT & Optimization** (Oct-Nov, 120 hours, $18K billing, $9K cost)
   - Outcomes: Customer tests everything, approves all functions
   - Approval Gate: Customer UAT sign-off

4. **Cutover & Support** (Dec-Jan, 80 hours, $18K billing, $6K cost)
   - Outcomes: System goes live, team trained, support completed
   - Approval Gate: System live, zero critical issues

**Key Concept: Milestone-Based Revenue**
- Don't invoice until phase is complete
- Don't recognize revenue until delivery is approved
- This protects the customer (can't be invoiced for incomplete work)
- This protects the company (clear audit trail of delivery)

**Gross Margin by Phase:**
- Phase 1: $18K revenue - $9K cost = $9K margin (50%)
- Phase 2: $18K revenue - $12K cost = $6K margin (33%)
- Phase 3: $18K revenue - $9K cost = $9K margin (50%)
- Phase 4: $18K revenue - $6K cost = $12K margin (67%)
- **Total: $72K revenue - $36K cost = $36K margin (50%)**

**What You'll See in the Simulator:**
- **Business Context:** The milestone-based services scenario
- **Phase Schedule:** All 4 phases with dates, hours, costs, deliverables, approval gates
- **SO Details:** VBAK/VBAP fields specific to services
- **GL Posting (Per Phase):** Shows 4-account entry (AR, COGS, Deferred Rev, Revenue)

---

### **Step 8: Milestone Trigger & Auto-Invoice (WDY-WEBHOOK)**
**For Business Users:**
This is where integration magic happens. When Phase 1 completes in Workday PSA, an automatic webhook fires to SAP.

**Real Example - Phase 1 Completion (June 30, 2026):**
1. **Workday PSA:** Project manager clicks "Mark Phase 1 Complete"
2. **Workday Records:**
   - Completion date: June 30, 2026
   - Confirmed hours: 118 (vs 120 planned)
   - Actual cost: $8,850 (118 hours × $75 cost rate)
   - Quality approval: APPROVED
3. **Webhook Fires:** Workday sends HTTP POST to SAP with phase data
4. **SAP Receives & Validates:**
   - Is this SO-2026-001569? YES ✓
   - Is Phase 1 the next milestone? YES ✓
   - Is quality approved? YES ✓
   - → Proceed to invoice creation
5. **SAP Auto-Creates:**
   - Invoice INV-2026-0815-1001 for $18,000
   - GL Journal Entry posting the revenue
   - Email sent to Acme Corp with invoice PDF
6. **Customer Receives:**
   - Invoice with clear phase description
   - List of deliverables completed
   - PM signature confirming quality
   - No disputes (customer already approved before invoice!)

**Why This Is Powerful:**
- ✓ Zero manual work (no invoice data entry)
- ✓ Fast billing (invoice created immediately upon completion)
- ✓ Clear quality gates (can't invoice for incomplete work)
- ✓ Audit trail (webhook logged, timestamps recorded)

**What You'll See in the Simulator:**
- **Business Context:** Why webhooks matter for automation
- **Webhook Payload:** Exact JSON data sent from Workday to SAP
- **SAP Validation:** Shows the business logic that validates the webhook
- **Invoice Created:** Shows the billing document with all details

---

### **Step 9: Consolidate Under IFRS 15 Revenue Standards (IFRS15-RAR)**
**For Business Users:**

This is where it all comes together from a financial reporting perspective.

**The Problem:**
We have 3 separate Sales Orders with 3 different revenue timelines:
- License: Recognizes $50K May 2026
- SaaS: Recognizes $2K monthly (May 2026 - Apr 2029)
- Services: Recognizes $18K per phase (4 invoices over time)

But Acme Corp signed ONE deal for $125K bundled. From an auditor's perspective, this should be ONE contract with one revenue allocation.

**IFRS 15 Solution: Standing Selling Price (SSP) Allocation**

List prices (what each product costs separately):
- License alone: $60,000 (market rate for this software)
- SaaS alone: $72,000 (market rate for 36 months hosting)
- Services alone: $80,000 (market rate for 4-phase implementation)
- **Total list price: $212,000**

Acme negotiated bundled deal: $125,000 (41% discount!)

**IFRS 15 Says:** Allocate the $125K contract price proportionally based on relative SSP:
- License: ($60K / $212K) × $125K = **$35,375** (28.3% of contract)
- SaaS: ($72K / $212K) × $125K = **$42,500** (34% of contract)
- Services: ($80K / $212K) × $125K = **$47,125** (37.7% of contract)

**Revenue Recognition Schedule (IFRS 15 Compliant):**

| Month | License | SaaS | Services | Total |
|-------|---------|------|----------|-------|
| May 2026 | $35,375 | $1,181 | - | $36,556 |
| Jun 2026 | - | $1,181 | $13,098 | $14,279 |
| Jul-Sep 2026 | - | $3,543 | $13,098 | $16,641 |
| Oct-Nov 2026 | - | $2,362 | $13,098 | $15,460 |
| Dec 2026 - Feb 2027 | - | $3,543 | $13,098 | $16,641 |
| Mar-Apr 2029 | - | $2,362 | - | $2,362 |
| **TOTAL** | **$35,375** | **$42,500** | **$47,125** | **$125,000** |

**Why This Matters:**
✓ Financial statements show ONE contract, not three fragmented orders
✓ Revenue allocation is defensible (based on SSP method)
✓ Auditors are happy (IFRS 15 compliant)
✓ Investors see clean revenue numbers

**What You'll See in the Simulator:**
- **Business Context:** The IFRS 15 compliance challenge and solution
- **Performance Obligation Matrix:** Shows the 3 products with list prices, allocation %, and IFRS 15 adjusted revenue
- **Consolidated Revenue Schedule:** Shows the month-by-month recognition for the entire 3-year period
- **IFRS 15 Compliance Checklist:** Confirms all requirements are met

---

## Key Business Insights

### 1. Revenue Model Diversity
A single $125K deal combines three fundamentally different revenue models:
- **Perpetual (License):** Once-and-done, immediate revenue
- **Recurring (SaaS):** Predictable monthly, multi-year
- **Milestone (Services):** Event-driven, phased delivery

This is real-world complexity that affects:
- Cash flow timing (license = one payment, SaaS = 36 payments)
- Revenue visibility (license shows all at once, SaaS shows 1/36th monthly)
- Customer retention (license is owned forever, SaaS must renew)

### 2. Deferred Revenue Accounting
Three separate deferred revenue GL accounts (1920, 1930, 1940) track:
- License delivered immediately → defer $50K, recognize immediately
- Services delivered in phases → defer $72K, recognize per phase
- SaaS delivered monthly → defer $72K, recognize monthly

Each account's balance decreases as delivery occurs and revenue is recognized.

### 3. Billing Automation
- **License:** 1 invoice created manually or via order form
- **SaaS:** 36 invoices created automatically by background job monthly
- **Services:** 4 invoices created automatically by webhook when PM approves phases

This automation reduces manual work and errors.

### 4. Gross Margin Tracking
- **License:** $50K revenue, ~$5K COGS (software licensing) = 90% margin
- **SaaS:** $72K revenue, ~$36K COGS (cloud infrastructure) = 50% margin
- **Services:** $72K revenue, $36K COGS (consultant labor) = 50% margin

Different products have different economics. SaaS scalability creates higher margins.

### 5. Risk Management
- **License:** Paid upfront, delivered immediately → Lowest risk
- **SaaS:** Monthly installments, 36-month term → Medium risk (churn after month 1?)
- **Services:** Phased billing, 4 payment milestones → Highest risk (approval gate delays?)

Milestone-based billing mitigates service delivery risk with quality gates.

---

## SAP Modules Involved

| Module | Role | Key Tables |
|--------|------|-----------|
| **SD** (Sales & Distribution) | Order creation, invoicing, delivery | VBAK, VBAP, VBRK, VBRP |
| **MM** (Materials Management) | Product master, inventory (if applicable) | MARA, MARC, MARD |
| **FI** (Financial Accounting) | GL posting, AR subledger, deferred revenue | LFA1, BSIS, BSAS |
| **CO** (Controlling) | Cost tracking, margin analysis, profitability | COBK, CECO |
| **FI-RAR** (Revenue Accounting) | IFRS 15 consolidation, SSP allocation | RARSDO, RARPOB |
| **PS** (Project Systems) | (Optional) Project tracking if integrated | PRPS, PLIT |
| **BTP** (Integration Platform) | API gateway, webhook receiver, data mapping | (Cloud-based) |

---

## For SAP Professionals: Configuration Checklist

### **Document Types (AUART)**
- [ ] ZORD: Solution Order (parent)
- [ ] ZLIC: License Order
- [ ] ZREC: Recurring Subscription
- [ ] ZSER: Services Order

### **Item Categories (PSTYV)**
- [ ] TAN: Tangible products (license) → Immediate billing
- [ ] CBAO: Consumption-based (SaaS) → Schedule-based billing
- [ ] ZSRV: Custom services → Milestone-based billing

### **GL Accounts**
- [ ] 1150: Accounts Receivable
- [ ] 1920: Deferred Revenue - Products
- [ ] 1930: Deferred Revenue - Services
- [ ] 1940: Deferred Revenue - SaaS
- [ ] 4100: License Revenue
- [ ] 4200: SaaS Revenue
- [ ] 4300: Service Revenue
- [ ] 5100: COGS - Labor

### **Pricing Conditions (KONP)**
- [ ] License: Fixed price condition
- [ ] SaaS: Monthly recurring condition
- [ ] Services: Hourly rate condition

### **Integration Points**
- [ ] API endpoint for Salesforce CPQ integration
- [ ] Webhook receiver for Workday PSA integration
- [ ] Background job for monthly SaaS billing
- [ ] RAR consolidation rules for IFRS 15

---

## Next Steps

This simulator is now ready for:
1. **Training:** Show business users real revenue recognition mechanics
2. **Configuration Review:** Verify GL accounts and item categories with finance team
3. **Process Documentation:** Create runbooks for billing team
4. **Testing:** Validate webhook integration with Workday PSA
5. **Go-Live:** Train AR team on recurring billing process

The simulator demonstrates that integrating complex billing models is possible with proper SAP configuration and automation.
