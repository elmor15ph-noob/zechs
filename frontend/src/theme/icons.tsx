/**
 * Data Mesh Icon System
 * Replace all emoji with lucide-react icons for consistency
 * Import and use these instead of emoji
 */

import React from 'react';
import {
  Search,
  FileText,
  BarChart3,
  Lightbulb,
  User,
  Brain,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  TrendingUp,
  Zap,
  Grid2X2,
  Layers,
  Database,
  Filter,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export const icons = {
  // Navigation
  search: <Search size={20} />,
  sapFitGap: <FileText size={20} />,
  pmDashboard: <BarChart3 size={20} />,
  ideas: <Lightbulb size={20} />,
  traits: <User size={20} />,
  brain: <Brain size={20} />,

  // Status
  success: <CheckCircle size={20} />,
  warning: <AlertCircle size={20} />,
  error: <XCircle size={20} />,
  info: <Grid2X2 size={20} />,

  // Actions
  settings: <Settings size={20} />,
  chart: <TrendingUp size={20} />,
  power: <Zap size={20} />,
  close: <X size={20} />,

  // Data
  database: <Database size={20} />,
  filter: <Filter size={20} />,
  layers: <Layers size={20} />,

  // Theme
  sun: <Sun size={20} />,
  moon: <Moon size={20} />,
};

/**
 * Emoji to Icon mapping for quick conversions
 * Use this to identify what icon should replace each emoji
 */
export const emojiToIconMap: Record<string, string> = {
  '🔍': 'search',
  '📋': 'sapFitGap',
  '📊': 'pmDashboard',
  '💡': 'ideas',
  '👤': 'traits',
  '🧠': 'brain',
  '✓': 'success',
  '❌': 'error',
  '⚠️': 'warning',
  '⚙️': 'settings',
  '📈': 'chart',
  '🔄': 'layers',
  '⚡': 'power',
  '🎯': 'target',
  '📁': 'database',
  '🔤': 'filter',
  '🌓': 'sun', // or moon
};

/**
 * Usage Example:
 *
 * Instead of:  <h4>❌ Error</h4>
 * Use:         <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
 *                {React.cloneElement(icons.error, {color: '#ff6b35', size: 16})}
 *                <h4>Error</h4>
 *              </div>
 */
export function renderIconWithText(
  iconKey: keyof typeof icons,
  text: string,
  size: number = 16,
  color?: string
) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {React.cloneElement(icons[iconKey], { size, color })}
      <span>{text}</span>
    </div>
  );
}
