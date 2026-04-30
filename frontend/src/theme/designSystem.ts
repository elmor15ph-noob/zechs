/**
 * ZECHS Design System - SAP FIORI Theme
 * Unified theme and component styling for dark/light modes
 * All components must import and use these values
 */

// FIORI Primary Color Palette
export const fiori = {
  primary: '#0A6ED4',        // SAP Blue
  primaryHover: '#055399',   // Darker blue on hover
  primaryActive: '#003D7A',  // Darkest blue on active
  primaryLight: '#4DA3FF',   // Light blue for dark mode

  // Semantic Status Colors
  success: '#107E3E',        // FIORI Green
  warning: '#E17B08',        // FIORI Orange
  error: '#C00',             // FIORI Red
  critical: '#BB0000',       // Critical red
  information: '#0A6ED4',    // Info blue (same as primary)

  // Neutral Palette
  neutral100: '#FFFFFF',     // Pure white
  neutral50: '#F8F8F8',      // Very light gray
  neutral10: '#F2F2F2',      // Light gray
  neutral5: '#F5F5F5',       // Slightly less light
  neutral20: '#E8E8E8',      // Medium light gray
  neutral40: '#CCCCCC',      // Medium gray
  neutral60: '#999999',      // Dark gray
  neutral80: '#666666',      // Darker gray
  neutral100: '#333333',     // Almost black

  // FIORI Belize Dark Theme
  darkBg: '#0a1929',         // FIORI Belize background (dark blue-black)
  darkSurface: '#111f2e',    // FIORI Belize elevated surface
  darkBorder: '#1a2a3a',     // FIORI Belize border
  darkText: '#ffffff',       // Light text
  darkTextSecondary: '#b0bec5' // Secondary text
};

export const colors = {
  dark: {
    bg: fiori.darkBg,
    card: fiori.darkSurface,
    header: fiori.darkSurface,
    border: fiori.darkBorder,
    text: fiori.darkText,
    textSecondary: fiori.darkTextSecondary,
    accent: fiori.primaryLight,
    accentDark: fiori.primary,
    success: fiori.success,
    warning: fiori.warning,
    error: fiori.error,
  },
  light: {
    bg: fiori.neutral50,
    card: fiori.neutral100,
    header: fiori.neutral50,
    border: fiori.neutral10,
    text: fiori.neutral100,
    textSecondary: fiori.neutral80,
    accent: fiori.primary,
    accentDark: fiori.primaryActive,
    success: fiori.success,
    warning: fiori.warning,
    error: fiori.error,
  },
};

// FIORI Elevation/Shadow System
export const shadows = {
  // Level 1: Subtle elevation
  elevation1: '0 0 1px 0 rgba(0, 0, 0, 0.08)',
  // Level 2: Card shadow
  elevation2: '0 1px 4px 0 rgba(0, 0, 0, 0.12)',
  // Level 3: Raised elevation
  elevation3: '0 2px 8px 0 rgba(0, 0, 0, 0.16)',

  // Legacy (backward compatibility)
  card: '0 1px 4px 0 rgba(0, 0, 0, 0.12)',
  cardLight: '0 0 1px 0 rgba(0, 0, 0, 0.08)',
  button: '0 1px 4px 0 rgba(10, 110, 212, 0.12)',
  buttonLight: '0 0 1px 0 rgba(10, 110, 212, 0.08)',
};

// FIORI Spacing System (4px base grid)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  xxl: '2rem',     // 32px
};

export const fonts = {
  primary: "'Community', 'IBM Plex Sans', sans-serif",
  mono: "'Community', 'IBM Plex Mono', monospace",
};

// FIORI Button Styles
export const buttonStyles = (isDark: boolean) => ({
  primary: {
    background: fiori.primary,      // SAP Blue #0A6ED4
    color: '#FFFFFF',
    border: 'none',
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
    boxShadow: shadows.elevation2,
  },
  primaryHover: {
    background: fiori.primaryHover,  // Darker blue on hover
    color: '#FFFFFF',
    border: 'none',
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  secondary: {
    background: isDark ? fiori.darkSurface : fiori.neutral50,
    color: isDark ? fiori.darkTextSecondary : fiori.neutral80,
    border: `1px solid ${isDark ? fiori.darkBorder : fiori.neutral10}`,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  ghost: {
    background: 'transparent',
    color: fiori.primary,
    border: `1px solid ${fiori.primary}`,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  danger: {
    background: fiori.error,         // FIORI Red
    color: '#FFFFFF',
    border: 'none',
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
});

// FIORI Card Styles
export const cardStyles = (isDark: boolean) => ({
  container: {
    background: isDark ? colors.dark.card : colors.light.card,
    borderRadius: '4px',
    padding: spacing.lg,
    boxShadow: shadows.elevation2,
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
  tile: {
    background: isDark ? colors.dark.card : colors.light.card,
    borderRadius: '4px',
    padding: spacing.lg,
    boxShadow: shadows.elevation1,
    border: `1px solid ${isDark ? colors.dark.border : colors.light.border}`,
    color: isDark ? colors.dark.text : colors.light.text,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
});

// FIORI Input Styles
export const inputStyles = (isDark: boolean) => ({
  input: {
    padding: spacing.md,
    background: isDark ? fiori.darkSurface : fiori.neutral100,
    border: `1px solid ${isDark ? fiori.darkBorder : fiori.neutral10}`,
    borderRadius: '4px',
    color: isDark ? colors.dark.text : colors.light.text,
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    transition: 'all 0.2s',
  },
  textarea: {
    padding: spacing.md,
    background: isDark ? fiori.darkSurface : fiori.neutral100,
    border: `1px solid ${isDark ? fiori.darkBorder : fiori.neutral10}`,
    borderRadius: '4px',
    color: isDark ? colors.dark.text : colors.light.text,
    fontSize: '0.875rem',
    fontFamily: fonts.primary,
    minHeight: '80px',
    resize: 'vertical' as const,
    transition: 'all 0.2s',
  },
});

/**
 * Component CSS Template for all new components
 * SAP FIORI Design System - Use this pattern for consistent theming
 */
export const componentCSSTemplate = `
  /* FIORI Dark Mode (default) */
  .component {
    background: #2D2D2D;
    color: #FFFFFF;
    border: 1px solid #404040;
    border-radius: 4px;
    padding: 1rem;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.12);
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .component button {
    background: #0A6ED4;        /* FIORI Primary Blue */
    color: #FFFFFF;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
    box-shadow: 0 1px 4px 0 rgba(10, 110, 212, 0.12);
  }

  .component button:hover {
    background: #055399;        /* FIORI Blue Hover */
  }

  .component button:active {
    background: #003D7A;        /* FIORI Blue Active */
  }

  .component button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Success Button */
  .component button.success {
    background: #107E3E;        /* FIORI Green */
  }

  .component button.success:hover {
    background: #0A6531;
  }

  /* FIORI Light Mode */
  .light-mode .component {
    background: #FFFFFF;
    color: #333333;
    border: 1px solid #F2F2F2;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.12);
  }

  .light-mode .component button {
    background: #0A6ED4;        /* FIORI Primary Blue */
    color: #FFFFFF;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
  }

  .light-mode .component button:hover {
    background: #055399;
  }
`;
