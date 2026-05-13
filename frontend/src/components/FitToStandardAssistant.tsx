import React, { useState } from 'react';
import { Zap } from 'lucide-react';

const FitToStandardAssistant: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [statement, setStatement] = useState('');

  const styles = `
    .f2s-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .f2s-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #0A6ED4; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .f2s-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #0A6ED4; display: flex; align-items: center; gap: 1rem; }
    .f2s-main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .f2s-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    .f2s-panel-title { font-size: 1rem; font-weight: 700; color: #0A6ED4; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .f2s-textarea { width: 100%; min-height: 120px; padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; resize: vertical; }
    .f2s-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #0A6ED4; color: #ffffff; width: 100%; transition: all 0.2s; }
    .f2s-button:hover { background: #055399; }
    .f2s-classification { padding: 1rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-left: 4px solid #0A6ED4; border-radius: 4px; margin: 1rem 0; }
    .f2s-fit { border-color: #107E3E; }
    .f2s-gap-config { border-color: #E17B08; }
    .f2s-gap-extension { border-color: #0A6ED4; }
    .f2s-gap-ricefw { border-color: #C00; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-f2s]')) {
      style.setAttribute('data-f2s', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`f2s-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="f2s-header">
        <h1 className="f2s-title">
          <Zap size={32} />
          Fit-to-Standard Workshop Assistant
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Real-time workshop companion for S/4HANA PCE 2022 (FS/Insurance)
        </p>
      </div>

      <div className="f2s-main">
        <div className="f2s-panel">
          <div className="f2s-panel-title">💬 What did the business say?</div>
          <textarea
            className="f2s-textarea"
            placeholder="Paste the business requirement or paste what they just said in the workshop..."
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
          <button className="f2s-button">Analyze Requirement</button>
        </div>

        <div className="f2s-panel">
          <div className="f2s-panel-title">📋 Analysis Output</div>

          <div className="f2s-classification">
            <div style={{ fontWeight: 700, color: '#0A6ED4', marginBottom: '0.5rem' }}>STANDARD SAP PROCESS</div>
            <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>J58 – Accounting and Financial Close</div>
          </div>

          <div className="f2s-classification f2s-fit">
            <div style={{ fontWeight: 700, color: '#107E3E', marginBottom: '0.5rem' }}>FIT CLASSIFICATION</div>
            <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>FIT (standard works as-is)</div>
          </div>

          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '1rem', lineHeight: '1.6' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>LIVE QUESTIONS TO ASK:</strong>
            <br />1. Is the posting period timing always monthly?
            <br />2. Do you need multi-company close coordination?
            <br />3. What's your tolerance for posting period overlap?
          </div>

          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '1rem', padding: '0.75rem', background: isDarkMode ? '#1a2a3a' : '#f8f8f8', borderRadius: '4px' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>ACTION ITEM:</strong>
            <br />FI Lead to confirm posting period close timeline and inter-company settlement rules.
          </div>
        </div>
      </div>

      <div className="f2s-panel" style={{ marginTop: '2rem' }}>
        <div className="f2s-panel-title">📚 FS/Insurance Heuristics</div>
        <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.8' }}>
          <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Custom premium/fee calculations:</strong> Usually GAP-EXTENSION (BTP side-by-side)<br/>
          <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Regulatory report variants:</strong> Often GAP-CONFIG via standard reporting<br/>
          <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Claims/policy workflow:</strong> Evaluate FS-CM/FS-PM standard first<br/>
          <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Dual approval/maker-checker:</strong> Usually FIT via standard workflow<br/>
          <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Multi-jurisdiction tax:</strong> Often GAP-CONFIG; sometimes needs external engine
        </div>
      </div>
    </div>
  );
};

export default FitToStandardAssistant;
