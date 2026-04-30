import React from 'react';

export default function PMDashboard() {
  const projects = [
    { name: 'Phase 1: L2 Retrieval', status: 'AMBER', progress: 65, risk: 'Timeline' },
    { name: 'Phase 2: Intelligence Layer', status: 'GREEN', progress: 30, risk: 'None' },
    { name: 'Phase 3: Orchestration', status: 'RED', progress: 10, risk: 'Scope' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        <div style={{ padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>3</div>
          <div style={{ fontSize: '0.9rem', color: '#155724' }}>Active Projects</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>35%</div>
          <div style={{ fontSize: '0.9rem', color: '#856404' }}>Overall Progress</div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#721c24' }}>1</div>
          <div style={{ fontSize: '0.9rem', color: '#721c24' }}>Red Items</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {projects.map((project, idx) => (
          <div key={idx} style={{
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            borderLeft: `3px solid ${
              project.status === 'GREEN' ? '#4CAF50' :
              project.status === 'AMBER' ? '#FF9800' : '#f44336'
            }`,
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>{project.name}</h4>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                backgroundColor:
                  project.status === 'GREEN' ? '#d4edda' :
                  project.status === 'AMBER' ? '#fff3cd' : '#f8d7da',
                color:
                  project.status === 'GREEN' ? '#155724' :
                  project.status === 'AMBER' ? '#856404' : '#721c24'
              }}>
                {project.status}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${project.progress}%`,
                  backgroundColor: '#667eea',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                {project.progress}% complete
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Risk: {project.risk}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
