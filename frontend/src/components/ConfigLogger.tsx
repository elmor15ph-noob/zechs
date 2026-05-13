import React, { useState } from 'react';
import { LogSquare } from 'lucide-react';

interface ConfigLog {
  id: string;
  date: string;
  description: string;
  transportRequest: string;
  businessJustification: string;
  testNotes: string;
  rollbackInstructions: string;
  auditNotes: string;
  component: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const ConfigLogger: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [logs, setLogs] = useState<ConfigLog[]>([]);
  const [formData, setFormData] = useState({
    description: '',
    transportRequest: '',
    businessJustification: '',
    testNotes: '',
    component: 'FI-GL'
  });
  const [showTemplate, setShowTemplate] = useState(false);

  const styles = `
    .config-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .config-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #E17B08; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .config-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #E17B08; display: flex; align-items: center; gap: 1rem; }
    .config-main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .config-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    .config-panel-title { font-size: 1rem; font-weight: 700; color: #E17B08; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .config-form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .config-form-group label { color: ${isDarkMode ? '#b0bec5' : '#666666'}; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .config-form-group input, .config-form-group select, .config-form-group textarea { padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; }
    .config-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #E17B08; color: #ffffff; width: 100%; transition: all 0.2s; }
    .config-button:hover { background: #d07000; }
    .config-button.secondary { background: #0A6ED4; }
    .config-button.secondary:hover { background: #055399; }
    .config-log { padding: 1.5rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-left: 4px solid; border-radius: 4px; margin-bottom: 1.5rem; }
    .config-log.low { border-color: #107E3E; }
    .config-log.medium { border-color: #E17B08; }
    .config-log.high { border-color: #C00; }
    .config-log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .config-log-title { font-weight: 700; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-size: 0.95rem; }
    .config-risk-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .config-risk-badge.low { background: #107E3E; color: #ffffff; }
    .config-risk-badge.medium { background: #E17B08; color: #ffffff; }
    .config-risk-badge.high { background: #C00; color: #ffffff; }
    .config-log-section { margin: 1rem 0; padding: 0.75rem; background: ${isDarkMode ? '#2a3a4a' : '#ffffff'}; border-radius: 2px; }
    .config-log-section-title { font-weight: 700; color: #E17B08; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .config-log-content { font-size: 0.85rem; color: ${isDarkMode ? '#b0bec5' : '#666666'}; line-height: 1.6; }
    .config-results { grid-column: 1 / -1; margin-top: 2rem; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-config]')) {
      style.setAttribute('data-config', 'true');
      document.head.appendChild(style);
    }
  }

  const handleAddLog = () => {
    if (formData.description && formData.transportRequest) {
      const newLog: ConfigLog = {
        id: `CFG-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        ...formData,
        rollbackInstructions: 'Reverse transport request in QA, then production. Verify GL reconciliation.',
        auditNotes: 'Configuration change logged in SAP audit trail. Segregation of duties verified.',
        riskLevel: 'MEDIUM'
      };
      setLogs([newLog, ...logs]);
      setFormData({ description: '', transportRequest: '', businessJustification: '', testNotes: '', component: 'FI-GL' });
    }
  };

  const deleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  const riskMap = {
    'LOW': '#107E3E',
    'MEDIUM': '#E17B08',
    'HIGH': '#C00'
  };

  return (
    <div className={`config-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="config-header">
        <h1 className="config-title">
          <LogSquare size={32} />
          Configuration Rationale Logger
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Document and audit all configuration changes with formal rationale & rollback plans
        </p>
      </div>

      <div className="config-main">
        <div className="config-panel">
          <div className="config-panel-title">📝 Log Configuration Change</div>

          <div className="config-form-group">
            <label>Change Description</label>
            <textarea
              placeholder="Describe the configuration change in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="config-form-group">
            <label>Component/Module</label>
            <select
              value={formData.component}
              onChange={(e) => setFormData({ ...formData, component: e.target.value })}
            >
              <option value="FI-GL">FI-GL (General Ledger)</option>
              <option value="FI-AR">FI-AR (Receivables)</option>
              <option value="FI-AP">FI-AP (Payables)</option>
              <option value="CO-PA">CO-PA (Profitability)</option>
              <option value="MM-IM">MM-IM (Inventory)</option>
              <option value="SD">SD (Sales & Distribution)</option>
              <option value="FS">FS (Financial Services)</option>
            </select>
          </div>

          <div className="config-form-group">
            <label>Transport Request #</label>
            <input
              type="text"
              placeholder="e.g., KNPK900125"
              value={formData.transportRequest}
              onChange={(e) => setFormData({ ...formData, transportRequest: e.target.value })}
            />
          </div>

          <div className="config-form-group">
            <label>Business Justification</label>
            <textarea
              placeholder="Why is this configuration change needed?"
              value={formData.businessJustification}
              onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
              style={{ minHeight: '60px' }}
            />
          </div>

          <div className="config-form-group">
            <label>Test Team Notes</label>
            <textarea
              placeholder="Test scenarios, validation results, sign-off..."
              value={formData.testNotes}
              onChange={(e) => setFormData({ ...formData, testNotes: e.target.value })}
              style={{ minHeight: '60px' }}
            />
          </div>

          <button className="config-button" onClick={handleAddLog}>
            Log Configuration Change
          </button>

          <button
            className="config-button secondary"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setShowTemplate(!showTemplate)}
          >
            {showTemplate ? 'Hide' : 'Show'} Rollback Template
          </button>

          {showTemplate && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: isDarkMode ? '#1a2a3a' : '#f8f8f8', borderRadius: '4px', fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
              <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Rollback Template:</strong>
              <br />1. Request rollback transport in DEV
              <br />2. Test in QA with GL reconciliation
              <br />3. Request STMS rollback for production
              <br />4. Validate all affected reports
              <br />5. Update change log with reversal date
              <br />6. Notify all stakeholders
            </div>
          )}
        </div>

        <div className="config-panel">
          <div className="config-panel-title">🔒 Audit & Compliance</div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.8' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>FS/Insurance Controls:</strong>
            <br />✓ All changes require documented justification
            <br />✓ SOD: Config changes must separate from testing
            <br />✓ Audit trail: Change logged in SAP Change & Transport
            <br />✓ Approval: Manager sign-off before production
            <br />✓ Rollback: Must have tested rollback plan
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Risk Assessment:</strong>
            <br />• LOW: UI label changes, report variants
            <br />• MEDIUM: GL account configs, tax settings
            <br />• HIGH: Revenue recognition, IFRS configs, payment processing
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Change Log Retention:</strong>
            <br />Maintain 7-year audit trail per FS regulations
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="config-results">
          <div className="config-panel">
            <div className="config-panel-title">📋 Change Log</div>
            {logs.map((log) => (
              <div key={log.id} className={`config-log ${log.riskLevel.toLowerCase()}`}>
                <div className="config-log-header">
                  <div>
                    <div className="config-log-title">{log.id} • {log.date}</div>
                    <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#999999' }}>
                      {log.component} • {log.transportRequest}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`config-risk-badge ${log.riskLevel.toLowerCase()}`}>
                      {log.riskLevel} RISK
                    </span>
                    <button
                      onClick={() => deleteLog(log.id)}
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

                <div className="config-log-section">
                  <div className="config-log-section-title">Change Description</div>
                  <div className="config-log-content">{log.description}</div>
                </div>

                <div className="config-log-section">
                  <div className="config-log-section-title">Business Justification</div>
                  <div className="config-log-content">{log.businessJustification || 'No justification provided'}</div>
                </div>

                <div className="config-log-section">
                  <div className="config-log-section-title">Test Validation</div>
                  <div className="config-log-content">{log.testNotes || 'Test notes pending'}</div>
                </div>

                <div className="config-log-section">
                  <div className="config-log-section-title">Rollback Instructions</div>
                  <div className="config-log-content">{log.rollbackInstructions}</div>
                </div>

                <div className="config-log-section">
                  <div className="config-log-section-title">Audit Notes (FS/Insurance)</div>
                  <div className="config-log-content">{log.auditNotes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigLogger;
