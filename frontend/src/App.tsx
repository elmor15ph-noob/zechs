import React, { useState, useEffect } from 'react';
import './App.css';
import SidebarRestructured from './components/SidebarRestructured';
import DashboardHub from './components/DashboardHub';
import PhaseNavigator from './components/PhaseNavigator';
import Constellation from './components/Constellation';
import SearchSection from './components/SearchSection';
import SAPAssistant from './components/SAPAssistant';
import O2COrchestrator from './components/O2COrchestrator';
import SAPSimulator from './components/SAPSimulator';
import SAPSimulatorExpanded from './components/SAPSimulatorExpanded';
import SolutionOrderSimulator from './components/SolutionOrderSimulator';
import ExecutionPlan from './components/ExecutionPlan';
import AgentObservabilityCard from './components/AgentObservabilityCard';
import EndpointDiagnostics from './components/EndpointDiagnostics';
import LogsPanel from './components/LogsPanel';
import RealtimeS4HANASimulator from './components/RealtimeS4HANASimulator';
import SolDocGenerator from './components/SolDocGenerator';
import CleanCoreChecker from './components/CleanCoreChecker';
import SAPNoteRadar from './components/SAPNoteRadar';
import FitToStandardAssistant from './components/FitToStandardAssistant';
import TestCaseGenerator from './components/TestCaseGenerator';
import TicketTriage from './components/TicketTriage';
import AskArchitect from './components/AskArchitect';
import ConfigLogger from './components/ConfigLogger';
import CutoverCenter from './components/CutoverCenter';
import { Brain, CheckCircle, Zap } from 'lucide-react';

interface HealthStatus {
  status: string;
  llm_provider: string;
  vault_notes: number;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('constellation');
  const isDarkMode = true; // Dark mode - FIORI Belize theme

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        console.log('Backend health:', data);
      })
      .catch(err => {
        setError(`Backend unavailable: ${err.message}`);
        console.error('Health check failed:', err);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Home') {
          e.preventDefault();
          setActiveSection('dashboard-hub');
        } else if (e.key === '/') {
          e.preventDefault();
          setActiveSection('phase-navigator');
        } else if (e.shiftKey && e.key === 'S') {
          e.preventDefault();
          setActiveSection('simulator');
        } else if (e.shiftKey && e.key === 'E') {
          e.preventDefault();
          setActiveSection('expanded-simulator');
        } else if (e.shiftKey && e.key === 'A') {
          e.preventDefault();
          setActiveSection('enterprise-architecture');
        } else if (e.shiftKey && e.key === 'G') {
          e.preventDefault();
          setActiveSection('soldoc');
        } else if (e.key === 'k') {
          e.preventDefault();
          setActiveSection('search');
        } else if (e.key === 'o') {
          e.preventDefault();
          setActiveSection('observability');
        } else if (e.key === 'l') {
          e.preventDefault();
          setActiveSection('logs');
        } else if (e.key === 'e') {
          e.preventDefault();
          setActiveSection('diagnostics');
        } else if (e.key === 's') {
          e.preventDefault();
          setActiveSection('sap');
        } else if (e.key === 'c' && e.ctrlKey) {
          e.preventDefault();
          setActiveSection('o2c');
        } else if (e.key === '`') {
          e.preventDefault();
          setActiveSection('constellation');
        } else if (e.key === 'p') {
          e.preventDefault();
          setActiveSection('execution-plan');
        } else if (e.shiftKey && e.key === 'R') {
          e.preventDefault();
          setActiveSection('realtime-simulator');
        } else if (e.shiftKey && e.key === 'C') {
          e.preventDefault();
          setActiveSection('clean-core');
        } else if (e.shiftKey && e.key === 'N') {
          e.preventDefault();
          setActiveSection('sap-note-radar');
        } else if (e.shiftKey && e.key === 'F') {
          e.preventDefault();
          setActiveSection('fit-standard');
        } else if (e.shiftKey && e.key === 'T') {
          e.preventDefault();
          setActiveSection('test-case');
        } else if (e.shiftKey && e.key === 'I') {
          e.preventDefault();
          setActiveSection('ticket-triage');
        } else if (e.shiftKey && e.key === 'H') {
          e.preventDefault();
          setActiveSection('ask-architect');
        } else if (e.shiftKey && e.key === 'O') {
          e.preventDefault();
          setActiveSection('config-logger');
        } else if (e.shiftKey && e.key === 'U') {
          e.preventDefault();
          setActiveSection('cutover-center');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard-hub':
        return <DashboardHub isDarkMode={isDarkMode} onNavigate={handleNavigate} />;
      case 'phase-navigator':
        return <PhaseNavigator isDarkMode={isDarkMode} onToolSelect={handleNavigate} />;
      case 'constellation':
        return <Constellation isDarkMode={isDarkMode} />;
      case 'search':
        return <SearchSection isDarkMode={isDarkMode} />;
      case 'observability':
        return <AgentObservabilityCard isDarkMode={isDarkMode} />;
      case 'logs':
        return <LogsPanel isDarkMode={isDarkMode} />;
      case 'diagnostics':
        return <EndpointDiagnostics isDarkMode={isDarkMode} />;
      case 'sap':
        return <SAPAssistant isDarkMode={isDarkMode} />;
      case 'simulator':
        return <SAPSimulator isDarkMode={isDarkMode} />;
      case 'expanded-simulator':
        return <SAPSimulatorExpanded isDarkMode={isDarkMode} />;
      case 'enterprise-architecture':
        return <SolutionOrderSimulator isDarkMode={isDarkMode} />;
      case 'o2c':
        return <O2COrchestrator />;
      case 'execution-plan':
        return <ExecutionPlan isDarkMode={isDarkMode} />;
      case 'realtime-simulator':
        return <RealtimeS4HANASimulator isDarkMode={isDarkMode} />;
      case 'soldoc':
        return <SolDocGenerator isDarkMode={isDarkMode} />;
      case 'clean-core':
        return <CleanCoreChecker isDarkMode={isDarkMode} />;
      case 'sap-note-radar':
        return <SAPNoteRadar isDarkMode={isDarkMode} />;
      case 'fit-standard':
        return <FitToStandardAssistant isDarkMode={isDarkMode} />;
      case 'test-case':
        return <TestCaseGenerator isDarkMode={isDarkMode} />;
      case 'ticket-triage':
        return <TicketTriage isDarkMode={isDarkMode} />;
      case 'ask-architect':
        return <AskArchitect isDarkMode={isDarkMode} />;
      case 'config-logger':
        return <ConfigLogger isDarkMode={isDarkMode} />;
      case 'cutover-center':
        return <CutoverCenter isDarkMode={isDarkMode} />;
      default:
        return <Constellation isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <SidebarRestructured active={activeSection} onNavigate={handleNavigate} onThemeToggle={() => {}} isDarkMode={isDarkMode} />

      <div className="app-main">
        <header className="app-header">
          <div className="header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Brain size={32} color={'#0A6ED4'} />
                <div>
                  <h1>ZECHS</h1>
                  <p className="header-subtitle">Zentai Enterprise Consulting & Holistic Solutions</p>
                </div>
              </div>
              {health && (
                <div className="health-status">
                  <CheckCircle size={16} color={'#0A6ED4'} />
                  <span>Claude • {health.vault_notes} notes</span>
                </div>
              )}
            </div>
          </div>
          <div className="header-logo">
            <Zap size={48} color="#00d4ff" strokeWidth={1.5} />
          </div>
          {error && <div className="error-banner">{error}</div>}
        </header>

        <main className="dashboard">
          <div className="section">
            {renderSection()}
          </div>
        </main>

        <footer className="app-footer">
          <p>ZECHS Platform: SAP Architecture Intelligence • Bernard Elmor B. • Solution Architecture Toolkit</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
