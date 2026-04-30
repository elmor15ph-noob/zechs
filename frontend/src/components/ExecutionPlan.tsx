import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { icons } from '../theme/icons';
import { colors } from '../theme/designSystem';

interface ExecutionPlanProps {
  isDarkMode?: boolean;
}

const executionData = {
  title: 'ZECHS 30-Day Execution Plan',
  subtitle: 'Option D: Hybrid Model - Market Validation & Phase 1 Completion',
  totalDays: 30,
  currentDay: 1, // Update this manually or derive from date
  weeks: [
    {
      week: 1,
      title: 'Market Validation & Research',
      color: '#00d4ff',
      tasks: [
        {
          id: 'w1-t1',
          day: '1-3',
          title: 'Identify & Reach Out to 5 SAP Partners',
          description: 'Contact decision-makers at Tier 1 partners, boutique implementers, system integrators',
          status: 'pending', // pending, in_progress, completed
          subtasks: [
            'Search SAP PartnerFinder for 10 companies',
            'Verify contact emails on LinkedIn',
            'Personalize outreach message for each',
            'Send 5 emails with meeting request',
          ],
          deliverable: 'Outreach list with 5 contacts',
          effort: '2-3 hours',
        },
        {
          id: 'w1-t2',
          day: '4-5',
          title: 'Document Feedback & Identify Themes',
          description: 'Create feedback form, document calls, identify patterns',
          status: 'pending',
          subtasks: [
            'Create feedback form (Google Form)',
            'Complete 2-3 partner calls',
            'Document responses',
            'Identify emerging themes',
          ],
          deliverable: 'Feedback from 2-3 partners + analysis',
          effort: '3-4 hours',
        },
      ],
    },
    {
      week: 2,
      title: 'Build Phase 1 Completion (P2P Module)',
      color: '#0A6ED4',
      tasks: [
        {
          id: 'w2-t1',
          day: '6-10',
          title: 'Build P2P (Procure-to-Pay) Simulator',
          description: '5-step detailed simulator matching O2C detail level',
          status: 'pending',
          subtasks: [
            'Create step 1: Purchase Requisition (BANF)',
            'Create step 2: Purchase Order (EKKO)',
            'Create step 3: Goods Receipt (MIGO)',
            'Create step 4: Invoice Receipt (MIRO)',
            'Create step 5: Payment Processing (F110)',
            'Add realistic vendor data ($50K example)',
            'Add 15+ GL accounts with explanations',
            'Test with partner feedback',
          ],
          deliverable: 'Complete ProcureToPaySimulator.tsx component',
          effort: '20-24 hours',
        },
        {
          id: 'w2-t2',
          day: '11-12',
          title: 'Add Client Configuration Feature',
          description: 'Allow users to customize GL accounts, products, company data',
          status: 'pending',
          subtasks: [
            'Create Settings dashboard component',
            'Add company configuration (code, name, currency)',
            'Add GL account mapping',
            'Add product master CRUD',
            'Implement localStorage persistence',
            'Test settings carry across simulators',
          ],
          deliverable: 'Working Settings/Configuration panel',
          effort: '8-10 hours',
        },
      ],
    },
    {
      week: 3,
      title: 'Packaging & Pitch Preparation',
      color: '#10b981',
      tasks: [
        {
          id: 'w3-t1',
          day: '13-21',
          title: 'Create ZECHS Pitch Deck (15 slides)',
          description: 'Professional presentation for partners, investors, customers',
          status: 'pending',
          subtasks: [
            'Slide 1: Title + tagline',
            'Slide 2: The Problem',
            'Slide 3: Market Size & Opportunity',
            'Slide 4: The Solution (ZECHS)',
            'Slide 5: Key Components',
            'Slide 6: Sample Feature (O2C)',
            'Slide 7: Competitive Advantage',
            'Slide 8: Target Customers',
            'Slide 9: Business Model',
            'Slide 10: Pricing & ROI',
            'Slide 11: Go-to-Market Strategy',
            'Slide 12: Current Traction',
            'Slide 13: Financial Projections (Year 1-3)',
            'Slide 14: Team & Expertise',
            'Slide 15: Call to Action',
          ],
          deliverable: 'Complete 15-slide pitch deck',
          effort: '6-8 hours',
        },
        {
          id: 'w3-t2',
          day: '13-21',
          title: 'Supporting Materials',
          description: 'One-pager, ROI calculator, feature comparison, email templates',
          status: 'pending',
          subtasks: [
            'Create 1-page PDF overview',
            'Build ROI calculator (Excel or interactive)',
            'Create feature comparison table',
            'Draft email templates for outreach',
            'Prepare demo script (3-minute walkthrough)',
          ],
          deliverable: 'Complete marketing collateral set',
          effort: '4-6 hours',
        },
      ],
    },
    {
      week: 4,
      title: 'Refinement & Decision',
      color: '#f59e0b',
      tasks: [
        {
          id: 'w4-t1',
          day: '22-28',
          title: 'Final Refinement & Partner Feedback',
          description: 'Polish P2P, refine pitch, prepare beta agreements',
          status: 'pending',
          subtasks: [
            'Incorporate Week 1 feedback into P2P module',
            'Test settings feature with real data',
            'Refine pitch deck based on response themes',
            'Update financial projections with real data',
            'Create simple beta agreement (1-page)',
            'Prepare demo environment',
          ],
          deliverable: 'Refined modules + beta agreement ready',
          effort: '6-8 hours',
        },
        {
          id: 'w4-t2',
          day: '29-30',
          title: 'Go/No-Go Decision & Planning',
          description: 'Evaluate feedback, make Phase 2 commitment decision',
          status: 'pending',
          subtasks: [
            'Compile all partner feedback',
            'Evaluate against go/no-go criteria',
            'Assess your energy/enthusiasm level',
            'Make decision: Commit, pivot, or keep solo',
            'Plan Phase 2 approach based on decision',
            'Document decision rationale',
          ],
          deliverable: 'Clear Phase 2 direction + action plan',
          effort: '3-4 hours',
        },
      ],
    },
  ],
  goNoGoCriteria: {
    go: [
      '✅ 3+ partners expressed genuine interest',
      '✅ Pricing feedback suggests $500+ is viable',
      '✅ Common themes: "This solves our problem"',
      '✅ You have energy/enthusiasm for next phase',
    ],
    warm: [
      '⚠️ 2+ partners interested but hesitant on pricing',
      '⚠️ Feedback: "Good concept, needs more modules"',
      '⚠️ You have bandwidth for part-time development (10-15 hrs/week)',
    ],
    pivot: [
      '❌ <2 partners interested',
      '❌ Feedback: "Nice to have, not must-have"',
      '❌ You\'re not enjoying the product building',
    ],
  },
  immediateActions: [
    {
      action: 'Create partner list (10 companies)',
      deadline: 'Today',
      priority: '🔥 Critical',
    },
    {
      action: 'Draft first outreach email',
      deadline: 'Today',
      priority: '🔥 Critical',
    },
    {
      action: 'Schedule 5 calls by Day 7',
      deadline: 'This week',
      priority: '🔥 Critical',
    },
  ],
};

const styles = `
  .execution-plan-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    min-height: auto;
    overflow-y: auto;
  }

  .execution-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .execution-header h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }

  .execution-header p {
    margin: 0;
    font-size: 0.95rem;
    opacity: 0.8;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 1rem 0;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff 0%, #10b981 100%);
    transition: width 0.3s ease;
  }

  .immediate-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }

  .action-card {
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-card strong {
    font-size: 0.9rem;
  }

  .action-deadline {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .week-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .week-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid;
  }

  .week-header h2 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 700;
  }

  .week-header p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .tasks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1rem;
  }

  .task-card {
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .task-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .task-status-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .task-title-section {
    flex: 1;
  }

  .task-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }

  .task-day {
    font-size: 0.75rem;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .task-description {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .subtasks {
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    line-height: 1.6;
    list-style: none;
    padding-left: 1rem;
  }

  .subtasks li {
    margin: 0.25rem 0;
  }

  .subtasks li::before {
    content: '□ ';
    margin-right: 0.5rem;
    font-weight: bold;
  }

  .task-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .go-no-go-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .go-no-go-card {
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid;
  }

  .go-no-go-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .go-no-go-card ul {
    margin: 0;
    padding-left: 1.5rem;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .go-no-go-card li {
    margin: 0.5rem 0;
  }

  /* Dark Mode */
  .dark-mode .execution-plan-container {
    background: #0f1620;
    color: #e0e8f0;
  }

  .dark-mode .progress-bar {
    background: rgba(0, 212, 255, 0.1);
  }

  .dark-mode .action-card {
    background: #1a2332;
    border-color: #00d4ff;
  }

  .dark-mode .week-header {
    background: rgba(0, 212, 255, 0.05);
    border-color: inherit;
    color: #e0e8f0;
  }

  .dark-mode .task-card {
    background: #1a2332;
    border-color: #2a3a4a;
    color: #e0e8f0;
  }

  .dark-mode .subtasks {
    background: rgba(0, 212, 255, 0.08);
  }

  .dark-mode .go-no-go-card {
    background: #1a2332;
    color: #e0e8f0;
  }

  .dark-mode .go-no-go-card.go {
    border-color: #10b981;
  }

  .dark-mode .go-no-go-card.warm {
    border-color: #f59e0b;
  }

  .dark-mode .go-no-go-card.pivot {
    border-color: #ef4444;
  }

  /* Light Mode */
  .light-mode .execution-plan-container {
    background: #ffffff;
    color: #1f2937;
  }

  .light-mode .progress-bar {
    background: rgba(255, 107, 53, 0.1);
  }

  .light-mode .action-card {
    background: #f8fafc;
    border-color: #ff6b35;
  }

  .light-mode .week-header {
    background: rgba(255, 107, 53, 0.05);
    border-color: inherit;
  }

  .light-mode .task-card {
    background: #ffffff;
    border-color: #e2e8f0;
  }

  .light-mode .subtasks {
    background: rgba(255, 107, 53, 0.05);
  }

  .light-mode .go-no-go-card {
    background: #f8fafc;
  }

  .light-mode .go-no-go-card.go {
    border-color: #10b981;
  }

  .light-mode .go-no-go-card.warm {
    border-color: #f59e0b;
  }

  .light-mode .go-no-go-card.pivot {
    border-color: #ef4444;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
}

export default function ExecutionPlan({ isDarkMode = true }: ExecutionPlanProps) {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const totalTasks = executionData.weeks.reduce((sum, week) => sum + week.tasks.length, 0);
  const progressPercent = (completedTasks.length / totalTasks) * 100;

  const getStatusIcon = (status: string) => {
    if (completedTasks.includes(status)) {
      return <CheckCircle2 size={20} color="#10b981" />;
    }
    return <Circle size={20} color={isDarkMode ? '#94a3b8' : '#cbd5e0'} />;
  };

  return (
    <div className={`execution-plan-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <div className="execution-header">
        <Target size={32} color={isDarkMode ? '#00d4ff' : '#0A6ED4'} />
        <div>
          <h1>{executionData.title}</h1>
          <p>{executionData.subtitle}</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong>Overall Progress: {Math.round(progressPercent)}%</strong>
          <span style={{ opacity: 0.7 }}>
            {completedTasks.length} of {totalTasks} tasks completed
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Immediate Actions */}
      <div>
        <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.2rem' }}>🔥 Immediate Actions (Today)</h2>
        <div className="immediate-actions">
          {executionData.immediateActions.map((item, idx) => (
            <div key={idx} className="action-card" style={{ borderColor: isDarkMode ? '#0A6ED4' : '#0A6ED4' }}>
              <strong>{item.action}</strong>
              <div className="action-deadline">Due: {item.deadline}</div>
              <div style={{ fontSize: '0.85rem' }}>{item.priority}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Week Breakdown */}
      {executionData.weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="week-section">
          <div className="week-header" style={{ borderColor: week.color, background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
            <Calendar size={24} color={week.color} />
            <div>
              <h2>Week {week.week}: {week.title}</h2>
              <p>{week.tasks.reduce((sum, t) => {
                const hours = t.effort.match(/\d+/g) || ['0'];
                return sum + parseInt(hours[0]);
              }, 0)} total hours estimated</p>
            </div>
          </div>

          <div className="tasks-grid">
            {week.tasks.map((task) => (
              <div
                key={task.id}
                className="task-card"
                style={{
                  borderColor: completedTasks.includes(task.id) ? week.color : isDarkMode ? '#2a3a4a' : '#e2e8f0',
                  opacity: completedTasks.includes(task.id) ? 0.7 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => toggleTask(task.id)}
              >
                <div className="task-header">
                  <div className="task-status-icon">
                    {getStatusIcon(task.id)}
                  </div>
                  <div className="task-title-section">
                    <p className="task-day">Days {task.day}</p>
                    <h3 className="task-title">{task.title}</h3>
                  </div>
                </div>

                <p className="task-description">{task.description}</p>

                <ul className="subtasks" style={{
                  background: isDarkMode ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 107, 53, 0.05)',
                }}>
                  {task.subtasks.map((subtask, idx) => (
                    <li key={idx}>{subtask}</li>
                  ))}
                </ul>

                <div className="task-footer">
                  <span>📦 {task.deliverable}</span>
                  <span>⏱️ {task.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Go/No-Go Criteria */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>📊 Day 30 Decision Criteria</h2>
        <div className="go-no-go-section">
          <div className="go-no-go-card go" style={{ borderColor: '#10b981', background: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
            <h3>🎯 GO Signal (Full Commit to Phase 2-3)</h3>
            <ul>
              {executionData.goNoGoCriteria.go.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="go-no-go-card warm" style={{ borderColor: '#f59e0b', background: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.05)' }}>
            <h3>⚠️ WARM Signal (Part-Time)</h3>
            <ul>
              {executionData.goNoGoCriteria.warm.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="go-no-go-card pivot" style={{ borderColor: '#ef4444', background: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
            <h3>🔄 PIVOT Signal (Keep as Solo Tool)</h3>
            <ul>
              {executionData.goNoGoCriteria.pivot.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div style={{
        padding: '1.5rem',
        borderRadius: '8px',
        background: isDarkMode ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255, 107, 53, 0.05)',
        border: `1px solid ${isDarkMode ? '#2a3a4a' : '#e2e8f0'}`,
        marginTop: '2rem',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color={isDarkMode ? '#00d4ff' : '#0A6ED4'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Click tasks to mark as complete</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              This tracker helps you execute the 30-day plan. Update as you progress each day.
              Focus on immediate actions first. Good luck! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
