import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, TrendingUp, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

interface OrderData {
  order_number: string;
  customer: string;
  order_value: number;
  currency: string;
  status: string;
  engagement_type: string;
  completion_percentage: number;
  created_date: string;
}

interface GLPosting {
  account: string;
  amount: number;
  type: string;
  description: string;
}

interface ARAgingBucket {
  bucket: string;
  days_overdue: number;
  amount: number;
  dunning_level: number;
  next_action: string;
  late_fees: number;
}

interface Scenario {
  id: string;
  name: string;
  engagement_type: string;
  total_value: number;
  currency: string;
}

const fioriStyles = `
  /* SAP Fiori Design System */
  :root {
    --sapBrandColor: #0070F2;
    --sapHighlight: #1B90FF;
    --sapAccentColor: #E76500;
    --sapPositive: #36A41D;
    --sapNegative: #BB0000;
    --sapBackgroundColor: #F5F6F7;
    --sapBaseColor: #FFFFFF;
    --sapBorderColor: #D5DADD;
    --sapTextColor: #232A31;
    --sapSecondaryText: #556B82;
    --sapCardBackground: #FFFFFF;
    --sapCardBorder: 1px solid #D5DADD;
    --sapShadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  }

  .o2c-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--sapBackgroundColor);
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  }

  .o2c-header {
    background-color: var(--sapBaseColor);
    border-bottom: 2px solid var(--sapBrandColor);
    padding: 1.5rem 2rem;
    margin: -2rem -2rem 2rem -2rem;
    box-shadow: var(--sapShadow);
  }

  .o2c-header-title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--sapBrandColor);
    letter-spacing: -0.5px;
  }

  .o2c-header-subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--sapSecondaryText);
  }

  .o2c-main {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 1.5rem;
  }

  .o2c-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .o2c-card {
    background-color: var(--sapCardBackground);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: var(--sapShadow);
    border: var(--sapCardBorder);
    transition: box-shadow 0.2s ease;
  }

  .o2c-card:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .o2c-card-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--sapTextColor);
    display: flex;
    align-items: center;
    gap: 1rem;
    border-left: 4px solid var(--sapBrandColor);
    padding-left: 1rem;
  }

  .o2c-card-title svg {
    color: var(--sapBrandColor);
    width: 24px;
    height: 24px;
  }

  .o2c-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
    position: relative;
  }

  .o2c-steps::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--sapBrandColor), var(--sapHighlight));
    z-index: 0;
  }

  .o2c-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    z-index: 1;
    position: relative;
    cursor: pointer;
  }

  .o2c-step-indicator {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--sapBackgroundColor);
    border: 2px solid var(--sapBorderColor);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: var(--sapSecondaryText);
    transition: all 0.3s ease;
  }

  .o2c-step.active .o2c-step-indicator {
    background: linear-gradient(135deg, var(--sapBrandColor), var(--sapHighlight));
    color: var(--sapBaseColor);
    border-color: var(--sapBrandColor);
    box-shadow: 0 0 0 4px rgba(0, 112, 242, 0.15);
  }

  .o2c-step.completed .o2c-step-indicator {
    background-color: var(--sapPositive);
    color: var(--sapBaseColor);
    border-color: var(--sapPositive);
  }

  .o2c-step-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--sapSecondaryText);
    text-align: center;
    max-width: 80px;
  }

  .o2c-form-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .o2c-form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .o2c-form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--sapTextColor);
  }

  .o2c-form-input,
  .o2c-form-select {
    padding: 1rem;
    border: 1px solid var(--sapBorderColor);
    border-radius: 6px;
    font-size: 0.875rem;
    background-color: var(--sapBaseColor);
    color: var(--sapTextColor);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    font-family: inherit;
  }

  .o2c-form-input::placeholder {
    color: var(--sapSecondaryText);
  }

  .o2c-form-input:focus,
  .o2c-form-select:focus {
    outline: none;
    border-color: var(--sapBrandColor);
    box-shadow: 0 0 0 4px rgba(0, 112, 242, 0.1);
  }

  .o2c-button {
    padding: 1rem 2rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 1.5rem;
    font-family: inherit;
  }

  .o2c-button-primary {
    background: linear-gradient(135deg, var(--sapBrandColor), var(--sapHighlight));
    color: var(--sapBaseColor);
    box-shadow: 0 2px 8px rgba(0, 112, 242, 0.25);
  }

  .o2c-button-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 112, 242, 0.35);
  }

  .o2c-button-primary:active {
    transform: translateY(0);
  }

  .o2c-button-primary:disabled {
    background: var(--sapBorderColor);
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.6;
  }

  .o2c-kpi-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.5rem;
    background-color: var(--sapCardBackground);
    border-radius: 8px;
    border: var(--sapCardBorder);
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .o2c-kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--sapBrandColor), var(--sapHighlight));
  }

  .o2c-kpi-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--sapSecondaryText);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .o2c-kpi-value {
    font-size: 1.75rem;
    font-weight: 900;
    background: linear-gradient(135deg, var(--sapBrandColor), var(--sapHighlight));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .o2c-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .o2c-status-badge.draft {
    background-color: var(--sapBackgroundColor);
    color: var(--sapSecondaryText);
    border: 1px solid var(--sapBorderColor);
  }

  .o2c-status-badge.submitted {
    background-color: rgba(0, 112, 242, 0.1);
    color: var(--sapBrandColor);
    border: 1px solid var(--sapBrandColor);
  }

  .o2c-status-badge.confirmed {
    background-color: rgba(54, 164, 29, 0.1);
    color: var(--sapPositive);
    border: 1px solid var(--sapPositive);
  }

  .o2c-status-badge.invoiced {
    background-color: rgba(231, 101, 0, 0.1);
    color: var(--sapAccentColor);
    border: 1px solid var(--sapAccentColor);
  }

  .o2c-status-badge.posted {
    background-color: rgba(54, 164, 29, 0.1);
    color: var(--sapPositive);
    border: 1px solid var(--sapPositive);
  }

  .o2c-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .o2c-sidebar-panel {
    background-color: var(--sapCardBackground);
    border-radius: 8px;
    padding: 1.5rem;
    border: var(--sapCardBorder);
    transition: box-shadow 0.2s ease;
  }

  .o2c-sidebar-panel:hover {
    box-shadow: var(--sapShadow);
  }

  .o2c-sidebar-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--sapTextColor);
    border-bottom: 2px solid var(--sapBrandColor);
    padding-bottom: 0.5rem;
  }

  .o2c-data-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--sapBackgroundColor);
    font-size: 0.875rem;
  }

  .o2c-data-row:last-child {
    border-bottom: none;
  }

  .o2c-data-label {
    font-weight: 600;
    color: var(--sapSecondaryText);
  }

  .o2c-data-value {
    font-weight: 700;
    color: var(--sapTextColor);
  }

  .o2c-gl-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .o2c-gl-table th {
    background-color: var(--sapBackgroundColor);
    padding: 0.75rem;
    text-align: left;
    font-weight: 700;
    color: var(--sapTextColor);
    border-bottom: 2px solid var(--sapBrandColor);
  }

  .o2c-gl-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--sapBorderColor);
  }

  .o2c-gl-table tr:hover {
    background-color: var(--sapBackgroundColor);
  }

  .o2c-loading {
    text-align: center;
    padding: 2rem;
    color: var(--sapSecondaryText);
  }

  .o2c-error {
    background-color: rgba(187, 0, 0, 0.08);
    border: 1px solid var(--sapNegative);
    color: var(--sapNegative);
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  @media (max-width: 1024px) {
    .o2c-main {
      grid-template-columns: 1fr;
    }

    .o2c-form-group {
      grid-template-columns: 1fr;
    }

    .o2c-header {
      padding: 1rem 1.5rem;
    }

    .o2c-header-title {
      font-size: 1.5rem;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = fioriStyles;
  document.head.appendChild(style);
}

export default function O2COrchestrator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [glPostings, setGlPostings] = useState<GLPosting[]>([]);
  const [arAging, setArAging] = useState<ARAgingBucket[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000/api/o2c';

  useEffect(() => {
    // Load scenarios on mount
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch(`${API_BASE}/scenarios`);
      if (res.ok) {
        const data = await res.json();
        setScenarios(data);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Get scenario values if selected
    let scenario = scenarios.find(s => s.id === selectedScenario);

    const orderPayload = {
      customer: scenario ? `${scenario.name.split(' ')[0]} Corp` : 'Global Enterprise Corp',
      order_value: scenario ? scenario.total_value : 150000,
      currency: scenario ? scenario.currency : 'EUR',
      engagement_type: scenario ? scenario.engagement_type : 'T&M',
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderData(data);
        setCurrentStep(1);
        setSelectedScenario(''); // Reset selector
      } else {
        setError('Failed to create order');
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (percentage: number) => {
    if (!orderData) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/orders/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderData.order_number,
          completion_percentage: percentage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderData(data);

        // Fetch GL postings
        const glRes = await fetch(`${API_BASE}/orders/${orderData.order_number}/gl-posting`);
        if (glRes.ok) {
          setGlPostings(await glRes.json());
        }

        // Fetch AR aging
        const arRes = await fetch(`${API_BASE}/orders/${orderData.order_number}/ar-aging`);
        if (arRes.ok) {
          setArAging(await arRes.json());
        }

        setCurrentStep(Math.min(5, Math.floor(percentage / 20) + 1));
      }
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Order', icon: ShoppingCart },
    { label: 'Confirm', icon: CheckCircle },
    { label: 'Invoice', icon: TrendingUp },
    { label: 'Revenue', icon: DollarSign },
    { label: 'AR Aging', icon: BarChart3 },
    { label: 'GL Post', icon: AlertCircle },
  ];

  const painPoints = [
    {
      id: 'pp-1',
      asIs: 'Manual cost center & legal entity mapping between Workday and SAP',
      tobe: 'Automated integration with master data governance',
      step: 'Order',
      config: 'SAP MDG + OData sync, FARR_D entity master mapping',
    },
    {
      id: 'pp-2',
      asIs: 'Renewal process inconsistent—no formal contract linkage',
      tobe: 'Automated order status tracking with renewal flag',
      step: 'Confirm',
      config: 'SO type determination rules, contract linkage in FARR_CONTRACT',
    },
    {
      id: 'pp-3',
      asIs: 'Revenue recognition by contract type is manual—no audit trail',
      tobe: 'IFRS 15 compliance via PBO (Performance-Based Objects) automation',
      step: 'Invoice',
      config: 'RAR Billing Rules (BRFPLUS), PBO transaction posting',
    },
    {
      id: 'pp-4',
      asIs: 'Revenue calc for T&M/Fixed/Milestone requires spreadsheet',
      tobe: 'Real-time recognition % calculation based on business logic',
      step: 'Revenue',
      config: 'RAR_POB monitoring (% complete logic), FI-RA module integration',
    },
    {
      id: 'pp-5',
      asIs: 'Prepayment tracking across projects causes manual reconciliation',
      tobe: 'AR aging shows all prepayment status with dunning escalation',
      step: 'AR Aging',
      config: 'Prepayment clearing in S/4, dunning rules per customer segment',
    },
    {
      id: 'pp-6',
      asIs: 'No real-time GL visibility—finance reconciliation is 10+ days',
      tobe: 'Immediate GL posting impact visibility for each transaction',
      step: 'GL Post',
      config: 'Auto-posting to GL accounts (1200/4000/2100/3000), SAP Posting Control',
    },
  ];

  return (
    <div className="o2c-shell">
      <header className="o2c-header">
        <h1 className="o2c-header-title">O2C Global Solution Orchestrator</h1>
        <p className="o2c-header-subtitle">Order-to-Cash with IFRS 15 RAR Integration</p>
      </header>

      {error && <div className="o2c-error">{error}</div>}

      <div className="o2c-main">
        <div className="o2c-content">
          <div className="o2c-card">
            <div className="o2c-steps">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <div
                    key={idx}
                    className={`o2c-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  >
                    <div className="o2c-step-indicator">{isCompleted ? '✓' : idx + 1}</div>
                    <div className="o2c-step-label">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentStep === 0 && !orderData && (
            <>
              <div className="o2c-card">
                <h3 className="o2c-card-title">
                  <AlertCircle size={24} />
                  Order-to-Cash: Current State vs. Future State
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1rem' }}>
                    This orchestration demonstrates how a modern O2C process architecture resolves common pain points and automates manual steps in the order lifecycle.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    fontSize: '0.8rem',
                  }}>
                    {painPoints.map((pp) => (
                      <div key={pp.id} style={{
                        padding: '1rem',
                        backgroundColor: '#F5F5F5',
                        borderLeft: '4px solid #0066CC',
                        borderRadius: '4px',
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#333333' }}>
                          {pp.step}
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ color: '#666666', fontWeight: 500 }}>AS IS:</div>
                          <div style={{ color: '#999999', fontSize: '0.75rem' }}>{pp.asIs}</div>
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ color: '#107E3E', fontWeight: 500 }}>TO BE:</div>
                          <div style={{ color: '#2d5016', fontSize: '0.75rem' }}>{pp.tobe}</div>
                        </div>
                        <div style={{
                          padding: '0.5rem',
                          backgroundColor: '#E3F2FD',
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          color: '#0066CC',
                          fontFamily: 'monospace',
                        }}>
                          {pp.config}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="o2c-card">
                <h3 className="o2c-card-title">
                  <ShoppingCart size={24} />
                  Create Sales Order
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1.5rem' }}>
                  Start with a professional services order (T&M, Fixed Price, or Retainer) and watch how the O2C process automates manual steps through intelligent automation and SAP integration.
                </p>

                {scenarios.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#333333' }}>
                      Select Scenario Template:
                    </label>
                    <select
                      value={selectedScenario}
                      onChange={(e) => setSelectedScenario(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #E0E0E0',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: '#FFFFFF',
                        color: '#333333',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">-- Or create custom order --</option>
                      {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name} • €{scenario.total_value.toLocaleString()} {scenario.currency}
                        </option>
                      ))}
                    </select>

                    {selectedScenario && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#E3F2FD',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#0066CC',
                        fontWeight: 500,
                      }}>
                        Selected: {scenarios.find(s => s.id === selectedScenario)?.engagement_type}
                      </div>
                    )}
                  </div>
                )}

                <button className="o2c-button o2c-button-primary" onClick={handleCreateOrder} disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Creating...' : selectedScenario ? 'Create Order from Template' : 'Create Order'}
                </button>
              </div>
            </>
          )}

          {orderData && currentStep === 1 && (
            <div className="o2c-card">
              <h3 className="o2c-card-title">
                <CheckCircle size={24} />
                Order Confirmation
              </h3>
              <div className="o2c-data-row">
                <span className="o2c-data-label">Order:</span>
                <span className="o2c-data-value">{orderData.order_number}</span>
              </div>
              <div className="o2c-data-row">
                <span className="o2c-data-label">Customer:</span>
                <span className="o2c-data-value">{orderData.customer}</span>
              </div>
              <div className="o2c-data-row">
                <span className="o2c-data-label">Value:</span>
                <span className="o2c-data-value">{orderData.order_value.toLocaleString()} {orderData.currency}</span>
              </div>
              <button
                className="o2c-button o2c-button-primary"
                onClick={() => handleUpdateProgress(25)}
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
          )}

          {orderData && currentStep >= 2 && (
            <div className="o2c-card">
              <h3 className="o2c-card-title">
                <TrendingUp size={24} />
                GL Posting Impact
              </h3>
              {glPostings.length > 0 ? (
                <table className="o2c-gl-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {glPostings.map((posting, idx) => (
                      <tr key={idx}>
                        <td>{posting.account}</td>
                        <td>{posting.type}</td>
                        <td>€{posting.amount.toLocaleString()}</td>
                        <td>{posting.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="o2c-loading">No GL postings yet</div>
              )}
            </div>
          )}

          {orderData && currentStep >= 4 && (
            <div className="o2c-card">
              <h3 className="o2c-card-title">
                <BarChart3 size={24} />
                AR Aging & Dunning
              </h3>
              {arAging.length > 0 ? (
                <table className="o2c-gl-table">
                  <thead>
                    <tr>
                      <th>Bucket</th>
                      <th>Days</th>
                      <th>Amount</th>
                      <th>Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arAging.map((bucket, idx) => (
                      <tr key={idx}>
                        <td>{bucket.bucket}</td>
                        <td>{bucket.days_overdue}</td>
                        <td>€{bucket.amount.toLocaleString()}</td>
                        <td>{bucket.dunning_level}</td>
                        <td>{bucket.next_action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="o2c-loading">No AR aging data yet</div>
              )}
            </div>
          )}

          {orderData && currentStep >= 5 && (
            <div className="o2c-card">
              <h3 className="o2c-card-title" style={{ color: '#107E3E' }}>
                ✓ Process Complete
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '1.5rem' }}>
                Order {orderData.order_number} has successfully progressed through all O2C steps. Export the configuration as a SAP Solution Builder template to deploy this flow in your S/4HANA landscape.
              </p>
              <button
                className="o2c-button o2c-button-primary"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch(`${API_BASE}/orders/${orderData.order_number}/export/download`, {
                      method: 'POST',
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `O2C-SolutionBuilder-${orderData.order_number}.xml`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } else {
                      setError('Failed to download Solution Builder export');
                    }
                  } catch (err) {
                    setError(`Export error: ${err}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? 'Exporting...' : '⬇ Export as Solution Builder XML'}
              </button>
            </div>
          )}
        </div>

        <aside className="o2c-sidebar">
          {orderData && (
            <>
              <div className="o2c-sidebar-panel">
                <h4 className="o2c-sidebar-title">Order Summary</h4>
                <div className="o2c-kpi-card">
                  <span className="o2c-kpi-label">Order Value</span>
                  <span className="o2c-kpi-value">{orderData.order_value.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: '#666666' }}>{orderData.currency}</span>
                </div>
              </div>

              <div className="o2c-sidebar-panel">
                <h4 className="o2c-sidebar-title">Process Status</h4>
                <div className="o2c-data-row">
                  <span className="o2c-data-label">Step:</span>
                  <span className="o2c-data-value">{currentStep + 1} of 6</span>
                </div>
                <div className="o2c-data-row">
                  <span className="o2c-data-label">Progress:</span>
                  <span className="o2c-data-value">{Math.round(((currentStep + 1) / 6) * 100)}%</span>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    className="o2c-button o2c-button-primary"
                    onClick={() => handleUpdateProgress(Math.min(100, (currentStep + 1) * 20))}
                    disabled={loading || currentStep >= 5}
                    style={{ marginTop: 0, width: '100%' }}
                  >
                    Next Step
                  </button>
                </div>
              </div>

              <div className="o2c-sidebar-panel">
                <h4 className="o2c-sidebar-title">Revenue Recognition</h4>
                <div className="o2c-data-row">
                  <span className="o2c-data-label">Completion:</span>
                  <span className="o2c-data-value">{orderData.completion_percentage}%</span>
                </div>
                <div className="o2c-data-row">
                  <span className="o2c-data-label">Recognized:</span>
                  <span className="o2c-data-value">
                    €{(orderData.order_value * (orderData.completion_percentage / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="o2c-sidebar-panel" style={{ backgroundColor: '#E3F2FD', borderLeft: '4px solid #0066CC' }}>
                <h4 className="o2c-sidebar-title" style={{ color: '#0066CC', marginBottom: '0.75rem' }}>SAP Config — Step {currentStep + 1}</h4>
                <div style={{ fontSize: '0.8rem', color: '#333333', lineHeight: '1.5' }}>
                  {currentStep === 0 && (
                    <>
                      <div><strong>Create SO (Sales Order)</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: VA01 (Create SO)</div>
                        <div>• Module: SD (Sales & Distribution)</div>
                        <div>• Config: Order Type determination rules</div>
                        <div>• Master: Customer, Material, Pricing</div>
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <div><strong>Contract Linkage & Confirmation</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: VA01 (Edit SO)</div>
                        <div>• Module: SD + CRM (Contract mgmt)</div>
                        <div>• Ref: FARR_CONTRACT (RAR module)</div>
                        <div>• Link: Old/New contract for renewals</div>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div><strong>Invoice Generation</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: VF01 (Create Invoice)</div>
                        <div>• Module: FI-AR (Accounts Receivable)</div>
                        <div>• Config: Billing plan, Invoice layout</div>
                        <div>• Output: FB01 (FI posting)</div>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <div><strong>Revenue Recognition (IFRS 15)</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: FARR_IMG (RAR Config)</div>
                        <div>• Module: RAR (Revenue Accounting)</div>
                        <div>• PBO: Performance Obligation setup</div>
                        <div>• Rules: BRFplus for % logic</div>
                      </div>
                    </>
                  )}
                  {currentStep === 4 && (
                    <>
                      <div><strong>AR Aging & Dunning</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: F150 (Dunning Run)</div>
                        <div>• Module: FI-AR (AR management)</div>
                        <div>• Config: Dunning levels (0-3)</div>
                        <div>• Late Fees: €200 (L2), €500 (L3)</div>
                      </div>
                    </>
                  )}
                  {currentStep === 5 && (
                    <>
                      <div><strong>GL Posting & Reconciliation</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.5rem' }}>
                        <div>• TXN: FB01 (GL Posting)</div>
                        <div>• Module: FI (General Ledger)</div>
                        <div>• Accounts: 1200 (A/R), 4000 (Rev)</div>
                        <div>• Auto-posting: Posting Control rules</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {scenarios.length > 0 && (
            <div className="o2c-sidebar-panel">
              <h4 className="o2c-sidebar-title">Available Scenarios</h4>
              <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                {scenarios.map((scenario) => (
                  <div key={scenario.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F5F5F5' }}>
                    <strong>{scenario.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>€{scenario.total_value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
