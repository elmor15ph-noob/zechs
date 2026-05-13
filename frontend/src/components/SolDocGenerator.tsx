import React, { useState } from 'react';
import { FileText, Plus, Download, Copy, CheckCircle } from 'lucide-react';

interface SolDocSection {
  title: string;
  content: string;
  completed: boolean;
}

const SolDocGenerator: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [projectName, setProjectName] = useState('SAP S/4HANA PCE 2022 Implementation');
  const [client, setClient] = useState('');
  const [industry, setIndustry] = useState('financial-services');
  const [fileInput, setFileInput] = useState('');
  const [sections, setSections] = useState<SolDocSection[]>([
    { title: '1. Business Context', content: '', completed: false },
    { title: '2. Solution Overview', content: '', completed: false },
    { title: '3. Process Design', content: '', completed: false },
    { title: '4. Data & Integration', content: '', completed: false },
    { title: '5. Extensibility Approach', content: '', completed: false },
    { title: '6. Non-Functional Considerations', content: '', completed: false },
    { title: '7. Assumptions', content: '', completed: false },
    { title: '8. Open Questions for Business', content: '', completed: false }
  ]);
  const [copiedSection, setCopiedSection] = useState<number | null>(null);

  const styles = `
    .soldoc-container {
      background: ${isDarkMode ? '#0a1929' : '#f5f5f5'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      min-height: 100vh;
      padding: 2rem;
      font-family: 'Community', 'IBM Plex Sans', sans-serif;
    }

    .soldoc-header {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border-bottom: 3px solid #0A6ED4;
      padding: 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .soldoc-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A6ED4;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .soldoc-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .soldoc-main {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 2rem;
    }

    .soldoc-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .soldoc-panel {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .soldoc-panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0A6ED4;
      margin: 0 0 1rem 0;
      padding-bottom: 1rem;
      border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
    }

    .soldoc-form-group {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .soldoc-form-group label {
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .soldoc-form-group input,
    .soldoc-form-group select,
    .soldoc-form-group textarea {
      padding: 0.75rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      border-radius: 4px;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      font-family: inherit;
      font-size: 0.9rem;
    }

    .soldoc-form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .soldoc-button {
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .soldoc-button-primary {
      background: #0A6ED4;
      color: #ffffff;
    }

    .soldoc-button-primary:hover {
      background: #055399;
    }

    .soldoc-button-secondary {
      background: ${isDarkMode ? '#1a2a3a' : '#f0f0f0'};
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .soldoc-button-secondary:hover {
      background: ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
    }

    .soldoc-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .soldoc-section {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .soldoc-section-header {
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      padding: 1rem 1.5rem;
      border-bottom: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .soldoc-section-header:hover {
      background: ${isDarkMode ? '#2a3a4a' : '#f0f0f0'};
    }

    .soldoc-section-title {
      font-weight: 700;
      color: #0A6ED4;
      font-size: 1rem;
    }

    .soldoc-section-actions {
      display: flex;
      gap: 0.5rem;
    }

    .soldoc-section-actions button {
      padding: 0.4rem 0.6rem;
      background: #0A6ED4;
      color: #ffffff;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .soldoc-section-actions button:hover {
      background: #055399;
    }

    .soldoc-section-body {
      padding: 1.5rem;
    }

    .soldoc-textarea {
      width: 100%;
      min-height: 150px;
      padding: 1rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      border-radius: 4px;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      resize: vertical;
    }

    .soldoc-help-text {
      font-size: 0.8rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      margin-top: 0.5rem;
      line-height: 1.5;
    }

    .soldoc-progress {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .soldoc-progress-bar {
      flex: 1;
      height: 8px;
      background: ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      overflow: hidden;
    }

    .soldoc-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0A6ED4 0%, #107E3E 100%);
      transition: width 0.3s ease;
    }

    .soldoc-progress-text {
      font-size: 0.8rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      min-width: 40px;
    }

    .soldoc-export-panel {
      background: linear-gradient(135deg, rgba(10, 110, 212, 0.1) 0%, rgba(16, 126, 62, 0.1) 100%);
      border-left: 4px solid #0A6ED4;
      padding: 1rem;
      border-radius: 4px;
    }

    .soldoc-guidelines {
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-left: 4px solid #107E3E;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .soldoc-guidelines-title {
      font-weight: 700;
      color: #107E3E;
      margin-bottom: 0.5rem;
    }

    .soldoc-guidelines-text {
      font-size: 0.85rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      line-height: 1.6;
    }

    .soldoc-completion-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #107E3E;
      color: #ffffff;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-soldoc]')) {
      style.setAttribute('data-soldoc', 'true');
      document.head.appendChild(style);
    }
  }

  const updateSection = (index: number, content: string) => {
    const newSections = [...sections];
    newSections[index].content = content;
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].completed = !newSections[index].completed;
    setSections(newSections);
  };

  const copySectionContent = (index: number) => {
    navigator.clipboard.writeText(sections[index].content);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const exportSolDoc = () => {
    const fullDoc = `# Solution Document: ${projectName}
${client ? `**Client:** ${client}\n` : ''}**Industry:** ${industry === 'financial-services' ? 'Financial Services' : 'Insurance'}
**Document Type:** Solution Design Document (HLD/LLD)

---

${sections.map(s => `## ${s.title}\n\n${s.content || '[To be filled]'}\n`).join('\n---\n\n')}`;

    const blob = new Blob([fullDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SolDoc_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completionPercentage = Math.round((sections.filter(s => s.completed).length / sections.length) * 100);

  return (
    <div className={`soldoc-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="soldoc-header">
        <h1 className="soldoc-title">
          <FileText size={32} />
          SolDoc Generator
        </h1>
        <p className="soldoc-subtitle">
          Generate SAP S/4HANA PCE 2022 solution documents for Financial Services & Insurance engagements
        </p>
      </div>

      <div className="soldoc-main">
        {/* Sidebar */}
        <div className="soldoc-sidebar">
          <div className="soldoc-panel">
            <div className="soldoc-panel-title">📋 Project Details</div>

            <div className="soldoc-form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., SAP S/4HANA Implementation"
              />
            </div>

            <div className="soldoc-form-group">
              <label>Client Name (Optional)</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g., Acme Bank"
              />
            </div>

            <div className="soldoc-form-group">
              <label>Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="financial-services">Financial Services</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>

            <button className="soldoc-button soldoc-button-primary" onClick={exportSolDoc}>
              <Download size={18} /> Export SolDoc
            </button>
          </div>

          <div className="soldoc-panel">
            <div className="soldoc-panel-title">📈 Progress</div>
            <div className="soldoc-progress">
              <div className="soldoc-progress-bar">
                <div
                  className="soldoc-progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="soldoc-progress-text">{completionPercentage}%</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: isDarkMode ? '#b0bec5' : '#666666', marginTop: '0.5rem' }}>
              {sections.filter(s => s.completed).length} of {sections.length} sections complete
            </div>
          </div>

          <div className="soldoc-panel">
            <div className="soldoc-panel-title">💡 FS/Insurance Context</div>
            <div className="soldoc-help-text">
              <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Key considerations:</strong>
              <br />• IFRS 9/17 reporting impact
              <br />• Segregation of duties
              <br />• Data privacy & PII handling
              <br />• Audit trail requirements
              <br />• Regulatory compliance
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="soldoc-content">
          <div className="soldoc-guidelines">
            <div className="soldoc-guidelines-title">📌 Guidelines</div>
            <div className="soldoc-guidelines-text">
              Fill each section with SAP-specific details. Use SAP scope item IDs (e.g., J58, BFH) where applicable.
              If you don't have enough information, write "TO BE CONFIRMED — need [specific input]".
              Export when ready to share with stakeholders.
            </div>
          </div>

          {sections.map((section, index) => (
            <div key={index} className="soldoc-section">
              <div className="soldoc-section-header">
                <span className="soldoc-section-title">
                  {section.title}
                  {section.completed && <span style={{ marginLeft: '1rem' }} className="soldoc-completion-badge">✓ Done</span>}
                </span>
                <div className="soldoc-section-actions">
                  <button
                    onClick={() => copySectionContent(index)}
                    title={copiedSection === index ? 'Copied!' : 'Copy to clipboard'}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => toggleSection(index)}
                    title={section.completed ? 'Mark incomplete' : 'Mark complete'}
                    style={{ background: section.completed ? '#107E3E' : '#0A6ED4' }}
                  >
                    <CheckCircle size={14} />
                  </button>
                </div>
              </div>
              <div className="soldoc-section-body">
                <textarea
                  className="soldoc-textarea"
                  value={section.content}
                  onChange={(e) => updateSection(index, e.target.value)}
                  placeholder={`Enter content for ${section.title}...`}
                />
                {copiedSection === index && (
                  <div style={{ color: '#107E3E', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    ✓ Copied to clipboard
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolDocGenerator;
