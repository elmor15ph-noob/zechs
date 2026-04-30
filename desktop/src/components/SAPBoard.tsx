import React, { useState } from 'react';

export default function SAPBoard() {
  const [requirements, setRequirements] = useState('');
  const [fit, setFit] = useState<string[]>([]);
  const [config, setConfig] = useState<string[]>([]);
  const [gap, setGap] = useState<string[]>([]);
  const [outOfScope, setOutOfScope] = useState<string[]>([]);

  const handleLoadRequirements = () => {
    // Placeholder for loading requirements
    setFit(['SAP Billing Module covers standard split billing']);
    setConfig(['Configure billing variants and revenue recognition']);
    setGap(['Custom logic for complex revenue sharing scenarios']);
    setOutOfScope(['Third-party payment gateway integration (handle separately)']);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <textarea
          placeholder="Paste customer requirements here..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}
        />
        <button
          onClick={handleLoadRequirements}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Load Requirements
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#155724' }}>Fit</h3>
          {fit.length === 0 ? (
            <p style={{ color: '#999' }}>Load requirements to see fit items</p>
          ) : (
            fit.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#155724' }}>
                ✓ {item}
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>Config</h3>
          {config.length === 0 ? (
            <p style={{ color: '#999' }}>Load requirements to see config items</p>
          ) : (
            config.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#856404' }}>
                ⚙ {item}
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#721c24' }}>Gap</h3>
          {gap.length === 0 ? (
            <p style={{ color: '#999' }}>Load requirements to see gap items</p>
          ) : (
            gap.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#721c24' }}>
                ⚠ {item}
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#e2e3e5',
          border: '1px solid #d6d8db',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#383d41' }}>Out of Scope</h3>
          {outOfScope.length === 0 ? (
            <p style={{ color: '#999' }}>Load requirements to see out-of-scope items</p>
          ) : (
            outOfScope.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#383d41' }}>
                ✕ {item}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
