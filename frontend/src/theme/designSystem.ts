/**
 * Brain App Design System
 * Unified theme and component styling for dark/light modes
 * All components must import and use these values
 */

export const colors = {
  dark: {
    bg: '#0f1620',
    card: '#1a2332',
    header: '#1a3a52',
    border: '#2a3a4a',
    text: '#e0e8f0',
    textSecondary: '#94a3b8',
    accent: '#00d4ff',
    accentDark: '#0a9fb5',
    orange: '#ff6b35',
    orangeLight: '#ff9500',
  },
  light: {
    bg: '#f0f4f8',
    card: '#ffffff',
    header: '#f8fafc',
    border: '#e2e8f0',
    text: '#1f2937',
    textSecondary: '#64748b',
    accent: '#6366f1',
    accentDark: '#4f46e5',
    orange: '#ff6b35',
    orangeLight: '#ff9500',
  },
};

export const shadows = {
  card: '0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 212, 255, 0.1)',
  cardLight: '0 12px 32px rgba(0, 0, 0, 0.1)',
  button: '0 4px 12px rgba(99, 102, 241, 0.3)',
  buttonLight: '0 2px 8px rgba(99, 102, 241, 0.2)',
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  xxl: '2rem',
};

export const fonts = {
  primary: "'Community', 'IBM Plex Sans', sans-serif",
  mono: "'Community', 'IBM Plex Mono', monospace",
};

export const buttonStyles = (isDark: boolean) => ({
  primary: {
    background: isDark ? '#00d4ff' : '#6366f1',
    color: isDark ? '#1e2a36' : '#ffffff',
    border: 'none',
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
    boxShadow: isDark ? `0 0 0 2px rgba(0, 212, 255, 0.2)` : shadows.button,
  },
  secondary: {
    background: isDark ? '#1a2332' : '#f8fafc',
    color: isDark ? '#94a3b8' : '#64748b',
    border: `1px solid ${isDark ? '#2a3a4a' : '#e2e8f0'}`,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  danger: {
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
});

export const cardStyles = (isDark: boolean) => ({
  container: {
    background: isDark ? colors.dark.card : colors.light.card,
    borderRadius: '8px',
    padding: spacing.xl,
    boxShadow: isDark ? shadows.card : shadows.cardLight,
    border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`,
    color: isDark ? colors.dark.text : colors.light.text,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${isDark ? colors.dark.border : colors.light.border}`,
  },
});

export const inputStyles = (isDark: boolean) => ({
  input: {
    padding: spacing.md,
    background: isDark ? '#263544' : '#ffffff',
    border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`,
    borderRadius: '3px',
    color: isDark ? colors.dark.text : colors.light.text,
    fontSize: '0.9rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  textarea: {
    padding: spacing.md,
    background: isDark ? '#263544' : '#ffffff',
    border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`,
    borderRadius: '3px',
    color: isDark ? colors.dark.text : colors.light.text,
    fontSize: '0.9rem',
    fontFamily: fonts.primary,
    minHeight: '80px',
    resize: 'vertical' as const,
    transition: 'all 0.2s',
  },
});

/**
 * Component CSS Template for all new components
 * Copy this pattern for consistent theming
 */
export const componentCSSTemplate = `
  /* Dark Mode (default) */
  .component {
    background: #1a2332;
    color: #e0e8f0;
    border: 1px solid #2a3a4a;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .component button {
    background: #00d4ff;
    color: #0f1620;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .component button:hover {
    background: #0ab5d4;
    transform: translateY(-1px);
  }

  .component button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Light Mode */
  .light-mode .component {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid #e2e8f0;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }

  .light-mode .component button {
    background: #6366f1;
    color: #ffffff;
  }

  .light-mode .component button:hover {
    background: #4f46e5;
  }
`;
