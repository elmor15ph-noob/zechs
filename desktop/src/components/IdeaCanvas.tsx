import React, { useState } from 'react';

export default function IdeaCanvas() {
  const [idea, setIdea] = useState({
    title: 'AI-powered SAP Consulting Bot',
    problem: 'Manual fit/gap analysis is slow and error-prone',
    solution: 'AI agent that reads requirements and analyzes fit/gap automatically',
    market: 'Mid-market SAP consultancies (100-500 consultants)',
    gtm: 'Partner with SAP consulting firms, white-label',
    risks: 'Model accuracy, data privacy, customer adoption'
  });

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      <div style={{
        position: 'relative',
        width: '400px',
        height: '400px',
        margin: '0 auto',
        borderRadius: '50%',
        background: 'radial-gradient(circle at center, #667eea 0%, #f0f4ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {idea.title}

        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          top: '40px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem'
        }}>
          Problem: {idea.problem}
        </div>

        <div style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          top: '75px',
          left: '75px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          color: '#333'
        }}>
          Solution: {idea.solution}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        <div style={{ padding: '1rem', backgroundColor: '#f0f4ff', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Market</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{idea.market}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f0f4ff', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>GTM</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{idea.gtm}</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: '#f0f4ff', borderRadius: '4px', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Key Risks</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{idea.risks}</p>
        </div>
      </div>

      <button style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#FF9800',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 600,
        alignSelf: 'flex-start'
      }}>
        Save Idea to Vault
      </button>
    </div>
  );
}
