import React, { useState } from 'react';

export default function NoteEditor() {
  const [content, setContent] = useState(`# My Note

This is a placeholder note. Edit and save back to your vault.

## Features
- Edit vault notes directly
- Markdown support
- Auto-save to vault on exit
`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.5rem' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          flex: 1,
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          resize: 'none'
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 600
        }}>
          Save to Vault
        </button>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#999',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 600
        }}>
          Revert
        </button>
      </div>
    </div>
  );
}
