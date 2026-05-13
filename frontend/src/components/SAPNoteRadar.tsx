import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const SAPNoteRadar: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [noteInput, setNoteInput] = useState('');

  const styles = `
    .radar-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .radar-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #E17B08; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .radar-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #E17B08; display: flex; align-items: center; gap: 1rem; }
    .radar-subtitle { margin: 0.5rem 0 0 0; font-size: 0.9rem; color: ${isDarkMode ? '#b0bec5' : '#666666'}; }
    .radar-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); margin-bottom: 1.5rem; }
    .radar-panel-title { font-size: 1rem; font-weight: 700; color: #E17B08; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .radar-form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .radar-form-group label { color: ${isDarkMode ? '#b0bec5' : '#666666'}; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .radar-form-group input, .radar-form-group textarea { padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; }
    .radar-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #E17B08; color: #ffffff; transition: all 0.2s; }
    .radar-button:hover { background: #d07000; }
    .radar-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .radar-table th, .radar-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .radar-table th { font-weight: 700; color: #E17B08; }
    .radar-relevance-high { color: #C00; font-weight: 700; }
    .radar-relevance-med { color: #E17B08; font-weight: 600; }
    .radar-relevance-low { color: ${isDarkMode ? '#b0bec5' : '#999999'}; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-radar]')) {
      style.setAttribute('data-radar', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`radar-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="radar-header">
        <h1 className="radar-title">
          <AlertCircle size={32} />
          SAP Note Impact Radar
        </h1>
        <p className="radar-subtitle">Analyze SAP Notes, KBAs, and release info for landscape impact</p>
      </div>

      <div className="radar-panel">
        <div className="radar-panel-title">➕ Add SAP Note</div>
        <div className="radar-form-group">
          <label>Note Number</label>
          <input placeholder="e.g., 3123456" />
        </div>
        <div className="radar-form-group">
          <label>Title</label>
          <input placeholder="Note title" />
        </div>
        <div className="radar-form-group">
          <label>Component</label>
          <input placeholder="e.g., FI-GL, MM-IM" />
        </div>
        <button className="radar-button">Analyze Note</button>
      </div>

      <div className="radar-panel">
        <div className="radar-panel-title">📊 Impact Analysis</div>
        <table className="radar-table">
          <thead>
            <tr>
              <th>Note ID</th>
              <th>Title</th>
              <th>Relevance</th>
              <th>Affected Area</th>
              <th>PCE 2022?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3123456</td>
              <td>GL posting period close issue</td>
              <td><span className="radar-relevance-high">HIGH</span></td>
              <td>FI-GL</td>
              <td>YES</td>
            </tr>
            <tr>
              <td>3145678</td>
              <td>Payment run F110 optimization</td>
              <td><span className="radar-relevance-med">MED</span></td>
              <td>FI-AR</td>
              <td>YES</td>
            </tr>
            <tr>
              <td>3167890</td>
              <td>Tax reporting variant</td>
              <td><span className="radar-relevance-high">HIGH</span></td>
              <td>FI-TX</td>
              <td>CHECK</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="radar-panel">
        <div className="radar-panel-title">💡 FS/Insurance Prioritization</div>
        <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.6' }}>
          Mark as HIGH any notes affecting:
          <br />✓ IFRS reporting • Tax determination • Payment processing
          <br />✓ Interest calculation • Accrual/provisioning • AML screening
          <br />✓ Regulatory submissions • Customer master • Audit logs
        </div>
      </div>
    </div>
  );
};

export default SAPNoteRadar;
