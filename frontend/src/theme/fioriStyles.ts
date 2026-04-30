/**
 * FIORI Simulator Styles
 * Centralized FIORI-compliant CSS for all simulator components
 */

export const createFioriStyles = (isDarkMode: boolean) => `
  /* PRIMARY FIORI COLORS */
  :root {
    --fiori-primary: #0A6ED4;
    --fiori-success: #107E3E;
    --fiori-warning: #E17B08;
    --fiori-error: #C00;
  }

  .realtime-header {
    background: ${isDarkMode ? '#2D2D2D' : '#FFFFFF'};
    border-bottom: 2px solid #0A6ED4;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.12);
  }

  .realtime-header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #0A6ED4;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: 0.5px;
  }

  .control-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    background: #0A6ED4;
    color: #FFFFFF;
    box-shadow: 0 1px 4px 0 rgba(10, 110, 212, 0.12);
  }

  .control-button:hover {
    background: #055399;
    box-shadow: 0 2px 8px 0 rgba(10, 110, 212, 0.2);
  }

  .control-button:active {
    background: #003D7A;
  }

  .progress-bar-container {
    flex: 1;
    height: 8px;
    background: ${isDarkMode ? '#404040' : '#E8E8E8'};
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #0A6ED4 0%, #107E3E 100%);
    transition: width 0.3s ease;
  }

  .module-flow {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: ${isDarkMode ? '#2D2D2D' : '#FFFFFF'};
    border-radius: 4px;
    border: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
    margin-bottom: 1.5rem;
    align-items: center;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.12);
  }

  .module-box {
    flex: 1;
    padding: 1rem;
    border-radius: 4px;
    text-align: center;
    border: 2px solid;
    transition: all 0.3s;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .module-box.inactive {
    border-color: ${isDarkMode ? '#404040' : '#F2F2F2'};
    background: ${isDarkMode ? '#1A1A1A' : '#F8F8F8'};
    color: ${isDarkMode ? '#999999' : '#999999'};
    opacity: 0.5;
  }

  .module-box.active {
    border-color: #0A6ED4;
    background: rgba(10, 110, 212, 0.1);
    color: #0A6ED4;
  }

  .transaction-timeline {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .transaction-card {
    padding: 1rem;
    background: ${isDarkMode ? '#2D2D2D' : '#FFFFFF'};
    border: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
  }

  .transaction-card:hover {
    border-color: #0A6ED4;
    background: ${isDarkMode ? 'rgba(10, 110, 212, 0.08)' : 'rgba(10, 110, 212, 0.04)'};
    box-shadow: 0 2px 8px 0 rgba(10, 110, 212, 0.12);
  }

  .transaction-card.active {
    border-color: #0A6ED4;
    background: ${isDarkMode ? 'rgba(10, 110, 212, 0.15)' : 'rgba(10, 110, 212, 0.08)'};
    box-shadow: 0 2px 8px 0 rgba(10, 110, 212, 0.2);
  }

  .transaction-code {
    font-size: 0.75rem;
    font-weight: 700;
    color: #0A6ED4;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .transaction-name {
    font-weight: 700;
    font-size: 0.95rem;
    margin: 0.5rem 0;
    color: ${isDarkMode ? '#FFFFFF' : '#333333'};
  }

  .transaction-description {
    font-size: 0.8rem;
    color: ${isDarkMode ? '#D0D0D0' : '#666666'};
    line-height: 1.5;
    margin-bottom: 0.75rem;
  }

  .transaction-module {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    background: rgba(10, 110, 212, 0.15);
    color: #0A6ED4;
    text-transform: uppercase;
  }

  .transaction-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .transaction-status.executing {
    background: #0A6ED4;
    color: #FFFFFF;
    animation: pulse-animation 1s infinite;
  }

  .transaction-status.completed {
    background: #107E3E;
    color: #FFFFFF;
  }

  @keyframes pulse-animation {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .gl-account-dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .gl-account-card {
    padding: 1rem;
    background: ${isDarkMode ? '#2D2D2D' : '#FFFFFF'};
    border: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
    border-radius: 4px;
    transition: all 0.3s;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
  }

  .gl-account-card.flashing {
    background: ${isDarkMode ? '#2D3D2D' : '#F0F8F0'};
    border-color: #107E3E;
    box-shadow: 0 0 8px rgba(16, 126, 62, 0.3);
  }

  .gl-account-number {
    font-weight: 700;
    font-size: 0.8rem;
    color: #0A6ED4;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.25rem;
  }

  .gl-account-balance {
    font-size: 1.5rem;
    font-weight: 700;
    color: #107E3E;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.5px;
  }

  .gl-account-balance.negative {
    color: #C00;
  }

  .summary-section {
    padding: 1.5rem;
    background: ${isDarkMode ? '#2D2D2D' : '#FFFFFF'};
    border: 1px solid ${isDarkMode ? '#404040' : '#F2F2F2'};
    border-radius: 4px;
    margin-top: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.08);
  }

  .summary-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${isDarkMode ? '#D0D0D0' : '#666666'};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0A6ED4;
    font-family: 'Courier New', monospace;
  }

  .dark-mode {
    color: #FFFFFF;
    background: #1A1A1A;
  }

  .light-mode {
    color: #333333;
    background: #FFFFFF;
  }
`;
