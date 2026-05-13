import React, { useState } from 'react';
import { MessageCircle, BookOpen } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  author: string;
  date: string;
  source: 'team' | 'general';
}

const AskArchitect: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [question, setQuestion] = useState('');
  const [responses, setResponses] = useState<KnowledgeEntry[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([
    {
      id: 'KB-001',
      question: 'When should we use side-by-side extension vs in-core?',
      answer: 'Use side-by-side for regulatory/FS-specific logic (premium calculation, IFRS 17, AML). Use in-core key user ext only for config/UI. Steampunk only for released APIs.',
      category: 'Clean-Core',
      author: 'Bernard Elmor',
      date: '2026-04-20',
      source: 'team'
    },
    {
      id: 'KB-002',
      question: 'How do we approach multi-currency GL posting?',
      answer: 'Always post in both local and company code currencies. Use OB61 for exchange rates. Realized gains/losses go to FX variance account. Unrealized at period-end via program Z050.',
      category: 'FI-GL',
      author: 'Team Architecture',
      date: '2026-04-18',
      source: 'team'
    },
    {
      id: 'KB-003',
      question: 'What is IFRS 15 vs IFRS 17?',
      answer: 'IFRS 15 (Revenue): Recognize when control transfers. IFRS 17 (Insurance): Recognize insurance contracts differently, with liabilities based on fulfillment performance obligations.',
      category: 'Accounting',
      author: 'SAP Knowledge',
      date: '2026-04-15',
      source: 'general'
    }
  ]);

  const styles = `
    .architect-container { background: ${isDarkMode ? '#0a1929' : '#f5f5f5'}; color: ${isDarkMode ? '#ffffff' : '#000000'}; min-height: 100vh; padding: 2rem; font-family: 'Community', 'IBM Plex Sans', sans-serif; }
    .architect-header { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border-bottom: 3px solid #107E3E; padding: 2rem; margin: -2rem -2rem 2rem -2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); }
    .architect-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #107E3E; display: flex; align-items: center; gap: 1rem; }
    .architect-main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .architect-panel { background: ${isDarkMode ? '#111f2e' : '#ffffff'}; border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; border-radius: 4px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); }
    .architect-panel-title { font-size: 1rem; font-weight: 700; color: #107E3E; margin: 0 0 1rem 0; padding-bottom: 1rem; border-bottom: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'}; }
    .architect-form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .architect-form-group label { color: ${isDarkMode ? '#b0bec5' : '#666666'}; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    .architect-form-group input, .architect-form-group textarea, .architect-form-group select { padding: 0.75rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; border-radius: 4px; color: ${isDarkMode ? '#ffffff' : '#000000'}; font-family: inherit; }
    .architect-button { padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; background: #107E3E; color: #ffffff; width: 100%; transition: all 0.2s; }
    .architect-button:hover { background: #0a6531; }
    .architect-entry { padding: 1.5rem; background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'}; border-left: 4px solid; border-radius: 4px; margin-bottom: 1.5rem; }
    .architect-entry.team { border-color: #107E3E; }
    .architect-entry.general { border-color: #0A6ED4; }
    .architect-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: inline-block; margin-bottom: 0.5rem; }
    .architect-badge.team { background: #107E3E; color: #ffffff; }
    .architect-badge.general { background: #0A6ED4; color: #ffffff; }
    .architect-badge.category { background: ${isDarkMode ? '#2a3a4a' : '#e0e0e0'}; color: ${isDarkMode ? '#b0bec5' : '#666666'}; }
    .architect-entry-title { font-weight: 700; color: ${isDarkMode ? '#ffffff' : '#000000'}; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .architect-entry-answer { font-size: 0.85rem; color: ${isDarkMode ? '#b0bec5' : '#666666'}; line-height: 1.6; margin: 1rem 0; }
    .architect-entry-meta { font-size: 0.8rem; color: ${isDarkMode ? '#94a3b8' : '#999999'}; }
    .architect-results { grid-column: 1 / -1; margin-top: 2rem; }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-architect]')) {
      style.setAttribute('data-architect', 'true');
      document.head.appendChild(style);
    }
  }

  const handleAskQuestion = () => {
    if (question.trim()) {
      // Simulate searching knowledge base
      const matchedKB = knowledge.filter(k =>
        question.toLowerCase().includes(k.question.toLowerCase()) ||
        question.toLowerCase().includes(k.category.toLowerCase())
      );

      const response: KnowledgeEntry = {
        id: `Q-${Date.now()}`,
        question,
        answer: matchedKB.length > 0
          ? `Based on team knowledge:\n\n${matchedKB[0].answer}`
          : 'This question may require additional team discussion. Suggested: Schedule architecture review with core team.',
        category: matchedKB.length > 0 ? matchedKB[0].category : 'General',
        author: 'ZECHS Knowledge Bot',
        date: new Date().toISOString().split('T')[0],
        source: matchedKB.length > 0 ? 'team' : 'general'
      };

      setResponses([response, ...responses]);
      setQuestion('');
    }
  };

  const addKnowledgeEntry = () => {
    // Placeholder for adding new KB entries
    alert('KB entry creation requires team authorization. Contact architecture lead.');
  };

  return (
    <div className={`architect-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="architect-header">
        <h1 className="architect-title">
          <MessageCircle size={32} />
          Ask the Architect
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: isDarkMode ? '#b0bec5' : '#666666' }}>
          Access team architectural decisions and S/4HANA knowledge base
        </p>
      </div>

      <div className="architect-main">
        <div className="architect-panel">
          <div className="architect-panel-title">❓ Ask Your Question</div>

          <div className="architect-form-group">
            <label>Question</label>
            <textarea
              placeholder="Ask anything about architecture, design decisions, or SAP best practices..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ minHeight: '120px' }}
            />
          </div>

          <button className="architect-button" onClick={handleAskQuestion}>
            Search Knowledge Base
          </button>

          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.6' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Quick Categories:</strong>
            <br />• Clean-Core & Extensibility
            <br />• IFRS 15/17 Revenue Recognition
            <br />• GL Posting & Multi-Currency
            <br />• Integration Patterns
            <br />• FS/Insurance Specific Topics
            <br />• Cutover & Deployment
          </div>
        </div>

        <div className="architect-panel">
          <div className="architect-panel-title">📚 Knowledge Base Overview</div>
          <div style={{ fontSize: '0.85rem', color: isDarkMode ? '#b0bec5' : '#666666', lineHeight: '1.8' }}>
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>{knowledge.filter(k => k.source === 'team').length} Team Decisions</strong>
            <br />Curated architectural decisions from ZECHS team
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>{knowledge.filter(k => k.source === 'general').length} General Topics</strong>
            <br />SAP standard practices and technical reference
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>💡 Tip:</strong>
            <br />Questions matching team KB entries are marked with green badges. Use these for consistent guidance.
            <br /><br />
            <strong style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Add to KB:</strong>
            <br />New architectural decisions are documented through design review process.
          </div>
        </div>
      </div>

      {responses.length > 0 && (
        <div className="architect-results">
          <div className="architect-panel">
            <div className="architect-panel-title">🔍 Responses</div>
            {responses.map((entry) => (
              <div key={entry.id} className={`architect-entry ${entry.source}`}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className={`architect-badge ${entry.source}`}>
                    {entry.source === 'team' ? '✓ TEAM KB' : 'ℹ GENERAL'}
                  </span>
                  <span className="architect-badge category">{entry.category}</span>
                </div>
                <div className="architect-entry-title">{entry.question}</div>
                <div className="architect-entry-answer">{entry.answer}</div>
                <div className="architect-entry-meta">
                  {entry.author} • {entry.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AskArchitect;
