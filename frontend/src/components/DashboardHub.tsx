import React, { useState } from 'react';
import {
  FileText, CheckCircle, AlertCircle, Zap, MessageCircle, BookOpen,
  Target, BarChart3, Activity, ScrollText, Search, Lightbulb, Compass
} from 'lucide-react';

interface ToolCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  phase: 'design' | 'implement' | 'cutover' | 'support';
  color: string;
  shortcut: string;
}

const DashboardHub: React.FC<{ isDarkMode?: boolean; onNavigate?: (id: string) => void }> = ({
  isDarkMode = true,
  onNavigate = () => {}
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'design' | 'implement' | 'cutover' | 'support'>('all');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const tools: ToolCard[] = [
    // DESIGN PHASE - Jules Projects
    {
      id: 'soldoc',
      name: 'SolDoc Generator',
      icon: <FileText size={24} />,
      description: '8-section solution document template for design documentation',
      phase: 'design',
      color: '#0A6ED4',
      shortcut: 'Ctrl+Shift+G'
    },
    {
      id: 'fit-standard',
      name: 'Fit-to-Standard Assistant',
      icon: <Zap size={24} />,
      description: 'Real-time workshop companion for requirement classification (FIT/GAP)',
      phase: 'design',
      color: '#0A6ED4',
      shortcut: 'Ctrl+Shift+F'
    },
    {
      id: 'clean-core',
      name: 'Clean-Core Checker',
      icon: <CheckCircle size={24} />,
      description: 'Verify custom objects for S/4HANA PCE 2022 compliance',
      phase: 'design',
      color: '#107E3E',
      shortcut: 'Ctrl+Shift+C'
    },
    {
      id: 'ask-architect',
      name: 'Ask the Architect',
      icon: <MessageCircle size={24} />,
      description: 'Team knowledge base and architectural Q&A guidance',
      phase: 'design',
      color: '#0A6ED4',
      shortcut: 'Ctrl+Shift+H'
    },

    // IMPLEMENT PHASE - Jules Projects
    {
      id: 'test-case',
      name: 'Test Case Generator',
      icon: <FileText size={24} />,
      description: 'Generate executable test cases from requirements (Positive/Negative/Edge)',
      phase: 'implement',
      color: '#107E3E',
      shortcut: 'Ctrl+Shift+T'
    },
    {
      id: 'config-logger',
      name: 'Configuration Logger',
      icon: <BookOpen size={24} />,
      description: 'Document configuration changes with formal audit trail and rollback plans',
      phase: 'implement',
      color: '#E17B08',
      shortcut: 'Ctrl+Shift+O'
    },
    {
      id: 'realtime-simulator',
      name: 'S/4HANA Realtime Simulator',
      icon: <Zap size={24} />,
      description: '9-step solution order flow simulation showing GL posting and revenue recognition',
      phase: 'implement',
      color: '#0A6ED4',
      shortcut: 'Ctrl+Shift+R'
    },
    {
      id: 'o2c',
      name: 'O2C Orchestrator',
      icon: <BarChart3 size={24} />,
      description: 'Solution order orchestration with 3 line items and detailed process flows',
      phase: 'implement',
      color: '#0A6ED4',
      shortcut: 'Ctrl+C'
    },

    // CUTOVER PHASE - Jules Projects
    {
      id: 'cutover-center',
      name: 'Cutover Command Center',
      icon: <Zap size={24} />,
      description: 'Real-time go-live coordination with critical path tracking',
      phase: 'cutover',
      color: '#C00',
      shortcut: 'Ctrl+Shift+U'
    },
    {
      id: 'execution-plan',
      name: 'Execution Plan',
      icon: <Target size={24} />,
      description: 'Week-by-week execution roadmap with task tracking',
      phase: 'cutover',
      color: '#E17B08',
      shortcut: 'Ctrl+P'
    },

    // SUPPORT PHASE - Jules Projects
    {
      id: 'ticket-triage',
      name: 'Support Ticket Triage',
      icon: <AlertCircle size={24} />,
      description: 'Classify, diagnose, and route support tickets (S1-S4 severity)',
      phase: 'support',
      color: '#0A6ED4',
      shortcut: 'Ctrl+Shift+I'
    },
    {
      id: 'sap-note-radar',
      name: 'SAP Note Radar',
      icon: <AlertCircle size={24} />,
      description: 'Impact analysis for SAP Notes, KBAs, and patch management',
      phase: 'support',
      color: '#E17B08',
      shortcut: 'Ctrl+Shift+N'
    },

    // SUPPORT TOOLS
    {
      id: 'search',
      name: 'Knowledge Search',
      icon: <Search size={24} />,
      description: 'Search across architectural decisions and SAP knowledge base',
      phase: 'support',
      color: '#0A6ED4',
      shortcut: 'Ctrl+K'
    },
    {
      id: 'diagnostics',
      name: 'System Diagnostics',
      icon: <Activity size={24} />,
      description: 'Endpoint diagnostics and system health checks',
      phase: 'support',
      color: '#107E3E',
      shortcut: 'Ctrl+E'
    },
    {
      id: 'logs',
      name: 'System Logs',
      icon: <ScrollText size={24} />,
      description: 'Real-time system logs and event monitoring',
      phase: 'support',
      color: '#C00',
      shortcut: 'Ctrl+L'
    }
  ];

  const filteredTools = selectedPhase === 'all'
    ? tools
    : tools.filter(t => t.phase === selectedPhase);

  const phaseInfo: { [key: string]: { title: string; description: string; color: string } } = {
    all: {
      title: 'All ZECHS Tools',
      description: 'Complete architectural toolkit spanning design, implementation, cutover, and support',
      color: '#0A6ED4'
    },
    design: {
      title: 'Design Phase',
      description: 'Solution design, requirement classification, and architectural decisions',
      color: '#0A6ED4'
    },
    implement: {
      title: 'Implementation Phase',
      description: 'Development, testing, configuration, and integration',
      color: '#107E3E'
    },
    cutover: {
      title: 'Cutover & Go-Live Phase',
      description: 'Execution planning and real-time go-live coordination',
      color: '#E17B08'
    },
    support: {
      title: 'Support & Operations',
      description: 'Post-live support, incident management, and knowledge resources',
      color: '#C00'
    }
  };

  const styles = `
    .hub-container {
      background: ${isDarkMode ? '#0a1929' : '#f5f5f5'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      min-height: 100vh;
      padding: 2rem;
      font-family: 'Community', 'IBM Plex Sans', sans-serif;
    }

    .hub-header {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border-bottom: 3px solid ${phaseInfo[selectedPhase].color};
      padding: 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .hub-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: ${phaseInfo[selectedPhase].color};
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hub-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .hub-phase-filter {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }

    .hub-phase-btn {
      padding: 0.5rem 1rem;
      border: 2px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      background: ${isDarkMode ? 'transparent' : 'transparent'};
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .hub-phase-btn:hover {
      border-color: ${isDarkMode ? '#2a3a4a' : '#d0d0d0'};
      color: ${isDarkMode ? '#ffffff' : '#333333'};
    }

    .hub-phase-btn.active {
      border-color: ${phaseInfo[selectedPhase].color};
      background: ${phaseInfo[selectedPhase].color};
      color: #ffffff;
    }

    .hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .hub-tool-card {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .hub-tool-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
      border-color: ${isDarkMode ? '#2a3a4a' : '#d0d0d0'};
    }

    .hub-tool-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .hub-tool-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    }

    .hub-tool-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: ${isDarkMode ? '#ffffff' : '#000000'};
    }

    .hub-tool-desc {
      font-size: 0.85rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .hub-tool-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .hub-shortcut {
      font-size: 0.75rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
      color: ${isDarkMode ? '#94a3b8' : '#999999'};
      font-family: 'Courier New', monospace;
    }

    .hub-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .hub-btn-primary {
      background: ${phaseInfo[selectedPhase].color};
      color: #ffffff;
    }

    .hub-btn-primary:hover {
      opacity: 0.9;
    }

    .hub-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .hub-stat-card {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      padding: 1rem;
      text-align: center;
    }

    .hub-stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #0A6ED4;
      margin-bottom: 0.5rem;
    }

    .hub-stat-label {
      font-size: 0.85rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-hub]')) {
      style.setAttribute('data-hub', 'true');
      document.head.appendChild(style);
    }
  }

  const handleToolClick = (toolId: string) => {
    onNavigate(toolId);
  };

  const phaseStats = {
    all: tools.length,
    design: tools.filter(t => t.phase === 'design').length,
    implement: tools.filter(t => t.phase === 'implement').length,
    cutover: tools.filter(t => t.phase === 'cutover').length,
    support: tools.filter(t => t.phase === 'support').length
  };

  return (
    <div className={`hub-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="hub-header">
        <h1 className="hub-title">
          <Compass size={40} />
          {phaseInfo[selectedPhase].title}
        </h1>
        <p className="hub-subtitle">
          {phaseInfo[selectedPhase].description}
        </p>

        <div className="hub-phase-filter">
          <button
            className={`hub-phase-btn ${selectedPhase === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPhase('all')}
          >
            All Tools ({phaseStats.all})
          </button>
          <button
            className={`hub-phase-btn ${selectedPhase === 'design' ? 'active' : ''}`}
            onClick={() => setSelectedPhase('design')}
          >
            Design ({phaseStats.design})
          </button>
          <button
            className={`hub-phase-btn ${selectedPhase === 'implement' ? 'active' : ''}`}
            onClick={() => setSelectedPhase('implement')}
          >
            Implement ({phaseStats.implement})
          </button>
          <button
            className={`hub-phase-btn ${selectedPhase === 'cutover' ? 'active' : ''}`}
            onClick={() => setSelectedPhase('cutover')}
          >
            Cutover ({phaseStats.cutover})
          </button>
          <button
            className={`hub-phase-btn ${selectedPhase === 'support' ? 'active' : ''}`}
            onClick={() => setSelectedPhase('support')}
          >
            Support ({phaseStats.support})
          </button>
        </div>
      </div>

      <div className="hub-grid">
        {filteredTools.map((tool) => (
          <div key={tool.id} className="hub-tool-card" onClick={() => handleToolClick(tool.id)}>
            <div className="hub-tool-header">
              <div className="hub-tool-icon" style={{ color: tool.color }}>
                {tool.icon}
              </div>
              <h3 className="hub-tool-title">{tool.name}</h3>
            </div>
            <p className="hub-tool-desc">{tool.description}</p>
            <div className="hub-tool-footer">
              <span className="hub-shortcut">{tool.shortcut}</span>
              <button className="hub-btn hub-btn-primary" onClick={(e) => {
                e.stopPropagation();
                handleToolClick(tool.id);
              }}>
                Open →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hub-stats">
        <div className="hub-stat-card">
          <div className="hub-stat-number">{tools.length}</div>
          <div className="hub-stat-label">Total Tools Available</div>
        </div>
        <div className="hub-stat-card">
          <div className="hub-stat-number">9</div>
          <div className="hub-stat-label">Jules Architect Projects</div>
        </div>
        <div className="hub-stat-card">
          <div className="hub-stat-number">4</div>
          <div className="hub-stat-label">Solution Phases</div>
        </div>
        <div className="hub-stat-card">
          <div className="hub-stat-number">100%</div>
          <div className="hub-stat-label">FS/Insurance Ready</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHub;
