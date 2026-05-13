import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'complete';
  tools: {
    id: string;
    name: string;
    description: string;
    required: boolean;
  }[];
  keyActivities: string[];
  risks: string[];
  estimatedDuration: string;
  successCriteria: string[];
}

const PhaseNavigator: React.FC<{ isDarkMode?: boolean; onToolSelect?: (toolId: string) => void }> = ({
  isDarkMode = true,
  onToolSelect = () => {}
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  const phases: Phase[] = [
    {
      id: 'discovery',
      name: '📋 Discovery & Planning',
      description: 'Initial requirements gathering and solution scoping',
      status: 'pending',
      tools: [
        { id: 'search', name: 'Knowledge Search', description: 'Search past implementations and patterns', required: true },
        { id: 'ask-architect', name: 'Ask the Architect', description: 'Get architectural guidance on approach', required: false },
      ],
      keyActivities: [
        'Stakeholder interviews and requirements gathering',
        'Identify similar past implementations',
        'Document business drivers and success criteria',
        'Assess team skills and resource availability'
      ],
      risks: [
        'Requirements not fully understood',
        'Scope creep from undefined expectations',
        'Insufficient resource allocation'
      ],
      estimatedDuration: '2-3 weeks',
      successCriteria: [
        'Requirements document approved',
        'Resource plan finalized',
        'High-level timeline agreed'
      ]
    },
    {
      id: 'design',
      name: '🎨 Solution Design',
      description: 'Design phase with fit-to-standard assessment',
      status: 'pending',
      tools: [
        { id: 'fit-standard', name: 'Fit-to-Standard Assistant', description: 'Workshop companion for requirement classification', required: true },
        { id: 'soldoc', name: 'SolDoc Generator', description: 'Document design decisions (8 sections)', required: true },
        { id: 'clean-core', name: 'Clean-Core Checker', description: 'Verify custom objects for PCE 2022 compliance', required: true },
        { id: 'ask-architect', name: 'Ask the Architect', description: 'Reference team decisions and patterns', required: false },
      ],
      keyActivities: [
        'Run Fit-to-Standard workshops with business team',
        'Classify each requirement as FIT, GAP-CONFIG, or GAP-EXTENSION',
        'Document design decisions in SolDoc',
        'Review custom objects for clean-core compliance',
        'Create integration architecture diagrams',
        'Define data migration approach'
      ],
      risks: [
        'Too many custom objects (clean-core violation)',
        'Misalignment on FIT vs GAP decisions',
        'Integration complexity underestimated',
        'IFRS/regulatory requirements missed'
      ],
      estimatedDuration: '4-6 weeks',
      successCriteria: [
        'SolDoc signed off by business and IT',
        'All custom objects GREEN or AMBER',
        'Integration architecture approved',
        'Data migration plan finalized'
      ]
    },
    {
      id: 'build',
      name: '🔧 Build & Implementation',
      description: 'Development, testing, and configuration',
      status: 'pending',
      tools: [
        { id: 'config-logger', name: 'Configuration Logger', description: 'Log all config changes with audit trail', required: true },
        { id: 'test-case', name: 'Test Case Generator', description: 'Generate test cases from requirements', required: true },
        { id: 'realtime-simulator', name: 'S/4HANA Realtime Simulator', description: 'Validate GL posting and revenue recognition', required: false },
        { id: 'o2c', name: 'O2C Orchestrator', description: 'Validate solution order processes', required: false },
      ],
      keyActivities: [
        'Configure FI-GL, FI-AR, AR processes',
        'Build revenue recognition rules (IFRS 15/17)',
        'Implement AML/KYC screening',
        'Build integration interfaces',
        'Create custom reports and extract programs',
        'Execute unit tests and integration tests',
        'Perform GL reconciliation testing',
        'Log all configuration changes'
      ],
      risks: [
        'GL balance discrepancies in testing',
        'Revenue cutover variance',
        'AML/KYC integration failures',
        'Data quality issues',
        'Performance issues with large data volumes',
        'Config changes not properly documented'
      ],
      estimatedDuration: '8-12 weeks',
      successCriteria: [
        'All test cases passed',
        'GL reconciles to ±$0 variance',
        'Revenue cutover variance < 0.01%',
        'All interfaces tested successfully',
        'Config changes logged and approved',
        'UAT sign-off from business'
      ]
    },
    {
      id: 'prep',
      name: '📊 Go-Live Preparation',
      description: 'Final preparation and readiness checks',
      status: 'pending',
      tools: [
        { id: 'execution-plan', name: 'Execution Plan', description: 'Week-by-week cutover timeline', required: true },
        { id: 'sap-note-radar', name: 'SAP Note Radar', description: 'Check for relevant SAP Notes and patches', required: true },
        { id: 'cutover-center', name: 'Cutover Command Center', description: 'Prepare cutover playbook', required: false },
      ],
      keyActivities: [
        'Finalize cutover timeline and activities',
        'Review SAP Notes and applicable patches',
        'Create detailed cutover runbooks',
        'Prepare data migration scripts',
        'Set up monitoring and alerting',
        'Train support team',
        'Prepare rollback procedures',
        'Executive readiness review'
      ],
      risks: [
        'Critical SAP Notes missed',
        'Cutover timeline too aggressive',
        'Support team not adequately trained',
        'Monitoring not properly configured',
        'Rollback procedures untested'
      ],
      estimatedDuration: '2-3 weeks',
      successCriteria: [
        'Cutover timeline approved',
        'All SAP Notes applied',
        'Runbooks completed and reviewed',
        'Support team training completed',
        'Monitoring dashboards deployed',
        'Rollback procedures tested',
        'Executive GO decision'
      ]
    },
    {
      id: 'cutover',
      name: '🚀 Go-Live & Cutover',
      description: 'Real-time cutover execution',
      status: 'pending',
      tools: [
        { id: 'cutover-center', name: 'Cutover Command Center', description: 'Real-time go-live coordination', required: true },
        { id: 'ticket-triage', name: 'Support Ticket Triage', description: 'Rapid incident response', required: true },
      ],
      keyActivities: [
        'Execute data migration',
        'Perform GL reconciliation',
        'Verify revenue cutover',
        'Run initial process cycles',
        'Monitor system health',
        'Handle production incidents',
        'Verify regulatory reports',
        'Confirm audit trail activation'
      ],
      risks: [
        'GL posting delays (RFC/AIF queue issues)',
        'Revenue cutover variance',
        'Data migration failures',
        'Integration timeouts',
        'Critical bugs discovered',
        'Performance degradation'
      ],
      estimatedDuration: '2-7 days',
      successCriteria: [
        'All data migrated successfully',
        'GL reconciles to ±$0',
        'Revenue cutover within tolerance',
        'All interfaces operational',
        'Regulatory reports generated',
        'Zero critical issues',
        'Full system stability achieved'
      ]
    },
    {
      id: 'stabilize',
      name: '📈 Stabilization & Support',
      description: 'Post-cutover support and optimization',
      status: 'pending',
      tools: [
        { id: 'ticket-triage', name: 'Support Ticket Triage', description: 'Ongoing incident management', required: true },
        { id: 'sap-note-radar', name: 'SAP Note Radar', description: 'Monitor for new critical patches', required: false },
        { id: 'config-logger', name: 'Configuration Logger', description: 'Log post-cutover config fixes', required: false },
      ],
      keyActivities: [
        'Monitor system performance',
        'Triage and resolve issues',
        'Perform process reconciliations',
        'Optimize configurations',
        'Document lessons learned',
        'Transition to BAU support',
        'Close project'
      ],
      risks: [
        'Critical issues escaping initial testing',
        'Performance degradation over time',
        'User adoption challenges',
        'Regulatory compliance issues',
        'Unplanned rollback required'
      ],
      estimatedDuration: '2-4 weeks',
      successCriteria: [
        'All critical issues resolved',
        'System performance optimal',
        'Business processes running smoothly',
        'User adoption successful',
        'Lessons learned documented',
        'Project officially closed'
      ]
    }
  ];

  const styles = `
    .navigator-container {
      background: ${isDarkMode ? '#0a1929' : '#f5f5f5'};
      color: ${isDarkMode ? '#ffffff' : '#000000'};
      min-height: 100vh;
      padding: 2rem;
      font-family: 'Community', 'IBM Plex Sans', sans-serif;
    }

    .navigator-header {
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border-bottom: 3px solid #0A6ED4;
      padding: 2rem;
      margin: -2rem -2rem 2rem -2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    .navigator-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0A6ED4;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .navigator-subtitle {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
    }

    .navigator-timeline {
      margin-top: 2rem;
    }

    .navigator-phase {
      margin-bottom: 1.5rem;
      background: ${isDarkMode ? '#111f2e' : '#ffffff'};
      border: 1px solid ${isDarkMode ? '#1a2a3a' : '#e0e0e0'};
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      transition: all 0.3s;
    }

    .navigator-phase:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .navigator-phase-header {
      padding: 1.5rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
    }

    .navigator-phase-header:hover {
      background: ${isDarkMode ? '#2a3a4a' : '#f0f0f0'};
    }

    .navigator-phase-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0A6ED4;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .navigator-phase-desc {
      font-size: 0.85rem;
      color: ${isDarkMode ? '#94a3b8' : '#999999'};
      margin: 0.25rem 0 0 0;
    }

    .navigator-phase-content {
      padding: 1.5rem;
    }

    .navigator-section {
      margin-bottom: 1.5rem;
    }

    .navigator-section-title {
      font-weight: 700;
      color: #0A6ED4;
      margin: 0 0 0.75rem 0;
      font-size: 0.95rem;
    }

    .navigator-tool-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .navigator-tool-item {
      padding: 0.75rem;
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      border-radius: 3px;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }

    .navigator-tool-required {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: #C00;
      color: white;
      border-radius: 2px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .navigator-tool-optional {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      color: ${isDarkMode ? '#94a3b8' : '#999999'};
      border-radius: 2px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .navigator-list-item {
      padding: 0.5rem 0;
      font-size: 0.85rem;
      color: ${isDarkMode ? '#b0bec5' : '#666666'};
      border-bottom: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      display: flex;
      gap: 0.75rem;
    }

    .navigator-list-item:before {
      content: '•';
      color: #0A6ED4;
      font-weight: bold;
      flex-shrink: 0;
    }

    .navigator-list-item:last-child {
      border-bottom: none;
    }

    .navigator-phase-footer {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid ${isDarkMode ? '#2a3a4a' : '#e0e0e0'};
      flex-wrap: wrap;
    }

    .navigator-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: ${isDarkMode ? '#94a3b8' : '#999999'};
      background: ${isDarkMode ? '#1a2a3a' : '#f8f8f8'};
      padding: 0.5rem 0.75rem;
      border-radius: 3px;
    }
  `;

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = styles;
    if (!document.head.querySelector('style[data-navigator]')) {
      style.setAttribute('data-navigator', 'true');
      document.head.appendChild(style);
    }
  }

  return (
    <div className={`navigator-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="navigator-header">
        <h1 className="navigator-title">
          <Zap size={32} />
          Solution Lifecycle Navigator
        </h1>
        <p className="navigator-subtitle">
          Guided journey from discovery through stabilization with recommended tools for each phase
        </p>
      </div>

      <div className="navigator-timeline">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="navigator-phase">
            <div
              className="navigator-phase-header"
              onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
            >
              <div>
                <h3 className="navigator-phase-title">
                  {phase.name}
                </h3>
                <p className="navigator-phase-desc">{phase.description}</p>
              </div>
              <ChevronRight
                size={24}
                style={{
                  transform: expandedPhase === idx ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }}
              />
            </div>

            {expandedPhase === idx && (
              <div className="navigator-phase-content">
                <div className="navigator-section">
                  <h4 className="navigator-section-title">🛠️ Recommended Tools</h4>
                  <ul className="navigator-tool-list">
                    {phase.tools.map((tool) => (
                      <li
                        key={tool.id}
                        className="navigator-tool-item"
                        onClick={() => onToolSelect(tool.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <strong>{tool.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#94a3b8' : '#999999' }}>
                            {tool.description}
                          </div>
                        </div>
                        <span className={tool.required ? 'navigator-tool-required' : 'navigator-tool-optional'}>
                          {tool.required ? 'REQUIRED' : 'OPTIONAL'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="navigator-section">
                  <h4 className="navigator-section-title">📋 Key Activities</h4>
                  {phase.keyActivities.map((activity, i) => (
                    <div key={i} className="navigator-list-item">
                      {activity}
                    </div>
                  ))}
                </div>

                <div className="navigator-section">
                  <h4 className="navigator-section-title">⚠️ Key Risks</h4>
                  {phase.risks.map((risk, i) => (
                    <div key={i} className="navigator-list-item" style={{ color: isDarkMode ? '#ff9999' : '#cc0000' }}>
                      {risk}
                    </div>
                  ))}
                </div>

                <div className="navigator-section">
                  <h4 className="navigator-section-title">✓ Success Criteria</h4>
                  {phase.successCriteria.map((criterion, i) => (
                    <div key={i} className="navigator-list-item" style={{ color: isDarkMode ? '#99ff99' : '#009900' }}>
                      {criterion}
                    </div>
                  ))}
                </div>

                <div className="navigator-phase-footer">
                  <div className="navigator-meta">
                    <Clock size={14} />
                    <span>{phase.estimatedDuration}</span>
                  </div>
                  <div className="navigator-meta">
                    <AlertCircle size={14} />
                    <span>{phase.risks.length} identified risks</span>
                  </div>
                  <div className="navigator-meta">
                    <CheckCircle size={14} />
                    <span>{phase.successCriteria.length} success criteria</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseNavigator;
