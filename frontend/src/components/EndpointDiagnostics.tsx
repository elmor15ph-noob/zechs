import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader, Copy } from 'lucide-react';

interface EndpointTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  status: 'pending' | 'testing' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

interface TestLog {
  timestamp: string;
  tests: EndpointTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

const EndpointDiagnostics: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [tests, setTests] = useState<EndpointTest[]>([
    // Existing endpoints
    { name: 'Health Check', endpoint: 'http://localhost:8000/health', method: 'GET', status: 'pending' },
    { name: 'Get Scorecard', endpoint: 'http://localhost:8000/agents/scorecard', method: 'GET', status: 'pending' },
    { name: 'Get Decisions History', endpoint: 'http://localhost:8000/agents/decisions/history?limit=5', method: 'GET', status: 'pending' },
    { name: 'Get Weekly Scorecard', endpoint: 'http://localhost:8000/agents/scorecard/weekly', method: 'GET', status: 'pending' },

    // NEW Phase 4 endpoints
    { name: 'Get Agent Health (All)', endpoint: 'http://localhost:8000/agents/health', method: 'GET', status: 'pending' },
    { name: 'Get Agent Health (Inbox)', endpoint: 'http://localhost:8000/agents/health/Inbox Distiller', method: 'GET', status: 'pending' },
    { name: 'Get Cost Status', endpoint: 'http://localhost:8000/agents/cost-status', method: 'GET', status: 'pending' },

    // POST endpoints (read-only tests)
    { name: 'Run Inbox Distiller', endpoint: 'http://localhost:8000/agents/inbox/distill', method: 'POST', status: 'pending' },
    { name: 'Run Weekly Synthesis', endpoint: 'http://localhost:8000/agents/synthesis/weekly', method: 'POST', status: 'pending' },
    { name: 'Log Feedback', endpoint: 'http://localhost:8000/agents/Inbox Distiller/feedback', method: 'POST', status: 'pending' },
    { name: 'Generate Scorecard', endpoint: 'http://localhost:8000/agents/scorecard/generate', method: 'POST', status: 'pending' },
  ]);

  const [testLog, setTestLog] = useState<TestLog | null>(null);
  const [copying, setCopying] = useState(false);

  const testEndpoint = async (test: EndpointTest, index: number) => {
    const startTime = Date.now();
    const updatedTests = [...tests];
    updatedTests[index].status = 'testing';
    setTests(updatedTests);

    try {
      const options: RequestInit = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };

      // Add body for POST requests (minimal test data)
      if (test.method === 'POST') {
        if (test.endpoint.includes('/inbox/distill')) {
          options.body = JSON.stringify({ query: 'test' });
        } else if (test.endpoint.includes('/synthesis/weekly')) {
          options.body = JSON.stringify({ query: 'test' });
        } else if (test.endpoint.includes('/feedback')) {
          options.body = JSON.stringify({ decision: 'accept', comment: 'test' });
        } else if (test.endpoint.includes('/scorecard/generate')) {
          options.body = JSON.stringify({});
        }
      }

      const response = await fetch(test.endpoint, options);
      const duration = Date.now() - startTime;

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      updatedTests[index] = {
        ...test,
        status: response.ok ? 'success' : 'error',
        response: responseData,
        duration,
        error: !response.ok ? `HTTP ${response.status}` : undefined,
      };
    } catch (error) {
      updatedTests[index] = {
        ...test,
        status: 'error',
        error: String(error),
        duration: Date.now() - startTime,
      };
    }

    setTests(updatedTests);
  };

  const runAllTests = async () => {
    // Reset tests
    const resetTests = tests.map(t => ({ ...t, status: 'pending' as const, response: undefined, error: undefined, duration: undefined }));
    setTests(resetTests);

    // Run tests sequentially
    for (let i = 0; i < resetTests.length; i++) {
      await testEndpoint(resetTests[i], i);
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between tests
    }

    // Generate log
    const passed = tests.filter(t => t.status === 'success').length;
    const failed = tests.filter(t => t.status === 'error').length;

    setTestLog({
      timestamp: new Date().toISOString(),
      tests: tests,
      summary: {
        total: tests.length,
        passed,
        failed,
      },
    });
  };

  const exportLog = () => {
    const logContent = JSON.stringify(testLog, null, 2);
    const blob = new Blob([logContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `endpoint-diagnostics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLogToClipboard = async () => {
    if (testLog) {
      const logContent = JSON.stringify(testLog, null, 2);
      await navigator.clipboard.writeText(logContent);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const colors = {
    dark: {
      bg: '#0f1620',
      card: '#1a2332',
      accent: '#00d4ff',
      text: '#e0e8f0',
      text_secondary: '#94a3b8',
      border: '#2a3a4a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    light: {
      bg: '#f8fafc',
      card: '#ffffff',
      accent: '#ff5722',
      text: '#1f2937',
      text_secondary: '#64748b',
      border: '#e2e8f0',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
  };

  const palette = isDarkMode ? colors.dark : colors.light;

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', padding: '2rem', fontFamily: "'Community', 'IBM Plex Sans', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: palette.text, margin: '0 0 0.5rem 0' }}>
            🔧 Endpoint Diagnostics
          </h1>
          <p style={{ color: palette.text_secondary, fontSize: '0.95rem' }}>
            Test all API endpoints and buttons to identify failures
          </p>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={runAllTests}
            style={{
              background: palette.accent,
              color: isDarkMode ? '#0f1620' : '#ffffff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}
          >
            🧪 Run All Tests
          </button>

          {testLog && (
            <>
              <button
                onClick={exportLog}
                style={{
                  background: palette.accent,
                  color: isDarkMode ? '#0f1620' : '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                📥 Export JSON
              </button>

              <button
                onClick={copyLogToClipboard}
                style={{
                  background: palette.accent,
                  color: isDarkMode ? '#0f1620' : '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Copy size={16} /> {copying ? 'Copied!' : 'Copy Log'}
              </button>
            </>
          )}
        </div>

        {/* Summary */}
        {testLog && (
          <div style={{
            background: palette.card,
            border: `1px solid ${palette.border}`,
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: palette.text, margin: '0 0 1rem 0' }}>
              Test Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: palette.text_secondary, marginBottom: '0.5rem' }}>Total</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: palette.text }}>{testLog.summary.total}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: palette.text_secondary, marginBottom: '0.5rem' }}>Passed</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: palette.success }}>{testLog.summary.passed}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: palette.text_secondary, marginBottom: '0.5rem' }}>Failed</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: palette.error }}>{testLog.summary.failed}</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: palette.text_secondary }}>
              Tested: {new Date(testLog.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div style={{
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '0.5fr 2fr 1fr 1fr 0.75fr',
            gap: '1rem',
            padding: '1.5rem',
            borderBottom: `1px solid ${palette.border}`,
            background: isDarkMode ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255, 107, 53, 0.05)',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: palette.text_secondary,
          }}>
            <div>Status</div>
            <div>Endpoint</div>
            <div>Method</div>
            <div>Duration</div>
            <div>Error</div>
          </div>

          {tests.map((test, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '0.5fr 2fr 1fr 1fr 0.75fr',
              gap: '1rem',
              padding: '1.5rem',
              borderBottom: index < tests.length - 1 ? `1px solid ${palette.border}` : 'none',
              alignItems: 'center',
            }}>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {test.status === 'pending' && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: palette.border }} />
                )}
                {test.status === 'testing' && (
                  <Loader size={20} color={palette.accent} style={{ animation: 'spin 1s linear infinite' }} />
                )}
                {test.status === 'success' && (
                  <CheckCircle size={20} color={palette.success} />
                )}
                {test.status === 'error' && (
                  <AlertCircle size={20} color={palette.error} />
                )}
              </div>

              {/* Endpoint */}
              <div style={{ fontSize: '0.85rem', color: palette.text, wordBreak: 'break-all' }}>
                {test.name}
              </div>

              {/* Method */}
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                borderRadius: '3px',
                background: test.method === 'GET' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 212, 255, 0.2)',
                color: test.method === 'GET' ? palette.success : palette.accent,
                width: 'fit-content',
              }}>
                {test.method}
              </div>

              {/* Duration */}
              <div style={{ fontSize: '0.85rem', color: palette.text_secondary }}>
                {test.duration ? `${test.duration}ms` : '—'}
              </div>

              {/* Error */}
              <div style={{ fontSize: '0.85rem', color: palette.error }}>
                {test.error || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Response View */}
        {testLog && tests.some(t => t.response) && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: palette.text, marginBottom: '1rem' }}>
              Response Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {tests.filter(t => t.response).map((test, index) => (
                <div key={index} style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: palette.text, marginTop: 0 }}>
                    {test.name}
                  </h3>
                  <pre style={{
                    fontSize: '0.75rem',
                    color: palette.text_secondary,
                    overflow: 'auto',
                    margin: '0.5rem 0 0 0',
                  }}>
                    {JSON.stringify(test.response, null, 2).substring(0, 500)}
                    {JSON.stringify(test.response, null, 2).length > 500 && '...'}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Shortcut */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: isDarkMode ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255, 107, 53, 0.05)',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: palette.text_secondary,
        }}>
          💡 <strong>Tip:</strong> Run tests periodically to check all endpoints. Export logs to track issues over time.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EndpointDiagnostics;
