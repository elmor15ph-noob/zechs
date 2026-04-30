import React, { useState } from 'react';
import { icons } from '../theme/icons';
import { colors } from '../theme/designSystem';

interface SAPSimulatorProps {
  isDarkMode?: boolean;
}

const solutionOrderScenario = {
  title: 'Enterprise Solution Order Architecture',
  subtitle: 'Salesforce CPQ → Solution Order → Multi-Product Routing with IFRS 15 Compliance',
  description: 'This demonstrates how a single Solution Order bundles Perpetual License, SaaS Subscription, and Professional Services, routing them to different SD Item Categories with distinct billing behaviors while maintaining unified revenue recognition.',

  steps: [
    {
      id: 1,
      phase: 'INBOUND INTEGRATION',
      name: 'Salesforce CPQ Payload Transmitted',
      code: 'API_SOLUTION_ORDER_SRV',
      description: 'Salesforce sends entire bundled deal to S/4HANA via single API',
      details: 'One JSON payload contains: License + Subscription + Services',
      explanation: `
        Salesforce CPQ (Configure Price Quote) generates a bundled solution with three components:
        • Perpetual License: $50K (one-time)
        • Cloud SaaS: $2K/month (recurring)
        • Professional Services: $25K (milestone-based)

        Instead of hitting multiple APIs (SO API, Subscription API, Service API), your middleware (MuleSoft / SAP BTP) makes ONE call to Solution Order API.

        Benefits:
        ✓ Reduced API complexity (single integration point)
        ✓ Middleware doesn't need intelligence to split payload
        ✓ Lower latency (one round-trip vs. three)
        ✓ Guaranteed atomic transaction (all-or-nothing)
      `,
      glImpact: [],
      crossModuleImpact: ['Salesforce: Deal closed', 'BTP/MuleSoft: Single API call executed', 'S/4HANA: Solution Order created (ZEST)'],
    },
    {
      id: 2,
      phase: 'SOLUTION ORDER CREATION',
      name: 'Solution Order Created in S/4HANA',
      code: 'ZEST / API_SOLUTION_ORDER_SRV',
      description: 'S/4HANA receives and creates master Solution Order',
      details: 'Transaction: ZEST (Solution Order) | Status: Created',
      explanation: `
        S/4HANA creates the Solution Order document (ZEST) as a "commercial grouping" wrapper.

        Solution Order Header:
        ├─ Customer: Acme Corp
        ├─ Contract Value: $77K total
        ├─ Contract Period: 3 years
        ├─ Currency: USD
        ├─ Billing Type: Multi-Schedule (Mixed)
        └─ Sales Org / Division / Channel assigned

        At this point, RAR (Revenue Accounting & Reporting) "sees" the entire $77K contract.
        Per IFRS 15 / ASC 606, this is "Step 1: Identify the contract with customer".

        Key architectural decision:
        • Solution Order acts as the REVENUE CONTRACT (single source of truth for RAR)
        • All downstream Sales Orders will link back to this parent for revenue consolidation
      `,
      glImpact: [],
      crossModuleImpact: ['RAR: Revenue Contract recognized ($77K)', 'MDG: Solution Order master data validated', 'AR: Customer record updated'],
    },
    {
      id: 3,
      phase: 'ITEM CATEGORY ROUTING',
      name: 'Item Categories Determined & Routed',
      code: 'IMG_ITEM_CATEGORY_DETERMINATION',
      description: 'Each solution item routed to appropriate SD Item Category',
      details: 'Routing logic: Solution Item → SD Item Category → Billing Behavior',
      explanation: `
        Your Item Category Determination matrix routes the three product types to different SD Item Categories:

        ╔════════════════════════════════════════════════════════════════════════════════╗
        ║ SOLUTION ORDER ITEM → SD ITEM CATEGORY → BILLING BEHAVIOR                      ║
        ╠════════════════════════════════════════════════════════════════════════════════╣
        ║ 1. PERPETUAL LICENSE (Srqs)                                                    ║
        ║    → SD Item Category: TAN (Tangible / Standard Item)                          ║
        ║    → Behavior: One-time delivery + one-time billing                            ║
        ║    → GL: Revenue recognized immediately upon GI (goods issue)                  ║
        ║    → Invoice: Single invoice on delivery date                                  ║
        ╠════════════════════════════════════════════════════════════════════════════════╣
        ║ 2. CLOUD SAAS SUBSCRIPTION (Custom: ZSUB)                                      ║
        ║    → SD Item Category: CBAO (or custom Z-category for periodic billing)        ║
        ║    → Behavior: No delivery. Periodic recurring billing (monthly)                ║
        ║    → GL: Revenue recognized monthly over contract term (IFRS 15 over time)     ║
        ║    → Invoice: 36 monthly invoices ($2K each) over 3-year term                  ║
        ║    → No physical goods movement (pure service)                                 ║
        ╠════════════════════════════════════════════════════════════════════════════════╣
        ║ 3. PROFESSIONAL SERVICES (Custom: ZSRV)                                        ║
        ║    → SD Item Category: Custom (Milestone / T&M based)                          ║
        ║    → Behavior: Sits open. Billed on milestone achievement or T&M hours         ║
        ║    → Workflow: Workday PSA → S/4HANA → Triggers billing                        ║
        ║    → GL: Revenue recognized when milestone accepted (IFRS 15 at point-in-time) ║
        ║    → Invoice: Multiple invoices as milestones completed                        ║
        ║    → Linked to: Workday time tracking, approval workflows                      ║
        ╚════════════════════════════════════════════════════════════════════════════════╝

        Key insight: All three are in the SAME Sales Order (internally split), but behave completely differently.
      `,
      glImpact: [],
      crossModuleImpact: ['Item Cat Determination: Routes items', 'Billing Plan: Assigned per item type', 'RAR: Schedules revenue recognition per item'],
    },
    {
      id: 4,
      phase: 'SALES ORDER CREATION (Internal)',
      name: 'Three SD Sales Orders Created (Internally Linked)',
      code: 'VA01 (Auto-generated via Solution Order)',
      description: 'One sales order per item type, all linked to parent Solution Order',
      details: 'Three SOs created: License (SO), Subscription (SO), Services (SO)',
      explanation: `
        S/4HANA auto-generates three Sales Orders from the Solution Order items, each with distinct properties:

        SALES ORDER #1: PERPETUAL LICENSE
        ├─ Material: LICENSE-PRODUCT (non-stocked material)
        ├─ Qty: 1 | Price: $50K
        ├─ Item Category: TAN (Tangible)
        ├─ Delivery: Physical fulfillment (license key shipped)
        ├─ Billing: One-time on delivery
        ├─ Incoterm: FOB
        └─ Link back to Solution Order: PARENT

        SALES ORDER #2: CLOUD SAAS
        ├─ Material: CLOUD-ANNUAL (recurring service)
        ├─ Qty: 36 | Price: $2K/month
        ├─ Item Category: CBAO (or ZSUB custom)
        ├─ Delivery: None (no GI posted)
        ├─ Billing: PERIODIC BILLING PLAN
        │  ├─ Schedule: Monthly (first invoice on go-live date)
        │  └─ Duration: 36 months
        ├─ Revenue Recognition: Monthly (IFRS 15 over time)
        └─ Link back to Solution Order: PARENT

        SALES ORDER #3: PROFESSIONAL SERVICES
        ├─ Material: CONSULT-SERVICES (service)
        ├─ Qty: 1 | Price: $25K (as ceiling)
        ├─ Item Category: ZSRV (custom milestone-based)
        ├─ Delivery: None
        ├─ Billing: MILESTONE-BASED
        │  ├─ Linked to: Workday PSA time entries
        │  └─ Trigger: Milestone acceptance → Auto-creates billing document
        ├─ Revenue Recognition: Upon milestone completion (IFRS 15 point-in-time)
        └─ Link back to Solution Order: PARENT

        Architectural key: All three remain independent SOs (different GL impacts, different billing cycles) BUT are
        consolidated in RAR as a single Revenue Contract for IFRS 15 compliance.
      `,
      glImpact: [
        { account: '1150 (AR)', amount: 50000, effect: 'debit' },
        { account: '4100 (License Revenue)', amount: 50000, effect: 'credit' },
      ],
      crossModuleImpact: [
        'SD: Three sales orders created (same customer)',
        'LE: One item requires fulfillment (license key)',
        'Subscription: Enters recurring billing queue',
        'RAR: All three linked to parent contract',
        'Workday: Service PO created for resource tracking',
      ],
    },
    {
      id: 5,
      phase: 'PERPETUAL LICENSE FULFILLMENT',
      name: 'License Item: Delivery & One-Time Billing',
      code: 'VL02N (Delivery) → VF01 (Invoice)',
      description: 'Physical/digital delivery of license; immediate billing',
      details: 'GL Impact: Revenue recognized immediately | Billing: Single invoice',
      explanation: `
        License SO proceeds through standard O2C flow:

        Timeline:
        Day 1:
        ├─ Goods Issue (VL02N): License key generated and electronically delivered
        │  └─ GL: Inventory (1200) ↓ | COGS (5100) ↑ [Small amount for license key generation]
        │
        ├─ Invoice (VF01): Created immediately
        │  └─ GL: AR (1150) ↑ $50K | License Revenue (4100) ↓ $50K
        │     Status: IFRS 15 recognition = POINT-IN-TIME (delivered)
        │
        └─ Payment (F110): Customer pays within 30 days
           └─ GL: Cash (1000) ↑ $50K | AR (1150) ↓ $50K

        Result: $50K revenue recognized immediately on delivery date (Day 1).
        Impact on RAR: This item contributes $50K to SSP analysis (for discount allocation across contract).
      `,
      glImpact: [
        { account: '1150 (AR)', amount: 50000, effect: 'debit' },
        { account: '4100 (License Revenue)', amount: 50000, effect: 'credit' },
        { account: '1000 (Cash)', amount: 50000, effect: 'debit' },
        { account: '1150 (AR)', amount: 50000, effect: 'credit' },
      ],
      crossModuleImpact: ['SD: Delivery completed', 'FI: Revenue recognized immediately', 'RAR: $50K SSP calculated'],
    },
    {
      id: 6,
      phase: 'CLOUD SAAS RECURRING BILLING',
      name: 'SaaS Item: Periodic Billing Initiated',
      code: 'BILLING_PLAN (Monthly Recurring) → VF01 (Auto-invoicing)',
      description: 'Monthly recurring billing plan activated; 36 invoices over 3 years',
      details: 'GL Impact: Monthly revenue recognition | Revenue pattern: 36 × $2K',
      explanation: `
        Cloud/SaaS SO is assigned a PERIODIC BILLING PLAN:

        Billing Plan Configuration:
        ├─ Bill Frequency: Monthly
        ├─ Start Date: 2026-05-01 (go-live)
        ├─ End Date: 2029-04-30 (3 years)
        ├─ Invoice Qty per Period: 1
        ├─ Price per Invoice: $2,000
        ├─ Total Invoices: 36
        └─ Auto-Invoicing: System generates invoice first day of each month

        Revenue Recognition (IFRS 15 "Over Time"):
        May 2026: Invoice 1  → Revenue recognition: $2K
        Jun 2026: Invoice 2  → Revenue recognition: $2K
        ...
        Apr 2029: Invoice 36 → Revenue recognition: $2K

        GL Posting (Each Month):
        ├─ AR (1150) ↑ $2K [Customer owes]
        ├─ Deferred Revenue (1920) ↓ $2K [Liability reduced]
        ├─ Cloud Revenue (4200) ↑ $2K [Performance obligation satisfied monthly]
        └─ Payment (when received): Cash ↑ $2K | AR ↓ $2K

        Key RAR advantage:
        • Deferred Revenue (liability) automatically decreases monthly as revenue is earned
        • No manual journal entries needed
        • Audit trail complete (system-generated invoices + GL postings)
        • Standalone Selling Price (SSP) for SaaS calculated: $2K × 36 = $72K total
      `,
      glImpact: [
        { account: '1150 (AR)', amount: 2000, effect: 'debit' },
        { account: '1920 (Deferred Revenue)', amount: 2000, effect: 'credit' },
        { account: '1920 (Deferred Revenue)', amount: 2000, effect: 'debit' },
        { account: '4200 (Cloud Revenue)', amount: 2000, effect: 'credit' },
      ],
      crossModuleImpact: [
        'Billing Plan: Auto-invoicing triggered monthly',
        'AR: 36 invoices created over contract term',
        'FI: Revenue recognized monthly (deferred to earned)',
        'RAR: Tracks monthly performance obligation satisfaction',
        'Cash: Collected monthly (customer subscription payment)',
      ],
    },
    {
      id: 7,
      phase: 'PROFESSIONAL SERVICES INTEGRATION',
      name: 'Services Item: Workday PSA Integration & Milestone Billing',
      code: 'Workday_PSA → S/4HANA Integration → BRIM (Billing & Revenue Mgmt)',
      description: 'Time entries from Workday trigger billing in S/4HANA',
      details: 'GL Impact: Variable revenue recognition | Trigger: Milestone acceptance',
      explanation: `
        Professional Services SO is the most complex. It sits OPEN in S/4HANA and awaits signals from Workday PSA.

        Workflow:

        1. Workday PSA: Time Tracking
           ├─ Project Manager creates project scope ($25K services)
           ├─ Consultants log time (billable hours)
           ├─ Project Manager tracks against milestones
           └─ Example Milestones:
              ├─ Phase 1 (Discovery): 40 hours → $5K (when approved)
              ├─ Phase 2 (Design): 80 hours → $10K (when approved)
              └─ Phase 3 (Implementation): 60 hours → $10K (when approved)

        2. Workday → S/4HANA Integration (Real-Time via API):
           ├─ When Phase 1 milestone marked "Accepted" in Workday PSA
           ├─ Workday sends API call to S/4HANA: MILESTONE_ACHIEVED
           └─ Payload: Phase_ID, Hours_Logged, Billable_Amount

        3. S/4HANA Receipt & Billing:
           ├─ S/4HANA receives milestone completion signal
           ├─ Creates billing document (VBRK/VBRP) automatically
           ├─ Qty field = milestone amount ($5K)
           ├─ Invoice created (VF01)
           └─ Sent to customer

        4. Revenue Recognition Timing:
           ├─ Under IFRS 15 "Point-in-Time" (not over time)
           ├─ Revenue recognized WHEN milestone is accepted (customer approval)
           ├─ Not when hours logged or resource deployed
           └─ This prevents revenue recognition for uncompleted work

        GL Impact per Milestone:
        Phase 1 Completion:
        ├─ AR (1150) ↑ $5K [Invoice created]
        ├─ Services Revenue (4300) ↓ $5K [Revenue recognized]
        └─ When paid: Cash ↑ $5K | AR ↓ $5K

        Advanced: Using BRIM (optional, but recommended for complex scenarios):
        • If your organization uses SAP BRIM for billing orchestration
        • BRIM can aggregate all three billing streams (License + SaaS + Services)
        • Single consolidated invoice per month (optional)
        • But still maintains separate GL posting per revenue stream
      `,
      glImpact: [
        { account: '1150 (AR)', amount: 5000, effect: 'debit' },
        { account: '4300 (Services Revenue)', amount: 5000, effect: 'credit' },
      ],
      crossModuleImpact: [
        'Workday PSA: Time tracking + milestone tracking',
        'Integration: API webhook triggers billing',
        'BRIM (optional): Billing orchestration & consolidation',
        'S/4HANA: Services SO remains open until all milestones complete',
        'RAR: Each milestone triggers point-in-time revenue recognition',
      ],
    },
    {
      id: 8,
      phase: 'REVENUE ACCOUNTING & REPORTING (RAR)',
      name: 'IFRS 15 Compliance: Consolidated Revenue Recognition',
      code: 'RAR_REVENUE_CONTRACT (Automated Contract Analysis)',
      description: 'RAR consolidates all three billing streams into single contract',
      details: 'Contract Recognition: Single $77K contract | Recognition: Mixed (Point + Over time)',
      explanation: `
        This is where the architectural brilliance shines. By using Solution Order as the contract wrapper,
        SAP RAR automatically identifies this as ONE contract under IFRS 15 / ASC 606.

        RAR Step 1: IDENTIFY THE CONTRACT
        ✓ Solution Order = Contract with Customer (Acme Corp, $77K, 3-year term)

        RAR Step 2: IDENTIFY PERFORMANCE OBLIGATIONS
        The $77K contract has THREE distinct performance obligations:

        1. LICENSE DELIVERY
           ├─ Transaction Price (Standalone Selling Price): $50K
           ├─ Performance Obligation Satisfied: Point-in-time (delivery)
           └─ Revenue Recognition Pattern: Immediate

        2. CLOUD SAAS SERVICE
           ├─ Transaction Price (Standalone Selling Price): $72K (36 months × $2K)
           ├─ Performance Obligation Satisfied: Over time (monthly service delivery)
           └─ Revenue Recognition Pattern: Straight-line monthly

        3. PROFESSIONAL SERVICES
           ├─ Transaction Price (Standalone Selling Price): $25K
           ├─ Performance Obligation Satisfied: Point-in-time (milestone achievement)
           └─ Revenue Recognition Pattern: As milestones completed

        RAR Step 3: ALLOCATE TRANSACTION PRICE (Discount Allocation)
        Actual contract price: $77K
        Sum of SSPs: $50K + $72K + $25K = $147K
        Discount to allocate: $77K / $147K = 52.4% of each component's SSP

        Allocation:
        ├─ License: $50K × 52.4% = $26.2K
        ├─ SaaS: $72K × 52.4% = $37.7K  (= $1,047/month)
        └─ Services: $25K × 52.4% = $13.1K

        RAR Step 4: AUTOMATE & TRACK
        RAR Dashboard shows (Monthly):
        ├─ Total contract value: $77K
        ├─ Cumulative revenue recognized: (dynamic based on licenses delivered + months passed + milestones completed)
        ├─ Remaining performance obligations: Decreases as time passes + milestones achieved
        └─ Deferred revenue liability: = Total contract - Cumulative revenue

        Audit Trail (Automated):
        ✓ Every invoice links to Solution Order parent
        ✓ Every GL posting tagged with contract ID
        ✓ RAR can drill down from contract → SOs → invoices → GL
        ✓ Exception reporting: Recognize revenue only if all validation rules pass
      `,
      glImpact: [],
      crossModuleImpact: [
        'RAR: Identifies single revenue contract (Solution Order)',
        'All three SOs consolidated for IFRS 15 analysis',
        'SSP allocation calculated automatically',
        'Discount automatically distributed to three line items',
        'Monthly revenue recognition dashboard updated',
      ],
    },
    {
      id: 9,
      phase: 'FINANCIAL REPORTING & CLOSURE',
      name: 'Month-End: Financial Statements & Revenue Analytics',
      code: 'FI_MONTH_END / FINANCIAL_STATEMENTS',
      description: 'All revenue streams consolidated into P&L',
      details: 'P&L Impact: License revenue + SaaS revenue + Services revenue (milestone-based)',
      explanation: `
        Month-end financial close consolidates all three revenue streams into the P&L statement.

        INCOME STATEMENT (May 2026, First Month Example):

        Revenue:
        ├─ License Sales (4100): $26.2K (1 unit delivered)
        ├─ Cloud SaaS Revenue (4200): $1.047K (May month 1/36)
        ├─ Professional Services (4300): $0K (only if Phase 1 milestone completed in May)
        └─ Total Revenue (4900): $27.247K

        Expenses:
        ├─ COGS (5100): $2K (license key generation + infra costs)
        ├─ Cloud Infrastructure (5200): $500 (pass-through cost for SaaS)
        ├─ Service Delivery (5300): Variable (if Phase 1 completed: resource costs)
        └─ Total Expenses (5900): ~$2.5K - $5K (depending on service progress)

        GROSS PROFIT: $22.247K - $24.747K

        Balance Sheet Impact (May 2026):
        Assets:
        ├─ Cash: +$50K (if license paid immediately) + $2K SaaS (if prepaid) + $5K Services (if milestone paid) = +$57K
        ├─ AR: $(2K + 5K) = $7K (pending customer payment for SaaS + current milestone)
        └─ Deferred Revenue (Liability): $72K - $1.047K = $70.953K (remaining SaaS obligations)
                                         $25K - $5K = $20K (if Phase 1 complete; else $25K)

        Key Metric: Deferred Revenue Rundown
        ├─ May 1 Start: $97K ($72K SaaS + $25K Services)
        ├─ May 31 End: $90.953K - $20K = $70.953K (SaaS) + $0-$20K (Services)
        ├─ Each month: SaaS deferred revenue ↓$1.047K
        └─ Each milestone: Services deferred revenue ↓$milestone_amount

        Advanced Reporting (Multi-Dimensional):
        ├─ By Revenue Stream: License 34% | SaaS 49% | Services 17%
        ├─ By Payment Pattern: One-time 34% | Recurring 49% | Milestone-based 17%
        ├─ By Customer Segment: (Acme Corp) 100%
        ├─ By Product Portfolio: (Core product 34% | Cloud 49% | Services 17%)
        └─ By Recognition Timing: Point-in-time 51% | Over-time 49%

        Metrics for Board/Investor Reporting:
        ├─ ARR (Annual Recurring Revenue): $1.047K × 12 = $12.564K (only SaaS)
        ├─ ARR Expansion: (if additional modules sold = new SaaS ARR)
        ├─ Dollar-Weighted Average Contract Life: 3 years (tied to contract term)
        ├─ Net Revenue Retention: (customers upselling or churning)
        └─ Deferred Revenue Health: $70.953K SaaS + $20K Services = $90.953K future revenue secured
      `,
      glImpact: [],
      crossModuleImpact: [
        'FI: All GL accounts for License/SaaS/Services consolidated',
        'AR: Customer aging analysis (outstanding balances)',
        'Deferred Revenue: Tracks remaining service obligations',
        'Analytics: Multi-dimensional revenue reporting',
        'Executive: ARR, retention, and revenue predictability',
      ],
    },
  ],
};

const simulatorStyles = `
  .solution-order-simulator {
    padding: 2rem;
    min-height: 100vh;
  }

  .so-header {
    margin-bottom: 2rem;
  }

  .so-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .so-meta {
    font-size: 0.95rem;
    opacity: 0.8;
    margin-bottom: 1rem;
  }

  .step-flow {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .step-card {
    padding: 1.25rem;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s;
  }

  .step-card:hover {
    transform: translateY(-2px);
  }

  .step-card.active {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  .step-phase {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  .step-name {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .step-code {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    display: inline-block;
  }

  .detail-container {
    border-radius: 8px;
    border: 1px solid;
    padding: 2rem;
  }

  .detail-header {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .detail-phase {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    display: inline-block;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .detail-section-title {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }

  .detail-text {
    line-height: 1.6;
    white-space: pre-wrap;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.85rem;
  }

  .table-container {
    overflow-x: auto;
    margin: 1rem 0;
  }

  .impact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .impact-table th {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 2px solid;
    font-weight: 600;
  }

  .impact-table td {
    padding: 0.75rem;
    border-bottom: 1px solid;
  }

  .dark-mode {
    background-color: #0f1620;
    color: #e0e8f0;
  }

  .dark-mode .so-title { color: #00d4ff; }
  .dark-mode .step-card {
    background: #1a2332;
    border-color: #2a3a4a;
  }
  .dark-mode .step-card.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: #00d4ff;
  }
  .dark-mode .step-code {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }
  .dark-mode .detail-container {
    background: #1a2332;
    border-color: #2a3a4a;
  }
  .dark-mode .detail-header { color: #00d4ff; }
  .dark-mode .detail-phase {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }
  .dark-mode .impact-table th { border-bottom-color: #2a3a4a; }
  .dark-mode .impact-table td { border-bottom-color: #2a3a4a; }

  .light-mode {
    background-color: #f5f5f5;
    color: #1f2937;
  }

  .light-mode .so-title { color: #ff6b35; }
  .light-mode .step-card {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .light-mode .step-card.active {
    background: rgba(255, 107, 53, 0.1);
    border-color: #ff6b35;
  }
  .light-mode .step-code {
    background: rgba(255, 107, 53, 0.15);
    color: #ff6b35;
  }
  .light-mode .detail-container {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .light-mode .detail-header { color: #ff6b35; }
  .light-mode .detail-phase {
    background: rgba(255, 107, 53, 0.2);
    color: #ff6b35;
  }
  .light-mode .impact-table th { border-bottom-color: #e2e8f0; }
  .light-mode .impact-table td { border-bottom-color: #e2e8f0; }

  @media (max-width: 768px) {
    .step-flow {
      grid-template-columns: 1fr;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = simulatorStyles;
  document.head.appendChild(style);
}

export default function SolutionOrderSimulator({ isDarkMode = true }: SAPSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = solutionOrderScenario.steps;
  const currentStepData = steps[currentStep];

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
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

  const isLast = currentStep === steps.length - 1;

  return (
    <div className={`solution-order-simulator ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <div className="so-header">
        <h1 className="so-title">{solutionOrderScenario.title}</h1>
        <div className="so-meta">{solutionOrderScenario.subtitle}</div>
        <div className="so-meta">{solutionOrderScenario.description}</div>
      </div>

      {/* Step Flow */}
      <div className="step-flow">
        {steps.map((step, idx) => (
          <button
            key={step.id}
            className={`step-card ${idx === currentStep ? 'active' : ''}`}
            onClick={() => handleStepClick(idx)}
            style={{
              background: idx === currentStep
                ? isDarkMode ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 107, 53, 0.1)'
                : isDarkMode ? '#1a2332' : '#ffffff',
              borderColor: idx === currentStep
                ? isDarkMode ? '#00d4ff' : '#ff6b35'
                : isDarkMode ? '#2a3a4a' : '#e2e8f0',
            }}
          >
            <div className="step-phase">{step.phase}</div>
            <div className="step-name">{step.name}</div>
            <div className="step-code">{step.code}</div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      <div className="detail-container">
        <div className="detail-header">
          <div
            className="detail-phase"
            style={{
              background: isDarkMode ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 107, 53, 0.15)',
              color: isDarkMode ? '#00d4ff' : '#ff6b35',
            }}
          >
            {currentStepData.phase}
          </div>
          <div>{currentStepData.name}</div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Overview</div>
          <div style={{ lineHeight: 1.6 }}>{currentStepData.description}</div>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginTop: '0.5rem' }}>{currentStepData.details}</div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Technical Deep-Dive</div>
          <div className="detail-text">{currentStepData.explanation}</div>
        </div>

        {currentStepData.glImpact && currentStepData.glImpact.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">💰 GL Impact (General Ledger)</div>
            <div className="table-container">
              <table className="impact-table">
                <thead>
                  <tr>
                    <th>GL Account</th>
                    <th>Amount</th>
                    <th>Debit/Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStepData.glImpact.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.account}</td>
                      <td>${item.amount.toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: item.effect === 'debit' ? '#10b981' : '#ef4444' }}>
                        {item.effect === 'debit' ? '↗ DEBIT' : '↙ CREDIT'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentStepData.crossModuleImpact && (
          <div className="detail-section">
            <div className="detail-section-title">🔗 Cross-Module Integration</div>
            <ul style={{ marginLeft: '1.5rem', lineHeight: 1.8, opacity: 0.9 }}>
              {currentStepData.crossModuleImpact.map((impact, idx) => (
                <li key={idx}>{impact}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid',
              borderColor: isDarkMode ? '#2a3a4a' : '#e2e8f0',
              background: 'transparent',
              color: isDarkMode ? '#e0e8f0' : '#1f2937',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reset
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ opacity: 0.7 }}>{currentStep + 1} / {steps.length}</span>
            <button
              onClick={handleNext}
              disabled={isLast}
              style={{
                padding: '0.75rem 1.5rem',
                background: isLast ? undefined : isDarkMode ? '#00d4ff' : '#ff6b35',
                color: isLast ? undefined : isDarkMode ? '#0f1620' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: isLast ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: isLast ? 0.5 : 1,
              }}
            >
              {isLast ? '✓ Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
