import React, { useState } from 'react';
import { CheckSquare } from 'lucide-react';

const TestCaseGenerator: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [requirement, setRequirement] = useState('');

  const styles = `
    .tcg-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .tcg-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #107E3E; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .tcg-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #107E3E; display: flex; align-items: center; gap: 1rem; }
    .tcg-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); margin-bottom: 1.5rem; }
    .tcg-panel-title { font-size: 1rem; font-weight: 700; color: #107E3E; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .tcg-textarea { width: 100%; min-height: 120px; padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; resize: vertical; }
    .tcg-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #107E3E; color: #ffffff; width: 100%; transition: all 0.2s; }
    .tcg-button:hover { background: #0a6531; }
    .tcg-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .tcg-table th, .tcg-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .tcg-table th { font-weight: 700; color: #107E3E; }
    .tcg-type-positive { color: #107E3E; font-weight: 600; }
    .tcg-type-negative { color: #C00; font-weight: 600; }
    .tcg-type-edge { color: #E17B08; font-weight: 600; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-tcg]')) {
      style.setAttribute('data-tcg', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`tcg-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="tcg-header">
        <h1 className="tcg-title">
          <CheckSquare size={32} />
          Test Case Generator
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Generate executable test cases from user stories & functional specs
        </p>
      </div>

      <div className="tcg-panel">
        <div className="tcg-panel-title">📝 User Story / Requirement</div>
        <textarea
          className="tcg-textarea"
          placeholder="Paste the user story, functional requirement, or specification here..."
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <button className="tcg-button">Generate Test Cases</button>
      </div>

      <div className="tcg-panel">
        <div className="tcg-panel-title">🧪 Generated Test Cases</div>
        <table className="tcg-table">
          <thead>
            <tr>
              <th>TC-ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Preconditions</th>
              <th>Expected Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TC-FI-001</td>
              <td>Post GL entry - valid</td>
              <td><span className="tcg-type-positive">Positive</span></td>
              <td>GL account active, period open</td>
              <td>Entry posted successfully</td>
            </tr>
            <tr>
              <td>TC-FI-002</td>
              <td>Post GL entry - closed period</td>
              <td><span className="tcg-type-negative">Negative</span></td>
              <td>Posting period closed</td>
              <td>Error: posting period closed</td>
            </tr>
            <tr>
              <td>TC-FI-003</td>
              <td>Post GL entry - zero amount</td>
              <td><span className="tcg-type-edge">Edge</span></td>
              <td>Amount = 0.00</td>
              <td>Entry rejected or warning</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tcg-panel">
        <div className="tcg-panel-title">💡 FS/Insurance Required Cases</div>
        <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.8' }}>
          ✓ Regulatory posting: Verify ledger hits correct IFRS 9/17<br/>
          ✓ Segregation of duties: Same user cannot create AND approve<br/>
          ✓ Audit trail: Change documents / table logging produced<br/>
          ✓ Cutover/reversal: Transaction reversible within posting-period rules<br/>
          ✓ Multi-currency: Translation at posting and period-end
        </div>
      </div>
    </div>
  );
};

export default TestCaseGenerator;
