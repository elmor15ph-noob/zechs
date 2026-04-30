import React, { useState, useEffect } from 'react';
import SAPBoard from './components/SAPBoard';
import IdeaCanvas from './components/IdeaCanvas';
import PMDashboard from './components/PMDashboard';
import NoteEditor from './components/NoteEditor';
import AgentButtons from './components/AgentButtons';
import PersonaWidget from './components/PersonaWidget';

export default function App() {
  const [activeTab, setActiveTab] = useState('sap-board');
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus(`Connected: ${data.llm_provider}`);
      })
      .catch(err => {
        setBackendStatus('Backend offline');
      });
  }, []);

  const tabStyles = `
    .desktop-app {
      display: flex;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .sidebar {
      width: 200px;
      background-color: #2c3e50;
      color: white;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .status {
      padding: 0.5rem;
      background-color: rgba(255,255,255,0.1);
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .nav-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-btn {
      padding: 0.75rem;
      background-color: rgba(255,255,255,0.2);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
    }

    .nav-btn.active {
      background-color: #667eea;
    }

    .nav-btn:hover {
      background-color: rgba(255,255,255,0.3);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .content-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .content-body {
      flex: 1;
      overflow: auto;
      padding: 1.5rem;
    }

    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      max-width: 1400px;
    }

    .section-panel {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .section-panel h2 {
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 0.5rem;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = tabStyles;
    document.head.appendChild(style);
  }

  return (
    <div className="desktop-app">
      <div className="sidebar">
        <h2>Brain App</h2>
        <div className="status">{backendStatus}</div>

        <div className="nav-buttons">
          <button
            className={`nav-btn ${activeTab === 'sap-board' ? 'active' : ''}`}
            onClick={() => setActiveTab('sap-board')}
          >
            🎯 SAP Board
          </button>
          <button
            className={`nav-btn ${activeTab === 'ideas' ? 'active' : ''}`}
            onClick={() => setActiveTab('ideas')}
          >
            💡 Ideas
          </button>
          <button
            className={`nav-btn ${activeTab === 'pm' ? 'active' : ''}`}
            onClick={() => setActiveTab('pm')}
          >
            📊 PM Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            ✎ Note Editor
          </button>
          <button
            className={`nav-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            🤖 Agents
          </button>
        </div>

        <PersonaWidget />
      </div>

      <div className="main-content">
        <div className="content-header">
          <h1>
            {activeTab === 'sap-board' && '🎯 SAP Visual Board'}
            {activeTab === 'ideas' && '💡 Business Idea Canvas'}
            {activeTab === 'pm' && '📊 PM Dashboard'}
            {activeTab === 'editor' && '✎ Note Editor'}
            {activeTab === 'agents' && '🤖 Agent Triggers'}
          </h1>
        </div>

        <div className="content-body">
          {activeTab === 'sap-board' && <SAPBoard />}
          {activeTab === 'ideas' && <IdeaCanvas />}
          {activeTab === 'pm' && <PMDashboard />}
          {activeTab === 'editor' && <NoteEditor />}
          {activeTab === 'agents' && <AgentButtons />}
        </div>
      </div>
    </div>
  );
}
