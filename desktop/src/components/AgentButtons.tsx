import React from 'react';

export default function AgentButtons() {
  const handleClick = (agent: string) => {
    alert(`Triggered: ${agent} agent\nThis will query the backend and update the current view.`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <button
        onClick={() => handleClick('SAP')}
        style={{
          padding: '2rem',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '2rem' }}>🎯</span>
        Run SAP Agent
      </button>

      <button
        onClick={() => handleClick('PM')}
        style={{
          padding: '2rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '2rem' }}>📊</span>
        Run PM Agent
      </button>

      <button
        onClick={() => handleClick('Synthesis')}
        style={{
          padding: '2rem',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '2rem' }}>🧠</span>
        Run Synthesis
      </button>
    </div>
  );
}
