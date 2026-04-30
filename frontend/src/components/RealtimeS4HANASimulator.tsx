import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { createFioriStyles } from '../theme/fioriStyles';

interface RealtimeS4HANASimulatorProps {
  isDarkMode?: boolean;
}

interface GLAccount {
  account: string;
  description: string;
  balance: number;
  postings: Array<{ amount: number; description: string; timestamp: number }>;
  isFlashing?: boolean;
}

interface Transaction {
  id: number;
  name: string;
  code: string;
  module: string;
  duration: number;
  description: string;
  businessImpact: string;
  glPostings: Array<{ account: string; debit?: number; credit?: number; description: string }>;
  apiPayload?: string;
  fieldMappings?: Array<{ sfdc: string; sap: string; value: string }>;
  status: 'pending' | 'executing' | 'completed';
}

const RealtimeS4HANASimulator: React.FC<RealtimeS4HANASimulatorProps> = ({ isDarkMode = true }) => {
  // Transactions array
  const transactions: Transaction[] = [
    {
      id: 1,
      name: 'SFDC CPQ Quote Generation',
      code: 'SFDC-CPQ',
      module: 'O2C',
      duration: 1000,
      description: 'Create bundled quote: Perpetual License ($500K) + SaaS 36mo ($180K) + Implementation ($150K)',
      businessImpact: 'Total Contract Value established at $830K. CPQ calculates bundled discount and standing selling prices for revenue recognition.',
      glPostings: [],
      status: 'pending',
    },
    {
      id: 2,
      name: 'Solution Order Creation (ZEST)',
      code: 'ZEST-001',
      module: 'O2C',
      duration: 1200,
      description: 'Create Solution Order linking SFDC quote to SAP enterprise contract. Header ID: ZORD-2026-0415-001',
      businessImpact: 'Solution Order validates item routing logic. Determines which performance obligations, billing models, and GL accounts each line uses.',
      glPostings: [
        { account: '100001', credit: 830000, description: 'AR - Solution Order Created' },
        { account: '250001', credit: 830000, description: 'Deferred Revenue - Liability for future performance' },
      ],
      apiPayload: JSON.stringify({
        zest_id: 'ZORD-2026-0415-001',
        customer: 'Acme Corp (0001234567)',
        currency: 'USD',
        amount_total: 830000,
        items: 3,
        created: '2026-04-15T09:00:00Z',
      }, null, 2),
      fieldMappings: [
        { sfdc: 'OpportunityLineItems.UnitPrice', sap: 'VBAP.NETPR', value: '166,667 / 5,000 / 50,000' },
        { sfdc: 'Quote.CustomerAccount', sap: 'KNA1.KUNNR', value: '0001234567' },
        { sfdc: 'Quote.TotalAmount', sap: 'VBAK.NETWR', value: '830,000' },
      ],
    },
    {
      id: 3,
      name: 'Item Category Routing Logic',
      code: 'ZEST-ROUTING',
      module: 'O2C',
      duration: 800,
      description: 'Route 3 items to different sales order types: License (Perpetual) → SO1, SaaS (Consumption) → SO2, Services (Milestone) → SO3',
      businessImpact: 'Item routing determines billing behavior: License = one-time, SaaS = monthly recurring, Services = milestone-triggered. Each has different revenue recognition timing.',
      glPostings: [],
      apiPayload: JSON.stringify({
        routing: [
          { line: 10, product: 'S/4HANA License', category: 'TAN', so_type: 'OR', billing: 'ONETIME' },
          { line: 20, product: 'S/4HANA SaaS', category: 'CBAO', so_type: 'OR', billing: 'RECUR' },
          { line: 30, product: 'Implementation Svc', category: 'ZSRV', so_type: 'OR', billing: 'MILESTONE' },
        ],
        validation_status: 'PASSED',
        created: '2026-04-15T09:15:00Z',
      }, null, 2),
    },
    {
      id: 4,
      name: 'Sales Order #1 - License (VA01)',
      code: 'VA01',
      module: 'O2C',
      duration: 1400,
      description: 'Create SO-2026-001567: Perpetual S/4HANA License for Acme Corp. One-time revenue of $500,000.',
      businessImpact: 'License SO recognizes full revenue immediately upon acceptance. Performance obligation fulfilled at go-live. No deferred revenue for perpetual.',
      glPostings: [
        { account: '100001', debit: 500000, description: 'AR - Sales Order License' },
        { account: '250001', debit: 500000, description: 'Deferred Revenue - Reduced' },
        { account: '400001', credit: 500000, description: 'License Revenue - Recognized' },
      ],
      apiPayload: JSON.stringify({
        sales_order: 'SO-2026-001567',
        customer: 'Acme Corp',
        items: [{ product: 'S/4HANA License', qty: 1, unit_price: 500000, line_type: 'MARA' }],
        billing_type: 'ONETIME',
        payment_terms: 'Net 30',
        created: '2026-04-15T09:30:00Z',
      }, null, 2),
      fieldMappings: [
        { sfdc: 'OpportunityLineItem[License]', sap: 'VBAP.ARKTX', value: 'License Item' },
        { sfdc: 'UnitPrice: 500000', sap: 'VBAP.NETPR', value: '500,000' },
        { sfdc: 'BillingType: Perpetual', sap: 'VBAP.ZTERM', value: 'PERPETUAL' },
      ],
    },
    {
      id: 5,
      name: 'Sales Order #2 - SaaS Monthly (VA01)',
      code: 'VA01',
      module: 'O2C',
      duration: 1400,
      description: 'Create SO-2026-001568: SaaS subscription for 36 months. Monthly billing of $5,000 each.',
      businessImpact: 'SaaS SO triggers recurring revenue recognition. $5K recognized each month. Deferred revenue decreases monthly. Consumption-based billing model.',
      glPostings: [
        { account: '100001', debit: 180000, description: 'AR - SaaS SO' },
        { account: '250001', debit: 180000, description: 'Deferred Revenue - SaaS' },
        { account: '400002', credit: 5000, description: 'SaaS Revenue - Month 1' },
        { account: '250002', credit: 175000, description: 'Deferred SaaS Revenue - Remaining 35 months' },
      ],
      apiPayload: JSON.stringify({
        sales_order: 'SO-2026-001568',
        customer: 'Acme Corp',
        items: [{ product: 'S/4HANA SaaS', qty: 36, unit_price: 5000, line_type: 'MARA' }],
        billing_type: 'RECURRING_MONTHLY',
        contract_months: 36,
        created: '2026-04-15T10:00:00Z',
      }, null, 2),
      fieldMappings: [
        { sfdc: 'OpportunityLineItem[SaaS]', sap: 'VBAP.ARKTX', value: 'SaaS Item' },
        { sfdc: 'UnitPrice: 5000', sap: 'VBAP.NETPR', value: '5,000' },
        { sfdc: 'BillingType: Recurring', sap: 'VBAP.ZTERM', value: 'RECURRING_MONTHLY' },
      ],
    },
    {
      id: 6,
      name: 'Sales Order #3 - Services Milestone (VA01)',
      code: 'VA01',
      module: 'O2C',
      duration: 1400,
      description: 'Create SO-2026-001569: Implementation Services milestone-based. 4 phases: Planning, Build, Testing, Go-Live.',
      businessImpact: 'Services SO uses milestone billing. Revenue triggered by Workday webhook when PSA marks phase complete. $150K total across 4 milestones.',
      glPostings: [
        { account: '100001', debit: 150000, description: 'AR - Services SO' },
        { account: '250001', debit: 150000, description: 'Deferred Revenue - Services' },
        { account: '400003', credit: 37500, description: 'Services Revenue - Phase 1' },
        { account: '250003', credit: 112500, description: 'Deferred Services Revenue - Phases 2-4' },
      ],
      apiPayload: JSON.stringify({
        sales_order: 'SO-2026-001569',
        customer: 'Acme Corp',
        items: [{ product: 'Implementation Svc', qty: 4, unit_price: 37500, line_type: 'MARA' }],
        billing_type: 'MILESTONE',
        milestones: ['Planning', 'Build', 'Testing', 'Go-Live'],
        created: '2026-04-15T10:30:00Z',
      }, null, 2),
      fieldMappings: [
        { sfdc: 'OpportunityLineItem[Services]', sap: 'VBAP.ARKTX', value: 'Services Item' },
        { sfdc: 'UnitPrice: 37500', sap: 'VBAP.NETPR', value: '37,500' },
        { sfdc: 'BillingType: Milestone', sap: 'VBAP.ZTERM', value: 'MILESTONE' },
      ],
    },
    {
      id: 7,
      name: 'Delivery & Fulfillment',
      code: 'VL01/MIGO',
      module: 'S2R',
      duration: 2000,
      description: 'Confirm goods receipt (License software) and service delivery plan (SaaS activation, Implementation kickoff). Trigger billing acceptance.',
      businessImpact: 'Fulfillment completion triggers revenue recognition for License. SaaS activation starts month 1 billing. Services kickoff begins Phase 1.',
      glPostings: [
        { account: '801000', credit: 500000, description: 'COGS - License (capitalized)' },
        { account: '150001', debit: 500000, description: 'Inventory/Assets - License' },
      ],
      apiPayload: JSON.stringify({
        deliveries: [
          { so: 'SO-2026-001567', type: 'SOFTWARE_DELIVERY', status: 'COMPLETED' },
          { so: 'SO-2026-001568', type: 'SERVICE_ACTIVATION', status: 'COMPLETED' },
          { so: 'SO-2026-001569', type: 'IMPLEMENTATION_KICKOFF', status: 'COMPLETED' },
        ],
        billing_trigger: 'ACCEPTANCE_SIGNED',
        created: '2026-04-15T11:30:00Z',
      }, null, 2),
    },
    {
      id: 8,
      name: 'Invoice & Billing Trigger',
      code: 'VF01/MIRO',
      module: 'O2C',
      duration: 1600,
      description: 'Create billing documents: Perpetual license invoice, first month SaaS invoice, Phase 1 services invoice. Send to Accounts Receivable.',
      businessImpact: 'Invoices due. AR balance increases. Cash collection expected per payment terms. Monthly/milestone billing cycles established.',
      glPostings: [
        { account: '100001', credit: 542500, description: 'AR - Invoices Created (License + SaaS M1 + Services P1)' },
        { account: '400001', credit: 500000, description: 'License Revenue Billed' },
        { account: '400002', credit: 5000, description: 'SaaS Revenue Billed - Month 1' },
        { account: '400003', credit: 37500, description: 'Services Revenue Billed - Phase 1' },
      ],
      apiPayload: JSON.stringify({
        invoices: [
          { invoice: 'IV-2026-0001', so: 'SO-2026-001567', amount: 500000, type: 'LICENSE' },
          { invoice: 'IV-2026-0002', so: 'SO-2026-001568', amount: 5000, type: 'SAAS_RECURRING' },
          { invoice: 'IV-2026-0003', so: 'SO-2026-001569', amount: 37500, type: 'SERVICES_MILESTONE' },
        ],
        total_billing: 542500,
        created: '2026-04-15T13:00:00Z',
      }, null, 2),
    },
    {
      id: 9,
      name: 'IFRS 15 Revenue Recognition & GL Post',
      code: 'FB01/FB50',
      module: 'FI/R2R',
      duration: 1800,
      description: 'GL posting for revenue recognition. Allocate $830K among 3 performance obligations per IFRS 15 Standing Selling Price. Consolidate deferred vs recognized.',
      businessImpact: 'Final revenue recognition. License fully recognized ($500K). SaaS Month 1 recognized ($5K), 35 months deferred ($175K). Services Phase 1 recognized ($37.5K), Phases 2-4 deferred ($112.5K).',
      glPostings: [
        { account: '100001', credit: 542500, description: 'AR - Balance after invoicing' },
        { account: '400001', debit: 500000, description: 'License Revenue' },
        { account: '400002', debit: 5000, description: 'SaaS Revenue' },
        { account: '400003', debit: 37500, description: 'Services Revenue' },
        { account: '250001', debit: 287500, description: 'Deferred Revenue - Reduced' },
        { account: '250002', debit: 175000, description: 'Deferred SaaS Revenue' },
        { account: '250003', debit: 112500, description: 'Deferred Services Revenue' },
        { account: '500001', credit: 542500, description: 'Revenue - Consolidated' },
      ],
      apiPayload: JSON.stringify({
        posting_type: 'REVENUE_RECOGNITION',
        ifrs15_allocation: {
          license: { amount: 500000, performance_obligation: 'License delivery', recognized_month: 'Apr 2026' },
          saas_m1: { amount: 5000, performance_obligation: 'Monthly SaaS', recognized_month: 'Apr 2026' },
          services_p1: { amount: 37500, performance_obligation: 'Phase 1 Implementation', recognized_month: 'Apr 2026' },
          deferred_saas: { amount: 175000, recognized_months: 'May 2026 - Feb 2029 (35 months)' },
          deferred_services: { amount: 112500, recognized_months: 'May 2026, Jun 2026, Jul 2026' },
        },
        total_recognized: 542500,
        total_deferred: 287500,
        created: '2026-04-15T14:30:00Z',
      }, null, 2),
    },
  ];

  // GL Accounts with initial balances
  const initialGLAccounts: Record<string, GLAccount> = {
    '100001': { account: '100001', description: 'Accounts Receivable', balance: 0, postings: [] },
    '250001': { account: '250001', description: 'Deferred Revenue (Liability)', balance: 0, postings: [] },
    '250002': { account: '250002', description: 'Deferred SaaS Revenue', balance: 0, postings: [] },
    '250003': { account: '250003', description: 'Deferred Services Revenue', balance: 0, postings: [] },
    '400001': { account: '400001', description: 'License Revenue', balance: 0, postings: [] },
    '400002': { account: '400002', description: 'SaaS Revenue', balance: 0, postings: [] },
    '400003': { account: '400003', description: 'Services Revenue', balance: 0, postings: [] },
    '500001': { account: '500001', description: 'Consolidated Revenue', balance: 0, postings: [] },
    '801000': { account: '801000', description: 'COGS - License', balance: 0, postings: [] },
    '150001': { account: '150001', description: 'Inventory/Assets', balance: 0, postings: [] },
  };

  const modules = [
    { id: 'O2C', name: 'Order-to-Cash', color: '#00d4ff' },
    { id: 'S2R', name: 'Source-to-Record', color: '#0A6ED4' },
    { id: 'R2R', name: 'Record-to-Report', color: '#10b981' },
    { id: 'FI', name: 'Finance', color: '#8b5cf6' },
  ];

  // State management
  const [isRunning, setIsRunning] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [glAccounts, setGLAccounts] = useState<Record<string, GLAccount>>(initialGLAccounts);
  const [expandedTransaction, setExpandedTransaction] = useState<number | null>(null);
  const [completedTransactions, setCompletedTransactions] = useState<number[]>([]);
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(0);

  // Calculate module activation
  useEffect(() => {
    const modules = new Set<string>();
    for (let i = 0; i <= currentStep; i++) {
      if (transactions[i]) modules.add(transactions[i].module);
    }
    setActiveModules(modules);
  }, [currentStep]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || currentStep >= transactions.length) {
      if (currentStep >= transactions.length && isRunning) {
        setIsRunning(false);
      }
      return;
    }

    const duration = transactions[currentStep].duration / speed;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < transactions.length) {
          // Apply GL postings for completed transaction
          const tx = transactions[prev];
          if (tx.glPostings && tx.glPostings.length > 0) {
            setGLAccounts(prev => {
              const updated = { ...prev };
              tx.glPostings.forEach(posting => {
                if (updated[posting.account]) {
                  const amount = (posting.debit || 0) - (posting.credit || 0);
                  updated[posting.account] = {
                    ...updated[posting.account],
                    balance: updated[posting.account].balance + amount,
                    postings: [
                      ...updated[posting.account].postings,
                      { amount, description: posting.description, timestamp: Date.now() },
                    ],
                    isFlashing: true,
                  };
                  // Remove flash after 600ms
                  setTimeout(() => {
                    setGLAccounts(prev2 => ({
                      ...prev2,
                      [posting.account]: {
                        ...prev2[posting.account],
                        isFlashing: false,
                      },
                    }));
                  }, 600);
                }
              });
              return updated;
            });
            setCompletedTransactions(prev => [...prev, prev]);
          }
        }
        return next;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [isRunning, currentStep, speed, transactions]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedTransactions([]);
    setGLAccounts(initialGLAccounts);
    setIsRunning(true);
    setExpandedTransaction(null);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleTransactionClick = (index: number) => {
    setCurrentStep(index);
    setExpandedTransaction(expandedTransaction === index ? null : index);
    setIsRunning(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const totalRevenue = Object.values(glAccounts)
    .filter(acc => acc.account.startsWith('4') || acc.account === '500001')
    .reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);

  const totalDeferred = Object.values(glAccounts)
    .filter(acc => acc.account.startsWith('25'))
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalAR = glAccounts['100001']?.balance || 0;

  const currentTransaction = transactions[currentStep];
  const progress = ((currentStep + 1) / transactions.length) * 100;

  const styles = `
    .realtime-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      min-height: auto;
      overflow-y: auto;
    }

    ${createFioriStyles(isDarkMode)}

    .transaction-details {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
      max-height: 1000px;
      overflow: hidden;
      animation: expand-animation 0.3s ease;
    }

    @keyframes expand-animation {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 1000px;
      }
    }

    .detail-section {
      margin: 0.75rem 0;
      font-size: 0.85rem;
    }

    .detail-section h4 {
      margin: 0.5rem 0 0.25rem 0;
      font-weight: 700;
      color: #0A6ED4;
      font-size: 0.85rem;
    }

    .business-impact {
      padding: 0.75rem;
      background: ${isDarkMode ? 'rgba(16, 126, 62, 0.1)' : 'rgba(16, 126, 62, 0.05)'};
      border-left: 3px solid #107E3E;
      border-radius: 4px;
      font-style: italic;
      color: ${isDarkMode ? '#D0D0D0' : '#333333'};
    }

    .gl-posting {
      padding: 0.5rem;
      background: ${isDarkMode ? '#404040' : '#F8F8F8'};
      border-radius: 3px;
      margin: 0.25rem 0;
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      font-family: 'Courier New', monospace;
    }

    .gl-account-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
    }

    .gl-account-description {
      font-size: 0.8rem;
      font-weight: 600;
      color: ${isDarkMode ? '#FFFFFF' : '#333333'};
    }

    .gl-account-postings {
      font-size: 0.75rem;
      color: ${isDarkMode ? '#999999' : '#333333'};
      margin-top: 0.5rem;
      max-height: 60px;
      overflow-y: auto;
    }

    .gl-posting-item {
      padding: 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: ${isDarkMode ? '#2D2D2D' : '#F8F8F8'};
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
      color: ${isDarkMode ? '#b0bec5' : '#333333'};
    }

    .speed-button {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 4px;
      background: ${isDarkMode ? '#404040' : '#F2F2F2'};
      color: ${isDarkMode ? '#999999' : '#1a1a1a'};
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }

    .speed-button.active {
      background: #0A6ED4;
      color: #FFFFFF;
    }

    .speed-button:hover {
      background: #0A6ED4;
      color: #FFFFFF;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-realtime]')) {
      style.setAttribute('data-realtime', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`realtime-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="realtime-header">
        <h1>
          <Zap size={28} />
          Real-Time S/4HANA Solution Order Simulator
        </h1>
      </div>

      <div className="realtime-controls">
        <button className="control-button" onClick={handlePlayPause} title={isRunning ? 'Pause' : 'Play'}>
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button className="control-button" onClick={handleReset} title="Reset">
          <RotateCcw size={18} />
          Reset
        </button>

        <div className="speed-control">
          <span style={{ fontSize: '0.85rem', fontWeight: '600', marginRight: '0.5rem' }}>Speed:</span>
          {[1, 2, 5].map(s => (
            <button
              key={s}
              className={`speed-button ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
              title={`${s}x speed`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar-container">
          <div className="progress-bar"></div>
        </div>
        <div className="progress-text">{currentStep + 1} / {transactions.length}</div>
      </div>

      <div className="module-flow">
        {modules.map((module, idx) => (
          <div key={module.id}>
            <div
              className={`module-box ${activeModules.has(module.id) ? 'active' : 'inactive'}`}
              style={{ borderColor: activeModules.has(module.id) ? module.color : undefined, '--module-color': module.color } as any}
            >
              {module.name}
            </div>
            {idx < modules.length - 1 && <div className="module-arrow">→</div>}
          </div>
        ))}
      </div>

      <div className="transaction-timeline">
        {transactions.map((tx, idx) => (
          <div
            key={tx.id}
            className={`transaction-card ${idx === currentStep ? 'active' : ''} ${completedTransactions.includes(idx) ? 'completed' : ''}`}
            onClick={() => handleTransactionClick(idx)}
          >
            <div className="transaction-status" style={{ background: idx < currentStep ? '#10b981' : idx === currentStep ? '#0A6ED4' : '#2a4a6a' }}>
              {idx < currentStep ? '✓' : idx === currentStep ? '▶' : idx + 1}
            </div>

            <div className="transaction-code">{tx.code}</div>
            <div className="transaction-name">{tx.name}</div>
            <div className="transaction-description">{tx.description}</div>
            <div className="transaction-module">{tx.module}</div>

            {expandedTransaction === idx && (
              <div className="transaction-details">
                <div className="detail-section">
                  <h4>Business Impact</h4>
                  <div className="business-impact">{tx.businessImpact}</div>
                </div>

                {tx.glPostings && tx.glPostings.length > 0 && (
                  <div className="detail-section">
                    <h4>GL Postings</h4>
                    {tx.glPostings.map((posting, i) => (
                      <div key={i} className="gl-posting">
                        <span>{posting.account} - {posting.description}</span>
                        <span style={{ textAlign: 'right', minWidth: '100px' }}>
                          {posting.debit ? `D: ${formatCurrency(posting.debit)}` : ''}
                          {posting.credit ? `C: ${formatCurrency(posting.credit)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {tx.fieldMappings && tx.fieldMappings.length > 0 && (
                  <div className="detail-section">
                    <h4>Field Mappings (SFDC → SAP)</h4>
                    {tx.fieldMappings.map((mapping, i) => (
                      <div key={i} className="gl-posting">
                        <span>{mapping.sfdc} → {mapping.sap}</span>
                        <span style={{ fontStyle: 'italic', color: isDarkMode ? '#64748b' : '#94a3b8' }}>{mapping.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {tx.apiPayload && (
                  <div className="detail-section">
                    <h4>API Payload</h4>
                    <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '150px', padding: '0.5rem', background: isDarkMode ? '#0f1620' : '#f5f5f5', borderRadius: '4px' }}>
                      {tx.apiPayload}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem', color: isDarkMode ? '#00d4ff' : '#0A6ED4', fontSize: '1.5rem', fontWeight: '700' }}>
        Live GL Account Dashboard
      </h2>

      <div className="gl-account-dashboard">
        {Object.values(glAccounts).map(account => (
          <div
            key={account.account}
            className={`gl-account-card ${account.isFlashing ? 'flashing' : ''}`}
          >
            <div className="gl-account-header">
              <div>
                <div className="gl-account-number">{account.account}</div>
                <div className="gl-account-description">{account.description}</div>
              </div>
            </div>
            <div className={`gl-account-balance ${account.balance < 0 ? 'negative' : ''}`}>
              {formatCurrency(account.balance)}
            </div>
            {account.postings.length > 0 && (
              <div className="gl-account-postings">
                <strong>Recent Postings:</strong>
                {account.postings.slice(-3).map((posting, i) => (
                  <div key={i} className="gl-posting-item">
                    {posting.description}: {formatCurrency(posting.amount)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="summary-section">
        <div className="summary-item">
          <div className="summary-label">Total Recognized Revenue</div>
          <div className="summary-value">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Deferred Revenue</div>
          <div className="summary-value">{formatCurrency(totalDeferred)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Accounts Receivable</div>
          <div className="summary-value">{formatCurrency(totalAR)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Progress</div>
          <div className="summary-value">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeS4HANASimulator;
