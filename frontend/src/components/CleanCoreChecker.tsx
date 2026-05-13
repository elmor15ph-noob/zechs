import React, { useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-react';

interface Verdict {
  status: 'GREEN' | 'AMBER' | 'RED';
  objectName: string;
  why: string;
  recommendedPath: string;
  alternatives: string[];
  risks: string[];
}

const CleanCoreChecker: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [objectInput, setObjectInput] = useState('');
  const [objectName, setObjectName] = useState('');

  const styles = `
    .checker-container {
      background: ${isDarkMode ? '#0a1929' : '#f5f5f5'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      min-height: 100vh;
      padding: 2rem;
      font-family: 'Community', 'IBM Plex Sans', sans-serif;
    }

    .checker-header {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border-bottom: 3px solid #C00;
      padding: 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .checker-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #C00;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .checker-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .checker-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .checker-panel {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .checker-panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: #C00;
      margin: 0 0 1rem 0;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
    }

    .checker-form-group {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checker-form-group label {
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .checker-form-group input,
    .checker-form-group textarea {
      padding: 0.75rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      border-radius: 4px;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      font-family: inherit;
      font-size: 0.9rem;
    }

    .checker-form-group textarea {
      min-height: 100px;
      resize: vertical;
    }

    .checker-button {
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      background: #C00;
      color: #ffffff;
      transition: all 0.2s;
    }

    .checker-button:hover {
      background: #a00;
    }

    .checker-verdict {
      padding: 1.5rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-left: 4px solid;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }

    .checker-verdict.green {
      border-color: #107E3E;
      background: ${isDarkMode ? 'rgba(16, 126, 62, 0.1)' : 'rgba(16, 126, 62, 0.05)'};
    }

    .checker-verdict.amber {
      border-color: #E17B08;
      background: ${isDarkMode ? 'rgba(225, 123, 8, 0.1)' : 'rgba(225, 123, 8, 0.05)'};
    }

    .checker-verdict.red {
      border-color: #C00;
      background: ${isDarkMode ? 'rgba(192, 0, 0, 0.1)' : 'rgba(192, 0, 0, 0.05)'};
    }

    .checker-verdict-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .checker-verdict-title {
      font-weight: 700;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
    }

    .checker-verdict-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .checker-verdict-badge.green {
      background: #107E3E;
      color: #ffffff;
    }

    .checker-verdict-badge.amber {
      background: #E17B08;
      color: #ffffff;
    }

    .checker-verdict-badge.red {
      background: #C00;
      color: #ffffff;
    }

    .checker-verdict-section {
      margin: 1rem 0;
      padding: 0.75rem;
      background: ${isDarkMode ? '#2a3a4a' : '#ffffff'};
      border-radius: 2px;
    }

    .checker-verdict-section-title {
      font-weight: 700;
      color: #C00;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .checker-verdict-content {
      font-size: 0.85rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      line-height: 1.6;
    }

    .checker-results {
      grid-column: 1 / -1;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-checker]')) {
      style.setAttribute('data-checker', 'true');
      document.head.appendChild(style);
    }
  }

  const addVerdict = () => {
    if (objectName.trim()) {
      const newVerdict: Verdict = {
        status: 'GREEN',
        objectName,
        why: 'Custom object assessment pending detailed review.',
        recommendedPath: 'Developer Extensibility / Embedded Steampunk',
        alternatives: [
          'Standard SAP already covers this',
          'In-App Key User Extensibility',
          'Side-by-Side on BTP (CAP, consuming released APIs / events)'
        ],
        risks: [
          'Upgrade impact on future support packages',
          'Maintenance burden for custom logic',
          'Clean-core compliance risks'
        ]
      };
      setVerdicts([...verdicts, newVerdict]);
      setObjectName('');
      setObjectInput('');
    }
  };

  const updateVerdict = (index: number, field: keyof Verdict, value: any) => {
    const updated = [...verdicts];
    (updated[index] as any)[field] = value;
    setVerdicts(updated);
  };

  const deleteVerdict = (index: number) => {
    setVerdicts(verdicts.filter((_, i) => i !== index));
  };

  return (
    <div className={`checker-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="checker-header">
        <h1 className="checker-title">
          <CheckCircle size={32} />
          Clean-Core Compliance Checker
        </h1>
        <p className="checker-subtitle">
          Review custom objects & enhancements for S/4HANA PCE 2022 clean-core compliance
        </p>
      </div>

      <div className="checker-main">
        <div className="checker-panel">
          <div className="checker-panel-title">➕ Add Custom Object</div>

          <div className="checker-form-group">
            <label>Object Name / Z-Code</label>
            <input
              type="text"
              placeholder="e.g., ZFIGL_POSTING, ZMM_INVENTORY"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
            />
          </div>

          <div className="checker-form-group">
            <label>Object Description</label>
            <textarea
              placeholder="What is this object? What does it do?"
              value={objectInput}
              onChange={(e) => setObjectInput(e.target.value)}
            />
          </div>

          <button className="checker-button" onClick={addVerdict}>
            <Upload size={18} style={{ marginRight: '0.5rem' }} /> Review Object
          </button>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Verdict Rules:</strong>
            <br />• GREEN: Clean extensibility or SAP standard
            <br />• AMBER: Feasible but design concerns
            <br />• RED: Non-compliant with PCE 2022
          </div>
        </div>

        <div className="checker-panel">
          <div className="checker-panel-title">📊 FS/Insurance Gaps</div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.6' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Common extension areas:</strong>
            <br />• Product-specific pricing (fees, premiums)
            <br />• Regulatory report enrichment (IFRS, Basel)
            <br />• Channel integrations (e-banking, claims)
            <br />• AML/KYC hooks
            <br />• Tax jurisdiction variants
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Recommended:</strong>
            <br />Point these toward side-by-side BTP rather than in-core extension.
          </div>
        </div>
      </div>

      {verdicts.length > 0 && (
        <div className="checker-results" style={{ marginTop: '2rem' }}>
          <div className="checker-panel">
            <div className="checker-panel-title">📋 Verdicts</div>

            {verdicts.map((verdict, idx) => (
              <div key={idx} className={`checker-verdict ${verdict.status.toLowerCase()}`}>
                <div className="checker-verdict-header">
                  <span className="checker-verdict-title">{verdict.objectName}</span>
                  <select
                    value={verdict.status}
                    onChange={(e) => updateVerdict(idx, 'status', e.target.value as any)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '2px',
                      border: 'none',
                      cursor: 'pointer',
                      background: verdict.status === 'GREEN' ? '#107E3E' : verdict.status === 'AMBER' ? '#E17B08' : '#C00',
                      color: '#ffffff'
                    }}
                  >
                    <option value="GREEN">GREEN</option>
                    <option value="AMBER">AMBER</option>
                    <option value="RED">RED</option>
                  </select>
                  <button
                    onClick={() => deleteVerdict(idx)}
                    style={{
                      background: '#C00',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div className="checker-verdict-section">
                  <div className="checker-verdict-section-title">Why</div>
                  <textarea
                    className="checker-verdict-content"
                    value={verdict.why}
                    onChange={(e) => updateVerdict(idx, 'why', e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '0.5rem',
                      background: isDarkMode ? '#1a2a3a' : '#f8f8f8',
                      border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}`,
                      borderRadius: '2px',
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}
                  />
                </div>

                <div className="checker-verdict-section">
                  <div className="checker-verdict-section-title">Recommended Path</div>
                  <select
                    value={verdict.recommendedPath}
                    onChange={(e) => updateVerdict(idx, 'recommendedPath', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: isDarkMode ? '#1a2a3a' : '#f8f8f8',
                      border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}`,
                      borderRadius: '2px',
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}
                  >
                    <option>Standard SAP already covers this</option>
                    <option>In-App Key User Extensibility</option>
                    <option>Developer Extensibility / Embedded Steampunk</option>
                    <option>Side-by-Side on BTP (CAP, consuming released APIs)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanCoreChecker;
