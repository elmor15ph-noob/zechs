import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SAPSimulatorProps {
  isDarkMode?: boolean;
}

const detailedScenario = {
  title: 'Solution Order: Deep-Dive Walkthrough',
  subtitle: 'Salesforce CPQ Deal → Solution Order → 3 Sales Orders with Field Mapping & GL Impact',
};

const steps = [
  {
    id: 1,
    title: 'Salesforce CPQ Deal Created',
    description: 'Opportunity closed in Salesforce with bundled products',
    sfdcData: {
      OpportunityName: 'Acme Corp - Enterprise Platform',
      Amount: 77000,
      CloseDate: '2026-04-30',
      AccountName: 'Acme Corporation',
      Products: [
        { name: 'Enterprise License - Perpetual', qty: 1, unitPrice: 50000, total: 50000 },
        { name: 'Cloud Platform - Monthly', qty: 36, unitPrice: 2000, total: 72000 },
        { name: 'Implementation Services', qty: 1, unitPrice: 25000, total: 25000 },
      ],
    },
    fieldMapping: [
      { sfdc: 'Opportunity.Name', s4h: 'ZEST.ZEST_DESC (Solution Order Description)', value: 'Acme Corp - Enterprise Platform' },
      { sfdc: 'Opportunity.Amount', s4h: 'ZEST.NETWR (Net Amount)', value: '$77,000' },
      { sfdc: 'Opportunity.CloseDate', s4h: 'ZEST.ERDAT (Creation Date)', value: '2026-04-30' },
      { sfdc: 'Account.Name', s4h: 'KNA1.NAME1 (Customer Master)', value: 'Acme Corporation' },
      { sfdc: 'Account.BillingCity', s4h: 'KNA1.ORT01 (City)', value: 'New York' },
      { sfdc: 'Account.BillingCountry', s4h: 'KNA1.LAND1 (Country)', value: 'US' },
    ],
    apiPayload: {
      opportunity_id: 'OPP-2026-05-001',
      account_id: 'ACC-001234',
      account_name: 'Acme Corporation',
      total_amount: 77000,
      line_items: [
        { product_id: 'PROD-LICENSE', name: 'Enterprise License', qty: 1, unit_price: 50000 },
        { product_id: 'PROD-CLOUD', name: 'Cloud Platform', qty: 36, unit_price: 2000 },
        { product_id: 'PROD-SERVICES', name: 'Implementation Services', qty: 1, unit_price: 25000 },
      ],
    },
  },
  {
    id: 2,
    title: 'Solution Order API Call (MuleSoft/BTP)',
    description: 'Single API call to S/4HANA with all bundled products',
    apiCall: {
      endpoint: 'POST /api/sap/solution-orders/create',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SAP_OAuth_Token',
        'X-SFDC-Instance': 'na123.salesforce.com',
      },
      requestBody: {
        solutionOrderHeader: {
          customerId: 'CUST-001',
          customerName: 'Acme Corporation',
          customerAddress: '123 Business Ave, New York, NY 10001',
          contractValue: 77000,
          contractCurrency: 'USD',
          contractStartDate: '2026-05-01',
          contractEndDate: '2029-04-30',
          billingType: 'MIXED',
          sfdcOpportunityId: 'OPP-2026-05-001',
          sfdcAccountId: 'ACC-001234',
        },
        solutionOrderItems: [
          {
            lineNumber: 1,
            productId: 'PROD-LICENSE',
            productName: 'Enterprise License - Perpetual',
            productType: 'PERPETUAL_LICENSE',
            qty: 1,
            unitPrice: 50000,
            totalPrice: 50000,
            billingBehavior: 'ONE_TIME_DELIVERY',
          },
          {
            lineNumber: 2,
            productId: 'PROD-CLOUD',
            productName: 'Cloud Platform - Monthly SaaS',
            productType: 'SAAS_SUBSCRIPTION',
            qty: 36,
            unitPrice: 2000,
            totalPrice: 72000,
            billingBehavior: 'PERIODIC_MONTHLY',
            contractTerm: 36,
          },
          {
            lineNumber: 3,
            productId: 'PROD-SERVICES',
            productName: 'Implementation Services',
            productType: 'PROFESSIONAL_SERVICES',
            qty: 1,
            unitPrice: 25000,
            totalPrice: 25000,
            billingBehavior: 'MILESTONE_BASED',
            linkedSystem: 'WORKDAY_PSA',
          },
        ],
      },
    },
    responseStatus: 'HTTP 201 Created',
    responseBody: {
      solutionOrderNumber: 'ZEST-2026-000451',
      solutionOrderId: '0050M00000AZ1NQAT1',
      status: 'CREATED',
      message: 'Solution Order created successfully',
      timestamp: '2026-04-30T14:32:45Z',
    },
  },
  {
    id: 3,
    title: 'Solution Order Created in S/4HANA',
    description: 'Master SO record persisted with all line items',
    solutionOrderMaster: {
      header: {
        ZEST: 'ZEST-2026-000451',
        KUNNR: '0001234567',
        NAME: 'Acme Corporation',
        NETWR: 77000,
        WAERS: 'USD',
        ERDAT: '2026-04-30',
        ERZET: '143245',
        ERNAM: 'SFDC_INTEGRATION',
        ZEST_STAT: 'A',
        ZEST_DESC: 'Acme Corp - Enterprise Platform Bundle',
        VKORG: '1000',
        VTWEG: '10',
        SPART: '00',
        INCO1: 'FOB',
        ZSD_SFDC_OPP_ID: 'OPP-2026-05-001',
      },
      items: [
        {
          ZEST: 'ZEST-2026-000451',
          ZESTI: '10',
          MATNR: 'LICENSE-001',
          MAKTX: 'Enterprise License - Perpetual',
          MENGE: 1,
          MEINS: 'PC',
          NETPR: 50000,
          NETWR: 50000,
          ZTYPBEZ: 'PERPETUAL_LICENSE',
          ZBILBEZ: 'ONE_TIME_DELIVERY',
          ZKUNNR: '0001234567',
        },
        {
          ZEST: 'ZEST-2026-000451',
          ZESTI: '20',
          MATNR: 'CLOUD-SYS-001',
          MAKTX: 'Cloud Platform Monthly',
          MENGE: 36,
          MEINS: 'MO',
          NETPR: 2000,
          NETWR: 72000,
          ZTYPBEZ: 'SAAS_SUBSCRIPTION',
          ZBILBEZ: 'PERIODIC_MONTHLY',
          ZBILPRD: '36',
          ZKUNNR: '0001234567',
        },
        {
          ZEST: 'ZEST-2026-000451',
          ZESTI: '30',
          MATNR: 'SERVICE-IMPL-001',
          MAKTX: 'Implementation Services',
          MENGE: 1,
          MEINS: 'PC',
          NETPR: 25000,
          NETWR: 25000,
          ZTYPBEZ: 'PROFESSIONAL_SERVICES',
          ZBILBEZ: 'MILESTONE_BASED',
          ZEXTSYS: 'WORKDAY_PSA',
          ZKUNNR: '0001234567',
        },
      ],
    },
    glPosting: [
      { account: '1150 (AR Acme Corp)', debit: 77000, credit: 0, description: 'Solution Order created - Revenue contract recognized' },
      { account: '1920 (Deferred Revenue)', debit: 0, credit: 77000, description: 'Liability recognized for contract obligations' },
    ],
  },
  {
    id: 4,
    title: 'Item Category Routing & Sales Order Creation',
    description: 'Three separate SOs generated with different billing behaviors',
    routingLogic: [
      {
        lineNum: 10,
        solutionItem: 'SRQS (Standard Sales Item)',
        itemCategory: 'TAN (Tangible)',
        behavior: 'One-time delivery + billing',
        soNumber: 'SO-2026-001567',
      },
      {
        lineNum: 20,
        solutionItem: 'ZSUB (Cloud Subscription - Custom)',
        itemCategory: 'CBAO (Periodic Billing)',
        behavior: 'Monthly recurring billing',
        soNumber: 'SO-2026-001568',
      },
      {
        lineNum: 30,
        solutionItem: 'ZSRV (Services - Custom)',
        itemCategory: 'ZSRV (Milestone-Based)',
        behavior: 'Workday-triggered milestone billing',
        soNumber: 'SO-2026-001569',
      },
    ],
  },
  {
    id: 5,
    title: 'Sales Order #1: Perpetual License',
    description: 'Standard one-time delivery and billing',
    salesOrder1: {
      header: {
        VBELN: 'SO-2026-001567',
        KUNNR: '0001234567',
        KUNAG: '0001234567',
        KUNNW: '0001234567',
        NETWR: 50000,
        WAERS: 'USD',
        ERDAT: '2026-04-30',
        VSART: '01',
        INCO1: 'FOB',
        ZPARENT_ZEST: 'ZEST-2026-000451',
        ZPARENT_LINE: '10',
      },
      items: [
        {
          VBELN: 'SO-2026-001567',
          POSNR: '10',
          MATNR: 'LICENSE-001',
          MAKTX: 'Enterprise License - Perpetual',
          KWMENG: 1,
          MEINS: 'PC',
          NETPR: 50000,
          NETWR: 50000,
          PSTYV: 'TAN',
          ZITEMCAT: 'PERPETUAL_LICENSE',
        },
      ],
      timeline: [
        { date: '2026-05-01', event: 'SO Released', glPosting: 'AR +$50K, Deferred Rev -$50K' },
        { date: '2026-05-02', event: 'License Key Generated (Goods Receipt)', glPosting: 'Inventory cost recorded' },
        { date: '2026-05-02', event: 'Invoice Created (VF01)', glPosting: 'AR +$50K, Revenue +$50K' },
        { date: '2026-05-15', event: 'Payment Received', glPosting: 'Cash +$50K, AR -$50K' },
      ],
    },
  },
  {
    id: 6,
    title: 'Sales Order #2: Cloud SaaS Subscription',
    description: 'Periodic monthly billing with deferred revenue',
    salesOrder2: {
      header: {
        VBELN: 'SO-2026-001568',
        KUNNR: '0001234567',
        KUNAG: '0001234567',
        KUNNW: '0001234567',
        NETWR: 72000,
        WAERS: 'USD',
        ERDAT: '2026-04-30',
        ZPARENT_ZEST: 'ZEST-2026-000451',
        ZPARENT_LINE: '20',
      },
      items: [
        {
          VBELN: 'SO-2026-001568',
          POSNR: '10',
          MATNR: 'CLOUD-SYS-001',
          MAKTX: 'Cloud Platform Monthly',
          KWMENG: 36,
          MEINS: 'MO',
          NETPR: 2000,
          NETWR: 72000,
          PSTYV: 'CBAO',
          ZITEMCAT: 'SAAS_SUBSCRIPTION',
          ZBILPLAN: 'MONTHLY_36',
        },
      ],
      billingPlan: {
        VBELN: 'SO-2026-001568',
        FKART: 'ZF2',
        FKSDA: '2026-05-01',
        FKSPE: '36',
        NETWR_MONTH: 2000,
        SCHEDULE: [
          { month: 'May 2026', invoiceDate: '2026-05-01', amount: 2000, glPosting: 'Deferred Rev -2K, Revenue +2K' },
          { month: 'Jun 2026', invoiceDate: '2026-06-01', amount: 2000, glPosting: 'Deferred Rev -2K, Revenue +2K' },
          { month: '...', invoiceDate: '...', amount: '...', glPosting: 'Repeats monthly' },
          { month: 'Apr 2029', invoiceDate: '2029-04-01', amount: 2000, glPosting: 'Deferred Rev -2K, Revenue +2K' },
        ],
      },
      glPostingAtCreation: [
        { account: '1150 (AR)', amount: 72000, direction: 'DEBIT', description: 'Future billing obligation' },
        { account: '1920 (Deferred Revenue)', amount: 72000, direction: 'CREDIT', description: 'Unearned revenue liability' },
      ],
      glPostingMonthly: [
        { account: '1920 (Deferred Revenue)', amount: 2000, direction: 'DEBIT', description: 'Monthly obligation satisfied' },
        { account: '4200 (Cloud Revenue)', amount: 2000, direction: 'CREDIT', description: 'Monthly revenue recognized' },
      ],
    },
  },
  {
    id: 7,
    title: 'Sales Order #3: Professional Services (Workday-Linked)',
    description: 'Milestone-based billing triggered by Workday PSA',
    salesOrder3: {
      header: {
        VBELN: 'SO-2026-001569',
        KUNNR: '0001234567',
        KUNAG: '0001234567',
        KUNNW: '0001234567',
        NETWR: 25000,
        WAERS: 'USD',
        ERDAT: '2026-04-30',
        ZPARENT_ZEST: 'ZEST-2026-000451',
        ZPARENT_LINE: '30',
        ZEXTERNAL_SYSTEM: 'WORKDAY_PSA',
        ZEXTERNAL_PROJECT_ID: 'PROJ-AcmeCorp-001',
      },
      items: [
        {
          VBELN: 'SO-2026-001569',
          POSNR: '10',
          MATNR: 'SERVICE-IMPL-001',
          MAKTX: 'Implementation Services',
          KWMENG: 1,
          MEINS: 'PC',
          NETPR: 25000,
          NETWR: 25000,
          PSTYV: 'ZSRV',
          ZITEMCAT: 'PROFESSIONAL_SERVICES',
          ZBILBEZ: 'MILESTONE_BASED',
        },
      ],
      milestones: [
        {
          milestoneId: 'MS-001',
          name: 'Phase 1: Discovery & Requirements',
          budget: 5000,
          status: 'IN_PROGRESS',
          workdayStatus: 'Time entries logged',
          triggerAction: 'Awaiting milestone acceptance in Workday',
          sapAction: 'Waiting for API trigger',
        },
        {
          milestoneId: 'MS-002',
          name: 'Phase 2: Design & Architecture',
          budget: 10000,
          status: 'PENDING',
          workdayStatus: 'Not yet started',
          triggerAction: 'Milestone 1 must complete first',
          sapAction: 'Will auto-create invoice when triggered',
        },
        {
          milestoneId: 'MS-003',
          name: 'Phase 3: Implementation & Testing',
          budget: 10000,
          status: 'PENDING',
          workdayStatus: 'Not yet started',
          triggerAction: 'Milestone 2 must complete first',
          sapAction: 'Will auto-create invoice when triggered',
        },
      ],
      workdayIntegration: {
        projectId: 'PROJ-AcmeCorp-001',
        projectManager: 'John Smith',
        resourcingPlan: [
          { phase: 'Phase 1', seniorConsultant: 40, juniorConsultant: 0, architect: 0, totalHours: 40, billableAmount: 5000 },
          { phase: 'Phase 2', seniorConsultant: 40, juniorConsultant: 40, architect: 20, totalHours: 100, billableAmount: 10000 },
          { phase: 'Phase 3', seniorConsultant: 40, juniorConsultant: 60, architect: 0, totalHours: 100, billableAmount: 10000 },
        ],
        apiWebhook: 'https://s4hana-btp.sap.com/webhook/milestone-complete',
      },
    },
  },
  {
    id: 8,
    title: 'Milestone Trigger (Phase 1 Example)',
    description: 'Workday sends milestone acceptance → SAP auto-creates invoice',
    workdayToSap: {
      event: 'Phase 1 Milestone Marked Complete in Workday PSA',
      timestamp: '2026-05-15T16:32:00Z',
      payload: {
        projectId: 'PROJ-AcmeCorp-001',
        milestoneId: 'MS-001',
        milestoneName: 'Phase 1: Discovery & Requirements',
        billingAmount: 5000,
        approvedBy: 'John Smith',
        approvalDate: '2026-05-15',
        actualHours: 42,
        deliverables: [
          'Requirements Document (v3)',
          'Architecture Diagram',
          'Risk Assessment',
        ],
      },
      sapAction: 'Auto-create Billing Document',
    },
    billingDocumentCreated: {
      VBRK: {
        VBELN: 'BILL-2026-0567',
        KUNNR: '0001234567',
        NETWR: 5000,
        WAERS: 'USD',
        FKART: 'F2',
        FKDAT: '2026-05-15',
        ZPARENT_SO: 'SO-2026-001569',
        ZMILESTONE_ID: 'MS-001',
        ZWORKDAY_APPROVED: 'Y',
      },
    },
    glPostingMilestoneCompletion: [
      { account: '1150 (AR)', amount: 5000, direction: 'DEBIT', description: 'Invoice for Phase 1 services' },
      { account: '4300 (Services Revenue)', amount: 5000, direction: 'CREDIT', description: 'Phase 1 services revenue recognized' },
    ],
  },
  {
    id: 9,
    title: 'Financial Consolidation & RAR',
    description: 'All 3 SOs consolidated under parent Solution Order for IFRS 15',
    consolidation: {
      revenueContract: {
        contractId: 'ZEST-2026-000451',
        contractValue: 77000,
        performanceObligations: [
          {
            obligationId: 'PO-001-LICENSE',
            description: 'Perpetual License Delivery',
            sap_so: 'SO-2026-001567',
            standaloneSellingPrice: 50000,
            recognitionTiming: 'POINT_IN_TIME',
            recognitionDate: '2026-05-02',
            recognizedRevenue: 50000,
          },
          {
            obligationId: 'PO-002-SAAS',
            description: 'Cloud SaaS Service (36 months)',
            sap_so: 'SO-2026-001568',
            standaloneSellingPrice: 72000,
            recognitionTiming: 'OVER_TIME',
            recognitionMethod: 'MONTHLY',
            monthlyRevenue: 2000,
            totalRecognized: 2000,
            deferredToDate: '2029-04-01',
          },
          {
            obligationId: 'PO-003-SERVICES',
            description: 'Professional Services',
            sap_so: 'SO-2026-001569',
            standaloneSellingPrice: 25000,
            recognitionTiming: 'POINT_IN_TIME',
            recognitionTrigger: 'Milestone Completion',
            milestonesCompleted: 1,
            recognizedRevenue: 5000,
            pendingRevenue: 20000,
          },
        ],
        totalStandaloneSellingPrice: 147000,
        discountPercentage: '47.6%',
        discountAllocation: [
          { obligation: 'License', ssp: 50000, discount: '47.6%', allocatedAmount: 26200 },
          { obligation: 'SaaS', ssp: 72000, discount: '47.6%', allocatedAmount: 37700 },
          { obligation: 'Services', ssp: 25000, discount: '47.6%', allocatedAmount: 13100 },
        ],
        totalRevenueRecognized: 57000,
        deferredRevenue: 20000,
      },
      rarDashboard: {
        contractStatus: 'ACTIVE',
        percentComplete: '74.0%',
        invoicesGenerated: 2,
        invoicesPending: 1,
        totalBilledToDate: 57000,
        remainingPerformanceObligations: 20000,
        estimatedCompletionDate: '2029-04-30',
      },
    },
  },
];

const simulatorStyles = `
  .solution-order-detailed {
    padding: 2rem;
    min-height: 100vh;
  }

  .sod-header {
    margin-bottom: 2rem;
    border-bottom: 2px solid;
    padding-bottom: 1rem;
  }

  .sod-title {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .sod-subtitle {
    font-size: 1rem;
    opacity: 0.8;
  }

  .step-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .step-button {
    padding: 0.6rem 1.2rem;
    border: 2px solid;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .step-button:hover {
    transform: translateY(-2px);
  }

  .step-button.active {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .detail-section {
    border-radius: 8px;
    border: 1px solid;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .subsection {
    margin-bottom: 2rem;
  }

  .subsection-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    opacity: 0.9;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .data-table th {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 2px solid;
    font-weight: 600;
  }

  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid;
  }

  .data-table tr:hover {
    opacity: 0.8;
  }

  .json-block {
    background: rgba(0, 0, 0, 0.2);
    border-left: 4px solid;
    padding: 1rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    overflow-x: auto;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .gl-posting-table {
    width: 100%;
    border-collapse: collapse;
  }

  .gl-posting-table th {
    text-align: left;
    padding: 1rem;
    border-bottom: 2px solid;
    font-weight: 600;
  }

  .gl-posting-table td {
    padding: 1rem;
    border-bottom: 1px solid;
  }

  .debit {
    color: #10b981;
    font-weight: 600;
  }

  .credit {
    color: #ef4444;
    font-weight: 600;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 120px 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    border-left: 4px solid;
    margin-bottom: 1rem;
    border-radius: 4px;
  }

  .timeline-date {
    font-weight: 600;
    opacity: 0.9;
  }

  .timeline-event {
    font-weight: 600;
  }

  .timeline-gl {
    opacity: 0.8;
    font-size: 0.9rem;
  }

  .dark-mode {
    background-color: #0f1620;
    color: #e0e8f0;
  }

  .dark-mode .sod-header { border-bottom-color: #2a3a4a; }
  .dark-mode .sod-title { color: #00d4ff; }
  .dark-mode .detail-section {
    background: #1a2332;
    border-color: #2a3a4a;
  }
  .dark-mode .step-button {
    color: #e0e8f0;
    border-color: #2a3a4a;
  }
  .dark-mode .step-button.active {
    background: rgba(0, 212, 255, 0.2);
    border-color: #00d4ff;
    color: #00d4ff;
  }
  .dark-mode .data-table th { border-bottom-color: #2a3a4a; }
  .dark-mode .data-table td { border-bottom-color: #2a3a4a; }
  .dark-mode .json-block {
    background: rgba(0, 212, 255, 0.1);
    border-left-color: #00d4ff;
    color: #a0b0c0;
  }
  .dark-mode .gl-posting-table th { border-bottom-color: #2a3a4a; }
  .dark-mode .gl-posting-table td { border-bottom-color: #2a3a4a; }
  .dark-mode .timeline-item { border-left-color: #00d4ff; background: rgba(0, 212, 255, 0.05); }
  .dark-mode .section-title { color: #00d4ff; }

  .light-mode {
    background-color: #f5f5f5;
    color: #1f2937;
  }

  .light-mode .sod-header { border-bottom-color: #e2e8f0; }
  .light-mode .sod-title { color: #ff6b35; }
  .light-mode .detail-section {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .light-mode .step-button {
    color: #1f2937;
    border-color: #e2e8f0;
  }
  .light-mode .step-button.active {
    background: rgba(255, 107, 53, 0.1);
    border-color: #ff6b35;
    color: #ff6b35;
  }
  .light-mode .data-table th { border-bottom-color: #e2e8f0; }
  .light-mode .data-table td { border-bottom-color: #e2e8f0; }
  .light-mode .json-block {
    background: rgba(255, 107, 53, 0.05);
    border-left-color: #ff6b35;
  }
  .light-mode .gl-posting-table th { border-bottom-color: #e2e8f0; }
  .light-mode .gl-posting-table td { border-bottom-color: #e2e8f0; }
  .light-mode .timeline-item { border-left-color: #ff6b35; background: rgba(255, 107, 53, 0.02); }
  .light-mode .section-title { color: #ff6b35; }

  @media (max-width: 768px) {
    .data-table { font-size: 0.8rem; }
    .data-table th, .data-table td { padding: 0.5rem; }
    .timeline-item { grid-template-columns: 1fr; }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = simulatorStyles;
  document.head.appendChild(style);
}

export default function SolutionOrderSimulatorDetailed({ isDarkMode = true }: SAPSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];

  const renderStep1 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📊 Salesforce CPQ Data</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Opportunity Name</strong></td>
              <td>{step.sfdcData.OpportunityName}</td>
            </tr>
            <tr>
              <td><strong>Amount</strong></td>
              <td>${step.sfdcData.Amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Close Date</strong></td>
              <td>{step.sfdcData.CloseDate}</td>
            </tr>
            <tr>
              <td><strong>Account</strong></td>
              <td>{step.sfdcData.AccountName}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">🛒 Bundled Products (Line Items)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {step.sfdcData.Products.map((prod, idx) => (
              <tr key={idx}>
                <td>{prod.name}</td>
                <td>{prod.qty}</td>
                <td>${prod.unitPrice.toLocaleString()}</td>
                <td><strong>${prod.total.toLocaleString()}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">🔗 SFDC → SAP Field Mapping</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Salesforce Field</th>
              <th>SAP S/4HANA Table.Field</th>
              <th>Mapped Value</th>
            </tr>
          </thead>
          <tbody>
            {step.fieldMapping.map((mapping, idx) => (
              <tr key={idx}>
                <td><code>{mapping.sfdc}</code></td>
                <td><code>{mapping.s4h}</code></td>
                <td>{mapping.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📤 API Endpoint</div>
        <div className="json-block">
          {step.apiCall.endpoint}<br />
          <strong>Method:</strong> POST<br />
          <strong>Host:</strong> https://mulesoft-btp.example.com
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-title">🔑 Request Headers</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Header</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.apiCall.headers).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📝 Request Body (JSON)</div>
        <div className="json-block">
          {JSON.stringify(step.apiCall.requestBody, null, 2)}
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-title">✅ Response (HTTP 201 Created)</div>
        <div className="json-block">
          {JSON.stringify(step.apiCall.responseBody, null, 2)}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📋 Solution Order Header (ZEST Table)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Table Reference</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.solutionOrderMaster.header).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td><code>ZEST.{key}</code></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📄 Solution Order Items (ZESTI Table)</div>
        {step.solutionOrderMaster.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
            <strong>Line Item {idx + 1}: {item.MAKTX}</strong>
            <table className="data-table" style={{ marginTop: '1rem' }}>
              <tbody>
                {Object.entries(item).map(([key, value]) => (
                  <tr key={key}>
                    <td><code>{key}</code></td>
                    <td>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="subsection">
        <div className="subsection-title">💰 GL Posting at SO Creation</div>
        <table className="gl-posting-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {step.glPosting.map((posting, idx) => (
              <tr key={idx}>
                <td>{posting.account}</td>
                <td className={posting.debit > 0 ? 'debit' : ''}>{posting.debit > 0 ? `$${posting.debit.toLocaleString()}` : '—'}</td>
                <td className={posting.credit > 0 ? 'credit' : ''}>{posting.credit > 0 ? `$${posting.credit.toLocaleString()}` : '—'}</td>
                <td>{posting.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">🔀 Item Category Determination & Routing</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SO Item #</th>
              <th>Solution Item Type</th>
              <th>SD Item Category</th>
              <th>Billing Behavior</th>
              <th>Generated SO Number</th>
            </tr>
          </thead>
          <tbody>
            {step.routingLogic.map((route, idx) => (
              <tr key={idx}>
                <td><strong>Line {route.lineNum}</strong></td>
                <td><code>{route.solutionItem}</code></td>
                <td><code>{route.itemCategory}</code></td>
                <td>{route.behavior}</td>
                <td><strong style={{ color: '#00d4ff' }}>{route.soNumber}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📌 Key Configuration in IMG</div>
        <div className="json-block">
          IMG Path: SD > Sales Orders > Sales Order Types > Determination > Item Category Determination<br/><br/>
          Rule 1: Solution Item Type = SRQS → Item Category TAN (One-time delivery)<br/>
          Rule 2: Solution Item Type = ZSUB → Item Category CBAO (Periodic billing)<br/>
          Rule 3: Solution Item Type = ZSRV → Item Category ZSRV (Milestone-based)
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📋 SO #1 Header: {step.salesOrder1.header.VBELN}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
              <th>SAP Table</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.salesOrder1.header).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
                <td>VBAK</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📄 SO #1 Line Items</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
              <th>SAP Table</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.salesOrder1.items[0]).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
                <td>VBAP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📅 Execution Timeline & GL Impact</div>
        {step.salesOrder1.timeline.map((timeline, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-date">{timeline.date}</div>
            <div className="timeline-event">{timeline.event}</div>
            <div className="timeline-gl">{timeline.glPosting}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📋 SO #2 Header: {step.salesOrder2.header.VBELN}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.salesOrder2.header).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">💳 Billing Plan Configuration (VBRK + VBRS Tables)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.salesOrder2.billingPlan).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📅 Monthly Billing Schedule (Sample)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Billing Period</th>
              <th>Invoice Date</th>
              <th>Amount</th>
              <th>GL Posting</th>
            </tr>
          </thead>
          <tbody>
            {step.salesOrder2.billingPlan.SCHEDULE.map((sched, idx) => (
              <tr key={idx}>
                <td>{sched.month}</td>
                <td>{sched.invoiceDate}</td>
                <td>${typeof sched.amount === 'number' ? sched.amount.toLocaleString() : sched.amount}</td>
                <td style={{ fontSize: '0.85rem' }}>{sched.glPosting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">💰 GL Impact at SO Creation</div>
        <table className="gl-posting-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {step.salesOrder2.glPostingAtCreation.map((posting, idx) => (
              <tr key={idx}>
                <td>{posting.account}</td>
                <td>${posting.amount.toLocaleString()}</td>
                <td className={posting.direction === 'DEBIT' ? 'debit' : 'credit'}>{posting.direction}</td>
                <td>{posting.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">💰 GL Impact Monthly (Recurring)</div>
        <table className="gl-posting-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {step.salesOrder2.glPostingMonthly.map((posting, idx) => (
              <tr key={idx}>
                <td>{posting.account}</td>
                <td>${posting.amount.toLocaleString()}</td>
                <td className={posting.direction === 'DEBIT' ? 'debit' : 'credit'}>{posting.direction}</td>
                <td>{posting.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📋 SO #3 Header: {step.salesOrder3.header.VBELN}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.salesOrder3.header).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">🎯 Milestones (Workday-Linked)</div>
        {step.salesOrder3.milestones.map((milestone, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
            <strong>{milestone.name}</strong>
            <table className="data-table" style={{ marginTop: '0.75rem' }}>
              <tbody>
                <tr>
                  <td><strong>Budget</strong></td>
                  <td>${milestone.budget.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>{milestone.status}</td>
                </tr>
                <tr>
                  <td><strong>Workday Status</strong></td>
                  <td>{milestone.workdayStatus}</td>
                </tr>
                <tr>
                  <td><strong>Trigger Action</strong></td>
                  <td>{milestone.triggerAction}</td>
                </tr>
                <tr>
                  <td><strong>SAP Action</strong></td>
                  <td>{milestone.sapAction}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="subsection">
        <div className="subsection-title">👥 Workday PSA Integration</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Project ID</strong></td>
              <td>{step.salesOrder3.workdayIntegration.projectId}</td>
            </tr>
            <tr>
              <td><strong>Project Manager</strong></td>
              <td>{step.salesOrder3.workdayIntegration.projectManager}</td>
            </tr>
            <tr>
              <td><strong>Webhook Endpoint</strong></td>
              <td><code style={{ fontSize: '0.8rem' }}>{step.salesOrder3.workdayIntegration.apiWebhook}</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📊 Resourcing Plan</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Senior Consultant</th>
              <th>Junior Consultant</th>
              <th>Architect</th>
              <th>Total Hours</th>
              <th>Billable Amount</th>
            </tr>
          </thead>
          <tbody>
            {step.salesOrder3.workdayIntegration.resourcingPlan.map((plan, idx) => (
              <tr key={idx}>
                <td><strong>{plan.phase}</strong></td>
                <td>{plan.seniorConsultant}h</td>
                <td>{plan.juniorConsultant}h</td>
                <td>{plan.architect}h</td>
                <td>{plan.totalHours}h</td>
                <td><strong>${plan.billableAmount.toLocaleString()}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">🔔 Milestone Completion Event (Workday → S/4HANA Webhook)</div>
        <div className="json-block">
          <strong>Event Timestamp:</strong> {step.workdayToSap.timestamp}<br/>
          <strong>Event Type:</strong> {step.workdayToSap.event}
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-title">📤 Webhook Payload (Sent from Workday)</div>
        <div className="json-block">
          {JSON.stringify(step.workdayToSap.payload, null, 2)}
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-title">✅ S/4HANA Auto-Generated Billing Document</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
              <th>SAP Table</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.billingDocumentCreated.VBRK).map(([key, value]) => (
              <tr key={key}>
                <td><code>{key}</code></td>
                <td>{String(value)}</td>
                <td>VBRK</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">💰 GL Posting (Milestone Completion)</div>
        <table className="gl-posting-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {step.glPostingMilestoneCompletion.map((posting, idx) => (
              <tr key={idx}>
                <td>{posting.account}</td>
                <td>${posting.amount.toLocaleString()}</td>
                <td className={posting.direction === 'DEBIT' ? 'debit' : 'credit'}>{posting.direction}</td>
                <td>{posting.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div>
      <div className="subsection">
        <div className="subsection-title">📊 Revenue Contract Consolidation (IFRS 15 / ASC 606)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Contract ID (Parent)</strong></td>
              <td><strong>{step.consolidation.revenueContract.contractId}</strong></td>
            </tr>
            <tr>
              <td><strong>Total Contract Value</strong></td>
              <td>${step.consolidation.revenueContract.contractValue.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Contract Term</strong></td>
              <td>3 years (2026-05-01 to 2029-04-30)</td>
            </tr>
            <tr>
              <td><strong>Number of Performance Obligations</strong></td>
              <td>{step.consolidation.revenueContract.performanceObligations.length}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">🎯 Performance Obligations Breakdown</div>
        {step.consolidation.revenueContract.performanceObligations.map((ob, idx) => (
          <div key={idx} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
            <strong>PO-{idx + 1:03}: {ob.description}</strong>
            <table className="data-table" style={{ marginTop: '1rem' }}>
              <tbody>
                <tr>
                  <td><strong>Linked Sales Order</strong></td>
                  <td><code>{ob.sap_so}</code></td>
                </tr>
                <tr>
                  <td><strong>Standalone Selling Price (SSP)</strong></td>
                  <td>${ob.standaloneSellingPrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Recognition Timing</strong></td>
                  <td>{ob.recognitionTiming}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>{ob.recognitionMethod ? `${ob.recognitionMethod}` : ob.recognitionTrigger || 'At delivery'}</td>
                </tr>
                <tr>
                  <td><strong>Recognized Revenue</strong></td>
                  <td><strong className="debit">${ob.recognizedRevenue.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="subsection">
        <div className="subsection-title">💰 Discount Allocation (SSP-Based)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Performance Obligation</th>
              <th>Standalone Selling Price</th>
              <th>% of Total SSP</th>
              <th>Discount Applied</th>
              <th>Allocated Amount</th>
            </tr>
          </thead>
          <tbody>
            {step.consolidation.revenueContract.discountAllocation.map((alloc, idx) => (
              <tr key={idx}>
                <td><strong>{alloc.obligation}</strong></td>
                <td>${alloc.ssp.toLocaleString()}</td>
                <td>{(alloc.ssp / step.consolidation.revenueContract.totalStandaloneSellingPrice * 100).toFixed(1)}%</td>
                <td>{alloc.discount}</td>
                <td><strong>${alloc.allocatedAmount.toLocaleString()}</strong></td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: 'rgba(0,0,0,0.1)' }}>
              <td>TOTAL</td>
              <td>${step.consolidation.revenueContract.totalStandaloneSellingPrice.toLocaleString()}</td>
              <td>100%</td>
              <td>—</td>
              <td>${step.consolidation.revenueContract.contractValue.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <div className="subsection-title">📊 RAR Dashboard Metrics</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(step.consolidation.rarDashboard).map(([key, value]) => (
              <tr key={key}>
                <td><strong>{key.replace(/_/g, ' ')}</strong></td>
                <td>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      case 5: return renderStep6();
      case 6: return renderStep7();
      case 7: return renderStep8();
      case 8: return renderStep9();
      default: return null;
    }
  };

  return (
    <div className={`solution-order-detailed ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="sod-header">
        <h1 className="sod-title">{detailedScenario.title}</h1>
        <p className="sod-subtitle">{detailedScenario.subtitle}</p>
      </div>

      <div className="step-selector">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            className={`step-button ${idx === currentStep ? 'active' : ''}`}
            onClick={() => setCurrentStep(idx)}
          >
            Step {s.id}: {s.title.split(':')[0]}
          </button>
        ))}
      </div>

      <div className="detail-section">
        <div className="section-title">
          {step.id}. {step.title}
        </div>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>{step.description}</p>

        {renderStepContent()}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentStep === 0 ? 'transparent' : isDarkMode ? '#00d4ff' : '#ff6b35',
              color: currentStep === 0 ? '#666' : isDarkMode ? '#0f1620' : '#fff',
              border: '2px solid',
              borderColor: isDarkMode ? '#2a3a4a' : '#e2e8f0',
              borderRadius: '4px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: currentStep === 0 ? 0.5 : 1,
            }}
          >
            ← Previous
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 600 }}>
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            style={{
              padding: '0.75rem 1.5rem',
              background: currentStep === steps.length - 1 ? 'transparent' : isDarkMode ? '#00d4ff' : '#ff6b35',
              color: currentStep === steps.length - 1 ? '#666' : isDarkMode ? '#0f1620' : '#fff',
              border: '2px solid',
              borderColor: isDarkMode ? '#2a3a4a' : '#e2e8f0',
              borderRadius: '4px',
              cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: currentStep === steps.length - 1 ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
