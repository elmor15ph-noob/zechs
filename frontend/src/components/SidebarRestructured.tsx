import React, { useState } from 'react';
import {
  Search, FileText, BarChart3, Moon, Sun, Brain, Activity, ScrollText, Zap,
  Network, Target, AlertCircle, MessageCircle, BookOpen, CheckCircle,
  ChevronDown, Compass, Map
} from 'lucide-react';

interface NavCategory {
  label: string;
  icon: React.ReactNode;
  color: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const categories: NavCategory[] = [
  {
    label: '🎯 QUICK ACCESS',
    icon: <Compass size={16} />,
    color: '#0A6ED4',
    items: [
      { id: 'dashboard-hub', label: 'Dashboard Hub', icon: <Compass size={18} />, shortcut: 'Ctrl+Home' },
      { id: 'phase-navigator', label: 'Phase Navigator', icon: <Map size={18} />, shortcut: 'Ctrl+/' },
      { id: 'constellation', label: 'System Overview', icon: <Brain size={18} />, shortcut: 'Ctrl+`' },
    ]
  },
  {
    label: '🎨 DESIGN PHASE',
    icon: <FileText size={16} />,
    color: '#0A6ED4',
    items: [
      { id: 'soldoc', label: 'SolDoc Generator', icon: <FileText size={18} />, shortcut: 'Ctrl+Shift+G' },
      { id: 'fit-standard', label: 'Fit-to-Standard', icon: <Zap size={18} />, shortcut: 'Ctrl+Shift+F' },
      { id: 'clean-core', label: 'Clean-Core Checker', icon: <CheckCircle size={18} />, shortcut: 'Ctrl+Shift+C' },
      { id: 'ask-architect', label: 'Ask the Architect', icon: <MessageCircle size={18} />, shortcut: 'Ctrl+Shift+H' },
    ]
  },
  {
    label: '🔧 IMPLEMENTATION',
    icon: <Zap size={16} />,
    color: '#107E3E',
    items: [
      { id: 'test-case', label: 'Test Case Generator', icon: <FileText size={18} />, shortcut: 'Ctrl+Shift+T' },
      { id: 'config-logger', label: 'Config Logger', icon: <BookOpen size={18} />, shortcut: 'Ctrl+Shift+O' },
      { id: 'realtime-simulator', label: 'S/4HANA Realtime', icon: <Zap size={18} />, shortcut: 'Ctrl+Shift+R' },
      { id: 'o2c', label: 'O2C Orchestrator', icon: <BarChart3 size={18} />, shortcut: 'Ctrl+C' },
    ]
  },
  {
    label: '🚀 CUTOVER & GO-LIVE',
    icon: <Target size={16} />,
    color: '#E17B08',
    items: [
      { id: 'execution-plan', label: 'Execution Plan', icon: <Target size={18} />, shortcut: 'Ctrl+P' },
      { id: 'cutover-center', label: 'Cutover Center', icon: <Zap size={18} />, shortcut: 'Ctrl+Shift+U' },
    ]
  },
  {
    label: '🛟 SUPPORT & OPERATIONS',
    icon: <AlertCircle size={16} />,
    color: '#C00',
    items: [
      { id: 'ticket-triage', label: 'Ticket Triage', icon: <AlertCircle size={18} />, shortcut: 'Ctrl+Shift+I' },
      { id: 'sap-note-radar', label: 'SAP Note Radar', icon: <AlertCircle size={18} />, shortcut: 'Ctrl+Shift+N' },
      { id: 'search', label: 'Knowledge Search', icon: <Search size={18} />, shortcut: 'Ctrl+K' },
      { id: 'diagnostics', label: 'Diagnostics', icon: <Activity size={18} />, shortcut: 'Ctrl+E' },
      { id: 'logs', label: 'System Logs', icon: <ScrollText size={18} />, shortcut: 'Ctrl+L' },
    ]
  },
  {
    label: '📊 SIMULATORS & TOOLS',
    icon: <BarChart3 size={16} />,
    color: '#0A6ED4',
    items: [
      { id: 'simulator', label: 'SAP Simulator', icon: <BarChart3 size={18} />, shortcut: 'Ctrl+Shift+S' },
      { id: 'expanded-simulator', label: 'SAP Scenarios', icon: <Zap size={18} />, shortcut: 'Ctrl+Shift+E' },
      { id: 'sap', label: 'SAP Fit/Gap', icon: <FileText size={18} />, shortcut: 'Ctrl+S' },
      { id: 'enterprise-architecture', label: 'Architecture', icon: <Network size={18} />, shortcut: 'Ctrl+Shift+A' },
    ]
  },
];

const SidebarRestructured: React.FC<{
  active: string;
  onNavigate: (id: string) => void;
  onThemeToggle: () => void;
  isDarkMode?: boolean;
}> = ({ active, onNavigate, onThemeToggle, isDarkMode = true }) => {
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    '🎯 QUICK ACCESS': true,
    '🎨 DESIGN PHASE': true,
    '🔧 IMPLEMENTATION': false,
    '🚀 CUTOVER & GO-LIVE': false,
    '🛟 SUPPORT & OPERATIONS': false,
    '📊 SIMULATORS & TOOLS': false,
  });

  const sidebarStyles = `
    .sidebar-restructured {
      width: 240px;
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

    .sidebar-header-restructured {
      padding: 1.5rem 1rem;
      border-bottom: 1px solid #2a3a4a;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sidebar-header-restructured h3 {
      margin: 0;
      font-size: 1rem;
      color: #00d4ff;
      font-weight: 400;
      letter-spacing: 0.05em;
    }

    .sidebar-nav-restructured {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .nav-category {
      padding: 0.5rem 0.5rem;
      margin: 0.25rem 0;
    }

    .nav-category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      border-left: 3px solid transparent;
      transition: all 0.2s;
      user-select: none;
    }

    .nav-category-header:hover {
      color: #00d4ff;
      border-left-color: #ff5722;
    }

    .nav-category-items {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow: hidden;
      max-height: 500px;
      transition: all 0.3s ease-out;
    }

    .nav-category-items.collapsed {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
    }

    .nav-item-restructured {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      cursor: pointer;
      color: #94a3b8;
      border-left: 3px solid transparent;
      transition: all 0.2s;
      font-size: 0.85rem;
      margin: 0 0.5rem;
      border-radius: 2px;
    }

    .nav-item-restructured:hover {
      background-color: rgba(0, 212, 255, 0.1);
      border-left-color: #ff5722;
      color: #00d4ff;
    }

    .nav-item-restructured.active {
      background-color: rgba(255, 107, 53, 0.15);
      border-left-color: #ff5722;
      color: #ff5722;
      font-weight: 600;
    }

    .nav-icon-restructured {
      width: 20px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-label-restructured {
      flex: 1;
    }

    .nav-shortcut-restructured {
      font-size: 0.65rem;
      color: #475569;
      font-family: 'Courier New', monospace;
      display: none;
    }

    .nav-item-restructured:hover .nav-shortcut-restructured {
      display: block;
    }

    .sidebar-footer-restructured {
      padding: 1rem;
      border-top: 1px solid #2a3a4a;
      font-size: 0.8rem;
      color: #64748b;
    }

    .sidebar-footer-restructured p {
      margin: 0 0 0.5rem 0;
    }

    .theme-toggle-restructured {
      display: flex;
      justify-content: center;
      padding: 0.5rem;
      margin-top: 0.5rem;
      gap: 0.5rem;
    }

    .theme-btn {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #2a3a4a;
      background: transparent;
      color: #64748b;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .theme-btn:hover {
      border-color: #ff5722;
      color: #ff5722;
      background: rgba(255, 107, 53, 0.1);
    }

    @media (max-width: 1024px) {
      .sidebar-restructured {
        width: 200px;
      }

      .nav-shortcut-restructured {
        display: none !important;
      }
    }

    @media (max-width: 768px) {
      .sidebar-restructured {
        width: 70px;
      }

      .nav-label-restructured {
        display: none;
      }

      .nav-category-header span {
        display: none;
      }

      .sidebar-header-restructured h3 {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 0.75rem;
      }
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = sidebarStyles;
    if (!document.head.querySelector('style[data-sidebar-restructured]')) {
      style.setAttribute('data-sidebar-restructured', 'true');
      document.head.appendChild(style);
    }
  }

  const toggleCategory = (label: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="sidebar-restructured">
      <div className="sidebar-header-restructured">
        <div style={{ color: isDarkMode ? '#00d4ff' : '#ff5722', display: 'flex' }}>
          <Brain size={20} />
        </div>
        <h3>ZECHS</h3>
      </div>

      <div className="sidebar-nav-restructured">
        {categories.map((category) => (
          <div key={category.label} className="nav-category">
            <div
              className="nav-category-header"
              onClick={() => toggleCategory(category.label)}
              style={{ borderLeftColor: expandedCategories[category.label] ? category.color : 'transparent' }}
            >
              {category.icon}
              <span>{category.label}</span>
              <ChevronDown
                size={14}
                style={{
                  marginLeft: 'auto',
                  transform: expandedCategories[category.label] ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </div>

            <div className={`nav-category-items ${!expandedCategories[category.label] ? 'collapsed' : ''}`}>
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={`nav-item-restructured ${active === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={`${item.label} (${item.shortcut})`}
                >
                  <span className="nav-icon-restructured">{item.icon}</span>
                  <span className="nav-label-restructured">{item.label}</span>
                  <span className="nav-shortcut-restructured">{item.shortcut}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer-restructured">
        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem' }}>
          ⚡ ZECHS v2 • Phase 5<br/>
          SAP Architect Toolkit
        </p>
        <div className="theme-toggle-restructured">
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle Theme">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarRestructured;
