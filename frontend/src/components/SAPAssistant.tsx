import React, { useState } from 'react';
import { icons } from '../theme/icons';
import { colors, spacing, fonts, buttonStyles, cardStyles } from '../theme/designSystem';

interface AnalysisResult {
  fit?: string;
  config?: string;
  gap?: string;
  out_of_scope?: string;
  recommended_approach?: string;
  risk_factors?: string[];
  [key: string]: any;
}

interface SAPAssistantProps {
  isDarkMode?: boolean;
}

const sapStyles = `
  /* Dark Mode (default) */
  .sap-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .sap-textarea-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sap-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .sap-textarea {
    padding: 0.75rem;
    border: 1px solid #2a3a4a;
    border-radius: 4px;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-size: 0.9rem;
    resize: vertical;
    min-height: 80px;
    background: #263544;
    color: #e0e8f0;
  }

  .sap-textarea:focus {
    outline: none;
    border-color: #00d4ff;
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
  }

  .sap-btn {
    padding: 0.75rem 1.5rem;
    background-color: #00d4ff;
    color: #0f1620;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .sap-btn:hover {
    background-color: #0ab5d4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
  }

  .sap-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .analysis-result {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .analysis-section {
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #2a3a4a;
  }

  .analysis-section.fit {
    background-color: rgba(16, 185, 129, 0.1);
    border-left-color: #10b981;
  }

  .analysis-section.config {
    background-color: rgba(255, 107, 53, 0.1);
    border-left-color: #ff6b35;
  }

  .analysis-section.gap {
    background-color: rgba(239, 68, 68, 0.1);
    border-left-color: #ef4444;
  }

  .analysis-section.out-of-scope {
    background-color: rgba(42, 58, 74, 0.3);
    border-left-color: #2a3a4a;
  }

  .analysis-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .analysis-section.fit h4 { color: #10b981; }
  .analysis-section.config h4 { color: #ff6b35; }
  .analysis-section.gap h4 { color: #ef4444; }
  .analysis-section.out-of-scope h4 { color: #94a3b8; }

  .analysis-section p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: #e0e8f0;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #2a3a4a;
    border-top-color: #00d4ff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    padding: 1rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 6px;
    color: #ff6b35;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Light Mode */
  .light-mode .sap-label {
    color: #64748b;
  }

  .light-mode .sap-textarea {
    background: #ffffff;
    color: #1f2937;
    border-color: #e2e8f0;
  }

  .light-mode .sap-textarea:focus {
    border-color: #ff6b35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }

  .light-mode .sap-btn {
    background-color: #ff6b35;
    color: #ffffff;
  }

  .light-mode .sap-btn:hover {
    background-color: #ff8c52;
  }

  .light-mode .analysis-section {
    border-left-color: #e2e8f0;
  }

  .light-mode .analysis-section.fit {
    background-color: rgba(16, 185, 129, 0.08);
  }

  .light-mode .analysis-section.config {
    background-color: rgba(99, 102, 241, 0.08);
  }

  .light-mode .analysis-section.gap {
    background-color: rgba(239, 68, 68, 0.08);
  }

  .light-mode .analysis-section.out-of-scope {
    background-color: #f3f4f6;
  }

  .light-mode .analysis-section p {
    color: #1f2937;
  }

  .light-mode .error-message {
    background-color: rgba(239, 68, 68, 0.08);
    border-color: #fecaca;
    color: #dc2626;
  }

  @media (max-width: 768px) {
    .analysis-result {
      grid-template-columns: 1fr;
    }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = sapStyles;
  document.head.appendChild(style);
}

export default function SAPAssistant({ isDarkMode = true }: SAPAssistantProps) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a SAP question or scenario');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/agents/sap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('SAP analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: spacing.md, color: isDarkMode ? colors.dark.text : colors.light.text }}>
        {React.cloneElement(icons.sapFitGap, { color: isDarkMode ? colors.dark.accent : colors.light.accent, size: 24 })}
        SAP Fit/Gap Analysis
      </h2>

      <form className="sap-form" onSubmit={handleAnalyze}>
        <div className="sap-textarea-wrapper">
          <label className="sap-label">Describe your SAP requirement or challenge:</label>
          <textarea
            className="sap-textarea"
            placeholder="e.g., We need to implement automated billing reconciliation for our 3PL customers..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="sap-btn" disabled={loading}>
          {loading ? <><span className="loading-spinner"></span> Analyzing...</> : 'Analyze'}
        </button>
      </form>

      {error && <div className="error-message">
        {React.cloneElement(icons.error, { size: 18 })}
        {error}
      </div>}

      {result && (
        <div className="analysis-result">
          <div className="analysis-section fit">
            <h4>
              {React.cloneElement(icons.success, { size: 18 })}
              Fits
            </h4>
            <p>{result.fit || 'Standard SAP capabilities match your requirements'}</p>
          </div>

          <div className="analysis-section config">
            <h4>
              {React.cloneElement(icons.settings, { size: 18 })}
              Configuration
            </h4>
            <p>{result.config || 'Standard configuration options available'}</p>
          </div>

          <div className="analysis-section gap">
            <h4>
              {React.cloneElement(icons.warning, { size: 18 })}
              Gaps
            </h4>
            <p>{result.gap || 'No significant gaps identified'}</p>
          </div>

          <div className="analysis-section out-of-scope">
            <h4>
              {React.cloneElement(icons.close, { size: 18 })}
              Out of Scope
            </h4>
            <p>{result.out_of_scope || 'All requirements are within standard SAP scope'}</p>
          </div>

          {result.recommended_approach && (
            <div style={{ gridColumn: '1 / -1', padding: spacing.lg, backgroundColor: isDarkMode ? 'rgba(0, 212, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', borderLeft: `4px solid ${isDarkMode ? colors.dark.accent : colors.light.accent}` }}>
              <h4 style={{ margin: `0 0 ${spacing.md} 0`, display: 'flex', alignItems: 'center', gap: spacing.md, color: isDarkMode ? colors.dark.accent : colors.light.accent }}>
                {React.cloneElement(icons.ideas, { size: 18 })}
                Recommended Approach
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: isDarkMode ? colors.dark.text : colors.light.text, lineHeight: '1.5' }}>{result.recommended_approach}</p>
            </div>
          )}

          {result.risk_factors && result.risk_factors.length > 0 && (
            <div style={{ gridColumn: '1 / -1', padding: spacing.lg, backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.05)' : 'rgba(255, 107, 53, 0.08)', borderRadius: '8px', borderLeft: `4px solid ${colors.dark.orange}` }}>
              <h4 style={{ margin: `0 0 ${spacing.md} 0`, display: 'flex', alignItems: 'center', gap: spacing.md, color: colors.dark.orange }}>
                {React.cloneElement(icons.power, { size: 18 })}
                Risk Factors
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem' }}>
                {result.risk_factors.map((risk, i) => (
                  <li key={i} style={{ marginBottom: spacing.sm, color: isDarkMode ? colors.dark.text : colors.light.text }}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
