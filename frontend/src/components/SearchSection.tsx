import React, { useState } from 'react';
import { Search, Database, Filter, FileText, X, Grid2X2, Layers } from 'lucide-react';

interface SearchResult {
  path: string;
  filename: string;
  preview: string;
  type?: string;
  score?: number;
}

interface NoteDetail {
  filename: string;
  path: string;
  content: string;
  body: string;
  frontmatter: any;
}

interface SearchSectionProps {
  isDarkMode?: boolean;
}

const searchStyles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;600&family=IBM+Plex+Mono&display=swap');

  * {
    box-sizing: border-box;
  }

  body, html {
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    letter-spacing: 0;
    font-variation-settings: "wght" 115;
  }

  .search-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-form {
    display: flex;
    gap: 0.5rem;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    background-color: #1a2332;
    border: 1px solid #2a3a4a;
    border-radius: 3px;
    font-size: 0.9rem;
    color: #cbd5e1;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
    letter-spacing: 0.025em;
    transition: all 0.2s;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .search-input:focus {
    outline: none;
    border-color: #00d4ff;
    background-color: #263544;
    box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
  }

  .search-btn {
    padding: 0.75rem 1.5rem;
    background-color: #00d4ff;
    color: #1e2a36;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .search-btn:hover {
    background-color: #0d9488;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);
  }

  .search-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .search-filter {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-tag {
    display: inline-block;
    padding: 0.4rem 0.75rem;
    background-color: #1a2332;
    border: 1px solid #2a3a4a;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    color: #94a3b8;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .filter-tag:hover {
    border-color: #00d4ff;
    color: #00d4ff;
  }

  .filter-tag.active {
    background-color: #00d4ff;
    color: #1e2a36;
    border-color: #00d4ff;
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-item {
    padding: 1rem;
    background-color: #1a2332;
    border: 1px solid #2a3a4a;
    border-left: 3px solid #00d4ff;
    border-radius: 3px;
    transition: all 0.2s;
    cursor: pointer;
  }

  .result-item:hover {
    background-color: #263544;
    border-color: #3a4a59;
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
  }

  .result-item h4 {
    margin: 0 0 0.3rem 0;
    color: #e2e8f0;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .path {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0 0 0.5rem 0;
    font-family: 'Community', 'IBM Plex Mono', monospace;
    letter-spacing: 0;
    font-variation-settings: "wght" 115;
  }

  .preview {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }

  .result-meta {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: #64748b;
  }

  .result-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    background-color: #334155;
    border-radius: 2px;
    font-family: 'Community', 'IBM Plex Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0;
    font-variation-settings: "wght" 115;
  }

  .result-badge.keyword {
    background-color: #1e3a8a;
    color: #93c5fd;
  }

  .result-badge.vector {
    background-color: #134e4a;
    color: #67e8f9;
  }

  .no-results {
    color: #64748b;
    text-align: center;
    padding: 2rem 0;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .result-count {
    font-size: 0.85rem;
    color: #64748b;
    padding: 0.5rem 0;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  /* Note Detail Modal */
  .note-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .note-modal {
    background: #1a2332;
    border-radius: 4px;
    max-width: 85%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    border: 1px solid #2a3a4a;
  }

  .note-modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #2a3a4a;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: sticky;
    top: 0;
    background: #1a2332;
    backdrop-filter: blur(4px);
  }

  .note-modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #e2e8f0;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .note-modal-path {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.5rem;
    font-family: 'Community', 'IBM Plex Mono', monospace;
  }

  .note-modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #64748b;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .note-modal-close:hover {
    color: #00d4ff;
  }

  .note-modal-body {
    padding: 1.5rem;
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.7;
    color: #cbd5e1;
  }

  .note-modal-body h1,
  .note-modal-body h2,
  .note-modal-body h3,
  .note-modal-body h4,
  .note-modal-body h5,
  .note-modal-body h6 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #e2e8f0;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    font-variation-settings: "wght" 115;
  }

  .note-modal-body h1 { font-size: 1.5rem; }
  .note-modal-body h2 { font-size: 1.3rem; }
  .note-modal-body h3 { font-size: 1.1rem; }

  .note-modal-body ul,
  .note-modal-body ol {
    margin: 0.75rem 0;
    padding-left: 2rem;
  }

  .note-modal-body li {
    margin-bottom: 0.35rem;
  }

  .note-modal-body code {
    background-color: #1b2632;
    padding: 0.2rem 0.5rem;
    border-radius: 2px;
    font-family: 'Community', 'IBM Plex Mono', monospace;
    font-size: 0.85rem;
    color: #67e8f9;
    border: 1px solid #2a3a4a;
  }

  .note-modal-body pre {
    background-color: #1b2632;
    padding: 1rem;
    border-radius: 3px;
    overflow-x: auto;
    margin: 1rem 0;
    border: 1px solid #2a3a4a;
    font-family: 'Community', 'IBM Plex Mono', monospace;
  }

  .note-modal-body pre code {
    background: none;
    border: none;
    padding: 0;
    color: #93c5fd;
  }

  .note-modal-body blockquote {
    border-left: 3px solid #00d4ff;
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: #94a3b8;
    font-style: italic;
  }

  .note-modal-body a {
    color: #00d4ff;
    text-decoration: none;
  }

  .note-modal-body a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .note-modal {
      max-width: 95%;
      max-height: 95vh;
    }

    .note-modal-body {
      padding: 1rem;
    }
  }

  /* Light Mode */
  .light-mode .search-container {
    background-color: transparent;
  }

  .light-mode .search-heading {
    color: #1f2937;
    border-color: #ff6b35;
  }

  .light-mode .search-heading h3 {
    color: #1f2937;
  }

  .light-mode .search-heading-right {
    color: #9ca3af;
  }

  .light-mode .search-input {
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    color: #1f2937;
    padding: 0.75rem 1rem;
  }

  .light-mode .search-input::placeholder {
    color: #a3a3a3;
  }

  .light-mode .search-input:focus {
    outline: none;
    border-color: #ff6b35;
    background-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.08);
  }

  .light-mode .search-btn {
    background-color: #ff6b35;
    color: #ffffff;
    font-weight: 600;
  }

  .light-mode .search-btn:hover {
    background-color: #ff8c52;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
  }

  .light-mode .filter-tag {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    color: #666666;
  }

  .light-mode .filter-tag:hover {
    border-color: #ff6b35;
    color: #ff6b35;
    background-color: #fff5f0;
  }

  .light-mode .filter-tag.active {
    background-color: #ff6b35;
    color: #ffffff;
    border-color: #ff6b35;
  }

  .light-mode .result-item {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-left: 3px solid #ff6b35;
  }

  .light-mode .result-item:hover {
    background-color: #fafafa;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.12);
  }

  .light-mode .result-item h4 {
    color: #1f2937;
  }

  .light-mode .path {
    color: #9ca3af;
  }

  .light-mode .preview {
    color: #6b7280;
  }

  .light-mode .result-badge {
    background-color: #e5e7eb;
    color: #374151;
  }

  .light-mode .result-badge.keyword {
    background-color: #dbeafe;
    color: #1e40af;
  }

  .light-mode .result-badge.vector {
    background-color: #ccfbf1;
    color: #0d9488;
  }

  .light-mode .note-modal {
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
  }

  .light-mode .note-modal-header {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .light-mode .note-modal-header h2 {
    color: #1f2937;
  }

  .light-mode .note-modal-close:hover {
    color: #ff6b35;
  }

  .light-mode .note-modal-body {
    color: #4b5563;
  }

  .light-mode .note-modal-body h1,
  .light-mode .note-modal-body h2,
  .light-mode .note-modal-body h3,
  .light-mode .note-modal-body h4,
  .light-mode .note-modal-body h5,
  .light-mode .note-modal-body h6 {
    color: #1f2937;
  }

  .light-mode .note-modal-body code {
    background-color: #f3f4f6;
    color: #0d9488;
    border: 1px solid #e5e7eb;
  }

  .light-mode .note-modal-body pre {
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
  }

  .light-mode .note-modal-body a {
    color: #ff6b35;
  }

  .light-mode .note-modal-body a:hover {
    color: #ff8c52;
  }

  .light-mode .search-filter {
    background-color: transparent;
  }

  .light-mode .empty-state {
    color: #9ca3af;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = searchStyles;
  document.head.appendChild(style);
}

interface IndexStatus {
  status: 'indexing' | 'ready' | 'unavailable';
  progress: number;
  total: number;
  percent: number;
}

export default function SearchSection({ isDarkMode = true }: SearchSectionProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null);
  const [loadingNote, setLoadingNote] = useState(false);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>({ status: 'unavailable', progress: 0, total: 0, percent: 0 });

  const quickFilters = ['SAP', 'Billing', 'Ideas', 'PM', 'Architecture'];

  // Check index progress on mount and periodically
  React.useEffect(() => {
    const checkProgress = async () => {
      try {
        const response = await fetch('http://localhost:8000/index/progress');
        const data: IndexStatus = await response.json();
        setIndexStatus(data);
      } catch (error) {
        console.error('Failed to check index progress:', error);
      }
    };

    checkProgress();
    const interval = setInterval(checkProgress, 1000); // Check every second while indexing
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent, searchQuery?: string) => {
    e.preventDefault();
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      // Use hybrid search (vector + keyword)
      const response = await fetch(
        `http://localhost:8000/vault/search/hybrid?q=${encodeURIComponent(q)}&limit=10`
      );
      if (!response.ok) {
        // Fallback to keyword search if hybrid fails
        const fallbackResponse = await fetch(
          `http://localhost:8000/vault/search?q=${encodeURIComponent(q)}&limit=10`
        );
        const fallbackData = await fallbackResponse.json();
        setResults(fallbackData.results || []);
      } else {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
    if (activeFilter !== filter) {
      const e = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(e, filter);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    setLoadingNote(true);
    try {
      const response = await fetch(`http://localhost:8000/vault/note/${result.filename}`);
      if (!response.ok) throw new Error('Failed to load note');
      const data = await response.json();
      setSelectedNote(data);
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setLoadingNote(false);
    }
  };

  const formatMarkdown = (content: string) => {
    // Simple markdown formatting (just render with line breaks and basic formatting)
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.startsWith('#### ')) return `<h4>${line.substring(5)}</h4>`;
        if (line.startsWith('##### ')) return `<h5>${line.substring(6)}</h5>`;
        if (line.startsWith('##### ')) return `<h6>${line.substring(7)}</h6>`;
        // Blockquote
        if (line.startsWith('> ')) return `<blockquote>${line.substring(2)}</blockquote>`;
        // List
        if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
        if (line.startsWith('* ')) return `<li>${line.substring(2)}</li>`;
        return line;
      })
      .join('\n');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDarkMode ? '#0f1620' : '#ffffff',
      color: isDarkMode ? '#e0e8f0' : '#1f2937',
      fontFamily: "'Community', 'IBM Plex Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        background: isDarkMode ? '#1a2332' : '#f9fafb',
        borderBottom: isDarkMode ? '1px solid #2a3a4a' : '1px solid #e5e7eb',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Grid2X2 size={20} color={isDarkMode ? '#00d4ff' : '#ff6b35'} />
          <h1 style={{
            fontSize: '1.2rem',
            fontWeight: 400,
            margin: 0,
            color: isDarkMode ? '#00d4ff' : '#ff6b35',
            letterSpacing: '0.05em'
          }}>Search Vault</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Database size={18} color={isDarkMode ? '#64748b' : '#9ca3af'} />
          <span style={{ fontSize: '0.85rem', color: isDarkMode ? '#64748b' : '#9ca3af' }}>82 notes</span>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '1.5rem', flex: 1 }}>

      {indexStatus.status === 'indexing' && (
        <div style={{ padding: '1rem', backgroundColor: '#1a2f3a', borderRadius: '3px', marginBottom: '1rem', borderLeft: '3px solid #ff6b35', borderTop: '1px solid #2a3a4a', borderRight: '1px solid #2a3a4a', borderBottom: '1px solid #2a3a4a' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#ff9500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} /> Indexing vault ({indexStatus.progress}/{indexStatus.total} notes)
          </p>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#0f2130', borderRadius: '2px', overflow: 'hidden', border: '1px solid #2a3a4a' }}>
            <div style={{ height: '100%', backgroundColor: '#ff6b35', width: `${indexStatus.percent}%`, transition: 'width 0.3s' }}></div>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            {indexStatus.percent}% complete
          </p>
        </div>
      )}

      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search your brain (SAP, billing, ideas...)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          <button type="submit" className="search-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <Search size={16} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="search-filter">
          {quickFilters.map(filter => (
            <button
              key={filter}
              className={`filter-tag ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <p className="result-count">Found {results.length} result{results.length !== 1 ? 's' : ''}</p>
      )}

      <div className="results">
        {results.length === 0 && (query || activeFilter) && !loading && (
          <p className="no-results">No notes found. Try a different search or filter.</p>
        )}
        {results.length === 0 && !query && !activeFilter && !loading && (
          <p className="no-results">Start typing or use quick filters to search your vault.</p>
        )}
        {results.map((result, idx) => (
          <div key={idx} className="result-item" onClick={() => handleResultClick(result)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <h4 style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color={isDarkMode ? '#00d4ff' : '#ff5722'} />
                {result.filename}
              </h4>
              <span className={`result-badge ${result.type || 'keyword'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {result.type === 'vector' ? <Search size={12} /> : <Filter size={12} />}
                {result.type === 'vector' ? 'semantic' : 'keyword'}
              </span>
            </div>
            <p className="path" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={12} color={isDarkMode ? '#00d4ff' : '#ff5722'} />
              {result.path}
            </p>
            <p className="preview">{result.preview}</p>
            {result.score && (
              <div className="result-meta">
                <span>Score: {(result.score * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>

      {selectedNote && (
        <div className="note-modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <div className="note-modal-header">
              <div>
                <h2>{selectedNote.filename}</h2>
                <p className="note-modal-path">📁 {selectedNote.path}</p>
              </div>
              <button className="note-modal-close" onClick={() => setSelectedNote(null)} style={{ padding: '0', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              </button>
            </div>
            <div
              className="note-modal-body"
              dangerouslySetInnerHTML={{
                __html: selectedNote.body
                  .split('\n')
                  .map((line, i) => {
                    // Headers
                    if (line.startsWith('###### ')) return `<h6>${line.substring(7)}</h6>`;
                    if (line.startsWith('##### ')) return `<h5>${line.substring(6)}</h5>`;
                    if (line.startsWith('#### ')) return `<h4>${line.substring(5)}</h4>`;
                    if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
                    if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
                    if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
                    // Blockquote
                    if (line.startsWith('> ')) return `<blockquote>${line.substring(2)}</blockquote>`;
                    // Bold/Italic
                    let formatted = line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code>$1</code>');
                    if (formatted) return `<p>${formatted}</p>`;
                    return '';
                  })
                  .filter(l => l)
                  .join('\n'),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
