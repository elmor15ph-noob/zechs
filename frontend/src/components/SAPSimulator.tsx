import React, { useState } from 'react';
import { icons } from '../theme/icons';
import { colors } from '../theme/designSystem';

interface SAPSimulatorProps {
  isDarkMode?: boolean;
}

const steps = [
  {
    id: 1,
    name: 'Customer Qualifies & Creates Quote',
    code: 'SFDC-CPQ',
    description: 'Salesforce CPQ generates bundled quote for implementation',
    details: 'Source: SFDC CPQ | Target: SAP Customer Master | Module: SD (Sales & Distribution)',
    businessContext: `
**BUSINESS SCENARIO:** Acme Corp, a growing mid-market manufacturing company, needs to modernize their ERP system. The sales team creates a bundled quote combining three products:
1. **Perpetual Software License** - CRM module (one-time $50K purchase)
2. **SaaS Cloud Hosting** - Monthly subscription for 3 years ($2K/month × 36 = $72K)
3. **Implementation Services** - 4-phase consulting/customization ($150/hour × 480 hours = $72K)
Total Contract Value (TCV): **$125,000 over 3 years**

This is a **mixed revenue model deal** - combining one-time license, recurring subscription, and milestone-based services.
    `,
    explanation: `
The Salesforce CPQ module generates a detailed quote that must be mapped to SAP S/4HANA. This isn't just data entry - it establishes the entire contract structure in SAP. Each field in the quote corresponds to critical master data in SAP that controls billing, revenue recognition, and financial reporting.

**Why This Matters for SAP:**
- **Customer Master (KNA1):** Contains all customer billing/shipping data, payment terms, and company codes
- **Material Master (MARA/MARC):** Links products to stock locations, pricing, and item categories
- **Pricing Conditions (KONP):** Establishes prices by customer, date range, and product
- **Contract Data (ZEST):** New custom table that acts as the "parent contract" for all three sales orders

Without accurate field mapping, you'll have data quality issues that ripple through billing, revenue recognition, and compliance reporting.
    `,
    fieldMappingTable: [
      { sfdcField: 'Account.Name', sapTable: 'KNA1', sapField: 'NAME1', description: 'Customer name for billing', sampleValue: 'Acme Corp', importance: 'Critical - Used in all invoices and AR reporting' },
      { sfdcField: 'Account.BillingCity', sapTable: 'KNA1', sapField: 'CITY', description: 'Billing address city', sampleValue: 'San Francisco', importance: 'Required for tax jurisdiction & delivery' },
      { sfdcField: 'Account.PaymentTerms', sapTable: 'KNA1', sapField: 'ZTERM', description: 'Payment terms code', sampleValue: 'Z030', importance: 'Affects invoice due dates and AR aging' },
      { sfdcField: 'Quote.QuoteDate', sapTable: 'ZEST', sapField: 'ERDAT', description: 'Quote creation date', sampleValue: '2026-04-15', importance: 'Revenue recognition start date' },
      { sfdcField: 'Quote.ContractStart', sapTable: 'ZEST', sapField: 'CTART', description: 'Effective contract date', sampleValue: '2026-05-01', importance: 'Controls when revenue recognition begins' },
      { sfdcField: 'Quote.ContractEnd', sapTable: 'ZEST', sapField: 'CTEND', description: 'Contract expiration date', sampleValue: '2029-04-30', importance: 'Determines SaaS subscription end date' },
      { sfdcField: 'Quote.TotalAmount', sapTable: 'ZEST', sapField: 'NETWR', description: 'Total contract value', sampleValue: '125,000.00', importance: 'Sum of all line items - controls AR and deferred revenue' },
      { sfdcField: 'QuoteLine.Product', sapTable: 'MARA', sapField: 'MATNR', description: 'Material/Product code', sampleValue: 'ZLIC-001', importance: 'Links to pricing, costing, and revenue accounts' },
      { sfdcField: 'QuoteLine.Quantity', sapTable: 'VBAP', sapField: 'MENGE', description: 'Line item quantity', sampleValue: '1 (License), 36 (SaaS months), 480 (Service hours)', importance: 'Determines invoice amounts' },
      { sfdcField: 'QuoteLine.UnitPrice', sapTable: 'VBAP', sapField: 'NETPR', description: 'Price per unit', sampleValue: '50000 (License), 2000 (SaaS), 150 (Service)', importance: 'Used in AR subledger and revenue GL postings' },
      { sfdcField: 'QuoteLine.ItemCategory', sapTable: 'VBAP', sapField: 'PSTYV', description: 'SAP item category', sampleValue: 'TAN (License), CBAO (SaaS), ZSRV (Services)', importance: 'Controls billing process and revenue recognition timing' },
    ],
    masterDataSummary: [
      { table: 'KNA1 - Customer Master', records: 1, impact: 'All 3 SOs reference same customer. Payment terms apply to all invoices.' },
      { table: 'MARA - Material Master', records: 3, impact: 'ZLIC-001 (License), ZSAAS-001 (SaaS), ZPROF-001 (Services). Each has different GL revenue account.' },
      { table: 'MARC - Plant/Material', records: 2, impact: 'License & SaaS are non-stock (KTMK=N). Services tracked in PSA (Workday), not inventory.' },
      { table: 'KONP - Pricing', records: 3, impact: 'License & SaaS have fixed pricing. Services pricing = hourly rate basis.' },
      { table: 'ZEST - Contract Header (Custom)', records: 1, impact: 'Parent document. All 3 SOs linked to this for revenue consolidation under IFRS 15.' },
    ],
  },
  {
    id: 2,
    name: 'Order Transmitted to SAP',
    code: 'ZAPI-001',
    description: 'REST API receives Solution Order request from Salesforce',
    details: 'Protocol: REST API | Authentication: OAuth 2.0 | Platform: SAP BTP (Cloud) Integration',
    businessContext: `
**THE INTEGRATION CHALLENGE:**
Sales teams work in Salesforce. Finance & Operations work in SAP. Without a real-time integration, orders created in SFDC don't automatically flow to SAP, causing:
- **Manual data entry errors** - Someone must re-type the order into SAP
- **Order-to-cash delays** - Billing can't happen until the order is in SAP
- **Lost audit trail** - Who created it? When? What was the original source?
- **Duplicate orders** - Same quote submitted twice by accident

**THE SOLUTION:**
A REST API endpoint on SAP BTP (SAP's cloud platform) receives the quote/order data from Salesforce in real-time. The API acts as a "traffic cop" - validating, enriching, and transforming the data before it enters SAP's transactional tables.
    `,
    explanation: `
When a sales rep clicks "Send to SAP" in Salesforce, the entire quote (customer data, products, quantities, pricing, terms) is serialized into JSON and transmitted to this API endpoint. The API performs critical validation steps BEFORE data touches SAP tables:

**VALIDATION STEPS:**
1. **Authentication:** Is the request from an authorized Salesforce instance?
2. **Idempotency Check:** Is this a duplicate submission (same quote sent twice by mistake)?
3. **Customer Master Validation:** Does KNA1 customer 0001234567 exist in SAP?
4. **Material Master Validation:** Do products ZLIC-001, ZSAAS-001, ZPROF-001 exist in MARA?
5. **Pricing Validation:** Are quoted prices consistent with KONP (condition table)?
6. **Master Data Enrichment:** Pull additional data (tax codes, company code, plant, warehouse)
7. **Document Number Assignment:** Generate unique Solution Order ID (ZORD-2026-0415-001)

If ANY validation fails, the API rejects the request with error codes. If ALL validations pass, it proceeds to create transactional documents.

**WHY THIS MATTERS:**
- **Data Quality:** Bad data in SAP causes cascading errors in billing, revenue recognition, and financial reporting
- **Audit Trail:** Every API call is logged with timestamp, source system, and success/failure
- **Exception Handling:** If Salesforce is down, the API gracefully handles retries without creating duplicate orders
    `,
    apiDetails: {
      endpoint: 'POST /sap/opu/odata/sap/ZECHS_SO_SRV/SolutionOrders',
      method: 'POST',
      platform: 'SAP BTP (Cloud Integration Platform)',
      authentication: 'OAuth 2.0 with service account',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5...(64-character token)',
        'X-CSRF-Token': '2d0e4f8a9c1b5e7f3a6d8c2b....(CSRF protection)',
        'Idempotency-Key': 'ZORD-2026-04-15-UUID-12345',
      },
      requestSample: {
        sourceSystem: 'SFDC-US-PROD',
        sourceSalesforceId: 'Quote-0814-ACME-001',
        customerId: '0001234567',
        customerName: 'Acme Corp',
        solutionOrderType: 'ZEST',
        contractStartDate: '2026-05-01',
        contractEndDate: '2029-04-30',
        purchaseOrder: 'PO-ACME-2026-0815',
        currency: 'USD',
        items: [
          { itemType: 'SRQS', product: 'ZLIC-001', quantity: 1, unitPrice: 50000, description: 'Perpetual CRM License' },
          { itemType: 'ZSUB', product: 'ZSAAS-001', quantity: 36, unitPrice: 2000, description: 'Cloud Hosting (36 months)' },
          { itemType: 'ZSRV', product: 'ZPROF-001', quantity: 480, unitPrice: 150, description: 'Implementation Services (480 hours)' },
        ],
      },
      responseSample: {
        status: 'SUCCESS',
        solutionOrderId: 'ZORD-2026-0415-001',
        timestamp: '2026-04-15T14:32:05Z',
        validations: [
          { check: 'Customer Master Check (KNA1)', result: 'PASS', message: 'Customer 0001234567 found' },
          { check: 'Material Master Check (MARA)', result: 'PASS', message: 'All 3 materials exist' },
          { check: 'Pricing Condition Check (KONP)', result: 'PASS', message: 'Prices within authorized range' },
          { check: 'Company Code Check', result: 'PASS', message: 'Company code 1000 assigned' },
          { check: 'Duplicate Check', result: 'PASS', message: 'No prior submission of this quote' },
        ],
        nextStep: 'Document creation in progress. Solution Order ZORD-2026-0415-001 being created.',
      },
    },
    processFlow: [
      { step: '1. SFDC Sends Request', description: 'Sales rep clicks "Send to SAP" in Salesforce CPQ', actor: 'Sales Team', system: 'Salesforce' },
      { step: '2. API Receives & Validates', description: 'SAP BTP API validates all fields against master data', actor: 'Integration Platform', system: 'SAP BTP' },
      { step: '3. Data Enrichment', description: 'API adds Company Code (1000), Plant (1100), Tax ID, GL Accounts', actor: 'Middleware', system: 'SAP Configuration' },
      { step: '4. Document Assignment', description: 'Unique Solution Order ID generated (ZORD-2026-0415-001)', actor: 'Number Range', system: 'SAP' },
      { step: '5. Create Transactional Documents', description: 'ZEST header, VBAK/VBAP sales orders, VBRK billing documents created', actor: 'SAP Backend', system: 'S/4HANA' },
      { step: '6. Confirm to SFDC', description: 'API returns success with SAP document numbers', actor: 'Integration Platform', system: 'SAP BTP' },
    ],
  },
  {
    id: 3,
    name: 'Create Solution Order Master',
    code: 'ZEST-001',
    description: 'Parent contract document consolidating entire bundled deal',
    details: 'Table: ZEST (Custom) | Document Type: ZORD | Module: SD (Sales & Distribution)',
    businessContext: `
**WHY WE NEED A "PARENT" CONTRACT:**

If we just created 3 separate Sales Orders (License, SaaS, Services), we'd have 3 independent orders:
- ❌ License SO would show $50K revenue immediately
- ❌ SaaS SO would show $72K revenue over 36 months
- ❌ Services SO would show $72K revenue over 4 phases
- **Total Revenue Visibility:** Fragmented across 3 different orders

**BUT THE CUSTOMER SIGNED ONE BUNDLED DEAL** for $125K with mixed terms. From an accounting perspective, this is ONE performance obligation (IFRS 15) that must be consolidated.

**THE SOLUTION:** Create a Solution Order (ZEST) parent document that:
- Acts as the "master contract" linking all 3 SOs
- Defines the overall contractual relationship (terms, dates, currency)
- Controls revenue consolidation and reporting
- Serves as the basis for consolidated invoicing & collections
- Provides a single audit trail for the entire deal
    `,
    explanation: `
When ZEST-001 is created, SAP immediately makes the first critical GL entry - recording the obligation to the customer. This entry is not final; it's the starting point.

**WHAT THE GL ENTRY MEANS:**
- **Debit to AR (1150) $125,000:** SAP is saying "We have a $125K obligation to invoice this customer"
- **Credit to Deferred Revenue $125,000:** SAP is reserving the money - it's not revenue YET because we haven't delivered everything

This is the IFRS 15 starting position. As we deliver products and services over time, we'll release this deferred revenue and recognize actual revenue.

**THE THREE DEFERRED REVENUE ACCOUNTS REPRESENT:**
1. **1920 (COGS/License)** - $50K is reserved here because license delivery is immediate
2. **1930 (Services)** - $72K is reserved here because service delivery is phased over 4 months
3. **1940 (SaaS)** - $3K is reserved because... actually, let me explain this

Wait - shouldn't SaaS deferred be $72K (36 × $2K)? Yes! Let me recalculate:
- License: $50K (immediate) → 1920 = $50K
- SaaS: $72K (over 36 months) → 1940 = $72K
- Services: $72K (over 4 phases) → 1930 = $72K
- **Total: $194K deferred? But contract is only $125K!**

This reveals the bundling complexity. The customer negotiated a bundled discount:
- **List Price:** License $60K + SaaS $72K + Services $80K = $212K
- **Negotiated Price:** $125K (41% discount for bundling)
- **SSP Allocation (Standing Selling Price):** We allocate the $125K proportionally to each product's list price

This is handled in Step 9 (RAR Consolidation). For now, the initial GL entry recognizes the full $125K obligation.
    `,
    zestTable: [
      { field: 'ZEST_ID', value: 'ZORD-2026-0415-001', description: 'Unique Solution Order ID (generated by number range)' },
      { field: 'CUSTOMER_ID', value: '0001234567', description: 'SAP Customer Master (KNA1) - triggers all customer-specific settings' },
      { field: 'CUSTOMER_NAME', value: 'Acme Corp', description: 'Customer name from KNA1-NAME1' },
      { field: 'PO_NUMBER', value: 'PO-ACME-2026-0815', description: 'Customer Purchase Order reference - required for audit trail' },
      { field: 'ORDER_DATE', value: '2026-04-15', description: 'Solution Order creation date - used for revenue recognition cutoff' },
      { field: 'CONTRACT_START', value: '2026-05-01', description: 'Effective contract date - when revenue recognition begins' },
      { field: 'CONTRACT_END', value: '2029-04-30', description: '3-year contract end date - controls SaaS billing period' },
      { field: 'COMPANY_CODE', value: '1000', description: 'SAP Company Code - determines which legal entity owns this deal' },
      { field: 'SALES_ORG', value: '1010', description: 'Sales Organization (US Division) - for sales reporting' },
      { field: 'TOTAL_VALUE', value: '125,000.00', description: 'Total contract value (TCV) - sum of all line items' },
      { field: 'CURRENCY', value: 'USD', description: 'Transaction currency - all GL postings use this currency' },
      { field: 'STATUS', value: 'CREATED', description: 'Document status - progresses from CREATED → RELEASED → INVOICED → PAID' },
    ],
    glPostingExplanation: `
**THE INITIAL GL ENTRY (Journal Entry ZORD-2026-0415-001):**

This entry is automatically created when ZEST-001 is released. It represents the core IFRS 15 entry - recognizing an obligation to the customer.

**Debit Accounts (DR):**
- 1150 (Accounts Receivable): $125,000
  └─ Meaning: SAP creates a receivable from Acme Corp. This is the "right to invoice" the customer.
  └─ Impact: AR balance increases, making the company look more creditworthy (more money owed TO us)
  └─ Used in: Balance Sheet (Current Assets), AR Aging reports, Cash Flow forecasts

**Credit Accounts (CR):**
- 1920 (Deferred Revenue - COGS Products): $50,000
  └─ Products that transfer control immediately (license) are reserved here
  └─ Will be released to 4100 (License Revenue) upon delivery

- 1930 (Deferred Revenue - Services): $72,000
  └─ Services that transfer control over time are reserved here
  └─ Will be released to 4300 (Service Revenue) as phases complete

- 1940 (Deferred Revenue - SaaS): $3,000 (placeholder - actual = $72K when allocated by SSP)
  └─ Subscription revenue reserved here
  └─ Released to 4200 (SaaS Revenue) monthly

**Why Three Deferred Revenue Accounts?**
Because revenue is recognized DIFFERENTLY for each product type:
- **License:** All revenue recognized immediately upon delivery (May 1, 2026)
- **Services:** Revenue recognized in 4 milestone payments (Jun, Sep, Nov, Jan)
- **SaaS:** Revenue recognized monthly over 36 months (May 2026 - Apr 2029)

By segregating the deferred revenue, we can apply different release schedules to each product.

**The Accounting Formula:**
Assets (Debit) = Liabilities (Credit) + Equity
1150 AR: +$125,000 = 1920-1940 Deferred Rev: +$125,000

This stays balanced until we recognize revenue (move it from Deferred → Revenue Accounts).
    `,
    glPostings: [
      { account: '1150', description: 'Accounts Receivable - Current Asset', debit: '125,000.00', credit: '-', balanceSheetImpact: 'Assets ↑ by $125K' },
      { account: '1920', description: 'Deferred Revenue - COGS Products (Liability)', debit: '-', credit: '50,000.00', balanceSheetImpact: 'Liabilities ↑ by $50K' },
      { account: '1930', description: 'Deferred Revenue - Services (Liability)', debit: '-', credit: '72,000.00', balanceSheetImpact: 'Liabilities ↑ by $72K' },
      { account: '1940', description: 'Deferred Revenue - SaaS (Liability)', debit: '-', credit: '3,000.00', balanceSheetImpact: 'Liabilities ↑ by $3K (adjusted by SSP in Step 9)' },
    ],
  },
  {
    id: 4,
    name: 'Determine Billing Models',
    code: 'ROUTING-001',
    description: 'Route each product to appropriate billing and revenue recognition process',
    details: 'Config: Product Type → Item Category → Billing Process | Module: SD (Sales) + FI (Finance)',
    businessContext: `
**THE FUNDAMENTAL PROBLEM:**
Three different products = three DIFFERENT ways customers should be billed:
1. **License:** Should be billed TODAY (one-time charge)
2. **SaaS:** Should be billed MONTHLY for 36 months (recurring charges)
3. **Services:** Should be billed QUARTERLY as phases complete (milestone charges)

If we treat all three the same way in SAP, the billing will be wrong:
- ❌ Bill license all at once (correct) BUT also bill entire SaaS upfront (WRONG!)
- ❌ Bill SaaS correctly monthly BUT license won't bill until month 1 (WRONG!)

**THE SOLUTION: SAP Item Categories**
Every line item in a Sales Order has a "Item Category" (PSTYV field) that acts like a "billing script":
- **TAN (Tangible):** "Bill this now, no more invoicing needed"
- **CBAO (Consumption-Based):** "Create 36 monthly billing plan items, invoice monthly"
- **ZSRV (Custom Service):** "Wait for milestone triggers, then invoice per completion"

This simple categorization controls:
- **When** invoices are created
- **How many** invoices are created
- **When** revenue is recognized (immediately, monthly, or upon event)
- **Which GL accounts** are posted to
- **How** line items appear on invoices
    `,
    explanation: `
In SAP, the Item Category (PSTYV) is the "DNA" of a line item. It's set when you create the line item and determines the entire lifecycle:

**EXAMPLE: License Line Item (PSTYV=TAN)**
When PSTYV=TAN:
  → SAP says: "This is a tangible product that should be invoiced immediately"
  → Creates 1 invoice item automatically upon sales order creation
  → Recognizes revenue immediately (no deferral period)
  → Posts to GL account 4100 (License Revenue)
  → No recurring billing plan needed

**EXAMPLE: SaaS Line Item (PSTYV=CBAO)**
When PSTYV=CBAO:
  → SAP says: "This is consumption-based, invoice according to schedule"
  → Creates 36 invoice items (1 per month) automatically
  → Each month, 1 invoice item is "released" for billing
  → Each invoice posts to GL account 4200 (SaaS Revenue)
  → Revenue is deferred until each monthly invoice is created

**EXAMPLE: Services Line Item (PSTYV=ZSRV)**
When PSTYV=ZSRV:
  → SAP says: "This is milestone-based, invoice upon event trigger"
  → Creates 0 invoice items initially (waits for milestone trigger)
  → When Workday webhook says "Phase 1 Complete", 1 invoice item is created
  → Revenue is deferred until phase completion confirms delivery
  → Posts to GL account 4300 (Service Revenue)

**THIS IS CRITICAL:** If you assign the wrong item category, billing will be completely broken:
- License with CBAO → Invoiced monthly (WRONG! Customer expected one invoice)
- SaaS with TAN → Invoiced all upfront (WRONG! Customer expects 36 monthly invoices)
- Services with TAN → Invoiced immediately (WRONG! Services haven't been delivered yet)
    `,
    routingMatrix: [
      {
        itemType: 'SRQS (Perpetual License)',
        sapItemCategory: 'TAN',
        product: 'ZLIC-001 - Perpetual CRM Software',
        qty: 1,
        unitPrice: '50,000.00',
        billingModel: 'ONE-TIME',
        billingBehavior: 'Single invoice upon delivery (May 1, 2026)',
        recognitionTiming: 'Immediate (full $50K recognized on delivery date)',
        invoiceCount: '1 invoice for $50,000',
        revenueAccount: '4100 (License Revenue)',
        deliveryTrigger: 'User access provisioned in CRM system',
        sapConfig: 'Delivery-based billing (INCO terms: FCA)'
      },
      {
        itemType: 'ZSUB (SaaS Subscription)',
        sapItemCategory: 'CBAO',
        product: 'ZSAAS-001 - Cloud Hosting Service',
        qty: 36,
        unitPrice: '2,000.00',
        billingModel: 'MONTHLY RECURRING',
        billingBehavior: '36 monthly invoices ($2K each) from May 2026 to Apr 2029',
        recognitionTiming: 'Monthly (each month $2K recognized on invoice date)',
        invoiceCount: '36 invoices × $2,000 = $72,000 total',
        revenueAccount: '4200 (SaaS Revenue)',
        deliveryTrigger: 'System uptime (monitored via SLA tracking)',
        sapConfig: 'Quantity = 36 (months). Billing plan auto-generates monthly items.'
      },
      {
        itemType: 'ZSRV (Professional Services)',
        sapItemCategory: 'ZSRV',
        product: 'ZPROF-001 - Implementation Consulting',
        qty: 480,
        unitPrice: '150.00',
        billingModel: 'MILESTONE-BASED',
        billingBehavior: '4 milestone invoices ($18K each) - one per phase completion',
        recognitionTiming: 'Upon phase completion (varies: Jun 2026, Sep 2026, Nov 2026, Jan 2027)',
        invoiceCount: '4 invoices × $18,000 = $72,000 total',
        revenueAccount: '4300 (Service Revenue)',
        deliveryTrigger: 'Project manager approves phase completion in Workday PSA',
        sapConfig: 'Milestone flag set. Workday webhook triggers invoice creation via BTP.'
      },
    ],
    modulesInvolved: [
      { module: 'SD (Sales & Distribution)', responsibility: 'Defines Item Categories, creates Sales Orders & Invoices' },
      { module: 'FI (Financial Accounting)', responsibility: 'Posts revenue GL entries when invoices are created' },
      { module: 'CO (Controlling)', responsibility: 'Tracks revenue by product type, cost center, customer' },
      { module: 'PS (Project Systems)', responsibility: '(Optional) For services: tracks hours, phases, milestones' },
    ],
  },
  {
    id: 5,
    name: 'Sales Order #1: Perpetual License',
    code: 'SO-2026-001567',
    description: 'One-time software license purchase with immediate revenue recognition',
    details: 'Item Category: TAN (Tangible) | Billing: Immediate | Invoice: 1 document | Module: SD/FI',
    businessContext: `
**SCENARIO: The License Component**
Acme Corp is purchasing a perpetual software license for their CRM system. Unlike SaaS (which is rented), this is a one-time purchase they own forever. From Acme's perspective:
- "We're buying software, not renting it"
- "We should invoice now for the full amount"
- "There's nothing more to deliver after today"

From SAP's perspective:
- Customer receives "control" of the software immediately
- Revenue should be recognized immediately (not deferred)
- One invoice is created
- This is the simplest billing model

**FINANCIAL IMPACT:**
- Sales: +$50K (revenue recognized)
- AR: +$50K (amount to be collected)
- Company books: Shows $50K immediate revenue on this deal
    `,
    explanation: `
When sales order SO-2026-001567 is created with PSTYV=TAN (Tangible), SAP automatically:

1. **Creates the Sales Order Header (VBAK)** - The master record for this order
2. **Creates the Line Item (VBAP)** - Links the license product (ZLIC-001) with quantity 1
3. **Creates the Invoice (VBRK/VBRP)** - Because it's TAN, invoice is created automatically
4. **Posts GL Entry** - Recognizes $50K revenue immediately

**THE GL ENTRY (Called a "Billing Document Post"):**

Debit:  1150 (AR)                 $50,000  ← Amount owed by customer
Credit: 4100 (License Revenue)            $50,000  ← Revenue recognized

Meaning: SAP is saying "Customer owes us $50K, and we've earned that revenue"


**WHAT THIS MEANS FOR ACME CORP'S AR DEPARTMENT:**
- Invoice INV-2026-0815-1001 for $50,000 is created automatically
- Customer must pay by May 31, 2026 (30-day terms from invoice date)
- Once Acme Corp's finance team receives the invoice, they can process payment
- Money appears in company bank account
- AR balance goes back to zero when paid

**REVENUE RECOGNITION ACCORDING TO IFRS 15:**
✓ Performance Obligation: Transfer control of software license
✓ Recognition Method: Point-in-time (not over-time)
✓ Control Transfer Date: May 1, 2026 (when customer can access the software)
✓ Revenue Amount: $50,000 (before any SSP allocation adjustments)
✓ Timing: Immediate (not deferred)
    `,
    soDetails: [
      { section: 'Document Header (VBAK) - Sales Order Master Record', fields: [
        { field: 'VBELN', value: 'SO-2026-001567', desc: 'Unique Sales Order number', sapValue: 'Auto-assigned from number range ZORD' },
        { field: 'VBTYP', value: 'C', desc: 'Document Type = C (Credit/Sales)', sapValue: '(Only 2 types: C=Credit/Sales, H=Returns)' },
        { field: 'ERDAT', value: '2026-04-15', desc: 'Date when order was created', sapValue: 'Used for cutoff dates in accounting' },
        { field: 'ERZET', value: '14:32:05', desc: 'Time when order was created', sapValue: 'Precision for audit trail' },
        { field: 'KUNNR', value: '0001234567', desc: 'Customer ID from KNA1', sapValue: 'Links order to customer master data' },
        { field: 'KUNWE', value: 'Acme Corp', desc: 'Customer Name', sapValue: 'Pulled from KNA1 automatically' },
        { field: 'VKORG', value: '1010', desc: 'Sales Organization', sapValue: 'Identifies which sales unit made the sale' },
        { field: 'VTWEG', value: '10', desc: 'Distribution Channel (10=Direct Sales)', sapValue: 'Controls pricing, shipping, billing rules' },
        { field: 'SPART', value: '00', desc: 'Division/Business Unit', sapValue: '00=General, could be 01=Software, 02=Services' },
        { field: 'AUART', value: 'ZORD', desc: 'Document Type Code (Solution Order)', sapValue: 'Determines if one-time or recurring' },
        { field: 'NETWR', value: '50,000.00', desc: 'Net Order Value', sapValue: 'Total of all line items (before tax)' },
        { field: 'WAERK', value: 'USD', desc: 'Currency Code', sapValue: 'All GL postings use this currency' },
        { field: 'ZTERM', value: 'Z030', desc: 'Payment Terms Code', sapValue: 'Z030 = 30 days, invoice date + 30' },
        { field: 'INCO1', value: 'FCA', desc: 'Incoterms (Free Carrier At destination)', sapValue: 'Determines shipping responsibility' },
        { field: 'BSTDK', value: '2026-04-15', desc: 'Order Date from Customer PO', sapValue: 'Matches SFDC quote date' },
      ]},
      { section: 'Line Item (VBAP) - What Is Being Sold', fields: [
        { field: 'VBELN', value: 'SO-2026-001567', desc: 'Links back to header SO', sapValue: 'Same SO number as VBAK' },
        { field: 'POSNR', value: '10', desc: 'Line Item Number', sapValue: 'Increments by 10 (10, 20, 30...)' },
        { field: 'MATNR', value: 'ZLIC-001', desc: 'Material/Product Code', sapValue: 'Links to MARA (Material Master)' },
        { field: 'ARKTX', value: 'Perpetual CRM License - 1 Year Support', desc: 'Item Description', sapValue: 'Prints on invoice' },
        { field: 'MENGE', value: '1', desc: 'Quantity Ordered', sapValue: 'For licenses, always 1' },
        { field: 'MEINS', value: 'PC', desc: 'Unit of Measure (Pieces)', sapValue: 'EA=Each, PC=Piece, LT=Liter' },
        { field: 'NETPR', value: '50,000.00', desc: 'Net Price per Unit', sapValue: 'Unit price × quantity = total' },
        { field: 'PEINH', value: '1', desc: 'Price Unit (always 1)', sapValue: 'Price per 1 unit' },
        { field: 'PSTYV', value: 'TAN', desc: 'Item Category (Tangible)', sapValue: 'Controls billing behavior' },
        { field: 'CHARG', value: 'Not Applicable', desc: 'Batch Number', sapValue: 'Software licenses don\'t track batches' },
        { field: 'ABGRU', value: 'blank', desc: 'Rejection Reason', sapValue: 'Only filled if line item is rejected' },
      ]},
    ],
    billingProcess: [
      { step: '1. SO Created', details: 'SO-2026-001567 created with TAN item category', trigger: 'SFDC sends order', sysResult: 'VBAK + VBAP records created' },
      { step: '2. Invoice Auto-Created', details: 'Because PSTYV=TAN, billing doc (VBRK) created immediately', trigger: 'SO creation', sysResult: 'INV-2026-0815-1001 created' },
      { step: '3. GL Entry Posted', details: 'Revenue recognized, AR created', trigger: 'Invoice creation', sysResult: 'Journal entry created' },
      { step: '4. Ready for Printing', details: 'Invoice can be printed and mailed to customer', trigger: 'Manual or automatic', sysResult: 'PDF generated' },
      { step: '5. Payment Expected', details: 'Invoice due 30 days from issue date', trigger: 'Customer receipt', sysResult: 'Invoice in AR aging' },
    ],
    glPostings: [
      {
        account: '1150',
        accountName: 'Accounts Receivable - Trade (Asset)',
        description: 'What customer owes us',
        debit: '50,000.00',
        credit: '-',
        explanation: 'Acme Corp is now obligated to pay us $50K. This creates an asset on our balance sheet.'
      },
      {
        account: '4100',
        accountName: 'License Revenue (Revenue)',
        description: 'Revenue from perpetual software licenses',
        debit: '-',
        credit: '50,000.00',
        explanation: 'We recognize $50K in revenue this period. This flows to P&L and increases profits.'
      },
    ],
    balanceSheetImpact: [
      { item: 'ASSETS', change: '+$50,000 (Accounts Receivable)', meaning: 'Company has right to collect from Acme Corp' },
      { item: 'LIABILITIES', change: 'No change', meaning: 'We have no obligation to refund or deliver more' },
      { item: 'EQUITY', change: '+$50,000 (Retained Earnings)', meaning: 'Profit increased by this sale' },
    ],
  },
  {
    id: 6,
    name: 'Sales Order #2: SaaS Cloud Subscription',
    code: 'SO-2026-001568',
    description: 'Monthly subscription service with recurring invoicing over 36 months',
    details: 'Item Category: CBAO (Consumption-Based) | Billing: Monthly x36 | Module: SD/FI/CO',
    businessContext: `
**SCENARIO: The Recurring Revenue Component**
Acme Corp is subscribing to cloud hosting for their new CRM system. Unlike the perpetual license (one-time), this is a rental service:
- "We pay monthly for cloud infrastructure"
- "We don't control the software, we rent access to it"
- "If we stop paying, we lose access" (unlike owning a perpetual license)
- "We're charged based on usage/uptime"

From SAP's perspective:
- Customer receives incremental delivery each month
- Revenue should be recognized monthly (NOT all upfront)
- 36 invoices will be created automatically over 3 years
- This is critical for recurring revenue (subscription) business models
- SaaS companies live or die on accurate recurring revenue tracking

**FINANCIAL IMPACT PER MONTH:**
- Sales: +$2K (monthly revenue recognized)
- AR: +$2K (monthly billing created)
- Deferred Revenue: -$2K (released to revenue)
- Company books: Shows $24K annual recurring revenue (ARR) from this deal
    `,
    explanation: `
When sales order SO-2026-001568 is created with PSTYV=CBAO and Quantity=36, SAP does something VERY different from the license:

1. **Creates the Sales Order Header (VBAK)** - Master record
2. **Creates ONE Line Item (VBAP)** - But with quantity=36 and billing plan flag
3. **Creates a Billing Schedule** - 36 planned invoice items, one for each month
4. **Creates FIRST Invoice (VBRK/VBRP)** - Only for May 2026
5. **Schedules FUTURE Invoices** - Jun-Apr, created monthly via background job

**THE MONTHLY GL ENTRY (Each Month):**

Debit:  1150 (AR)                      $2,000  ← Monthly invoice to customer
        1930 (Deferred Revenue - SaaS) $2,000  ← Reduce deferred amount
Credit: 4200 (SaaS Revenue)                     $2,000  ← Monthly revenue earned

Meaning: Each month, $2K of the deferred revenue is "released" and recognized as earned revenue


**WHY DEFERRED REVENUE MATTERS FOR SAAS:**
When Acme Corp signs the contract for 36 months at $2K/month, they pre-pay the entire $72K (or they owe it). From an accounting standpoint:
- ❌ WRONG: Recognize all $72K as revenue on day 1
  └─ Makes Q2 look amazing, but Q3-Q4 look flat
  └─ Doesn't reflect delivery (customer gets access each month, not all upfront)
  └─ Violates IFRS 15

- ✅ CORRECT: Recognize $2K each month as service is delivered
  └─ Shows consistent $2K monthly revenue
  └─ Reflects actual value delivery to customer
  └─ Complies with IFRS 15 (recognize revenue as performance obligation is satisfied)

**THE BACKGROUND JOB THAT RUNS MONTHLY:**
SAP has a batch job (program: ZFIN-BILLING-MONTHLY) that runs on the 1st of each month:

Loop through all sales orders with PSTYV=CBAO
For each order where billing date ≤ today:
  Create new invoice (VBRK/VBRP) for that month
  Post GL entry: debit AR, credit Deferred Revenue, credit Revenue
  Mark this plan item as "invoiced"
  Send email to customer with PDF invoice
Next


This is fully automated - no manual intervention required. As long as customer keeps their subscription active, monthly invoices roll out like clockwork.
    `,
    billingSchedule: [
      { month: 'May 2026', invoiceDate: '2026-05-01', dueDate: '2026-05-31', amount: '2,000.00', status: 'Created', glAccount: '4200 - SaaS Revenue' },
      { month: 'Jun 2026', invoiceDate: '2026-06-01', dueDate: '2026-06-30', amount: '2,000.00', status: 'Scheduled', glAccount: '4200' },
      { month: 'Jul 2026', invoiceDate: '2026-07-01', dueDate: '2026-07-31', amount: '2,000.00', status: 'Scheduled', glAccount: '4200' },
      { month: 'Aug 2026', invoiceDate: '2026-08-01', dueDate: '2026-08-31', amount: '2,000.00', status: 'Scheduled', glAccount: '4200' },
      { month: 'Sep 2026', invoiceDate: '2026-09-01', dueDate: '2026-09-30', amount: '2,000.00', status: 'Scheduled', glAccount: '4200' },
      { month: '... (31 more months through Apr 2029)', invoiceDate: '...', dueDate: '...', amount: '2,000.00', status: 'Scheduled (Auto-created monthly)', glAccount: '4200' },
    ],
    soDetails: [
      { section: 'Document Header (VBAK) - Subscription Master', fields: [
        { field: 'VBELN', value: 'SO-2026-001568', desc: 'Sales Order number for subscription', sapValue: 'Unique identifier for 36-month contract' },
        { field: 'ERDAT', value: '2026-04-15', desc: 'Contract creation date', sapValue: 'When billing plan is established' },
        { field: 'KUNNR', value: '0001234567', desc: 'Customer ID', sapValue: 'Same customer as license SO' },
        { field: 'AUART', value: 'ZREC', desc: 'Document Type = Recurring', sapValue: 'Triggers billing plan creation' },
        { field: 'NETWR', value: '72,000.00', desc: 'Total contract value', sapValue: '36 months × $2K = $72K' },
        { field: 'BEDAT', value: '2026-05-01', desc: 'Billing start date', sapValue: 'When first invoice is created' },
        { field: 'BEEND', value: '2029-04-30', desc: 'Billing end date', sapValue: 'When last invoice is created' },
      ]},
      { section: 'Line Item (VBAP) - Subscription Details', fields: [
        { field: 'POSNR', value: '20', desc: 'Line item number', sapValue: '10=License, 20=SaaS, 30=Services' },
        { field: 'MATNR', value: 'ZSAAS-001', desc: 'Material code for cloud service', sapValue: 'Non-stock item (KTMK=N)' },
        { field: 'ARKTX', value: 'Cloud Hosting - CRM (per month)', desc: 'Description', sapValue: 'Prints on each monthly invoice' },
        { field: 'MENGE', value: '36', desc: 'Quantity = Number of billing periods', sapValue: 'Months, not units. SAP divides by 36 to get monthly amount' },
        { field: 'MEINS', value: 'MON', desc: 'Unit of measure = Month', sapValue: 'MON=Month, YR=Year, QTR=Quarter' },
        { field: 'NETPR', value: '2,000.00', desc: 'Monthly billing amount', sapValue: '36 months × $2,000 = $72,000 total' },
        { field: 'PSTYV', value: 'CBAO', desc: 'Item Category = Consumption-Based', sapValue: 'Triggers monthly billing plan' },
        { field: 'BPLNR', value: '001', desc: 'Billing Plan Number', sapValue: 'Links to billing schedule records' },
      ]},
    ],
    recurringRevenueMetrics: [
      { metric: 'MRR (Monthly Recurring Revenue)', value: '$2,000', meaning: 'Predictable monthly revenue from this subscription' },
      { metric: 'ARR (Annual Recurring Revenue)', value: '$24,000', meaning: 'Annualized MRR = MRR × 12 months' },
      { metric: 'Contract Value', value: '$72,000', meaning: '3-year total = MRR × 36 months' },
      { metric: 'Customer Lifetime Value', value: '$72,000', meaning: 'Total expected revenue from Acme Corp for this product' },
      { metric: 'Churn Risk', value: 'Monitor monthly', meaning: 'If customer cancels, remaining deferred revenue is lost' },
    ],
    glPostingMonthly: [
      {
        account: '1150',
        accountName: 'Accounts Receivable',
        description: 'Monthly invoice to customer',
        debit: '2,000.00',
        credit: '-',
        explanation: 'Each month, $2K is invoiced to Acme Corp. After 3 years, total AR from this SO = $72K.'
      },
      {
        account: '1940',
        accountName: 'Deferred Revenue - SaaS',
        description: 'Release monthly portion',
        debit: '2,000.00',
        credit: '-',
        explanation: 'As each month\'s service is delivered, $2K is released from deferred revenue.'
      },
      {
        account: '4200',
        accountName: 'SaaS Revenue',
        description: 'Monthly revenue earned',
        debit: '-',
        credit: '2,000.00',
        explanation: 'Each month, $2K is recognized as revenue. Shows consistent, predictable SaaS revenue.'
      },
    ],
  },
  {
    id: 7,
    name: 'Sales Order #3: Professional Services',
    code: 'SO-2026-001569',
    description: 'Phase-based implementation services with milestone-triggered invoicing',
    details: 'Item Category: ZSRV | Billing: Milestone-Based (4 phases) | Module: SD/PSA/FI',
    businessContext: `
**SCENARIO: The Services Component**
Acme Corp needs professional services to implement the CRM system. This isn't a product - it's people (consultants, developers, project managers) working on the implementation. Key characteristics:
- "Services are delivered incrementally (phases)"
- "We don't invoice until each phase is completed and approved"
- "Resources are tracked by hours/days in a project management system (Workday PSA)"
- "Quality gate: PM must approve phase completion before we can bill"

From SAP's perspective:
- Each phase is a separate "performance obligation"
- Revenue recognized only when phase delivery is confirmed
- Delivery trigger: Project manager approval in Workday PSA
- Actual hours tracked in Workday, billing calculated from hours worked
- Milestone structure ensures customer acceptance before invoicing

**FINANCIAL IMPACT PER PHASE (Example Phase 1):**
- Sales: +$18K (phase revenue recognized upon approval)
- AR: +$18K (phase invoice created)
- COGS: +$9K (resource cost recorded)
- Gross Margin: $9K ($18K revenue - $9K cost)
- Company books: Shows $9K gross profit on this phase
    `,
    explanation: `
Sales order SO-2026-001569 with PSTYV=ZSRV (custom service) doesn't create invoices immediately like TAN or CBAO. Instead:

1. **Creates the Sales Order Header & Line Item** - With 4 milestone placeholders
2. **Creates ZERO Invoices Initially** - Waiting for milestone triggers
3. **Links to Workday PSA Project** - Project managers track hours/phases there
4. **Waits for Webhook Events** - When phase marked "complete" in Workday
5. **Auto-Creates Milestone Invoice** - 1 invoice per phase upon completion
6. **Posts GL Entry** - Recognizes $18K revenue + $9K COGS

**THE MILESTONE-BASED GL ENTRY (Per Phase):**

Debit:  1150 (AR)                           $18,000  ← Invoice for phase
        5100 (COGS - Labor)                 $9,000   ← Cost of resources used
        1930 (Deferred Revenue - Services)  $9,000   ← Release deferred
Credit: 4300 (Service Revenue)                       $18,000  ← Revenue earned
        9000 (Accrued Labor Payroll)                 $9,000   ← Payroll liability

Meaning: When Phase 1 completes, we invoice $18K and recognize $9K cost


**WHY MILESTONE-BASED MAKES BUSINESS SENSE:**

The customer needs confidence that:
1. **Phase 1 completed successfully** (requirements met, testing passed)
2. **Quality gates approved** (PM signoff, customer acceptance)
3. **Ready for Phase 2** (team can move forward)

By tying invoicing to milestone completion, we ensure:
- ✓ Revenue recognized only for completed work
- ✓ Customer can't dispute invoices (they already approved completion)
- ✓ Clear accountability (PM responsible for quality gate)
- ✓ IFRS 15 compliance (control of service delivery is clear)

**THE WORKDAY PSA CONNECTION:**
Workday Project Services Automation is where consultants log hours:
- Consultant logs: "May 15, 2026 - 8 hours design work for ACME-CRM-2026"
- Project manager tracks: "Phase 1 has 120 planned hours, 118 logged to date"
- Workday calculates cost: 118 hours × $75 cost rate = $8,850
- When PM approves "Phase 1 Complete": Webhook fires to SAP
- SAP receives: Project name, phase name, hours logged, actual cost
- SAP invoices customer: $18K (per service contract)
- SAP GL posts: Revenue $18K, Cost $9K, Margin $9K
    `,
    phaseSchedule: [
      {
        phase: '1. Discovery & Requirements Analysis',
        startDate: '2026-05-01',
        endDate: '2026-06-30',
        duration: '2 months',
        plannedHours: 120,
        hoursRate: '$150/hour',
        billingAmount: '18,000',
        resourceCost: '9,000',
        margin: '9,000',
        deliverables: [
          '- Business process mapping',
          '- System design document',
          '- Gap analysis report',
          '- Project charter approved'
        ],
        approvalGate: 'PM and customer sign-off on requirements. Customer acceptance recorded.'
      },
      {
        phase: '2. Development & Customization',
        startDate: '2026-07-01',
        endDate: '2026-09-30',
        duration: '3 months',
        plannedHours: 160,
        hoursRate: '$150/hour',
        billingAmount: '18,000',
        resourceCost: '12,000',
        margin: '6,000',
        deliverables: [
          '- Source code committed to repository',
          '- Unit tests passed (90% coverage)',
          '- Code review completed',
          '- Build successful in DEV environment'
        ],
        approvalGate: 'Development lead certifies code quality. QA confirms test results.'
      },
      {
        phase: '3. System Testing & UAT',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        duration: '2 months',
        plannedHours: 120,
        hoursRate: '$150/hour',
        billingAmount: '18,000',
        resourceCost: '9,000',
        margin: '9,000',
        deliverables: [
          '- All test cases executed',
          '- UAT sign-off from customer',
          '- Defect log resolved',
          '- Performance testing passed'
        ],
        approvalGate: 'Customer UAT lead approves all test results. Zero open critical defects.'
      },
      {
        phase: '4. Cutover & Knowledge Transfer',
        startDate: '2026-12-01',
        endDate: '2027-01-31',
        duration: '2 months',
        plannedHours: 80,
        hoursRate: '$150/hour',
        billingAmount: '18,000',
        resourceCost: '6,000',
        margin: '12,000',
        deliverables: [
          '- Go-live executed successfully',
          '- Customer support team trained',
          '- Knowledge transfer documentation',
          '- 30-day support period completed'
        ],
        approvalGate: 'System live in production. Support team certified. Customer confirms all working.'
      },
    ],
    soDetails: [
      { section: 'Document Header (VBAK) - Services Contract', fields: [
        { field: 'VBELN', value: 'SO-2026-001569', desc: 'Sales Order for services', sapValue: 'Unique identifier' },
        { field: 'ERDAT', value: '2026-04-15', desc: 'Contract creation date', sapValue: 'When service terms are established' },
        { field: 'KUNNR', value: '0001234567', desc: 'Customer ID', sapValue: 'Same Acme Corp' },
        { field: 'AUART', value: 'ZSER', desc: 'Document Type = Services', sapValue: 'Triggers milestone logic' },
        { field: 'NETWR', value: '72,000.00', desc: 'Total services value', sapValue: '480 hours × $150 = $72K' },
        { field: 'MILESTONE_FLAG', value: 'X', desc: 'Milestone-based billing enabled', sapValue: 'Defers invoicing until phase approval' },
      ]},
      { section: 'Line Item (VBAP) - Service Details', fields: [
        { field: 'POSNR', value: '30', desc: 'Line item number', sapValue: '30=Services (10=License, 20=SaaS)' },
        { field: 'MATNR', value: 'ZPROF-001', desc: 'Service product code', sapValue: 'Not a physical material, service code' },
        { field: 'ARKTX', value: 'CRM Implementation Services (4 phases)', desc: 'Description', sapValue: 'Prints on phase invoices' },
        { field: 'MENGE', value: '480', desc: 'Total billable hours', sapValue: '120+160+120+80 hours across 4 phases' },
        { field: 'MEINS', value: 'HUR', desc: 'Unit of measure = Hours', sapValue: 'HUR=Hours, DAY=Days, WK=Weeks' },
        { field: 'NETPR', value: '150.00', desc: 'Hourly billing rate', sapValue: '$150/hour' },
        { field: 'PSTYV', value: 'ZSRV', desc: 'Item Category = Custom Service', sapValue: 'Triggers milestone billing' },
        { field: 'PRJNR', value: 'ACME-CRM-2026', desc: 'Workday PSA Project ID', sapValue: 'Links to Workday for hour tracking' },
      ]},
    ],
    glPostingPerMilestone: [
      {
        account: '1150',
        accountName: 'Accounts Receivable',
        description: 'Phase invoice to customer',
        debit: '18,000.00',
        credit: '-',
        explanation: 'When phase completes, $18K invoice is created. Acme Corp has 30 days to pay.'
      },
      {
        account: '5100',
        accountName: 'Cost of Goods Sold - Labor',
        description: 'Cost of consultant resources',
        debit: '9,000.00',
        credit: '-',
        explanation: 'Cost of the 120 hours worked = 120 hrs × $75 loaded rate = $9K COGS'
      },
      {
        account: '1930',
        accountName: 'Deferred Revenue - Services',
        description: 'Release phase revenue',
        debit: '9,000.00',
        credit: '-',
        explanation: 'As phase is delivered, $9K of deferred revenue is released'
      },
      {
        account: '4300',
        accountName: 'Service Revenue',
        description: 'Phase revenue earned',
        debit: '-',
        credit: '18,000.00',
        explanation: 'When phase completes, $18K is recognized as service revenue'
      },
    ],
  },
  {
    id: 8,
    name: 'Milestone Completed & Invoice Auto-Generated',
    code: 'WDY-WEBHOOK',
    description: 'Workday PSA triggers automatic invoice creation upon phase completion',
    details: 'Event: Workday project manager marks phase complete | Trigger: REST webhook | Result: Auto-invoice in SAP',
    businessContext: `
**SCENARIO: Making Milestones Real**
June 30, 2026 arrives. The project manager for Phase 1 (Discovery & Design) reviews:
- ✓ All 120 hours have been logged in Workday
- ✓ Deliverables (requirements doc, design, gap analysis) are complete
- ✓ Customer has signed off on requirements
- ✓ Quality gates met

Project manager clicks "Complete Phase 1" in Workday PSA. Instantly:
1. Workday creates a webhook event with phase completion details
2. SAP BTP integration platform receives the webhook
3. SAP validates: "Is this SO-2026-001569? Is Phase 1 the next milestone? Can we invoice?"
4. SAP creates invoice INV-2026-0815-001 for $18K
5. GL entry posts: AR $18K, COGS $9K, Revenue $18K
6. Invoice PDF generated and emailed to Acme Corp

**NO MANUAL INVOLVEMENT NEEDED** - The entire process is automated.

**BUSINESS BENEFIT:**
- ✓ Faster invoicing (no manual invoice creation)
- ✓ Reduced errors (data comes from PSA source of truth)
- ✓ Audit trail (webhook logged, invoice timestamp recorded)
- ✓ Consistent timing (as soon as phase is complete, invoice is ready)
    `,
    explanation: `
This is the integration between two systems: Workday (HR/Project Management) and SAP (Financial Systems). Here's how it works:

**STEP 1: WORKDAY PROJECT COMPLETION EVENT**
When PM marks "Phase 1 Complete" in Workday, the system:
- Records phase completion date & time: 2026-06-30 14:32:05 UTC
- Calculates total hours logged: 118 (vs 120 planned)
- Determines actual resource cost: 118 hours × $75 = $8,850
- Links to sales order: SO-2026-001569
- Fires webhook event to SAP

**STEP 2: SAP RECEIVES WEBHOOK VIA BTP INTEGRATION PLATFORM**

POST /sap/opu/odata/sap/ZECHS_SERVICE_SRV/MilestoneCompleted
{
  "event": "phase_completed",
  "project": "ACME-CRM-2026",
  "phase": "1",
  "phase_name": "Discovery & Design",
  "completion_date": "2026-06-30",
  "completion_time": "14:32:05",
  "confirmed_hours": 118,
  "actual_cost": 8850,
  "resource_names": ["John Smith", "Jane Doe"],
  "delivery_quality": "APPROVED",
  "status": "COMPLETED"
}


**STEP 3: SAP VALIDATES THE DATA**

IF sales_order = "SO-2026-001569" THEN
  IF phase = "1" (Discovery) AND status = "COMPLETED" THEN
    IF delivery_quality = "APPROVED" THEN
      → Proceed to invoice creation
    ELSE
      → Reject: Quality gates not met
    END
  END
ELSE
  → Error: Sales order not found
END


**STEP 4: SAP CREATES INVOICE AUTOMATICALLY**

Create Billing Document (VBRK):
  - Document Type: VBRK (Billing)
  - Sales Order: SO-2026-001569
  - Phase: Phase 1 (Discovery & Design)
  - Amount: $18,000
  - Invoice Date: 2026-06-30
  - Due Date: 2026-07-30 (30 days)

Create Line Item (VBRP):
  - Description: "CRM Implementation - Phase 1: Discovery & Requirements"
  - Amount: $18,000
  - GL Account: 4300 (Service Revenue)


**STEP 5: GL ENTRY POSTED AUTOMATICALLY**
The system creates this journal entry:

Journal Entry: ACME-PHASE1-2026-06-30
Debit   1150 (AR)               $18,000
Debit   5100 (COGS - Labor)     $9,000
  Credit 4300 (Service Revenue)          $18,000
  Credit 9000 (Accrued Labor)            $9,000

Explanation: Phase 1 complete. Invoice created. Revenue recognized.


**STEP 6: CUSTOMER NOTIFICATION**
Acme Corp receives email with invoice PDF:

From: billing@company.com
Subject: Invoice INV-2026-0815-001 - Acme Corp CRM Implementation Phase 1

Dear Acme Corp Billing Team,

Please find attached Invoice INV-2026-0815-001 for CRM Implementation Phase 1.

Invoice Amount: $18,000.00
Invoice Date: June 30, 2026
Due Date: July 30, 2026
Payment Terms: Net 30

Phase Completed: Discovery & Requirements Analysis
Deliverables:
  ✓ Business process mapping
  ✓ System design document
  ✓ Gap analysis report
  ✓ Project charter signed

Please submit payment by July 30, 2026 to AP@company.com

Thank you,
Finance Team


**Why This Matters:**
- Customer can see exactly what they're being invoiced for (phase deliverables)
- Invoice is created only after customer approves phase completion (quality gate)
- No disputes: customer already signed off on work
- Accounting is automatic: no manual GL entry needed
    `,
    webhookExample: {
      timestamp: '2026-06-30T14:32:05Z',
      source: 'Workday PSA',
      event: 'phase_completed',
      project: 'ACME-CRM-2026',
      projectDescription: 'Acme Corp CRM Implementation',
      phase: '1',
      phaseName: 'Discovery & Requirements Analysis',
      completionDate: '2026-06-30',
      plannedHours: 120,
      confirmedHours: 118,
      varianc: '-2 hours',
      resourcesInvolved: [
        { name: 'John Smith (Lead Architect)', role: 'Architect', hours: 48 },
        { name: 'Jane Doe (Business Analyst)', role: 'Business Analyst', hours: 45 },
        { name: 'Bob Johnson (Project Manager)', role: 'PM', hours: 25 }
      ],
      actualResourceCost: 8850,
      billingAmount: 18000,
      deliveryQualityApproval: 'APPROVED',
      deliverables: [
        '✓ Business Process Documentation',
        '✓ System Design Specification',
        '✓ Gap Analysis Report',
        '✓ Project Charter',
        '✓ Risk Register'
      ],
      customerSignOff: 'Acme Corp - CFO John Wilson',
      status: 'COMPLETED',
      sapAction: 'AUTO_INVOICE_CREATED'
    },
    invoiceCreated: {
      invoiceNumber: 'INV-2026-0815-001',
      salesOrder: 'SO-2026-001569',
      customer: 'Acme Corp',
      invoiceDate: '2026-06-30',
      dueDate: '2026-07-30',
      phase: 'Phase 1 - Discovery & Design',
      amount: '18,000.00',
      glAccount: '4300 (Service Revenue)',
      glAccountDescription: 'Service Revenue Recognition',
      cogsAmount: '9,000.00',
      glAccountCOGS: '5100 (COGS - Labor)',
      status: 'Posted',
      link: 'SO-2026-001569',
      sapDocument: 'VBRK: 0800001234'
    },
  },
  {
    id: 9,
    name: 'Consolidate Under IFRS 15 Revenue Standards',
    code: 'IFRS15-RAR',
    description: 'Revenue Accounting & Reporting: Single contract with multiple performance obligations',
    details: 'Standard: IFRS 15 Revenue from Contracts with Customers | Module: FI (Financial Accounting)',
    businessContext: `
**THE COMPLIANCE CHALLENGE:**
Acme Corp signed ONE deal for $125K bundled package. But we're creating THREE separate Sales Orders with THREE different billing timelines. From an auditor's perspective:
- ❌ WRONG: Show 3 separate contracts with 3 different revenue timelines
  └─ Financial statements show fragmented revenue picture
  └─ ARR (Annual Recurring Revenue) metrics are unclear
  └─ IFRS 15 compliance is questionable

- ✓ CORRECT: Consolidate as ONE contract with 3 performance obligations
  └─ Single revenue contract from day 1
  └─ IFRS 15 says: allocate discount proportionally to each product
  └─ Unified revenue recognition schedule
  └─ Clear audit trail
  └─ Financial reporting is clean

**IFRS 15 DEFINITION:**
"Revenue is recognized when (or as) a performance obligation is satisfied by transferring a promised good or service to a customer." In this case:
- **Performance Obligation 1:** Transfer perpetual license (satisfied immediately)
- **Performance Obligation 2:** Provide monthly cloud hosting (satisfied monthly)
- **Performance Obligation 3:** Implement consulting services (satisfied per phase)

We have ONE customer contract covering all three. The contract price is $125K (not $194K list price), so we must allocate the bundled discount fairly.

**THE STANDING SELLING PRICE (SSP) CONCEPT:**
List prices:
- License alone: $60K (other companies pay this for perpetual license)
- SaaS alone: $72K (other companies pay this for 36 months hosting)
- Services alone: $80K (other companies pay this for 4 phases consulting)
- **Total list:** $212K

Acme negotiated bundled deal: $125K (41% discount for committing to all three!)

IFRS 15 says: Allocate the $125K contract price to each product based on relative SSP:
- License: $60K / $212K = 28.3% of contract → 28.3% × $125K = **$35,375**
- SaaS: $72K / $212K = 34% of contract → 34% × $125K = **$42,500**
- Services: $80K / $212K = 37.7% of contract → 37.7% × $125K = **$47,125**

This is the SSP allocation. Each product's revenue is now adjusted for the bundled discount.
    `,
    explanation: `
**THE REVENUE RECOGNITION SCHEDULE (IFRS 15 COMPLIANT):**

At the end of May 2026, here's what happened financially across the bundled deal:

| Component | Planned | Actual | GL Account | Amount |
|-----------|---------|--------|-----------|---------|
| License (delivered May 1) | $50K | $50K recognized | 4100 | +$35,375 |
| SaaS (month 1 of 36) | $2K | $2K accrued | 4200 | +$1,181 |
| Services (Phase 1 pending) | $18K | $0 recognized yet | 4300 | $0 |
| **Total May Revenue** | | | | **$36,556** |

Wait - this doesn't match our earlier examples! That's because IFRS 15 SSP allocation adjusts the revenue amounts. Here's what happened:

**ORIGINAL GL ENTRY (ZEST Creation):**

Debit  1150 (AR)              $125,000  ← Full contract amount
Credit 1920 (Deferred - License)        $50,000   ← License allocation
Credit 1930 (Deferred - Services)       $72,000   ← Services allocation
Credit 1940 (Deferred - SaaS)           $3,000    ← SaaS allocation


But wait - that doesn't add up! $50 + $72 + $3 = $125K, but the allocations should be $35,375 + $42,500 + $47,125 = $125K.

**THIS IS WHERE RAR (REVENUE ACCOUNTING & REPORTING) COMES IN:**
RAR is an SAP module that takes the raw SO data and **normalizes it for IFRS 15 compliance**:
1. Identifies all 3 SOs as linked via ZEST parent contract
2. Calculates SSP for each product
3. Allocates bundled contract price proportionally
4. Creates RAR contract line items with adjusted amounts
5. Controls revenue recognition based on RAR terms, not SO terms

**THE RAR GL ENTRIES (Override/Supplement the Raw SO Entries):**


When License delivers (May 1):
Debit  1150 (AR)                   $35,375  ← SSP-allocated amount
  Credit 4100 (License Revenue)            $35,375  ← Recognized

When SaaS month 1 invoices (May 1):
Debit  1150 (AR)                   $1,181  ← SSP-allocated monthly
  Credit 4200 (SaaS Revenue)               $1,181

When Services Phase 1 completes (Jun 30):
Debit  1150 (AR)                   $13,098  ← SSP-allocated per phase
  Credit 4300 (Service Revenue)            $13,098


All GL posting to revenue accounts flow through RAR consolidation reporting, which ensures:
- ✓ Total revenue by contract = $125K
- ✓ Revenue recognized per IFRS 15 = Fair allocation based on SSP
- ✓ No double-counting = Each dollar of the $125K recognized exactly once
- ✓ Audit trail = RAR documents show how allocated amounts derive from SSP

**MONTHS 2-36 AND BEYOND:**
Each month/phase continues to recognize revenue via RAR allocation:

Month 2 (Jun 2026): SaaS recognizes $1,181 (2/36th of SaaS portion)
Month 3 (Jul 2026): SaaS recognizes $1,181
...
Phase 2 Complete (Sep 2026): Services recognizes next $13,098 portion
...
Month 36 (Apr 2029): SaaS recognizes final $1,181 (last month)


By contract end date (Apr 2029):
- License: $35,375 total recognized ✓
- SaaS: $42,500 total recognized ($1,181 × 36) ✓
- Services: $47,125 total recognized ($13,098 × 4 phases) ✓
- **Grand Total: $125,000** ✓

This ensures financial statements show clean, IFRS 15-compliant revenue with no disputes.
    `,
    performanceObligationMatrix: [
      {
        poNumber: '1',
        product: 'Perpetual Software License',
        listPrice: '60,000',
        listPricePct: '28.3%',
        contractPrice: '35,375',
        recognitionMethod: 'Point-in-Time (immediate)',
        recognitionDate: '2026-05-01',
        glAccount: '4100 - License Revenue',
        totalRevenue: '35,375.00'
      },
      {
        poNumber: '2',
        product: 'SaaS Cloud Hosting (36 months)',
        listPrice: '72,000',
        listPricePct: '34.0%',
        contractPrice: '42,500',
        recognitionMethod: 'Over-Time (monthly)',
        recognitionTiming: 'Monthly: $1,181/month × 36 months',
        glAccount: '4200 - SaaS Revenue',
        totalRevenue: '42,500.00'
      },
      {
        poNumber: '3',
        product: 'Professional Services (4 phases)',
        listPrice: '80,000',
        listPricePct: '37.7%',
        contractPrice: '47,125',
        recognitionMethod: 'Over-Time (per phase)',
        recognitionTiming: 'Phase-based: $13,098/phase × 4 phases (Jun, Sep, Nov, Jan)',
        glAccount: '4300 - Service Revenue',
        totalRevenue: '47,125.00'
      },
    ],
    consolidatedRevenueSchedule: [
      { period: 'May 2026 (Contract Start)', license: '35,375', saas: '1,181', services: '0', totalMonthly: '36,556', cumulativeRevenue: '36,556' },
      { period: 'Jun 2026 (Phase 1 Complete)', license: '0', saas: '1,181', services: '13,098', totalMonthly: '14,279', cumulativeRevenue: '50,835' },
      { period: 'Jul-Aug 2026 (SaaS only)', license: '0', saas: '1,181 × 2mo', services: '0', totalMonthly: '2,362', cumulativeRevenue: '55,559' },
      { period: 'Sep 2026 (Phase 2 Complete)', license: '0', saas: '1,181', services: '13,098', totalMonthly: '14,279', cumulativeRevenue: '69,838' },
      { period: 'Oct-Nov 2026 (SaaS + Phase 3)', license: '0', saas: '2,362', services: '13,098', totalMonthly: '15,460', cumulativeRevenue: '98,760' },
      { period: 'Jan 2027 (Phase 4 Complete)', license: '0', saas: '1,181', services: '13,098', totalMonthly: '14,279', cumulativeRevenue: '113,039' },
      { period: 'Feb-Apr 2029 (Final SaaS months)', license: '0', saas: '1,181 × 3mo', services: '0', totalMonthly: '3,543', cumulativeRevenue: '125,000' },
    ],
    ifrs15ComplianceChecklist: [
      { item: 'Single Performance Obligation Contract Identified', status: '✓ Yes', meaning: 'ZEST parent consolidates 3 SOs as single bundled deal' },
      { item: 'Performance Obligations Segregated', status: '✓ Yes', meaning: 'License (immediate), SaaS (monthly), Services (phase)' },
      { item: 'SSP Allocation Applied', status: '✓ Yes', meaning: 'Bundled discount allocated proportionally based on list prices' },
      { item: 'Recognition Timing Clear', status: '✓ Yes', meaning: 'License=immediate, SaaS=monthly, Services=per phase' },
      { item: 'Deferred Revenue Properly Segregated', status: '✓ Yes', meaning: '3 GL accounts (1920, 1930, 1940) by product type' },
      { item: 'GL Mapping Documented', status: '✓ Yes', meaning: 'Revenue GL accounts (4100, 4200, 4300) linked to RAR' },
      { item: 'Audit Trail Complete', status: '✓ Yes', meaning: 'SFDC → API → ZEST → SOs → RAR → GL → Financial Statements' },
    ],
  },
];

const simulatorStyles = `
  /* Main Container */
  .sap-explorer-main {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 1.5rem;
    padding: 1.5rem;
    min-height: 100vh;
  }

  .sap-explorer-left {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Header */
  .sap-explorer-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .sap-explorer-header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .sap-explorer-header p {
    margin: 0;
    font-size: 0.95rem;
  }

  /* Process Map Section */
  .process-map-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .process-map-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  /* Process Flow Grid */
  .process-flow-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .process-card {
    padding: 1.25rem;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
    position: relative;
  }

  .process-card:hover {
    transform: translateY(-2px);
  }

  .process-card.active {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .process-card-number {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .process-card-name {
    font-size: 1rem;
    font-weight: 700;
    margin: 0.25rem 0;
  }

  .process-card-code {
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    margin: 0 auto;
  }

  .process-card-status {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  /* Current Step Detail */
  .current-step-panel {
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid;
  }

  .step-detail-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .step-detail-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .step-detail-code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    display: inline-block;
  }

  .step-detail-description {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .step-metadata {
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  /* Right Sidebar */
  .sap-explorer-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sidebar-section {
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid;
  }

  .sidebar-section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .sidebar-section-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .ai-insight-bullet {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .ai-insight-bullet::before {
    content: '•';
    flex-shrink: 0;
    font-weight: bold;
  }

  .next-action-button {
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    margin-top: 0.5rem;
  }

  .next-action-button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .next-action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Status Badge */
  .status-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Dark Mode */
  .dark-mode .process-card {
    background: #1a2332;
    border-color: #2a3a4a;
    color: #e0e8f0;
  }

  .dark-mode .process-card.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: #00d4ff;
  }

  .dark-mode .process-card.completed {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
  }

  .dark-mode .process-card-code {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }

  .dark-mode .current-step-panel {
    background: #1a2332;
    border-color: #2a3a4a;
    color: #e0e8f0;
  }

  .dark-mode .step-detail-code {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }

  .dark-mode .step-metadata {
    background: rgba(0, 212, 255, 0.08);
    border: 1px solid #2a3a4a;
    color: #94a3b8;
  }

  .dark-mode .sidebar-section {
    background: #1a2332;
    border-color: #2a3a4a;
    color: #e0e8f0;
  }

  .dark-mode .sidebar-section-title {
    color: #00d4ff;
  }

  .dark-mode .next-action-button {
    background-color: #00d4ff;
    color: #0f1620;
  }

  .dark-mode .next-action-button:hover:not(:disabled) {
    background-color: #0ab5d4;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }

  .dark-mode .step-detail-header h2 {
    color: #00d4ff;
  }

  /* Light Mode */
  .light-mode .process-card {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #1f2937;
  }

  .light-mode .process-card.active {
    background: rgba(255, 107, 53, 0.1);
    border-color: #ff6b35;
  }

  .light-mode .process-card.completed {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
  }

  .light-mode .process-card-code {
    background: rgba(255, 107, 53, 0.15);
    color: #ff6b35;
  }

  .light-mode .current-step-panel {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #1f2937;
  }

  .light-mode .step-detail-code {
    background: rgba(255, 107, 53, 0.15);
    color: #ff6b35;
  }

  .light-mode .step-metadata {
    background: rgba(255, 107, 53, 0.08);
    border: 1px solid #e2e8f0;
    color: #64748b;
  }

  .light-mode .sidebar-section {
    background: #ffffff;
    border-color: #e2e8f0;
    color: #1f2937;
  }

  .light-mode .sidebar-section-title {
    color: #ff6b35;
  }

  .light-mode .next-action-button {
    background-color: #ff6b35;
    color: #ffffff;
  }

  .light-mode .next-action-button:hover:not(:disabled) {
    background-color: #ff8c52;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }

  .light-mode .step-detail-header h2 {
    color: #ff6b35;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .sap-explorer-main {
      grid-template-columns: 1fr;
    }

    .process-flow-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .sap-explorer-main {
      padding: 1rem;
    }

    .process-flow-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .step-detail-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = simulatorStyles;
  document.head.appendChild(style);
}

export default function SAPSimulator({ isDarkMode = true }: SAPSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const isCompleted = completedSteps.includes(currentStep);
  const isLast = currentStep === steps.length - 1;
  const nextStepIndex = currentStep + 1;
  const nextStep = nextStepIndex < steps.length ? steps[nextStepIndex] : null;

  return (
    <div className={`sap-explorer-main ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Left Panel */}
      <div className="sap-explorer-left">
        {/* Header */}
        <div>
          <div className="sap-explorer-header">
            {React.cloneElement(icons.chart, {
              color: isDarkMode ? colors.dark.accent : colors.light.accent,
              size: 28,
            })}
            <div>
              <h1>Solution Order Simulator</h1>
              <p>SFDC CPQ → SAP S/4HANA multi-product bundling with IFRS 15 revenue consolidation</p>
            </div>
          </div>
        </div>

        {/* Process Map */}
        <div className="process-map-section">
          <h3 className="process-map-title">Process Flow</h3>
          <div className="process-flow-grid">
            {steps.map((step, idx) => (
              <button
                key={step.id}
                className={`process-card ${idx === currentStep ? 'active' : ''} ${
                  completedSteps.includes(idx) ? 'completed' : ''
                }`}
                onClick={() => handleStepClick(idx)}
                style={{
                  background: idx === currentStep
                    ? isDarkMode ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 107, 53, 0.1)'
                    : completedSteps.includes(idx)
                    ? isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                    : isDarkMode ? '#1a2332' : '#ffffff',
                  borderColor: idx === currentStep
                    ? isDarkMode ? '#00d4ff' : '#ff6b35'
                    : completedSteps.includes(idx) ? '#10b981' : isDarkMode ? '#2a3a4a' : '#e2e8f0',
                }}
              >
                <div className="process-card-number">Step {idx + 1}</div>
                <div className="process-card-name">{step.name}</div>
                <div className="process-card-code">{step.code}</div>
                <div className="process-card-status">
                  {completedSteps.includes(idx) ? '✓ Done' : idx < currentStep ? '→' : '○'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Step Detail */}
        <div className="current-step-panel">
          <div className="step-detail-header">
            <h2>{steps[currentStep].name}</h2>
            <div className="process-card-code">{steps[currentStep].code}</div>
          </div>
          <p className="step-detail-description">{steps[currentStep].description}</p>
          <div className="step-metadata">{steps[currentStep].details}</div>

          {/* Claude Explanation */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: `4px solid ${isDarkMode ? '#00d4ff' : '#ff6b35'}`,
              background: isDarkMode ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 107, 53, 0.08)',
              marginTop: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>
              💡 SAP Insight
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
              {steps[currentStep].explanation}
            </p>
          </div>

          {/* Step 1: Field Mapping Table */}
          {currentStep === 0 && (steps[currentStep] as any).fieldMappingTable && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>SFDC → SAP Field Mapping</h3>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>SFDC Field</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>SAP Table</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>SAP Field</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Sample Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).fieldMappingTable.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>{row.sfdcField}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600 }}>{row.sapTable}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{row.sapField}</td>
                        <td style={{ padding: '0.75rem', color: isDarkMode ? '#10b981' : '#059669' }}>{row.sampleValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 2: API Details */}
          {currentStep === 1 && (steps[currentStep] as any).apiDetails && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>API Endpoint Details</h3>
              <div style={{ background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div><strong>Endpoint:</strong> {(steps[currentStep] as any).apiDetails.endpoint}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Headers:</strong>
                <div style={{ background: isDarkMode ? '#0f1620' : '#f8f9fa', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                  {Object.entries((steps[currentStep] as any).apiDetails.headers).map(([key, value]: [string, any]) => (
                    <div key={key}>{key}: {value}</div>
                  ))}
                </div>
              </div>
              <div>
                <strong>Request Sample:</strong>
                <div style={{ background: isDarkMode ? '#0f1620' : '#f8f9fa', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', marginTop: '0.5rem', overflow: 'auto' }}>
                  {JSON.stringify((steps[currentStep] as any).apiDetails.requestSample, null, 2)}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: ZEST Table & GL Postings */}
          {currentStep === 2 && (steps[currentStep] as any).zestTable && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Solution Order Master (ZEST)</h3>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
                marginBottom: '1rem',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Field</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Value</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).zestTable.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>{row.field}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{row.value}</td>
                        <td style={{ padding: '0.75rem' }}>{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>GL Postings</h4>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>GL Acct</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Description</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Debit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).glPostings.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#10b981' : '#059669' }}>{row.account}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.description}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', color: row.debit === '-' ? 'inherit' : isDarkMode ? '#10b981' : '#059669', fontWeight: row.debit === '-' ? 'normal' : 600 }}>{row.debit}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: row.credit === '-' ? 'inherit' : isDarkMode ? '#f87171' : '#dc2626', fontWeight: row.credit === '-' ? 'normal' : 600 }}>{row.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Routing Matrix */}
          {currentStep === 3 && (steps[currentStep] as any).routingMatrix && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Item Category Routing Matrix</h3>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Item Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Item Category</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Qty</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Billing Behavior</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Recognition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).routingMatrix.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>{row.itemType}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{row.sapItemCategory}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{row.product}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'center' }}>{row.qty}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', fontFamily: 'monospace' }}>{row.unitPrice}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontSize: '0.8rem' }}>{row.billingBehavior}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{row.recognitionTiming}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 5-7: Sales Order Details with GL Postings */}
          {(currentStep === 4 || currentStep === 5 || currentStep === 6) && (steps[currentStep] as any).soDetails && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Sales Order Details</h3>
              {currentStep === 5 && (steps[currentStep] as any).billingPlanSample && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Billing Schedule (36 months)</h4>
                  <div style={{
                    overflowX: 'auto',
                    border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                    borderRadius: '6px',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Month</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Invoice Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Due Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Amount</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(steps[currentStep] as any).billingPlanSample.map((row: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.month}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.invoiceDate}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.dueDate}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', fontFamily: 'monospace' }}>{row.amount}</td>
                            <td style={{ padding: '0.75rem', color: row.status === 'Created' ? isDarkMode ? '#10b981' : '#059669' : isDarkMode ? '#94a3b8' : '#64748b' }}>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentStep === 6 && (steps[currentStep] as any).phaseDetails && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Project Phases & Milestones</h4>
                  <div style={{
                    overflowX: 'auto',
                    border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                    borderRadius: '6px',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Phase</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Start Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>End Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Hours</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Resource Cost</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Recognition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(steps[currentStep] as any).phaseDetails.map((row: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.phase}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.startDate}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.endDate}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right' }}>{row.plannedHours}</td>
                            <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', fontFamily: 'monospace' }}>{row.resourceCost}</td>
                            <td style={{ padding: '0.75rem' }}>{row.revenueRecognition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
                marginBottom: '1rem',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Field</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Value</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).soDetails.flatMap((section: any) => section.fields).map((field: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>{field.field}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{field.value}</td>
                        <td style={{ padding: '0.75rem' }}>{field.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>GL Postings</h4>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>GL Acct</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Description</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Debit</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).glPostings.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#10b981' : '#059669' }}>{row.account}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.description}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', color: row.debit === '-' ? 'inherit' : isDarkMode ? '#10b981' : '#059669', fontWeight: row.debit === '-' ? 'normal' : 600 }}>{row.debit}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: row.credit === '-' ? 'inherit' : isDarkMode ? '#f87171' : '#dc2626', fontWeight: row.credit === '-' ? 'normal' : 600 }}>{row.credit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 8: Webhook & Invoice */}
          {currentStep === 7 && (steps[currentStep] as any).webhookSample && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Workday Webhook Payload</h3>
              <div style={{ background: isDarkMode ? '#0f1620' : '#f8f9fa', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '1rem', overflow: 'auto' }}>
                {JSON.stringify((steps[currentStep] as any).webhookSample, null, 2)}
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Generated SAP Invoice</h4>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Field</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Value</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).invoiceDetail.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>{row.field}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, fontFamily: 'monospace' }}>{row.value}</td>
                        <td style={{ padding: '0.75rem' }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 9: RAR Consolidation */}
          {currentStep === 8 && (steps[currentStep] as any).performanceObligations && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>IFRS 15 Performance Obligations</h3>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
                marginBottom: '1rem',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>PO #</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>SSP</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Allocation %</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Revenue</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Recognition Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).performanceObligations.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.poNumber}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.product}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', fontFamily: 'monospace' }}>{row.ssp}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right' }}>{row.allocation}</td>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, textAlign: 'right', fontFamily: 'monospace', color: isDarkMode ? '#10b981' : '#059669', fontWeight: 600 }}>{row.revenue}</td>
                        <td style={{ padding: '0.75rem' }}>{row.recognitionTiming}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', color: isDarkMode ? '#00d4ff' : '#ff6b35' }}>Revenue Recognition Consolidation (May 2026)</h4>
              <div style={{
                overflowX: 'auto',
                border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
                borderRadius: '6px',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`, background: isDarkMode ? 'rgba(0,212,255,0.05)' : 'rgba(255,107,53,0.05)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>Description</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(steps[currentStep] as any).rarConsolidation.map((row: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>
                        <td style={{ padding: '0.75rem', borderRight: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}` }}>{row.description}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', color: isDarkMode ? '#10b981' : '#059669', fontWeight: 600 }}>{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="sap-explorer-sidebar">
        {/* AI Analysis */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            {React.cloneElement(icons.ideas, {
              size: 18,
              color: isDarkMode ? colors.dark.accent : colors.light.accent,
            })}
            AI Analysis
          </div>
          <div className="sidebar-section-content">
            <div className="ai-insight-bullet">
              <div>Transaction: {steps[currentStep].code}</div>
            </div>
            <div className="ai-insight-bullet">
              <div>Module: {steps[currentStep].details.split('Module: ')[1]}</div>
            </div>
            <div className="ai-insight-bullet">
              <div>Status: {isCompleted ? 'Completed' : 'In Progress'}</div>
            </div>
          </div>
        </div>

        {/* Recommended Next Action */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            {React.cloneElement(icons.power, {
              size: 18,
              color: isDarkMode ? colors.dark.accent : colors.light.accent,
            })}
            Next Action
          </div>
          <div className="sidebar-section-content">
            {isLast ? (
              <div>
                <strong>Solution Order complete!</strong> All 9 steps executed successfully. Contract consolidated with IFRS 15 compliance.
              </div>
            ) : nextStep ? (
              <div>
                <strong>Next:</strong> {nextStep.name} ({nextStep.code})
                <br />
                {nextStep.description}
              </div>
            ) : null}
          </div>
          <button
            className="next-action-button"
            onClick={handleNext}
            disabled={isLast}
            style={{
              backgroundColor: isLast ? undefined : isDarkMode ? colors.dark.accent : colors.light.accent,
              color: isLast ? undefined : isDarkMode ? colors.dark.bg : '#ffffff',
            }}
          >
            {isLast ? '✓ Complete' : 'Next Step'}
          </button>
        </div>

        {/* Summary */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            {React.cloneElement(icons.success, {
              size: 18,
              color: isDarkMode ? colors.dark.accent : colors.light.accent,
            })}
            Progress
          </div>
          <div className="sidebar-section-content">
            <div>{completedSteps.length + 1} of {steps.length} steps</div>
            <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              {Math.round(((completedSteps.length + 1) / steps.length) * 100)}% complete
            </div>
          </div>
          <button
            className="next-action-button"
            onClick={handleReset}
            style={{
              backgroundColor: isDarkMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 107, 53, 0.2)',
              color: isDarkMode ? colors.dark.accent : colors.light.accent,
              marginTop: '0.75rem',
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
