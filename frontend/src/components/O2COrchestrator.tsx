import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, AlertCircle, TrendingUp, Package, DollarSign, Clock } from 'lucide-react';

interface SolutionOrderLineItem {
  line_number: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  billing_model: 'one-time' | 'recurring' | 'milestone';
  billing_frequency?: string;
  performance_obligation: string;
  revenue_recognition_trigger: string;
  revenue_amount: number;
  deferred_amount: number;
  target_sales_order_type: string;
}

interface SolutionOrder {
  solution_order_id: string;
  customer_name: string;
  customer_id: string;
  contract_date: string;
  total_contract_value: number;
  total_deferred_revenue: number;
  currency: string;
  status: 'Draft' | 'Active' | 'Executing' | 'Completed';
  line_items: SolutionOrderLineItem[];
}

const solutionOrderDemo: SolutionOrder = {
  solution_order_id: 'ZORD-2026-0415-001',
  customer_name: 'Acme Corporation Global',
  customer_id: '0001234567',
  contract_date: '2026-04-15',
  total_contract_value: 830000,
  total_deferred_revenue: 480000,
  currency: 'USD',
  status: 'Active',
  line_items: [
    {
      line_number: 10,
      product_name: 'SAP S/4HANA Enterprise License',
      product_code: 'S4H-PERPETUAL-ENT',
      quantity: 1,
      unit_price: 500000,
      total_price: 500000,
      billing_model: 'one-time',
      performance_obligation: 'License delivery and activation',
      revenue_recognition_trigger: 'Go-live acceptance',
      revenue_amount: 500000,
      deferred_amount: 0,
      target_sales_order_type: 'OR (Sales Order for One-Time License)'
    },
    {
      line_number: 20,
      product_name: 'SAP S/4HANA Cloud SaaS (36 months)',
      product_code: 'S4H-SAAS-36MO',
      quantity: 36,
      unit_price: 5000,
      total_price: 180000,
      billing_model: 'recurring',
      billing_frequency: 'Monthly',
      performance_obligation: 'Monthly cloud service delivery',
      revenue_recognition_trigger: 'Monthly service delivery',
      revenue_amount: 0,
      deferred_amount: 180000,
      target_sales_order_type: 'OR (Subscription Order with Recurring Billing)'
    },
    {
      line_number: 30,
      product_name: 'Implementation & Change Management Services',
      product_code: 'S4H-IMPL-SERVICES',
      quantity: 1,
      unit_price: 150000,
      total_price: 150000,
      billing_model: 'milestone',
      billing_frequency: 'Milestone-based (4 phases)',
      performance_obligation: 'Phased implementation delivery',
      revenue_recognition_trigger: 'Milestone completion and acceptance',
      revenue_amount: 0,
      deferred_amount: 150000,
      target_sales_order_type: 'ZS (Service Order with Milestone Billing)'
    }
  ]
};

const O2COrchestrator: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [selectedOrder] = useState<SolutionOrder>(solutionOrderDemo);
  const [activeTab, setActiveTab] = useState('overview');

  const styles = `
    .o2c-container {
      background: ${isDarkMode ? '#0a1929' : '#f5f5f5'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      min-height: 100vh;
      padding: 2rem;
      font-family: 'Community', 'IBM Plex Sans', sans-serif;
    }

    .o2c-header {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border-bottom: 3px solid #0A6ED4;
      padding: 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .o2c-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A6ED4;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .o2c-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .o2c-main {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .o2c-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .o2c-card {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .o2c-card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0A6ED4;
      margin: 0 0 1.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
    }

    .o2c-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
    }

    .o2c-tab {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .o2c-tab.active {
      color: #0A6ED4;
      border-bottom-color: #0A6ED4;
    }

    .o2c-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .o2c-summary-item {
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-radius: 4px;
      padding: 1rem;
      text-align: center;
      border-left: 4px solid #0A6ED4;
    }

    .o2c-summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0A6ED4;
      margin-bottom: 0.25rem;
    }

    .o2c-summary-label {
      font-size: 0.8rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      text-transform: uppercase;
    }

    .o2c-line-item {
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid #107E3E;
    }

    .o2c-line-item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
    }

    .o2c-line-item-title {
      font-weight: 700;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      font-size: 0.95rem;
    }

    .o2c-line-item-badge {
      background: #107E3E;
      color: #ffffff;
      padding: 0.25rem 0.75rem;
      border-radius: 2px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .o2c-line-item-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    .o2c-detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: ${isDarkMode ? '#2a3a4a' : '#ffffff'};
      border-radius: 2px;
    }

    .o2c-detail-label {
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      font-weight: 600;
    }

    .o2c-detail-value {
      color: #0A6ED4;
      font-weight: 700;
    }

    .o2c-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-radius: 4px;
      margin-bottom: 1rem;
      border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
    }

    .o2c-flow-step {
      flex: 1;
      text-align: center;
    }

    .o2c-flow-step-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: #0A6ED4;
      margin-bottom: 0.25rem;
    }

    .o2c-flow-step-desc {
      font-size: 0.8rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .o2c-flow-arrow {
      color: #0A6ED4;
      margin: 0 0.5rem;
      font-weight: bold;
    }

    .o2c-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .o2c-sidebar-card {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .o2c-sidebar-title {
      font-weight: 700;
      color: #0A6ED4;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }

    .o2c-status-badge {
      display: inline-block;
      background: #107E3E;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }

    .o2c-info-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      font-size: 0.85rem;
    }

    .o2c-info-item:last-child {
      border-bottom: none;
    }

    .o2c-info-label {
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      font-weight: 600;
    }

    .o2c-info-value {
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      margin-top: 0.25rem;
      font-weight: 700;
    }

    .o2c-section {
      display: ${activeTab === 'overview' ? 'block' : 'none'};
    }

    .o2c-section.hidden {
      display: none;
    }

    .o2c-kpi-box {
      background: linear-gradient(135deg, rgba(10, 110, 212, 0.1) 0%, rgba(16, 126, 62, 0.1) 100%);
      border-left: 4px solid #0A6ED4;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .o2c-kpi-label {
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
    }

    .o2c-kpi-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A6ED4;
      margin-top: 0.5rem;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-o2c]')) {
      style.setAttribute('data-o2c', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`o2c-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="o2c-header">
        <h1 className="o2c-title">
          <ShoppingCart size={32} />
          Solution Order Orchestrator
        </h1>
        <p className="o2c-subtitle">
          Complete Order-to-Cash flow with multi-item solution orders, diverse billing models, and IFRS 15 revenue recognition
        </p>
      </div>

      <div className="o2c-main">
        <div className="o2c-content">
          {/* Tabs */}
          <div className="o2c-tabs">
            <button
              className={`o2c-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📋 Overview
            </button>
            <button
              className={`o2c-tab ${activeTab === 'lineitems' ? 'active' : ''}`}
              onClick={() => setActiveTab('lineitems')}
            >
              📦 Line Items
            </button>
            <button
              className={`o2c-tab ${activeTab === 'lineflows' ? 'active' : ''}`}
              onClick={() => setActiveTab('lineflows')}
            >
              ⚙️ Line Item Flows
            </button>
            <button
              className={`o2c-tab ${activeTab === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveTab('workflow')}
            >
              🔄 Workflow
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="o2c-card">
                <h2 className="o2c-card-title">
                  <Package size={24} />
                  Solution Order: {selectedOrder.solution_order_id}
                </h2>

                <div className="o2c-summary">
                  <div className="o2c-summary-item">
                    <div className="o2c-summary-value">${selectedOrder.total_contract_value.toLocaleString()}</div>
                    <div className="o2c-summary-label">Total Contract Value</div>
                  </div>
                  <div className="o2c-summary-item">
                    <div className="o2c-summary-value">${selectedOrder.total_deferred_revenue.toLocaleString()}</div>
                    <div className="o2c-summary-label">Deferred Revenue</div>
                  </div>
                  <div className="o2c-summary-item">
                    <div className="o2c-summary-value">{selectedOrder.line_items.length}</div>
                    <div className="o2c-summary-label">Line Items</div>
                  </div>
                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
                  <strong>Concept:</strong> This solution order contains 3 distinct line items with different billing models and revenue recognition triggers:
                  <br />• License (one-time revenue at go-live)
                  <br />• SaaS subscription (recurring monthly revenue)
                  <br />• Implementation services (milestone-based revenue)
                </p>
              </div>

              <div className="o2c-card">
                <h2 className="o2c-card-title">
                  <TrendingUp size={24} />
                  Revenue Recognition Strategy
                </h2>

                <div className="o2c-flow">
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Line 10: License</div>
                    <div className="o2c-flow-step-desc">$500K (One-time)</div>
                  </div>
                  <div className="o2c-flow-arrow">→</div>
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Recognize Immediately</div>
                    <div className="o2c-flow-step-desc">At Go-Live</div>
                  </div>
                </div>

                <div className="o2c-flow">
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Line 20: SaaS</div>
                    <div className="o2c-flow-step-desc">$180K (36 months)</div>
                  </div>
                  <div className="o2c-flow-arrow">→</div>
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Recognize Monthly</div>
                    <div className="o2c-flow-step-desc">$5K/month</div>
                  </div>
                </div>

                <div className="o2c-flow">
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Line 30: Services</div>
                    <div className="o2c-flow-step-desc">$150K (Milestone)</div>
                  </div>
                  <div className="o2c-flow-arrow">→</div>
                  <div className="o2c-flow-step">
                    <div className="o2c-flow-step-title">Recognize by Phase</div>
                    <div className="o2c-flow-step-desc">On Completion</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Tab */}
          {activeTab === 'lineitems' && (
            <div>
              <div className="o2c-card">
                <h2 className="o2c-card-title">
                  <Package size={24} />
                  Solution Order Line Items
                </h2>

                {selectedOrder.line_items.map((item) => (
                  <div key={item.line_number} className="o2c-line-item">
                    <div className="o2c-line-item-header">
                      <div>
                        <div className="o2c-line-item-title">
                          Line {item.line_number}: {item.product_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.25rem' }}>
                          {item.product_code}
                        </div>
                      </div>
                      <div className="o2c-line-item-badge">
                        {item.billing_model === 'one-time' ? '💰 One-Time' : item.billing_model === 'recurring' ? '📅 Recurring' : '🎯 Milestone'}
                      </div>
                    </div>

                    <div className="o2c-line-item-details">
                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Quantity:</span>
                        <span className="o2c-detail-value">{item.quantity}</span>
                      </div>
                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Unit Price:</span>
                        <span className="o2c-detail-value">${item.unit_price.toLocaleString()}</span>
                      </div>
                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Total Price:</span>
                        <span className="o2c-detail-value">${item.total_price.toLocaleString()}</span>
                      </div>
                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Billing:</span>
                        <span className="o2c-detail-value">{item.billing_frequency || item.billing_model}</span>
                      </div>

                      <div className="o2c-detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="o2c-detail-label">Performance Obligation:</span>
                        <span className="o2c-detail-value">{item.performance_obligation}</span>
                      </div>

                      <div className="o2c-detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="o2c-detail-label">Revenue Recognition Trigger:</span>
                        <span className="o2c-detail-value">{item.revenue_recognition_trigger}</span>
                      </div>

                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Revenue Recognized:</span>
                        <span className="o2c-detail-value">${item.revenue_amount.toLocaleString()}</span>
                      </div>

                      <div className="o2c-detail-row">
                        <span className="o2c-detail-label">Deferred:</span>
                        <span className="o2c-detail-value">${item.deferred_amount.toLocaleString()}</span>
                      </div>

                      <div className="o2c-detail-row" style={{ gridColumn: '1 / -1' }}>
                        <span className="o2c-detail-label">Target Sales Order Type:</span>
                        <span className="o2c-detail-value">{item.target_sales_order_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Item Process Flows Tab */}
          {activeTab === 'lineflows' && (
            <div>
              {/* Line 10: License */}
              <div className="o2c-card">
                <h2 className="o2c-card-title">
                  💰 Line 10: Perpetual License ($500K - One-Time)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Step 1 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 1️⃣ Quote & CPQ</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      Salesforce CPQ Quote
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Product: S4H-PERPETUAL-ENT
                      <br />✓ Unit Price: $500,000
                      <br />✓ Billing Model: One-time
                      <br />✓ Performance Obligation: License delivery at go-live
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 2️⃣ Solution Order Creation (ZEST)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      ZORD-2026-0415-001 (Line 10)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Item Category: TAN (Tangible/License)
                      <br />✓ GL Account: 100001 (AR), 250001 (Deferred Revenue)
                      <br />✓ Revenue Recognition: At go-live acceptance
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 3️⃣ Item Routing & Sales Order Generation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      SO-2026-001567 (Type: OR - One-Time)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Document Type: OR (Sales Order)
                      <br />✓ Billing: One-time invoice
                      <br />✓ Line item quantity: 1
                      <br />✓ Price: $500,000
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 4️⃣ Billing & AR Creation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      GL Posting (Initial)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 100001 (AR) $500,000
                      <br />Cr. 250001 (Deferred Revenue) $500,000
                      <br />✓ Invoice ZORD-2026-0415-001-10 issued
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Go-Live & Revenue Recognition</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Revenue Recognized - GO-LIVE TRIGGER
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250001 (Deferred Revenue) $500,000
                      <br />Cr. 400001 (License Revenue) $500,000
                      <br />✓ Performance obligation satisfied
                      <br />✓ Revenue fully recognized
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 6️⃣ Collections & Cash Application</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Payment Received
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 110001 (Cash) $500,000
                      <br />Cr. 100001 (AR) $500,000
                      <br />✓ AR closed
                      <br />✓ Transaction complete
                    </div>
                  </div>
                </div>
              </div>

              {/* Line 20: SaaS */}
              <div className="o2c-card" style={{ marginTop: '2rem' }}>
                <h2 className="o2c-card-title">
                  📅 Line 20: SaaS Subscription ($180K - Recurring Monthly)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Step 1 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 1️⃣ Quote & CPQ (36 Months)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      Salesforce CPQ Quote
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Product: S4H-SAAS-36MO
                      <br />✓ Monthly Price: $5,000
                      <br />✓ Total: $5,000 × 36 = $180,000
                      <br />✓ Billing Model: Recurring monthly
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 2️⃣ Solution Order Creation (ZEST)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      ZORD-2026-0415-001 (Line 20)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Item Category: CBAO (Cloud-Based Ancillary Offering)
                      <br />✓ Performance Obligation: Monthly service delivery
                      <br />✓ Revenue Recognition: Monthly triggers
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 3️⃣ Item Routing & Sales Order Generation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      SO-2026-001568 (Type: OR - Subscription)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Document Type: OR (Recurring)
                      <br />✓ Billing Schedule: Monthly billing for 36 months
                      <br />✓ Start Date: May 2026 (post go-live)
                      <br />✓ Monthly Amount: $5,000
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 4️⃣ Initial AR & Deferred Revenue Setup</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      GL Posting (Upfront)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 100001 (AR) $180,000
                      <br />Cr. 250001 (Deferred Revenue - SaaS) $180,000
                      <br />✓ Total contract value recognized as liability
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Monthly Revenue Recognition (Repeating 36x)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Month 1, 2, 3... 36
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250001 (Deferred Revenue) $5,000
                      <br />Cr. 400002 (SaaS Revenue) $5,000
                      <br />✓ Each month: Service delivery performance obligation satisfied
                      <br />✓ Example: May 2026, June 2026... April 2029
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 6️⃣ Monthly Billing & Collections</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Recurring Monthly Invoice
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 110001 (Cash) $5,000
                      <br />Cr. 100001 (AR) $5,000
                      <br />✓ Repeat monthly for 36 months
                      <br />✓ Total: 36 invoices × $5,000 = $180,000 collected
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? '#1a2a3a' : '#f8f8f8',
                    borderRadius: '4px',
                    borderLeft: '4px solid #0A6ED4',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#b0bec5' : '#666666'
                  }}>
                    <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Summary:</strong> This line item generates 36 months of recurring revenue. Each month, $5,000 is recognized as revenue and a new invoice is issued. Deferred revenue decreases monthly as obligations are satisfied.
                  </div>
                </div>
              </div>

              {/* Line 30: Services */}
              <div className="o2c-card" style={{ marginTop: '2rem' }}>
                <h2 className="o2c-card-title">
                  🎯 Line 30: Implementation Services ($150K - Milestone-Based)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Step 1 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 1️⃣ Quote & CPQ (4 Phases)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      Salesforce CPQ Quote
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Product: S4H-IMPL-SERVICES
                      <br />✓ Total Value: $150,000
                      <br />✓ Divided into 4 Phases: $37,500 each
                      <br />✓ Billing: Milestone-based upon phase completion
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 2️⃣ Solution Order Creation (ZEST)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      ZORD-2026-0415-001 (Line 30)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Item Category: ZSRV (Service - Milestone)
                      <br />✓ Performance Obligation: Delivery of 4 project phases
                      <br />✓ Revenue Recognition: Upon phase acceptance
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 3️⃣ Item Routing & Sales Order Generation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      SO-2026-001569 (Type: ZS - Service Order)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      ✓ Document Type: ZS (Service Order with milestone billing)
                      <br />✓ Phase 1: Discovery & Assessment ($37,500)
                      <br />✓ Phase 2: Config & Build ($37,500)
                      <br />✓ Phase 3: Testing & UAT ($37,500)
                      <br />✓ Phase 4: Deployment & Go-Live ($37,500)
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 4️⃣ Initial AR & Deferred Revenue Setup</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      GL Posting (Upfront)
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 100001 (AR) $150,000
                      <br />Cr. 250002 (Deferred Revenue - Services) $150,000
                      <br />✓ Total milestone value accrued
                    </div>
                  </div>

                  {/* Step 5 - Phase 1 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Phase 1 Complete: Discovery & Assessment</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      June 2026 - Milestone 1 Accepted
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250002 (Deferred Revenue) $37,500
                      <br />Cr. 400003 (Services Revenue) $37,500
                      <br />✓ Invoice milestone: $37,500
                      <br />✓ Customer acceptance signed
                    </div>
                  </div>

                  {/* Step 5 - Phase 2 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Phase 2 Complete: Config & Build</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      August 2026 - Milestone 2 Accepted
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250002 (Deferred Revenue) $37,500
                      <br />Cr. 400003 (Services Revenue) $37,500
                      <br />✓ Invoice milestone: $37,500 (Cumulative: $75K)
                    </div>
                  </div>

                  {/* Step 5 - Phase 3 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Phase 3 Complete: Testing & UAT</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      October 2026 - Milestone 3 Accepted
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250002 (Deferred Revenue) $37,500
                      <br />Cr. 400003 (Services Revenue) $37,500
                      <br />✓ Invoice milestone: $37,500 (Cumulative: $112.5K)
                    </div>
                  </div>

                  {/* Step 5 - Phase 4 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 5️⃣ Phase 4 Complete: Deployment & Go-Live</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      December 2026 - Milestone 4 Accepted
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 250002 (Deferred Revenue) $37,500
                      <br />Cr. 400003 (Services Revenue) $37,500
                      <br />✓ Invoice milestone: $37,500 (Cumulative: $150K)
                      <br />✓ All revenue recognized
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">Step 6️⃣ Collections (4 Milestone Payments)</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      4 Payments × $37,500
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      Dr. 110001 (Cash) $37,500 (repeat 4 times)
                      <br />Cr. 100001 (AR) $37,500 (repeat 4 times)
                      <br />✓ Payment upon milestone acceptance
                      <br />✓ Total collected: $150,000
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{
                    padding: '1rem',
                    background: isDarkMode ? '#1a2a3a' : '#f8f8f8',
                    borderRadius: '4px',
                    borderLeft: '4px solid #0A6ED4',
                    fontSize: '0.85rem',
                    color: isDarkMode ? '#b0bec5' : '#666666'
                  }}>
                    <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Summary:</strong> This line item is split into 4 milestones over 6 months (Jun-Dec 2026). Revenue is only recognized when each phase is accepted by the customer. This aligns with the project timeline and creates a predictable, phase-based revenue pattern.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <div>
              <div className="o2c-card">
                <h2 className="o2c-card-title">
                  <Clock size={24} />
                  Order-to-Cash Workflow
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">📝 Step 1: Solution Order Creation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      ZORD-2026-0415-001 Created
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      • Contract established with Acme Corp
                      <br />• 3 distinct line items registered
                      <br />• Total contract value: $830K
                      <br />• Deferred revenue liability: $480K
                    </div>
                  </div>

                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">📤 Step 2: Item Routing & Sales Order Generation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      3 Sales Orders Created
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      • SO-2026-001567 (Perpetual License)
                      <br />• SO-2026-001568 (SaaS 36-month Subscription)
                      <br />• SO-2026-001569 (Implementation Services)
                    </div>
                  </div>

                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">💳 Step 3: Billing & AR Creation</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#0A6ED4', marginTop: '0.5rem' }}>
                      AR: $830,000
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      • Customer invoice issued (Acme Corp)
                      <br />• AR account 100001 debited: $830K
                      <br />• Deferred Revenue account 250001 credited: $480K
                      <br />• Immediate revenue accounts credited: $350K
                    </div>
                  </div>

                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">📊 Step 4: Revenue Recognition & GL Posting</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Multi-Trigger Recognition
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      • License: $500K recognized at go-live (performance obligation satisfied)
                      <br />• SaaS: $5K/month recognized (recurring obligation)
                      <br />• Services: Milestone-based recognition ($37.5K per phase)
                      <br />• GL Posting to revenue accounts (4000xx series)
                    </div>
                  </div>

                  <div className="o2c-kpi-box">
                    <div className="o2c-kpi-label">💰 Step 5: Collections & AR Aging</div>
                    <div className="o2c-kpi-value" style={{ fontSize: '1rem', color: '#107E3E', marginTop: '0.5rem' }}>
                      Payment Tracking Active
                    </div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
                      • Monitor AR aging: Current / 30-60 days / 60+ days
                      <br />• Apply payments to invoice
                      <br />• Dunning management for overdue amounts
                      <br />• Cash application to GL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="o2c-sidebar">
          <div className="o2c-sidebar-card">
            <div className="o2c-status-badge">🟢 ACTIVE</div>
            <div className="o2c-sidebar-title">Solution Order Details</div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Order ID</div>
              <div className="o2c-info-value">{selectedOrder.solution_order_id}</div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Customer</div>
              <div className="o2c-info-value">{selectedOrder.customer_name}</div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Customer ID</div>
              <div className="o2c-info-value">{selectedOrder.customer_id}</div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Contract Date</div>
              <div className="o2c-info-value">{selectedOrder.contract_date}</div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Currency</div>
              <div className="o2c-info-value">{selectedOrder.currency}</div>
            </div>
          </div>

          <div className="o2c-sidebar-card">
            <div className="o2c-sidebar-title">💡 Key Concepts</div>

            <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: isDarkMode ? '#b0bec5' : '#666666' }}>
              <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Solution Order</strong> is a master container for multiple line items with different billing and revenue models.

              <br /><br />

              <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Item Routing</strong> directs each line to the appropriate Sales Order type:
              <br />• One-time items → OR (Sales Order)
              <br />• Recurring → OR with subscription
              <br />• Services → ZS (Service Order)

              <br /><br />

              <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Revenue Recognition</strong> follows IFRS 15 based on performance obligation satisfaction.
            </div>
          </div>

          <div className="o2c-sidebar-card">
            <div className="o2c-sidebar-title">📈 GL Impact</div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">AR (100001)</div>
              <div className="o2c-info-value" style={{ color: '#0A6ED4' }}>
                +${selectedOrder.total_contract_value.toLocaleString()}
              </div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Deferred Revenue (250001)</div>
              <div className="o2c-info-value" style={{ color: '#E17B08' }}>
                +${selectedOrder.total_deferred_revenue.toLocaleString()}
              </div>
            </div>

            <div className="o2c-info-item">
              <div className="o2c-info-label">Immediate Revenue</div>
              <div className="o2c-info-value" style={{ color: '#107E3E' }}>
                +${(selectedOrder.total_contract_value - selectedOrder.total_deferred_revenue).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default O2COrchestrator;
