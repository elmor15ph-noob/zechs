import React, { useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';

interface TriageTicket {
  id: string;
  title: string;
  module: string;
  severity: 'S1' | 'S2' | 'S3' | 'S4';
  description: string;
  rootCause: string;
  diagnosticSteps: string[];
  resolutionPath: string;
  estimatedEffort: string;
}

const TicketTriage: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    module: '',
    severity: 'S2' as const,
    description: ''
  });

  const styles = `
    .triage-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .triage-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #0A6ED4; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .triage-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #0A6ED4; display: flex; align-items: center; gap: 1rem; }
    .triage-main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .triage-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    .triage-panel-title { font-size: 1rem; font-weight: 700; color: #0A6ED4; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .triage-form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .triage-form-group label { color: ${isDarkMode ? '#b0bec5' : '#666666'}; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .triage-form-group input, .triage-form-group select, .triage-form-group textarea { padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; }
    .triage-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #0A6ED4; color: #ffffff; width: 100%; transition: all 0.2s; }
    .triage-button:hover { background: #055399; }
    .triage-ticket { padding: 1.5rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-left: 4px solid; border-radius: 4px; margin-bottom: 1.5rem; }
    .triage-ticket.s1 { border-color: #C00; }
    .triage-ticket.s2 { border-color: #E17B08; }
    .triage-ticket.s3 { border-color: #0A6ED4; }
    .triage-ticket.s4 { border-color: #107E3E; }
    .triage-ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .triage-severity { padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .triage-severity.s1 { background: #C00; color: #ffffff; }
    .triage-severity.s2 { background: #E17B08; color: #ffffff; }
    .triage-severity.s3 { background: #0A6ED4; color: #ffffff; }
    .triage-severity.s4 { background: #107E3E; color: #ffffff; }
    .triage-ticket-title { font-weight: 700; color: ${isDarkMode ? '#ffffff' : '#000000'}; margin-bottom: 0.5rem; }
    .triage-ticket-section { margin: 1rem 0; padding: 0.75rem; background: ${isDarkMode ? '#2a3a4a' : '#ffffff'}; border-radius: 2px; }
    .triage-ticket-section-title { font-weight: 700; color: #0A6ED4; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .triage-ticket-content { font-size: 0.85rem; color: ${isDarkMode ? '#b0bec5' : '#666666'}; line-height: 1.6; }
    .triage-results { grid-column: 1 / -1; margin-top: 2rem; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-triage]')) {
      style.setAttribute('data-triage', 'true');
      document.head.appendChild(style);
    }
  }

  const handleAddTicket = () => {
    if (formData.title && formData.module) {
      const newTicket: TriageTicket = {
        id: `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        ...formData,
        rootCause: 'Pending detailed analysis',
        diagnosticSteps: ['Review error logs', 'Check system configuration', 'Verify user permissions'],
        resolutionPath: 'Escalate to SAP Basis team for investigation',
        estimatedEffort: '4-8 hours'
      };
      setTickets([...tickets, newTicket]);
      setFormData({ title: '', module: '', severity: 'S2', description: '' });
    }
  };

  const deleteTicket = (id: string) => {
    setTickets(tickets.filter(t => t.id !== id));
  };

  const severityMap = {
    'S1': { label: 'CRITICAL - Production Down', color: '#C00' },
    'S2': { label: 'HIGH - Major Functionality Impaired', color: '#E17B08' },
    'S3': { label: 'MEDIUM - Minor Functionality Impact', color: '#0A6ED4' },
    'S4': { label: 'LOW - General Question/Enhancement', color: '#107E3E' }
  };

  return (
    <div className={`triage-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="triage-header">
        <h1 className="triage-title">
          <AlertCircle size={32} />
          Support Ticket Triage
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Classify, diagnose, and route SAP support tickets for rapid resolution
        </p>
      </div>

      <div className="triage-main">
        <div className="triage-panel">
          <div className="triage-panel-title">➕ New Support Ticket</div>

          <div className="triage-form-group">
            <label>Ticket Title</label>
            <input
              type="text"
              placeholder="e.g., GL posting period close fails"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="triage-form-group">
            <label>Module/Component</label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            >
              <option value="">Select Module</option>
              <option value="FI-GL">FI-GL (General Ledger)</option>
              <option value="FI-AR">FI-AR (Accounts Receivable)</option>
              <option value="FI-AP">FI-AP (Accounts Payable)</option>
              <option value="MM-IM">MM-IM (Inventory)</option>
              <option value="SD-SLI">SD-SLI (Sales)</option>
              <option value="FS-CM">FS-CM (Claims Management)</option>
              <option value="FS-PM">FS-PM (Policy Management)</option>
              <option value="FSCM">FSCM (Financial Supply Chain)</option>
            </select>
          </div>

          <div className="triage-form-group">
            <label>Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
            >
              <option value="S1">S1 - Critical (Production Down)</option>
              <option value="S2">S2 - High (Major Impact)</option>
              <option value="S3">S3 - Medium (Minor Impact)</option>
              <option value="S4">S4 - Low (General Question)</option>
            </select>
          </div>

          <div className="triage-form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ minHeight: '100px' }}
            />
          </div>

          <button className="triage-button" onClick={handleAddTicket}>
            Triage Ticket
          </button>
        </div>

        <div className="triage-panel">
          <div className="triage-panel-title">📚 FS/Insurance Patterns</div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.6' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Common Issues:</strong>
            <br />• IFRS 15/17 revenue accrual failures → Escalate to FI Lead
            <br />• AML/KYC screening timeouts → Compliance team
            <br />• Premium calculation errors → Product team + SAP
            <br />• Payment processing blocks → Treasury + FI-AR
            <br />• Regulatory report generation failures → BI team
            <br />• Interest accrual discrepancies → Accounting
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>S1 Escalation Path:</strong>
            <br />1. Page SAP Basis oncall
            <br />2. Notify FI Lead if revenue/GL affected
            <br />3. Engage SAP Support with INC number
            <br />4. Create war room if customer-facing
          </div>
        </div>
      </div>

      {tickets.length > 0 && (
        <div className="triage-results">
          <div className="triage-panel">
            <div className="triage-panel-title">📋 Triage Queue</div>
            {tickets.map((ticket) => (
              <div key={ticket.id} className={`triage-ticket ${ticket.severity.toLowerCase()}`}>
                <div className="triage-ticket-header">
                  <div>
                    <div className="triage-ticket-title">{ticket.title}</div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#999999' }}>
                      {ticket.id} • {ticket.module}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`triage-severity ${ticket.severity.toLowerCase()}`}>
                      {severityMap[ticket.severity].label}
                    </span>
                    <button
                      onClick={() => deleteTicket(ticket.id)}
                      style={{
                        background: '#C00',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="triage-ticket-section">
                  <div className="triage-ticket-section-title">Description</div>
                  <div className="triage-ticket-content">{ticket.description || 'No description provided'}</div>
                </div>

                <div className="triage-ticket-section">
                  <div className="triage-ticket-section-title">Root Cause Analysis</div>
                  <div className="triage-ticket-content">{ticket.rootCause}</div>
                </div>

                <div className="triage-ticket-section">
                  <div className="triage-ticket-section-title">Diagnostic Steps</div>
                  <div className="triage-ticket-content">
                    {ticket.diagnosticSteps.map((step, idx) => (
                      <div key={idx}>• {step}</div>
                    ))}
                  </div>
                </div>

                <div className="triage-ticket-section">
                  <div className="triage-ticket-section-title">Recommended Resolution Path</div>
                  <div className="triage-ticket-content">{ticket.resolutionPath}</div>
                </div>

                <div className="triage-ticket-section">
                  <div className="triage-ticket-section-title">Estimated Effort</div>
                  <div className="triage-ticket-content">{ticket.estimatedEffort}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketTriage;
