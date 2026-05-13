import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface CutoverStatus {
  id: string;
  timestamp: string;
  phase: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETE';
  message: string;
  owner: string;
}

interface CriticalPath {
  phase: string;
  duration: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'PENDING';
  owner: string;
}

const CutoverCenter: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [statusUpdates, setStatusUpdates] = useState<CutoverStatus[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('system-prep');
  const [statusType, setStatusType] = useState<'ON_TRACK' | 'AT_RISK' | 'BLOCKED' | 'COMPLETE'>('ON_TRACK');

  const [criticalPath] = useState<CriticalPath[]>([
    { phase: 'System Prep & Validation', duration: '3 days', status: 'COMPLETE', owner: 'Tech Lead' },
    { phase: 'Data Migration & Load', duration: '2 days', status: 'IN_PROGRESS', owner: 'Data Team' },
    { phase: 'GL Reconciliation', duration: '1 day', status: 'PENDING', owner: 'FI Lead' },
    { phase: 'Revenue Cutover & GL Posting', duration: '1 day', status: 'PENDING', owner: 'FI-Revenue Team' },
    { phase: 'UAT & Sign-off', duration: '2 days', status: 'PENDING', owner: 'Business Team' },
    { phase: 'Go-Live & Monitoring', duration: '2 days', status: 'PENDING', owner: 'Operations' }
  ]);

  const styles = `
    .cutover-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .cutover-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #C00; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .cutover-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #C00; display: flex; align-items: center; gap: 1rem; }
    .cutover-main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .cutover-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    .cutover-panel-title { font-size: 1rem; font-weight: 700; color: #C00; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .cutover-form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .cutover-form-group label { color: ${isDarkMode ? '#b0bec5' : '#666666'}; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .cutover-form-group input, .cutover-form-group select, .cutover-form-group textarea { padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; }
    .cutover-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #C00; color: #ffffff; width: 100%; transition: all 0.2s; }
    .cutover-button:hover { background: #a00; }
    .cutover-status-update { padding: 1rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-left: 4px solid; border-radius: 4px; margin-bottom: 1rem; }
    .cutover-status-update.on-track { border-color: #107E3E; }
    .cutover-status-update.at-risk { border-color: #E17B08; }
    .cutover-status-update.blocked { border-color: #C00; }
    .cutover-status-update.complete { border-color: #0A6ED4; }
    .cutover-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: inline-block; }
    .cutover-badge.on-track { background: #107E3E; color: #ffffff; }
    .cutover-badge.at-risk { background: #E17B08; color: #ffffff; }
    .cutover-badge.blocked { background: #C00; color: #ffffff; }
    .cutover-badge.complete { background: #0A6ED4; color: #ffffff; }
    .cutover-path-item { padding: 1rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-radius: 4px; margin-bottom: 0.75rem; border-left: 4px solid; }
    .cutover-path-item.complete { border-color: #107E3E; }
    .cutover-path-item.in-progress { border-color: #E17B08; }
    .cutover-path-item.pending { border-color: #0A6ED4; }
    .cutover-path-phase { font-weight: 700; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .cutover-path-meta { font-size: 0.8rem; color: ${isDarkMode ? '#94a3b8' : '#999999'}; }
    .cutover-results { grid-column: 1 / -1; margin-top: 2rem; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-cutover]')) {
      style.setAttribute('data-cutover', 'true');
      document.head.appendChild(style);
    }
  }

  const handleAddStatus = () => {
    if (statusMessage.trim()) {
      const newUpdate: CutoverStatus = {
        id: `STS-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        phase: selectedPhase,
        status: statusType,
        message: statusMessage,
        owner: 'Cutover Lead'
      };
      setStatusUpdates([newUpdate, ...statusUpdates]);
      setStatusMessage('');
    }
  };

  const phaseLabels: { [key: string]: string } = {
    'system-prep': 'System Prep & Validation',
    'data-migration': 'Data Migration & Load',
    'gl-reconciliation': 'GL Reconciliation',
    'revenue-cutover': 'Revenue Cutover & GL Posting',
    'uat': 'UAT & Sign-off',
    'go-live': 'Go-Live & Monitoring'
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return '✓';
      case 'ON_TRACK':
        return '▶';
      case 'AT_RISK':
        return '⚠';
      case 'BLOCKED':
        return '✕';
      default:
        return '◯';
    }
  };

  return (
    <div className={`cutover-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="cutover-header">
        <h1 className="cutover-title">
          <Zap size={32} />
          Cutover Command Center
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Real-time S/4HANA go-live coordination & critical path tracking
        </p>
      </div>

      <div className="cutover-main">
        <div className="cutover-panel">
          <div className="cutover-panel-title">📢 Post Status Update</div>

          <div className="cutover-form-group">
            <label>Critical Phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
            >
              <option value="system-prep">System Prep & Validation</option>
              <option value="data-migration">Data Migration & Load</option>
              <option value="gl-reconciliation">GL Reconciliation</option>
              <option value="revenue-cutover">Revenue Cutover & GL Posting</option>
              <option value="uat">UAT & Sign-off</option>
              <option value="go-live">Go-Live & Monitoring</option>
            </select>
          </div>

          <div className="cutover-form-group">
            <label>Status</label>
            <select
              value={statusType}
              onChange={(e) => setStatusType(e.target.value as any)}
            >
              <option value="ON_TRACK">✓ On Track</option>
              <option value="AT_RISK">⚠ At Risk</option>
              <option value="BLOCKED">✕ Blocked</option>
              <option value="COMPLETE">◯ Complete</option>
            </select>
          </div>

          <div className="cutover-form-group">
            <label>Update Message</label>
            <textarea
              placeholder="Post a status update for the team (e.g., 'GL reconciliation completed, variance $0.00')..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              style={{ minHeight: '100px' }}
            />
          </div>

          <button className="cutover-button" onClick={handleAddStatus}>
            Post Status Update
          </button>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.6' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Quick Tips:</strong>
            <br />• Post every 2-4 hours during cutover
            <br />• Flag ALL blockers immediately
            <br />• Include GL posting verification
            <br />• Note any data discrepancies
            <br />• Confirm revenue cutover completion
          </div>
        </div>

        <div className="cutover-panel">
          <div className="cutover-panel-title">🎯 Critical Path & Risks</div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Key Go-Live Risks:</strong>
            <br />🔴 GL posting delays → Check AIF/RFC queues
            <br />🔴 Revenue cutover variance → Validate IFRS 15 config
            <br />🔴 Data migration failures → Rerun reconciliation reports
            <br />🔴 Integration timeouts → Monitor backend systems
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>FS/Insurance Flags:</strong>
            <br />• Regulatory reporting must go live same day
            <br />• AML/KYC screening cannot be deferred
            <br />• Audit trail must be active from go-live
            <br />• Reserve calculations must reconcile
          </div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Steering Communication:</strong>
            <br />Draft: "System cutover on schedule. Data migration complete. GL reconciliation in progress. Revenue cutover go-live proceeding as planned. No critical blockers."
          </div>
        </div>
      </div>

      <div className="cutover-results">
        <div className="cutover-panel">
          <div className="cutover-panel-title">📊 Critical Path Tracker</div>
          <div style={{ marginBottom: '2rem' }}>
            {criticalPath.map((item, idx) => (
              <div key={idx} className={`cutover-path-item ${item.status.toLowerCase().replace('_', '-')}`}>
                <div className="cutover-path-phase">
                  {statusIcon(item.status)} {item.phase}
                </div>
                <div className="cutover-path-meta">
                  Duration: {item.duration} • Owner: {item.owner} • Status: {item.status}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}`, paddingTop: '1.5rem' }}>
            <div className="cutover-panel-title" style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: 0 }}>
              📋 Status Timeline
            </div>
            {statusUpdates.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#999999', textAlign: 'center', padding: '2rem' }}>
                No status updates yet. Post your first update above.
              </div>
            ) : (
              statusUpdates.map((update) => (
                <div key={update.id} className={`cutover-status-update ${update.status.toLowerCase().replace('_', '-')}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <span className={`cutover-badge ${update.status.toLowerCase().replace('_', '-')}`}>
                      {update.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#999999' }}>
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000', marginBottom: '0.5rem' }}>
                    {phaseLabels[update.phase]}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: 1.5 }}>
                    {update.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CutoverCenter;
