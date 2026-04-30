import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
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
  const isDarkMode = false; // Light mode - FIORI default

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
        if (e.shiftKey && e.key === 'S') {
          e.preventDefault();
          setActiveSection('simulator');
        } else if (e.shiftKey && e.key === 'E') {
          e.preventDefault();
          setActiveSection('expanded-simulator');
        } else if (e.shiftKey && e.key === 'A') {
          e.preventDefault();
          setActiveSection('enterprise-architecture');
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
      default:
        return <Constellation isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Sidebar active={activeSection} onNavigate={handleNavigate} onThemeToggle={() => {}} isDarkMode={isDarkMode} />

      <div className="app-main">
        <header className="app-header">
          <div className="header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Brain size={32} color={isDarkMode ? '#00d4ff' : '#ff5722'} />
                <div>
                  <h1>ZECHS</h1>
                  <p className="header-subtitle">Zentai Enterprise Consulting & Holistic Solutions</p>
                </div>
              </div>
              {health && (
                <div className="health-status">
                  <CheckCircle size={16} color={isDarkMode ? '#00d4ff' : '#ff5722'} />
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
