import React, { useState } from 'react';
import { Search, FileText, BarChart3, Moon, Sun, Brain, Activity, ScrollText, Zap, Network, Target, AlertCircle, MessageCircle, LogSquare, CheckCircle } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const navItems: NavItem[] = [
  { id: 'constellation', label: 'System Overview', icon: <Brain size={20} />, shortcut: 'Ctrl+`' },
  { id: 'soldoc', label: 'SolDoc Generator', icon: <FileText size={20} />, shortcut: 'Ctrl+Shift+G' },
  { id: 'clean-core', label: 'Clean-Core Checker', icon: <CheckCircle size={20} />, shortcut: 'Ctrl+Shift+C' },
  { id: 'sap-note-radar', label: 'SAP Note Radar', icon: <AlertCircle size={20} />, shortcut: 'Ctrl+Shift+N' },
  { id: 'fit-standard', label: 'Fit-to-Standard', icon: <Zap size={20} />, shortcut: 'Ctrl+Shift+F' },
  { id: 'test-case', label: 'Test Case Gen', icon: <FileText size={20} />, shortcut: 'Ctrl+Shift+T' },
  { id: 'ticket-triage', label: 'Ticket Triage', icon: <AlertCircle size={20} />, shortcut: 'Ctrl+Shift+I' },
  { id: 'ask-architect', label: 'Ask Architect', icon: <MessageCircle size={20} />, shortcut: 'Ctrl+Shift+H' },
  { id: 'config-logger', label: 'Config Logger', icon: <LogSquare size={20} />, shortcut: 'Ctrl+Shift+O' },
  { id: 'cutover-center', label: 'Cutover Center', icon: <Zap size={20} />, shortcut: 'Ctrl+Shift+U' },
  { id: 'execution-plan', label: 'Execution Plan', icon: <Target size={20} />, shortcut: 'Ctrl+P' },
  { id: 'realtime-simulator', label: 'S/4HANA Realtime', icon: <Zap size={20} />, shortcut: 'Ctrl+Shift+R' },
  { id: 'search', label: 'Knowledge Search', icon: <Search size={20} />, shortcut: 'Ctrl+K' },
  { id: 'sap', label: 'SAP Fit/Gap', icon: <FileText size={20} />, shortcut: 'Ctrl+S' },
  { id: 'simulator', label: 'SAP Simulator', icon: <BarChart3 size={20} />, shortcut: 'Ctrl+Shift+S' },
  { id: 'expanded-simulator', label: 'SAP Scenarios', icon: <Zap size={20} />, shortcut: 'Ctrl+Shift+E' },
  { id: 'enterprise-architecture', label: 'Enterprise Architecture', icon: <Network size={20} />, shortcut: 'Ctrl+Shift+A' },
  { id: 'o2c', label: 'O2C Orchestrator', icon: <BarChart3 size={20} />, shortcut: 'Ctrl+C' },
  { id: 'diagnostics', label: 'Diagnostics', icon: <Activity size={20} />, shortcut: 'Ctrl+E' },
  { id: 'logs', label: 'System Logs', icon: <ScrollText size={20} />, shortcut: 'Ctrl+L' },
];

const sidebarStyles = `
  .sidebar {
    width: 220px;
    background: linear-gradient(180deg, #1a2332 0%, #0f1620 100%);
    color: #e0e8f0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    border-right: 2px solid #00d4ff;
    z-index: 100;
    box-shadow: 4px 0 16px rgba(0, 212, 255, 0.1);
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid #2a3a4a;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #00d4ff;
    font-weight: 400;
    letter-spacing: 0.05em;
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: #94a3b8;
    border-left: 3px solid transparent;
    transition: all 0.2s;
    font-size: 0.9rem;
  }

  .nav-item:hover {
    background-color: rgba(0, 212, 255, 0.1);
    border-left-color: #ff5722;
    color: #00d4ff;
  }

  .nav-item.active {
    background-color: rgba(255, 107, 53, 0.15);
    border-left-color: #ff5722;
    color: #ff5722;
    font-weight: 600;
  }

  .nav-icon {
    width: 28px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-label {
    flex: 1;
  }

  .nav-shortcut {
    font-size: 0.7rem;
    color: #64748b;
  }

  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid #2a3a4a;
    font-size: 0.8rem;
    color: #64748b;
  }

@media (max-width: 1024px) {
    .sidebar {
      width: 180px;
    }

    .nav-shortcut {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 60px;
    }

    .nav-label {
      display: none;
    }

    .sidebar-header h3 {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 0.75rem;
    }
  }

  /* Light Mode */
  .light-mode .sidebar {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    border-right-color: #ff5722;
    box-shadow: 4px 0 16px rgba(255, 107, 53, 0.1);
  }

  .light-mode .sidebar-header {
    border-bottom-color: #e2e8f0;
  }

  .light-mode .sidebar-header h3 {
    color: #ff5722;
  }

  .light-mode .nav-item {
    color: #ff5722;
  }

  .light-mode .nav-item:hover {
    background-color: rgba(255, 107, 53, 0.1);
    border-left-color: #ff5722;
    color: #ff5722;
  }

  .light-mode .nav-item.active {
    background-color: rgba(255, 107, 53, 0.15);
    border-left-color: #ff5722;
    color: #ff5722;
  }

  .light-mode .nav-shortcut {
    color: #cbd5e0;
  }

  .light-mode .sidebar-footer {
    border-top-color: #e2e8f0;
    color: #94a3b8;
  }

  .light-mode .theme-toggle {
    border-color: #e2e8f0;
    color: #64748b;
  }

  .light-mode .theme-toggle:hover {
    background-color: rgba(255, 107, 53, 0.1);
    border-color: #ff5722;
    color: #ff5722;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = sidebarStyles;
  document.head.appendChild(style);
}

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  onThemeToggle: () => void;
  isDarkMode?: boolean;
}

export default function Sidebar({ active, onNavigate, onThemeToggle, isDarkMode = true }: SidebarProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const keyMap: { [key: string]: string } = {
          'k': 'search',
          'd': 'inbox',
          'o': 'observability',
          'e': 'diagnostics',
          's': 'sap',
          'p': 'pm',
          'i': 'ideas',
          't': 'traits',
        };
        const section = keyMap[e.key.toLowerCase()];
        if (section) {
          e.preventDefault();
          onNavigate(section);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="nav-icon" style={{ color: isDarkMode ? '#00d4ff' : '#ff5722' }}>
          <Brain size={20} />
        </div>
        <h3>ZECHS</h3>
      </div>

      <div className="sidebar-nav">
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={`${item.label} (${item.shortcut})`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-shortcut">{item.shortcut}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <p style={{ margin: '0', fontSize: '0.75rem' }}>Phase 4 • Observability</p>
      </div>
    </div>
  );
}
