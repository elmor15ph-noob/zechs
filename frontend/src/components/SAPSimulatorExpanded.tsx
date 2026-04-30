import React, { useState } from 'react';
import { icons } from '../theme/icons';
import { colors } from '../theme/designSystem';

interface SimulationStep {
  id: number;
  name: string;
  code: string;
  module: string;
  description: string;
  details: string;
  explanation: string;
  glImpact?: { account: string; amount: number; effect: 'debit' | 'credit' }[];
  crossModuleImpact?: string[];
}

interface SAPSimulatorProps {
  isDarkMode?: boolean;
}

// Process Flows: 6 Complete Enterprise Scenarios
const scenarios = {
  O2C: {
    name: 'Order-to-Cash (Sales & Billing)',
    module: 'SD / FI / AR',
    description: 'End-to-end sales order processing, delivery, billing, and cash collection',
    steps: [
      {
        id: 1,
        name: 'Sales Order Creation',
        code: 'VA01',
        module: 'SD',
        description: 'Customer places an order',
        details: 'Document type: SO | Module: SD',
        explanation: 'Sales Order created in transaction VA01. System validates material availability, customer credit, and pricing. Inventory demand reserved (not yet decremented). GL posting records sales order acknowledgment.',
        glImpact: [{ account: '1150 (AR)', amount: 10000, effect: 'debit' }, { account: '4100 (Revenue)', amount: 10000, effect: 'credit' }],
        crossModuleImpact: ['MM: Inventory demand noted', 'FI: AR subledger initialized', 'CO: Sales order cost center assigned'],
      },
      {
        id: 2,
        name: 'Picking & Packing',
        code: 'MB1A',
        module: 'LE/MM',
        description: 'Warehouse picks materials from bins',
        details: 'Module: LE | Stock type: Unrestricted',
        explanation: 'Warehouse personnel pick materials using mobile app (Fiori). Goods movement MB1A decrements available inventory. Material ledger (HANA) updated in real-time. GR/IR clearing account prepared for invoice matching.',
        glImpact: [{ account: '1200 (Inventory)', amount: 6000, effect: 'credit' }, { account: '5000 (COGS)', amount: 6000, effect: 'debit' }],
        crossModuleImpact: ['MM: Stock reduced', 'QM: Quality check (if configured)', 'PM: Equipment wear tracked'],
      },
      {
        id: 3,
        name: 'Goods Issue / Delivery',
        code: 'VL02N',
        module: 'SD/LE',
        description: 'Issue goods for delivery to customer',
        details: 'Document type: DN | Status: Delivered',
        explanation: 'Delivery document (VL02N) created. Final goods removal from warehouse. GL posting reflects goods issued and cost of goods sold (COGS). Customer receives tracking information. Billing document triggered.',
        glImpact: [{ account: '1200 (Inventory)', amount: 6000, effect: 'credit' }, { account: '5100 (COGS)', amount: 6000, effect: 'debit' }],
        crossModuleImpact: ['LE: Shipping status updated', 'SD: Revenue recognition triggered', 'FI: COGS posted'],
      },
      {
        id: 4,
        name: 'Billing / Invoice',
        code: 'VF01',
        module: 'SD/FI',
        description: 'Create and post invoice to customer',
        details: 'Document type: INV | Module: SD/FI',
        explanation: 'Invoice created (VF01) and posted to GL. FI recognizes revenue in P&L. AR subledger entry created. Payment terms and due date set based on customer master. System validates billing against delivery and PO.',
        glImpact: [{ account: '1150 (AR)', amount: 10000, effect: 'debit' }, { account: '4100 (Sales Revenue)', amount: 10000, effect: 'credit' }],
        crossModuleImpact: ['FI: Revenue recognized (IFRS 15)', 'AR: Invoice record created', 'Analytics: Sales KPI updated'],
      },
      {
        id: 5,
        name: 'Payment Received & Clearing',
        code: 'F110/FF58',
        module: 'FI/AR/Cash',
        description: 'Customer payment received and matched to invoice',
        details: 'Module: FI | Status: Paid in Full',
        explanation: 'Payment received via bank (F110 - Automatic Clearing House). Bank reconciliation (FF58) matches payment to invoice. AR invoice marked as fully paid. Cash position updated. O2C cycle complete.',
        glImpact: [{ account: '1000 (Cash)', amount: 10000, effect: 'debit' }, { account: '1150 (AR)', amount: 10000, effect: 'credit' }],
        crossModuleImpact: ['Cash position updated', 'DSO (Days Sales Outstanding) calculated', 'Customer credit limit restored'],
      },
    ],
  },

  P2P: {
    name: 'Procure-to-Pay (Purchasing & Payments)',
    module: 'MM / PO / FI / AP',
    description: 'End-to-end procurement from purchase requisition through supplier payment',
    steps: [
      {
        id: 1,
        name: 'Purchase Requisition',
        code: 'ME51N',
        module: 'MM',
        description: 'Department creates purchase request for materials',
        details: 'Document type: PR | Module: MM',
        explanation: 'Purchase requisition (ME51N) created by materials planning or requester. System validates material master data, vendor information, and budget availability. PR routed to procurement for approval.',
        glImpact: [],
        crossModuleImpact: ['CO: Budget check performed', 'MM: Material demand recorded', 'Procurement: Sourcing initiated'],
      },
      {
        id: 2,
        name: 'Purchase Order Creation',
        code: 'ME21N',
        module: 'MM/PO',
        description: 'Procurement creates PO with supplier',
        details: 'Document type: PO | Status: Released',
        explanation: 'Purchase Order (ME21N) created with selected vendor. System applies pricing, payment terms, delivery date. PO can be sent to vendor via EDI/email. Purchasing data (lead time, min order qty) incorporated.',
        glImpact: [],
        crossModuleImpact: ['Vendor: Purchase history updated', 'Procurement: Order placed', 'Logistics: Delivery expected date noted'],
      },
      {
        id: 3,
        name: 'Goods Receipt',
        code: 'MIGO',
        module: 'MM/LE',
        description: 'Goods arrive and are received into warehouse',
        details: 'Module: LE | Stock type: Blocked (if QM inspection required)',
        explanation: 'Goods receipt (MIGO) posted upon receiving material at dock. Inventory created in material management. If inspection required (QM), stock remains blocked until inspection completes. Three-way match begins (PO → GR → Invoice).',
        glImpact: [{ account: '1200 (Inventory)', amount: 5000, effect: 'debit' }, { account: '2000 (GR/IR Accrual)', amount: 5000, effect: 'credit' }],
        crossModuleImpact: ['QM: Inspection lot created', 'MM: Stock increased', 'FI: GR/IR account updated'],
      },
      {
        id: 4,
        name: 'Invoice Receipt & Matching',
        code: 'MIRO',
        module: 'FI/AP',
        description: 'Supplier invoice received and matched to PO/GR',
        details: 'Document type: IV | Module: FI/AP',
        explanation: 'Invoice receipt (MIRO) matches supplier invoice to PO and Goods Receipt (3-way match). System validates amounts, quantities, payment terms. Any discrepancies held for manual review (invoice parking). AP subledger entry created.',
        glImpact: [{ account: '2000 (GR/IR)', amount: 5000, effect: 'debit' }, { account: '2100 (AP)', amount: 5000, effect: 'credit' }],
        crossModuleImpact: ['AP: Vendor invoice record created', 'FI: Payables recorded', 'Vendor: Purchase history + invoice count'],
      },
      {
        id: 5,
        name: 'Supplier Payment',
        code: 'F110',
        module: 'FI/AP/Cash',
        description: 'Supplier payment processed and sent',
        details: 'Module: FI | Status: Paid',
        explanation: 'Automatic payment program (F110) selects open invoices for payment based on payment terms. Payment method (check, ACH, wire) selected. AP cleared. Cash position decreased. Supplier relationship metrics updated.',
        glImpact: [{ account: '2100 (AP)', amount: 5000, effect: 'debit' }, { account: '1000 (Cash)', amount: 5000, effect: 'credit' }],
        crossModuleImpact: ['Cash position decreased', 'Supplier KPIs updated', 'Budget consumed'],
      },
    ],
  },

  S2R: {
    name: 'Stock-to-Replenishment (Inventory Management)',
    module: 'MM / LE / Analytics',
    description: 'Continuous inventory replenishment based on consumption and demand signals',
    steps: [
      {
        id: 1,
        name: 'Demand Forecast / MRP',
        code: 'MD04',
        module: 'MM/PP',
        description: 'System calculates replenishment requirements',
        details: 'Module: MM | Type: Demand-driven',
        explanation: 'Material Requirements Planning (MRP) run (MD04) analyzes current stock, safety levels, lead times, and forecasted demand. System recommends purchase quantities and reorder dates. Planned orders created for review.',
        crossModuleImpact: ['Analytics: Demand signals analyzed', 'Procurement: PRs auto-generated', 'Supply chain: Planning optimized'],
      },
      {
        id: 2,
        name: 'Stock Allocation & ABC',
        code: 'MMBE',
        module: 'MM/LE',
        description: 'Allocate stock across locations based on priority',
        details: 'Module: LE | Classification: ABC',
        explanation: 'Stock allocation (MMBE) prioritizes critical materials (A-class: fast-moving, high-value) to primary locations for quick access. Slow-moving (C-class) items stored in remote locations. Optimizes picking time and warehouse layout.',
        crossModuleImpact: ['LE: Warehouse layout optimized', 'Picking: Efficiency improved', 'Analytics: Inventory metrics tracked'],
      },
      {
        id: 3,
        name: 'Cycle Counting & Quality',
        code: 'MI07',
        module: 'MM/QM',
        description: 'Physical inventory verification (continuous)',
        details: 'Module: MM | Type: Continuous Cycle Count',
        explanation: 'Cycle counting (MI07) continuously verifies physical inventory against system records. High-value items counted weekly, low-value monthly. Discrepancies investigated. Improves data quality vs. annual physical inventory.',
        glImpact: [{ account: '1200 (Inventory)', amount: 100, effect: 'debit' }, { account: '7100 (Shrinkage)', amount: 100, effect: 'credit' }],
        crossModuleImpact: ['QM: Accuracy metrics tracked', 'Analytics: Inventory health monitored', 'Finance: Variance analysis'],
      },
      {
        id: 4,
        name: 'Consumption Posting',
        code: 'MB1A',
        module: 'MM/PP',
        description: 'Materials consumed in production or sales',
        details: 'Module: MM | Movement: Goods Issue',
        explanation: 'As materials are consumed (sales picking, production backflush), inventory is decremented (MB1A). FIFO or weighted-average costing applied. GL posting reduces inventory value, increases COGS.',
        glImpact: [{ account: '1200 (Inventory)', amount: 3000, effect: 'credit' }, { account: '5100 (COGS)', amount: 3000, effect: 'debit' }],
        crossModuleImpact: ['FI: COGS recorded', 'Analytics: Turnover calculated', 'Demand: Signals updated'],
      },
      {
        id: 5,
        name: 'Replenishment Receipt',
        code: 'MIGO',
        module: 'MM/LE',
        description: 'New stock arrives and is received',
        details: 'Module: LE | Stock: Unrestricted',
        explanation: 'Replenishment purchase order arrives. Goods receipt (MIGO) posts stock. Cycle closes and restarts. System tracks inventory turnover, Days Inventory Outstanding (DIO), and stockout risk.',
        glImpact: [{ account: '1200 (Inventory)', amount: 5000, effect: 'debit' }, { account: '2000 (GR/IR)', amount: 5000, effect: 'credit' }],
        crossModuleImpact: ['Supply chain balanced', 'Analytics: Turnover refreshed', 'Demand forecast adjusted'],
      },
    ],
  },

  M2O: {
    name: 'Make-to-Order (Production Planning)',
    module: 'PP / MM / CO / QM',
    description: 'Production order creation through manufacturing completion and goods receipt',
    steps: [
      {
        id: 1,
        name: 'Production Order Creation',
        code: 'CO01',
        module: 'PP',
        description: 'Create work order for manufacturing run',
        details: 'Document type: PO | Status: Created',
        explanation: 'Production order (CO01) created from demand or sales order. BOM expanded to component requirements. Routing assigned with operation details, labor codes, equipment. Plant, cost center assigned for expense tracking.',
        glImpact: [{ account: '1300 (WIP)', amount: 10000, effect: 'debit' }, { account: '7000 (Production Cost)', amount: 10000, effect: 'credit' }],
        crossModuleImpact: ['MM: Components reserved', 'PM: Machine schedules updated', 'CO: Cost order created'],
      },
      {
        id: 2,
        name: 'Material Component Backflush',
        code: 'MB1B',
        module: 'MM/PP',
        description: 'Components automatically deducted from inventory',
        details: 'Module: MM | Type: Backflush',
        explanation: 'Upon production order confirmation, components are automatically backflushed (MB1B) from inventory based on actual completion qty. Alternative: manual component issue (MB1A). Reduces data entry, improves accuracy.',
        glImpact: [{ account: '1200 (Inventory)', amount: 6000, effect: 'credit' }, { account: '1300 (WIP)', amount: 6000, effect: 'debit' }],
        crossModuleImpact: ['MM: Stock reduced', 'Supply chain: Consumption signals sent', 'Analytics: Material flow tracked'],
      },
      {
        id: 3,
        name: 'Manufacturing Execution',
        code: 'IW51/CONFOP',
        module: 'PP/PM',
        description: 'Execute production operations with labor tracking',
        details: 'Module: PP | Status: In Progress',
        explanation: 'Production team executes operations per routing. Labor time recorded (IW51) per operation. Equipment utilization tracked. Quality inspections performed at checkpoints. Any deviations logged for traceability.',
        glImpact: [{ account: '7100 (Labor)', amount: 2000, effect: 'debit' }, { account: '2200 (Accrued Labor)', amount: 2000, effect: 'credit' }],
        crossModuleImpact: ['HCM: Labor hours tracked', 'PM: Equipment maintenance alerts triggered', 'QM: Inspection lots created'],
      },
      {
        id: 4,
        name: 'Quality Inspection',
        code: 'QI01N',
        module: 'QM/PP',
        description: 'Final inspection before goods receipt',
        details: 'Module: QM | Status: Accept/Reject',
        explanation: 'Final quality inspection performed (QI01N). Sample drawn based on AQL (Acceptable Quality Level). Characteristics measured (dimension, weight, performance). Accept/Reject decision made. Nonconforming units trigger NCM workflow.',
        crossModuleImpact: ['PP: Release decision', 'QM: Defect history tracked', 'Analytics: First-pass yield calculated'],
      },
      {
        id: 5,
        name: 'Goods Receipt (Finished Goods)',
        code: 'MIGO',
        module: 'PP/MM',
        description: 'Post finished goods to inventory',
        details: 'Module: MM | Stock Type: Unrestricted',
        explanation: 'Production order confirmed and finished goods received (MIGO). WIP inventory transferred to finished goods stock. Production costs finalized. Actual costs vs. standard costs analyzed. Order closed.',
        glImpact: [{ account: '1200 (Inventory-FG)', amount: 10000, effect: 'debit' }, { account: '1300 (WIP)', amount: 10000, effect: 'credit' }],
        crossModuleImpact: ['Inventory: Finished goods increased', 'Analytics: Production KPIs updated', 'SD: Ready-to-ship items available'],
      },
    ],
  },

  R2R: {
    name: 'Request-to-Resolve (Service Management)',
    module: 'CS / LE / FI / PM',
    description: 'Service request through resolution, parts logistics, and billing',
    steps: [
      {
        id: 1,
        name: 'Service Request / Warranty Check',
        code: 'CRM_CREATE',
        module: 'CS',
        description: 'Customer initiates service request',
        details: 'Module: CS | Type: Warranty/Billable',
        explanation: 'Service request created (mobile app or portal). System checks warranty status, service contract, entitlement. If in warranty: free service. If out: charge customer or offer extended warranty. Technician assigned based on location + skills.',
        crossModuleImpact: ['Warranty: Entitlement verified', 'AR: Billable determination made', 'PM: Service parts pre-allocated'],
      },
      {
        id: 2,
        name: 'Field Technician Dispatch',
        code: 'SC01N',
        module: 'CS/LE',
        description: 'Technician assigned and routed to customer location',
        details: 'Module: CS | Status: Dispatched',
        explanation: 'Service order (SC01N) created. Technician with required certifications assigned. Route optimization calculates optimal sequence of customer visits. Spare parts pre-picked and checked out from inventory. Mobile app notifies technician.',
        glImpact: [{ account: '1500 (Spare Parts)', amount: 500, effect: 'credit' }, { account: '5200 (Service Parts Used)', amount: 500, effect: 'debit' }],
        crossModuleImpact: ['LE: Spare parts reserved', 'PM: Field equipment tracking', 'Logistics: Route optimization'],
      },
      {
        id: 3,
        name: 'Service Execution',
        code: 'IW51/CAPTURE',
        module: 'CS/PM',
        description: 'Technician performs service at customer site',
        details: 'Module: CS | Status: In Progress',
        explanation: 'Technician executes service (repair, preventive maintenance, replacement). Labor time recorded. Spare parts consumed logged. Defects documented with photos. SLA tracked (response time, resolution time).',
        glImpact: [{ account: '5250 (Service Labor)', amount: 400, effect: 'debit' }, { account: '2300 (Accrued Service Labor)', amount: 400, effect: 'credit' }],
        crossModuleImpact: ['HCM: Technician hours logged', 'Equipment: Service history updated', 'Analytics: MTTR calculated'],
      },
      {
        id: 4,
        name: 'Service Completion & Invoice',
        code: 'SC02N/VF01',
        module: 'CS/FI/AR',
        description: 'Close service order and create invoice',
        details: 'Module: FI | Type: Service Invoice',
        explanation: 'Service order closed (SC02N). Invoice generated (VF01) with labor hours (if billable) + spare parts consumed. If warranty: no charge. If out-of-warranty: customer charged. GL posting records service revenue.',
        glImpact: [{ account: '1150 (AR)', amount: 900, effect: 'debit' }, { account: '4150 (Service Revenue)', amount: 900, effect: 'credit' }],
        crossModuleImpact: ['AR: Billable revenue recognized', 'Analytics: Service profitability tracked', 'Customer: Invoice sent'],
      },
      {
        id: 5,
        name: 'Payment & Warranty Accrual',
        code: 'F110/ACCRUE',
        module: 'FI/AR/Warranty',
        description: 'Collect payment and adjust warranty reserves',
        details: 'Module: FI | Status: Complete',
        explanation: 'Customer payment received. AR cleared. Warranty accruals adjusted based on service costs. Extended warranty revenue recognized over contract term (IFRS 15). Service KPIs updated (first-call resolution, customer satisfaction).',
        glImpact: [{ account: '1000 (Cash)', amount: 900, effect: 'debit' }, { account: '1150 (AR)', amount: 900, effect: 'credit' }],
        crossModuleImpact: ['Service analytics: KPIs updated', 'Customer lifetime value: Calculated', 'Warranty reserves: Adjusted'],
      },
    ],
  },

  INTEGRATED: {
    name: '🌐 Integrated Enterprise Flow (All 12 Modules)',
    module: 'O2C + P2P + Production + Service + Analytics',
    description: 'Real-world scenario showing how all 12 SAP S/4HANA modules interact in an end-to-end business process',
    steps: [
      {
        id: 1,
        name: 'Sales Order Creates Demand',
        code: 'VA01',
        module: 'SD → PP → MM → QM',
        description: 'Customer SO triggers planning cascades',
        details: 'Modules involved: 7 (Sales, Inventory, Planning, Finance, Logistics, Quality)',
        explanation: '✅ SD: Sales Order created → ✅ PP: Production order planned → ✅ MM: Stock allocated → ✅ QM: Inspection checkpoints scheduled → ✅ PM: Equipment maintenance scheduled → ✅ CO: Cost tracking initialized → ✅ Analytics: Demand signal recorded',
        crossModuleImpact: ['SD→PP: Production triggered', 'PP→MM: Component demand raised', 'MM→LE: Warehouse planning updated', 'All→Analytics: KPIs refreshed', 'All→FI: GL accounts impacted'],
      },
      {
        id: 2,
        name: 'Procurement & Manufacturing',
        code: 'ME21N + CO01',
        module: 'MM/P2P → PP → QM → PM',
        description: 'Components sourced while production executes',
        details: 'Modules: 10 (Procurement, Production, Quality, Maintenance, Finance)',
        explanation: '✅ P2P: PO created for component shortage → ✅ PP: Production run started (BOM exploded) → ✅ MM: Components backflushed on completion → ✅ QM: In-process inspections performed → ✅ PM: Equipment health monitored (predictive alerts) → ✅ LE: Material flow optimized → ✅ CO: Labor costs accrued → ✅ HCM: Technician hours tracked → ✅ FI: All costs posted to GL',
        crossModuleImpact: ['PP→QM: Inspections triggered', 'MM→LE: Stock positions updated', 'P2P→FI: Invoice accruals', 'PM→Analytics: Equipment trending'],
      },
      {
        id: 3,
        name: 'Finished Goods Ready',
        code: 'MIGO',
        module: 'PP → MM → SD → LE → Analytics',
        description: 'Production complete, goods ready for shipment',
        details: 'Modules: 8 (Production, Materials, Sales, Logistics, Finance, Quality, Analytics, Accounting)',
        explanation: '✅ PP: Production order closed (actual vs. standard cost variance calculated) → ✅ MM: FG inventory increased (stock position visible to sales) → ✅ SD: Materials now available for customer shipment → ✅ LE: Picking/packing wave can be created → ✅ QM: Final inspection results archived → ✅ PM: Equipment maintenance history logged → ✅ FI: Production costs finalized & GL posted → ✅ Analytics: Manufacturing KPIs (cycle time, yields, costs) updated',
        crossModuleImpact: ['All→Analytics: Real-time dashboards updated', 'PP→FI: Variance analysis', 'MM→SD: Fulfillment now possible'],
      },
      {
        id: 4,
        name: 'Fulfillment & Delivery',
        code: 'VL02N + MIGO',
        module: 'LE → SD → FI → CS → Analytics',
        description: 'Goods picked, packed, and shipped to customer',
        details: 'Modules: 10 (Logistics, Sales, Finance, Service, Inventory, Warehouse, Quality, Analytics, Revenue Recognition)',
        explanation: '✅ LE: Pick wave created → Technician picks materials (barcode scan) → Packing validated → QC sign-off → ✅ SD: Delivery document created (VL02N) → Revenue recognition triggered → ✅ CS: Service contract linked (warranty info attached) → ✅ FI: COGS posted (inventory reduced, revenue recognized per IFRS 15) → ✅ Analytics: Order fulfillment KPI tracked (Days to Ship) → ✅ PM: Logistics equipment (conveyor, sorter) usage logged → ✅ MDG: Customer & product master data quality validated',
        crossModuleImpact: ['LE→SD: Shipping updates SO', 'MM→FI: COGS posting', 'SD→AR: Revenue & AR recorded', 'All→Analytics: Fulfillment metrics'],
      },
      {
        id: 5,
        name: 'Invoice, Payment & Warranty',
        code: 'VF01 + F110 + CS',
        module: 'SD/FI → AR → CS → Analytics → HCM',
        description: 'Billing, payment collection, and service warranty setup',
        details: 'Modules: 12 (All integrated: SD, FI, AR, CS, MM, LE, PP, CO, QM, PM, Analytics, HCM)',
        explanation: '✅ SD: Invoice created (VF01) → ✅ FI: Revenue posted to GL (IFRS 15 compliance) → AR subledger updated → ✅ AR: Payment terms set, due date calculated → ✅ F110: Automatic payment processing (customer payment matched) → Cash position updated → ✅ CS: Service contract entitlements initialized (warranty start date, coverage limits) → ✅ Analytics: Full O2C cycle tracked (Days Sales Outstanding, Gross Margin, Customer Lifetime Value) → ✅ HCM: Sales commission (if applicable) calculated on deal size → ✅ MDG: All master data transactions audited → ✅ All Modules: Real-time dashboards reflect complete business transaction',
        crossModuleImpact: ['Complete integration: All 12 modules active', 'GL consolidated (P&L impact visible)', 'Analytics: End-to-end profitability calculated', 'Predictive: Next best actions suggested (upsell, cross-sell, service renewal)'],
      },
    ],
  },
};

const simulatorStyles = `
  .sap-expanded-simulator {
    padding: 2rem;
    min-height: 100vh;
  }

  .scenario-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .scenario-button {
    padding: 0.75rem 1.5rem;
    border: 2px solid;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-size: 0.95rem;
  }

  .scenario-button:hover {
    transform: translateY(-2px);
  }

  .scenario-button.active {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .dark-mode .scenario-button {
    color: #e0e8f0;
    border-color: #2a3a4a;
  }

  .dark-mode .scenario-button.active {
    background: rgba(0, 212, 255, 0.2);
    border-color: #00d4ff;
    color: #00d4ff;
  }

  .light-mode .scenario-button {
    color: #1f2937;
    border-color: #e2e8f0;
  }

  .light-mode .scenario-button.active {
    background: rgba(255, 107, 53, 0.2);
    border-color: #ff6b35;
    color: #ff6b35;
  }

  .scenario-header {
    margin-bottom: 2rem;
  }

  .scenario-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .scenario-meta {
    display: flex;
    gap: 2rem;
    font-size: 0.95rem;
    opacity: 0.8;
  }

  .module-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-right: 0.5rem;
  }

  .process-flow-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .process-card {
    padding: 1.5rem;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .process-card:hover {
    transform: translateY(-4px);
  }

  .process-card.active {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  .process-card-header {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .process-card-module {
    font-size: 0.8rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .process-card-code {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
  }

  .detail-panel {
    border-radius: 8px;
    border: 1px solid;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .detail-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .detail-content {
    line-height: 1.6;
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

  .gl-impact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .gl-impact-table th {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 2px solid;
    font-weight: 600;
  }

  .gl-impact-table td {
    padding: 0.75rem;
    border-bottom: 1px solid;
  }

  .dark-mode {
    background-color: #0f1620;
    color: #e0e8f0;
  }

  .dark-mode .scenario-title { color: #00d4ff; }
  .dark-mode .process-card {
    background: #1a2332;
    border-color: #2a3a4a;
  }
  .dark-mode .process-card.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: #00d4ff;
  }
  .dark-mode .process-card-code {
    background: rgba(0, 212, 255, 0.2);
    color: #00d4ff;
  }
  .dark-mode .detail-panel {
    background: #1a2332;
    border-color: #2a3a4a;
  }
  .dark-mode .detail-title { color: #00d4ff; }
  .dark-mode .gl-impact-table th { border-bottom-color: #2a3a4a; }
  .dark-mode .gl-impact-table td { border-bottom-color: #2a3a4a; }

  .light-mode {
    background-color: #f5f5f5;
    color: #1f2937;
  }

  .light-mode .scenario-title { color: #ff6b35; }
  .light-mode .process-card {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .light-mode .process-card.active {
    background: rgba(255, 107, 53, 0.1);
    border-color: #ff6b35;
  }
  .light-mode .process-card-code {
    background: rgba(255, 107, 53, 0.15);
    color: #ff6b35;
  }
  .light-mode .detail-panel {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .light-mode .detail-title { color: #ff6b35; }
  .light-mode .gl-impact-table th { border-bottom-color: #e2e8f0; }
  .light-mode .gl-impact-table td { border-bottom-color: #e2e8f0; }

  @media (max-width: 768px) {
    .process-flow-grid {
      grid-template-columns: 1fr;
    }
    .scenario-meta {
      flex-direction: column;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = simulatorStyles;
  document.head.appendChild(style);
}

export default function SAPSimulatorExpanded({ isDarkMode = true }: SAPSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof scenarios>('O2C');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const scenario = scenarios[selectedScenario];
  const steps = scenario.steps;

  const handleScenarioChange = (scenarioKey: keyof typeof scenarios) => {
    setSelectedScenario(scenarioKey);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

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

  const currentStepData = steps[currentStep];
  const isCompleted = completedSteps.includes(currentStep);
  const isLast = currentStep === steps.length - 1;

  return (
    <div className={`sap-expanded-simulator ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Scenario Selector */}
      <div className="scenario-selector">
        {Object.entries(scenarios).map(([key, scen]) => (
          <button
            key={key}
            className={`scenario-button ${selectedScenario === key ? 'active' : ''}`}
            onClick={() => handleScenarioChange(key as keyof typeof scenarios)}
          >
            {scen.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Scenario Header */}
      <div className="scenario-header">
        <h1 className="scenario-title">{scenario.name}</h1>
        <div className="scenario-meta">
          <div><strong>Module(s):</strong> {scenario.module}</div>
          <div><strong>Type:</strong> {scenario.description}</div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="process-flow-grid">
        {steps.map((step, idx) => (
          <button
            key={step.id}
            className={`process-card ${idx === currentStep ? 'active' : ''}`}
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
            <div className="process-card-module">Step {idx + 1}</div>
            <div className="process-card-header">{step.name}</div>
            <div className="process-card-code">{step.code}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{step.module}</div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      <div className="detail-panel">
        <div className="detail-title">
          {currentStepData.name} ({currentStepData.code})
        </div>

        <div className="detail-content">
          <div className="detail-section">
            <div className="detail-section-title">Description</div>
            <p>{currentStepData.description}</p>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{currentStepData.details}</p>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">💡 SAP Architecture Insight</div>
            <p>{currentStepData.explanation}</p>
          </div>

          {currentStepData.glImpact && currentStepData.glImpact.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">💰 GL Impact</div>
              <table className="gl-impact-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Debit/Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStepData.glImpact.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.account}</td>
                      <td>${item.amount.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{item.effect === 'debit' ? 'DEBIT ↗' : 'CREDIT ↙'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentStepData.crossModuleImpact && (
            <div className="detail-section">
              <div className="detail-section-title">🔗 Cross-Module Impact</div>
              <ul style={{ marginLeft: '1.5rem', opacity: 0.9 }}>
                {currentStepData.crossModuleImpact.map((impact, idx) => (
                  <li key={idx}>{impact}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'space-between' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid',
              borderColor: isDarkMode ? '#2a3a4a' : '#e2e8f0',
              background: isDarkMode ? 'transparent' : 'transparent',
              color: isDarkMode ? '#e0e8f0' : '#1f2937',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reset Scenario
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ opacity: 0.7 }}>{currentStep + 1} of {steps.length}</span>
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
              {isLast ? '✓ Scenario Complete' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
