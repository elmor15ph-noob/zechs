# Brain App Component Template

This is the required template for all new components to ensure consistent theming across the dashboard.

## Template Structure

```tsx
import React, { useState } from 'react';
import { icons } from '../theme/icons';
import { colors, spacing, fonts, buttonStyles, cardStyles } from '../theme/designSystem';

interface ComponentProps {
  isDarkMode?: boolean;
}

const componentStyles = `
  /* Dark Mode (default) */
  .my-component {
    background: #1a2332;
    color: #e0e8f0;
    border: 1px solid #2a3a4a;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    font-family: 'Community', 'IBM Plex Sans', sans-serif;
  }

  .my-component-btn {
    background: #00d4ff;
    color: #0f1620;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 3px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .my-component-btn:hover {
    background: #0ab5d4;
    transform: translateY(-1px);
  }

  /* Light Mode */
  .light-mode .my-component {
    background: #ffffff;
    color: #1f2937;
    border: 1px solid #e2e8f0;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }

  .light-mode .my-component-btn {
    background: #6366f1;
    color: #ffffff;
  }

  .light-mode .my-component-btn:hover {
    background: #4f46e5;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = componentStyles;
  document.head.appendChild(style);
}

export default function MyComponent({ isDarkMode = true }: ComponentProps) {
  const [data, setData] = useState(null);

  return (
    <div className="my-component">
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        {/* Use icons instead of emoji */}
        {React.cloneElement(icons.brain, { color: '#00d4ff', size: 20 })}
        <h2 style={{ margin: 0, color: isDarkMode ? '#e0e8f0' : '#1f2937' }}>
          My Component
        </h2>
      </div>

      {/* Use buttons with proper theming */}
      <button 
        className="my-component-btn"
        onClick={() => console.log('clicked')}
      >
        Submit
      </button>
    </div>
  );
}
```

## Key Rules

### 1. Always Import Required Modules
```tsx
import { icons } from '../theme/icons';  // For icons, NOT emoji
import { colors, spacing, fonts, buttonStyles, cardStyles } from '../theme/designSystem';
```

### 2. Colors - Never Hardcode
❌ **WRONG:**
```tsx
<div style={{ background: '#1a2332', color: '#e0e8f0' }}>
```

✅ **RIGHT:**
```tsx
<div style={{ 
  background: isDarkMode ? colors.dark.card : colors.light.card,
  color: isDarkMode ? colors.dark.text : colors.light.text,
}}>
```

### 3. Icons - Never Use Emoji
❌ **WRONG:**
```tsx
<h4>❌ Error</h4>
<h4>⚙️ Settings</h4>
<h4>📊 Dashboard</h4>
```

✅ **RIGHT:**
```tsx
<div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
  {React.cloneElement(icons.error, { color: '#ff6b35' })}
  <h4>Error</h4>
</div>

<div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
  {React.cloneElement(icons.settings, { color: '#00d4ff' })}
  <h4>Settings</h4>
</div>
```

### 4. Buttons - Always Theme Aware
❌ **WRONG:**
```tsx
<button style={{ background: '#667eea' }}>Click Me</button>
```

✅ **RIGHT:**
```tsx
<button style={{
  background: isDarkMode ? '#00d4ff' : '#6366f1',
  color: isDarkMode ? '#0f1620' : '#ffffff',
}}>Click Me</button>
```

### 5. CSS - Always Include Dark & Light Modes
```css
/* Dark Mode (default) */
.component {
  background: #1a2332;
  color: #e0e8f0;
}

/* Light Mode */
.light-mode .component {
  background: #ffffff;
  color: #1f2937;
}
```

### 6. Spacing - Use Design System Constants
```tsx
padding: spacing.lg        // 1rem
gap: spacing.md            // 0.75rem
marginBottom: spacing.xl    // 1.5rem
```

## Dark Mode Color Palette

| Element | Dark | Light |
|---------|------|-------|
| Background | #0f1620 | #f0f4f8 |
| Card/Panel | #1a2332 | #ffffff |
| Border | #2a3a4a | #e2e8f0 |
| Text | #e0e8f0 | #1f2937 |
| Text Secondary | #94a3b8 | #64748b |
| Primary Accent | #00d4ff | #6366f1 |
| Orange Accent | #ff6b35 | #ff6b35 |

## Icon List (Use Instead of Emoji)

- 🔍 → `icons.search`
- 📋 → `icons.sapFitGap`
- 📊 → `icons.pmDashboard`
- 💡 → `icons.ideas`
- 👤 → `icons.traits`
- 🧠 → `icons.brain`
- ✓ → `icons.success`
- ❌ → `icons.error`
- ⚠️ → `icons.warning`
- ⚙️ → `icons.settings`
- 📈 → `icons.chart`
- ⚡ → `icons.power`

## CSS Shadow Presets

```tsx
// Soft shadow for light mode
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);

// Deep shadow for dark mode  
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 212, 255, 0.1);
```

## Component Checklist

- [ ] Imports `icons` from theme/icons.tsx
- [ ] Imports design system from theme/designSystem.ts
- [ ] CSS includes both dark & light mode styles
- [ ] No hardcoded colors (uses design system)
- [ ] All emoji replaced with `icons.*`
- [ ] Buttons use theme-aware colors
- [ ] Spacing uses `spacing.*` constants
- [ ] Font uses `fonts.primary` or `fonts.mono`
- [ ] `isDarkMode` prop supported (even if defaulted)

## Questions?

Check these components for examples:
- SearchSection.tsx (SearchVault)
- App.tsx (Header + Layout)
- Sidebar.tsx (Navigation)
