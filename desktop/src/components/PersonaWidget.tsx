import React, { useEffect, useState } from 'react';

interface Traits {
  decisiveness_index?: number;
  risk_tolerance?: number;
  simplicity_preference?: number;
}

export default function PersonaWidget() {
  const [traits, setTraits] = useState<Traits | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/persona/traits')
      .then(res => res.json())
      .then(data => {
        if (data.decisiveness_index) {
          setTraits(data);
        }
      })
      .catch(() => setTraits(null));
  }, []);

  return (
    <div style={{
      marginTop: 'auto',
      padding: '1rem',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '4px',
      fontSize: '0.8rem',
      color: '#fff'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0' }}>Your Traits</h4>
      {traits ? (
        <div>
          <div>Decisiveness: {(traits.decisiveness_index! * 100).toFixed(0)}%</div>
          <div>Risk: {(traits.risk_tolerance! * 100).toFixed(0)}%</div>
          <div>Simplicity: {(traits.simplicity_preference! * 100).toFixed(0)}%</div>
        </div>
      ) : (
        <p style={{ margin: 0, opacity: 0.7 }}>Traits loading...</p>
      )}
    </div>
  );
}
