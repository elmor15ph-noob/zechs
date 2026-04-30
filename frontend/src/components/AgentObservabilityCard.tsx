import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  isDarkMode: boolean;
}

const AgentObservabilityCard: React.FC<Props> = ({ isDarkMode }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColor = status?.status === 'ok' ? '#10b981' : '#ef4444';
  const statusIcon = status?.status === 'ok' ? <CheckCircle size={20} color={statusColor} /> : <AlertCircle size={20} color={statusColor} />;

  return (
    <div style={{ padding: '2rem', backgroundColor: isDarkMode ? '#1a2a3a' : '#ffffff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Activity size={28} color="#00d4ff" />
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#00d4ff' }}>System Status</h2>
      </div>

      {loading ? (
        <div style={{ color: '#a0b0c0' }}>Loading system status...</div>
      ) : status ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {/* Status */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: isDarkMode ? '#0f1620' : '#f0f4f8',
            borderLeft: `4px solid ${statusColor}`,
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {statusIcon}
              <span style={{ fontSize: '0.9rem', color: '#7a8a9a' }}>Status</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isDarkMode ? '#e0e8f0' : '#1f2937', textTransform: 'uppercase' }}>
              {status.status}
            </div>
          </div>

          {/* LLM Provider */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: isDarkMode ? '#0f1620' : '#f0f4f8',
            borderLeft: '4px solid #00d4ff',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#7a8a9a', marginBottom: '0.5rem' }}>LLM Provider</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isDarkMode ? '#e0e8f0' : '#1f2937' }}>
              {status.llm_provider}
            </div>
          </div>

          {/* Knowledge Base Files */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: isDarkMode ? '#0f1620' : '#f0f4f8',
            borderLeft: '4px solid #a855f7',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#7a8a9a', marginBottom: '0.5rem' }}>Knowledge Files</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isDarkMode ? '#e0e8f0' : '#1f2937' }}>
              {status.vault_notes}
            </div>
          </div>

          {/* Index Status */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: isDarkMode ? '#0f1620' : '#f0f4f8',
            borderLeft: '4px solid #10b981',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#7a8a9a', marginBottom: '0.5rem' }}>Index Status</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isDarkMode ? '#e0e8f0' : '#1f2937' }}>
              {status.index_status}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: '#ef4444' }}>Unable to load system status</div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: `1px solid ${isDarkMode ? '#2a4a6a' : '#e5e7eb'}` }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: isDarkMode ? '#c0d0e0' : '#6b7280' }}>
          ℹ️ System Information
        </h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: isDarkMode ? '#a0b0c0' : '#6b7280', lineHeight: '1.8' }}>
          <li>Backend running on http://localhost:8000</li>
          <li>Frontend running on http://localhost:3000</li>
          <li>Knowledge base auto-indexed and searchable</li>
          <li>All 37 SAP architecture files available</li>
        </ul>
      </div>
    </div>
  );
};

export default AgentObservabilityCard;
