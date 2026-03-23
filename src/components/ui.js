'use client';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { AlertCircle, Inbox, X, Search, ChevronLeft, ChevronRight, Check, ChevronDown, MoreVertical } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   THEME CONFIGURATION
═══════════════════════════════════════════════════════════════════════ */
export const THEME = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    purple: '#a855f7',
    pink: '#ec4899',
    slate: '#64748b',
    dark: '#0f172a',
    light: '#f8fafc',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    secondary: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    success: 'linear-gradient(135deg, #10b981, #34d399)',
    error: 'linear-gradient(135deg, #ef4444, #f87171)',
    warning: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    info: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    purple: 'linear-gradient(135deg, #a855f7, #c084fc)',
    pink: 'linear-gradient(135deg, #ec4899, #f472b6)',
    dark: 'linear-gradient(135deg, #1e293b, #334155)',
    rainbow: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b)',
  },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.12)',
    lg: '0 8px 32px rgba(0,0,0,0.16)',
    xl: '0 16px 48px rgba(0,0,0,0.2)',
    primary: '0 8px 24px rgba(99,102,241,0.35)',
    success: '0 8px 24px rgba(16,185,129,0.35)',
    error: '0 8px 24px rgba(239,68,68,0.35)',
    warning: '0 8px 24px rgba(245,158,11,0.35)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  fonts: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s ease',
    bounce: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   TOAST CONTEXT
═══════════════════════════════════════════════════════════════════════ */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback for when not wrapped in ToastProvider
    return {
      addToast: (msg, type) => console.log(`Toast [${type}]: ${msg}`),
      removeToast: () => {},
    };
  }
  return context;
}

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL STYLES & ANIMATIONS
═══════════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Keyframes ── */
  @keyframes fadeSlideDown  { from { opacity:0; transform:translateY(-16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fadeSlideUp    { from { opacity:0; transform:translateY(20px)  scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fadeSlideLeft  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeSlideRight { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeIn         { from { opacity:0; } to { opacity:1; } }
  @keyframes fadeOut        { from { opacity:1; } to { opacity:0; } }
  @keyframes scaleIn        { from { opacity:0; transform:scale(0.88) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes scaleOut       { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.88); } }
  @keyframes shimmer        { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes pulse          { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.95); } }
  @keyframes spin           { to { transform:rotate(360deg); } }
  @keyframes spinReverse    { to { transform:rotate(-360deg); } }
  @keyframes bounceSoft     { 0%,100% { transform:translateY(0) rotate(0deg); } 30% { transform:translateY(-8px) rotate(-3deg); } 60% { transform:translateY(-4px) rotate(2deg); } }
  @keyframes countUp        { from { opacity:0; transform:translateY(14px) scale(0.85); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes glowPulse      { 0%,100% { box-shadow: 0 0 0 0 var(--glow-color,rgba(99,102,241,0.4)); } 50% { box-shadow: 0 0 0 8px rgba(0,0,0,0); } }
  @keyframes borderFlow     { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
  @keyframes floatUp        { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-6px); } }
  @keyframes ripple         { 0% { transform:scale(0); opacity:0.6; } 100% { transform:scale(4); opacity:0; } }
  @keyframes slideInRight   { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideOutRight  { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(32px); } }
  @keyframes slideInUp      { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideOutDown   { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(100%); } }
  @keyframes progressFill   { from { width:0%; } to { width:var(--target-width,100%); } }
  @keyframes shake          { 0%,100% { transform:translateX(0); } 10%,30%,50%,70%,90% { transform:translateX(-4px); } 20%,40%,60%,80% { transform:translateX(4px); } }
  @keyframes wiggle         { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(-5deg); } 75% { transform:rotate(5deg); } }
  @keyframes heartbeat      { 0%,100% { transform:scale(1); } 25% { transform:scale(1.1); } 50% { transform:scale(1); } 75% { transform:scale(1.1); } }
  @keyframes confetti       { 0% { transform:translateY(0) rotate(0deg); opacity:1; } 100% { transform:translateY(400px) rotate(720deg); opacity:0; } }

  /* ── Stat Card ── */
  .sc-wrap {
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
    animation: fadeSlideUp 0.5s cubic-bezier(.34,1.56,.64,1) both;
    cursor: default; position: relative; overflow: hidden;
  }
  .sc-wrap:hover {
    transform: translateY(-7px) scale(1.025);
    box-shadow: 0 24px 60px rgba(0,0,0,0.13) !important;
  }
  .sc-wrap::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--sc-gradient);
    opacity: 0; transition: opacity 0.3s;
  }
  .sc-wrap:hover::before { opacity: 1; }

  /* ── Table Row ── */
  .tr-hover {
    transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
    animation: fadeIn 0.35s ease both;
  }
  .tr-hover:hover {
    background: linear-gradient(90deg, #f5f3ff 0%, #faf5ff 100%) !important;
    transform: translateX(4px);
    box-shadow: inset 3px 0 0 #6366f1;
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
    position: relative;
    overflow: hidden;
    border: none;
    outline: none;
    white-space: nowrap;
  }
  .btn:hover { transform: translateY(-2px) scale(1.03); }
  .btn:active { transform: scale(0.96); }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    box-shadow: 0 4px 16px rgba(99,102,241,0.35);
  }
  .btn-primary:hover { box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
  .btn-secondary {
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    color: #374151;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .btn-secondary:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .btn-success {
    background: linear-gradient(135deg, #10b981, #34d399);
    color: white;
    box-shadow: 0 4px 16px rgba(16,185,129,0.35);
  }
  .btn-danger {
    background: linear-gradient(135deg, #ef4444, #f87171);
    color: white;
    box-shadow: 0 4px 16px rgba(239,68,68,0.35);
  }
  .btn-warning {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: white;
    box-shadow: 0 4px 16px rgba(245,158,11,0.35);
  }
  .btn-outline {
    background: white;
    color: #6366f1;
    border: 2px solid #e2e8f0;
  }
  .btn-outline:hover {
    border-color: #6366f1;
    background: #f5f3ff;
  }
  .btn-ghost {
    background: transparent;
    color: #64748b;
  }
  .btn-ghost:hover {
    background: #f1f5f9;
    color: #374151;
  }
  .btn-sm {
    padding: 6px 12px;
    font-size: 0.78rem;
    border-radius: 8px;
    gap: 5px;
  }
  .btn-lg {
    padding: 14px 28px;
    font-size: 1rem;
    border-radius: 14px;
  }
  .btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 12px;
  }
  .btn-icon.btn-sm {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .btn .ripple-el {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }

  /* ── Inputs ── */
  .input, .select, .textarea {
    width: 100%;
    padding: 11px 14px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #fafbff;
    font-size: 0.88rem;
    color: #374151;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  .input:focus, .select:focus, .textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    background: white;
  }
  .input::placeholder { color: #94a3b8; }
  .input:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.7;
  }
  .input-error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
  }
  .select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }
  .textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }

  /* ── Card ── */
  .card {
    background: white;
    border-radius: 18px;
    padding: 22px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
    position: relative;
    overflow: hidden;
  }
  .card-animate {
    animation: fadeSlideUp 0.4s ease both;
  }
  .card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  }

  /* ── Modal ── */
  .modal-panel { animation: scaleIn 0.32s cubic-bezier(.34,1.56,.64,1); }
  .modal-backdrop { animation: fadeIn 0.22s ease; }
  .modal-closing .modal-panel { animation: scaleOut 0.2s ease; }
  .modal-closing .modal-backdrop { animation: fadeOut 0.2s ease; }

  /* ── Shimmer ── */
  .shimmer {
    background: linear-gradient(90deg,#f0f4ff 25%,#e8eeff 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 10px;
  }

  /* ── Badge ── */
  .badge-el {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    letter-spacing: 0.03em;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .badge-el:hover { transform: scale(1.06); }
  .badge-dot {
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
    animation: pulse 2.2s infinite;
  }

  /* ── Filter Select ── */
  .filter-select {
    padding: 9px 13px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #fafbff;
    font-size: 0.83rem;
    cursor: pointer;
    color: #374151;
    outline: none;
    font-weight: 500;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }
  .filter-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    background-color: #fff;
    transform: translateY(-1px);
  }
  .filter-select[data-active="true"] {
    border-color: #6366f1;
    background: #eef2ff;
    color: #4338ca;
    font-weight: 700;
  }

  /* ── Tabs ── */
  .tab-pill {
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 0.8rem;
    border: none;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    font-weight: 500;
    position: relative;
    background: transparent;
    color: #6366f1;
  }
  .tab-pill:hover:not(.tab-active) {
    background: rgba(99,102,241,0.07);
    color: #4338ca;
    transform: translateY(-1px);
  }
  .tab-pill.tab-active {
    background: white;
    color: #1e293b;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06);
  }

  /* ── Pagination btn ── */
  .pg-btn {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    font-size: 0.79rem;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #374151;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pg-btn:hover:not(:disabled):not(.pg-active) {
    border-color: #6366f1;
    color: #4338ca;
    transform: translateY(-2px) scale(1.08);
    box-shadow: 0 4px 12px rgba(99,102,241,0.2);
  }
  .pg-btn.pg-active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
    color: white;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(99,102,241,0.45);
    transform: translateY(-1px);
  }
  .pg-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }

  /* ── InfoRow ── */
  .info-row {
    padding: 10px 0;
    border-bottom: 1px solid #f4f6fb;
    animation: fadeSlideUp 0.3s ease both;
    transition: background 0.18s, padding-left 0.18s;
    border-radius: 6px;
  }
  .info-row:hover {
    background: #fafbff;
    padding-left: 8px;
  }

  /* ── Alert ── */
  .alert-el { animation: slideInRight 0.3s cubic-bezier(.34,1.56,.64,1); }

  /* ── Progress ── */
  .progress-fill { animation: progressFill 1.2s cubic-bezier(.4,0,.2,1) both; }

  /* ── Toast ── */
  .toast-enter { animation: slideInRight 0.4s cubic-bezier(.34,1.56,.64,1); }
  .toast-exit { animation: slideOutRight 0.3s ease; }

  /* ── Dropdown ── */
  .dropdown-menu {
    animation: scaleIn 0.2s ease;
  }
  .dropdown-item {
    width: 100%;
    padding: 10px 16px;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    transition: background 0.15s, color 0.15s;
  }
  .dropdown-item:hover {
    background: #f5f3ff;
    color: #6366f1;
  }
  .dropdown-item-danger:hover {
    background: #fef2f2;
    color: #ef4444;
  }

  /* ── Tooltip ── */
  .tooltip-content {
    animation: fadeIn 0.15s ease;
  }

  /* ── Checkbox & Radio ── */
  .checkbox-wrapper, .radio-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
    user-select: none;
  }
  .checkbox-box, .radio-box {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #d1d5db;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .radio-box { border-radius: 50%; }
  .checkbox-wrapper:hover .checkbox-box,
  .radio-wrapper:hover .radio-box {
    border-color: #6366f1;
  }
  .checkbox-box.checked, .radio-box.checked {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent;
  }

  /* ── Switch/Toggle ── */
  .switch-track {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    background: #e2e8f0;
    position: relative;
    cursor: pointer;
    transition: background 0.25s ease;
  }
  .switch-track.active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }
  .switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.25s cubic-bezier(.34,1.56,.64,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  .switch-track.active .switch-thumb {
    transform: translateX(20px);
  }

  /* ── Avatar ── */
  .avatar {
    border-radius: 50%;
    object-fit: cover;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #6366f1;
    flex-shrink: 0;
  }
  .avatar-group {
    display: flex;
  }
  .avatar-group .avatar {
    border: 2px solid white;
    margin-left: -10px;
  }
  .avatar-group .avatar:first-child {
    margin-left: 0;
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
    margin: 16px 0;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sc-wrap { padding: 14px 16px !important; }
    .modal-panel { border-radius: 20px 20px 0 0 !important; max-height: 90vh !important; }
    .pg-btn { width: 30px; height: 30px; font-size: 0.73rem; }
    .filter-bar-wrap { flex-direction: column; align-items: stretch !important; }
    .filter-bar-wrap > * { width: 100% !important; max-width: 100% !important; }
    .btn { padding: 9px 14px; font-size: 0.82rem; }
    .hide-mobile { display: none !important; }
  }

  @media (max-width: 480px) {
    .card { padding: 16px; border-radius: 14px; }
    .modal-panel { border-radius: 16px 16px 0 0 !important; }
  }
`;

function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE HEADER
═══════════════════════════════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, children, backButton, onBack }) {
  return (
    <>
      <GlobalStyles />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 14,
        animation: 'fadeSlideDown 0.45s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {backButton && (
              <button
                onClick={onBack}
                className="btn btn-ghost btn-icon btn-sm"
                style={{ marginRight: 4 }}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div style={{
              width: 4,
              height: 28,
              borderRadius: 4,
              background: 'linear-gradient(180deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.45)',
              flexShrink: 0,
            }} />
            <h2 style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
              background: 'linear-gradient(135deg, #0f172a 0%, #4338ca 60%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {title}
            </h2>
          </div>
          {subtitle && (
            <p style={{
              color: '#94a3b8',
              fontSize: '0.83rem',
              margin: '0 0 0 14px',
              fontWeight: 500,
              animation: 'fadeSlideDown 0.45s ease 0.08s both',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {children && (
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            animation: 'fadeSlideDown 0.45s ease 0.12s both',
          }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════════════════ */
const BADGE_THEMES = {
  Active: { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Inactive: { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Pass: { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Fail: { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Paid: { bg: 'linear-gradient(135deg,#d1fae5,#bbf7d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Pending: { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', text: '#78350f', dot: '#f59e0b', shadow: 'rgba(245,158,11,0.3)' },
  Due: { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Present: { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Absent: { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  New: { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', text: '#1e40af', dot: '#3b82f6', shadow: 'rgba(59,130,246,0.3)' },
  Draft: { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', text: '#475569', dot: '#94a3b8', shadow: 'rgba(148,163,184,0.3)' },
  Published: { bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', text: '#5b21b6', dot: '#8b5cf6', shadow: 'rgba(139,92,246,0.3)' },
  Default: { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', text: '#475569', dot: '#94a3b8', shadow: 'rgba(148,163,184,0.3)' },
};

export function Badge({ children, variant, size = 'md', dot = true }) {
  const key = variant || children;
  const theme = BADGE_THEMES[key] || BADGE_THEMES.Default;
  const sizes = {
    sm: { padding: '2px 8px', fontSize: '0.65rem', dotSize: 4 },
    md: { padding: '4px 11px', fontSize: '0.7rem', dotSize: 5 },
    lg: { padding: '5px 14px', fontSize: '0.78rem', dotSize: 6 },
  };
  const s = sizes[size];

  return (
    <span
      className="badge-el"
      style={{
        padding: s.padding,
        borderRadius: 20,
        fontSize: s.fontSize,
        fontWeight: 700,
        background: theme.bg,
        color: theme.text,
        boxShadow: `0 2px 8px ${theme.shadow}, 0 0 0 1px ${theme.shadow}`,
      }}
    >
      {dot && (
        <span
          className="badge-dot"
          style={{
            width: s.dotSize,
            height: s.dotSize,
            background: theme.dot,
            boxShadow: `0 0 6px ${theme.shadow}`,
          }}
        />
      )}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════════════ */
export function StatCard({ title, value, sub, color = '#6366f1', icon, delay = 0, trend, trendValue, onClick }) {
  const gradients = {
    '#6366f1': 'linear-gradient(135deg,#6366f1,#818cf8)',
    '#10b981': 'linear-gradient(135deg,#10b981,#34d399)',
    '#ef4444': 'linear-gradient(135deg,#ef4444,#f87171)',
    '#f59e0b': 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    '#8b5cf6': 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
    '#06b6d4': 'linear-gradient(135deg,#06b6d4,#22d3ee)',
    '#ec4899': 'linear-gradient(135deg,#ec4899,#f472b6)',
    '#4f46e5': 'linear-gradient(135deg,#4f46e5,#6366f1)',
  };
  const grad = gradients[color] || `linear-gradient(135deg,${color},${color}cc)`;

  return (
    <div
      className="sc-wrap card"
      style={{
        '--sc-gradient': grad,
        padding: '20px 22px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        animationDelay: `${delay}ms`,
        background: 'white',
        border: '1px solid #f1f5f9',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* Icon bubble */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          flexShrink: 0,
          background: grad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: `0 8px 24px ${color}44`,
          animation: `floatUp 3s ease infinite ${delay}ms`,
        }}
      >
        {icon || <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{String(value)?.[0] || '#'}</span>}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 'clamp(1.4rem,3vw,1.7rem)',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            animation: `countUp 0.6s cubic-bezier(.34,1.56,.64,1) ${delay + 120}ms both`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          {value}
          {trend && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                background: trend === 'up' ? '#dcfce7' : trend === 'down' ? '#fee2e2' : '#f1f5f9',
                color: trend === 'up' ? '#15803d' : trend === 'down' ? '#dc2626' : '#64748b',
              }}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            marginTop: 5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              marginTop: 4,
              background: grad,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {sub}
          </div>
        )}
      </div>

      {/* Decorative orb */}
      <div
        style={{
          position: 'absolute',
          right: -14,
          bottom: -14,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `${color}0d`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════════════════════════ */
export function SectionCard({ title, children, action, noPadding, icon }) {
  return (
    <div className="card card-animate" style={{ padding: 0, overflow: 'hidden' }}>
      {title && (
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #f4f6fb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #fafbff 0%, #f4f6fb 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {icon}
              </div>
            )}
            {!icon && (
              <div
                style={{
                  width: 3,
                  height: 18,
                  borderRadius: 2,
                  background: 'linear-gradient(180deg,#6366f1,#a855f7)',
                }}
              />
            )}
            <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.92rem', margin: 0 }}>{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: noPadding ? 0 : 22 }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CARD (Generic)
═══════════════════════════════════════════════════════════════════════ */
export function Card({ children, variant = 'default', padding = true, hover = false, onClick, style, className = '', ...props }) {
  const variants = {
    default: {
      background: 'white',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    gradient: {
      background: THEME.gradients.primary,
      border: 'none',
      boxShadow: THEME.shadows.primary,
      color: 'white',
    },
    outlined: {
      background: 'transparent',
      border: '2px solid #6366f1',
      boxShadow: 'none',
    },
    glass: {
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
    dark: {
      background: THEME.gradients.dark,
      border: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      color: 'white',
    },
  };

  return (
    <div
      className={`card-animate ${hover ? 'card-hover' : ''} ${className}`}
      onClick={onClick}
      style={{
        ...variants[variant],
        borderRadius: 18,
        padding: padding ? 22 : 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TABLE WRAPPER
═══════════════════════════════════════════════════════════════════════ */
export function TableWrapper({ children, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shimmer" style={{ height: 48, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ui-tw { overflow-x: auto; border-radius: 14px; border: 1.5px solid #f0f2ff; }
        .ui-tw table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .ui-tw thead tr {
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f4ff 100%);
        }
        .ui-tw th {
          padding: 13px 16px; text-align: left;
          font-size: 0.68rem; font-weight: 800; color: #6366f1;
          white-space: nowrap; border-bottom: 2px solid #e0e7ff;
          letter-spacing: 0.08em; text-transform: uppercase;
          position: relative;
        }
        .ui-tw th::after {
          content: ''; position: absolute; bottom: 0; left: 16px; right: 16px;
          height: 2px; background: linear-gradient(90deg, #6366f1, transparent);
          opacity: 0.3;
        }
        .ui-tw td {
          padding: 12px 16px; font-size: 0.84rem; color: #374151;
          border-bottom: 1px solid #f8f6ff; vertical-align: middle;
        }
        .ui-tw tbody tr {
          transition: background 0.18s, transform 0.18s;
          animation: fadeIn 0.4s ease both;
        }
        .ui-tw tbody tr:hover {
          background: linear-gradient(90deg, #f5f3ff 0%, #faf8ff 100%);
          transform: translateX(4px);
          box-shadow: inset 3px 0 0 #6366f1;
        }
        .ui-tw tbody tr:last-child td { border-bottom: none; }
        .ui-tw tbody tr:hover td:first-child { padding-left: 20px; transition: padding 0.18s; }
      `,
        }}
      />
      <div className="ui-tw">
        <table>{children}</table>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════════════════ */
export function Pagination({ total, page, perPage, onChange, showInfo = true }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const dot = (
    <span style={{ color: '#c4b5fd', fontSize: '0.85rem', padding: '0 3px', fontWeight: 700 }}>•••</span>
  );

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
        paddingTop: 16,
        borderTop: '1.5px solid #f0f2ff',
        flexWrap: 'wrap',
        gap: 12,
        animation: 'fadeSlideUp 0.35s ease',
      }}
    >
      {/* Info */}
      {showInfo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>{page}</span>
          </div>
          <span style={{ fontSize: '0.77rem', color: '#94a3b8', fontWeight: 500 }}>
            Showing <strong style={{ color: '#4338ca' }}>{Math.min((page - 1) * perPage + 1, total)}</strong>–
            <strong style={{ color: '#4338ca' }}>{Math.min(page * perPage, total)}</strong> of{' '}
            <strong style={{ color: '#4338ca' }}>{total}</strong>
          </span>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={14} />
        </button>

        {start > 1 && (
          <>
            <button className={`pg-btn${1 === page ? ' pg-active' : ''}`} onClick={() => onChange(1)}>
              1
            </button>
            {start > 2 && dot}
          </>
        )}

        {pages.map((p) => (
          <button key={p} className={`pg-btn${p === page ? ' pg-active' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && dot}
            <button
              className={`pg-btn${totalPages === page ? ' pg-active' : ''}`}
              onClick={() => onChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════ */
export function EmptyState({ message = 'No data found', description, icon, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fadeSlideUp 0.5s ease' }}>
      {/* Icon ring */}
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 22px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(99,102,241,0.15)',
            animation: 'floatUp 3s ease infinite',
          }}
        >
          {icon || <Inbox size={32} color="#8b5cf6" />}
        </div>
        {/* Rings */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '1.5px dashed #c4b5fd',
            animation: 'spin 12s linear infinite',
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: -16,
            borderRadius: '50%',
            border: '1px dashed #ddd6fe',
            animation: 'spinReverse 18s linear infinite',
            opacity: 0.3,
          }}
        />
      </div>

      <p style={{ color: '#4338ca', fontSize: '0.98rem', fontWeight: 700, marginBottom: 6 }}>{message}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: action ? 20 : 0, lineHeight: 1.6 }}>
        {description || 'No records to display right now.'}
      </p>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════════════ */
export function Modal({ open, onClose, title, children, size = 'md', subtitle, footer, closable = true }) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (!closable) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closable) handleClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, closable]);

  if (!open) return null;

  const widths = { sm: 420, md: 580, lg: 760, xl: 980, full: '95vw' };

  return (
    <div
      className={closing ? 'modal-closing' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,10,30,0.58)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="modal-panel"
        style={{
          position: 'relative',
          background: 'white',
          borderRadius: 22,
          boxShadow: '0 40px 100px rgba(0,0,0,0.28), 0 8px 24px rgba(99,102,241,0.12)',
          maxWidth: widths[size] || 580,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(99,102,241,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Gradient top strip */}
        <div
          style={{
            height: 4,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b)',
            backgroundSize: '300% 100%',
            animation: 'borderFlow 3s ease infinite',
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '20px 26px 16px',
            borderBottom: '1px solid #f4f6fb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'white',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0f172a', lineHeight: 1.3, margin: 0 }}>
              {title}
            </h3>
            {subtitle && <p style={{ color: '#94a3b8', fontSize: '0.79rem', marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          {closable && (
            <button
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                marginLeft: 14,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239,68,68,0.2)';
              }}
            >
              <X size={14} color="#dc2626" />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px', flex: 1, overflowY: 'auto' }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 26px',
              borderTop: '1px solid #f4f6fb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FORM FIELD
═══════════════════════════════════════════════════════════════════════ */
export function FormField({ label, required, children, hint, error }) {
  return (
    <div style={{ animation: 'fadeSlideUp 0.32s ease both', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      {label && (
        <label
          style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            color: '#374151',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 3,
              height: 12,
              borderRadius: 2,
              background: required ? 'linear-gradient(#6366f1,#8b5cf6)' : '#e2e8f0',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {label}
          {required && <span style={{ color: '#ef4444', fontSize: '0.9rem', lineHeight: 1 }}>*</span>}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{hint}</p>}
      {error && (
        <p
          style={{
            fontSize: '0.71rem',
            color: '#ef4444',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            margin: 0,
            background: '#fff5f5',
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid #fecaca',
          }}
        >
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INFO ROW
═══════════════════════════════════════════════════════════════════════ */
export function InfoRow({ label, value, highlight, icon }) {
  return (
    <div
      className="info-row"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 8px 10px 0',
        borderBottom: '1px solid #f4f6fb',
        transition: 'all 0.18s',
        cursor: 'default',
      }}
    >
      <div
        style={{
          fontSize: '0.63rem',
          color: '#a5b4fc',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {icon && <span style={{ color: '#8b5cf6' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: highlight || '#0f172a' }}>{value ?? '—'}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ALERT
═══════════════════════════════════════════════════════════════════════ */
export function Alert({ type = 'info', message, onClose, title }) {
  const themes = {
    info: {
      bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
      border: '#bfdbfe',
      color: '#1d4ed8',
      icon: '💡',
      glow: 'rgba(59,130,246,0.15)',
    },
    success: {
      bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
      border: '#bbf7d0',
      color: '#15803d',
      icon: '✅',
      glow: 'rgba(16,185,129,0.15)',
    },
    error: {
      bg: 'linear-gradient(135deg,#fff1f2,#fee2e2)',
      border: '#fecaca',
      color: '#dc2626',
      icon: '❌',
      glow: 'rgba(239,68,68,0.15)',
    },
    warning: {
      bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
      border: '#fde68a',
      color: '#b45309',
      icon: '⚠️',
      glow: 'rgba(245,158,11,0.15)',
    },
  };
  const s = themes[type] || themes.info;

  return (
    <div
      className="alert-el"
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        borderRadius: 14,
        padding: '13px 17px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        fontSize: '0.84rem',
        fontWeight: 600,
        lineHeight: 1.55,
        boxShadow: `0 4px 20px ${s.glow}`,
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: s.color,
            opacity: 0.65,
            padding: 0,
            display: 'flex',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.2) rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.65';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════════════════ */
export function FilterBar({ filters = [], onSearch, searchPlaceholder = 'Search...', searchValue = '', children }) {
  return (
    <div
      className="filter-bar-wrap"
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        animation: 'fadeSlideUp 0.35s ease both',
        marginBottom: 16,
      }}
    >
      {onSearch && <SearchInput value={searchValue} onChange={onSearch} placeholder={searchPlaceholder} />}
      {filters.map((f, i) => (
        <SelectFilter key={i} value={f.value} onChange={f.onChange} options={f.options} placeholder={f.label} />
      ))}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH INPUT
═══════════════════════════════════════════════════════════════════════ */
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: '#fafbff',
        borderRadius: 12,
        padding: '8px 13px',
        border: '1.5px solid #e0e7ff',
        flex: 1,
        minWidth: 190,
        maxWidth: 320,
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
        e.currentTarget.style.background = 'white';
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = '#e0e7ff';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = '#fafbff';
      }}
    >
      <Search size={14} color="#a5b4fc" style={{ flexShrink: 0 }} />
      <input
        style={{
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: '0.84rem',
          flex: 1,
          color: '#374151',
          minWidth: 0,
        }}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            borderRadius: 6,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <X size={11} color="#8b5cf6" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SELECT FILTER
═══════════════════════════════════════════════════════════════════════ */
export function SelectFilter({ value, onChange, options = [], placeholder = 'All' }) {
  return (
    <select className="filter-select" data-active={!!value} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((opt) =>
        typeof opt === 'string' ? (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ) : (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )
      )}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════════════════════════════ */
export function Tabs({ tabs = [], active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
        borderRadius: 14,
        padding: 5,
        width: 'fit-content',
        animation: 'fadeSlideUp 0.35s ease',
        boxShadow: 'inset 0 2px 8px rgba(99,102,241,0.08)',
        border: '1px solid #e0e7ff',
      }}
    >
      {tabs.map(({ key, label, count, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`tab-pill${active === key ? ' tab-active' : ''}`}
          style={{ color: active === key ? '#1e293b' : '#6366f1' }}
        >
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {label}
          {count !== undefined && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 99,
                minWidth: 20,
                textAlign: 'center',
                background: active === key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e0e7ff',
                color: active === key ? 'white' : '#6366f1',
                boxShadow: active === key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LOADING SPINNER
═══════════════════════════════════════════════════════════════════════ */
export function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const sizes = {
    sm: { wrapper: 32, outer: '100%', middle: 6, inner: 12, fontSize: '0.75rem', padding: 40 },
    md: { wrapper: 52, outer: '100%', middle: 7, inner: 17, fontSize: '0.875rem', padding: 72 },
    lg: { wrapper: 72, outer: '100%', middle: 10, inner: 22, fontSize: '1rem', padding: 100 },
  };
  const s = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: s.padding,
        gap: 18,
      }}
    >
      <div style={{ position: 'relative', width: s.wrapper, height: s.wrapper }}>
        {/* Outer ring */}
        <div
          style={{
            width: s.outer,
            height: s.outer,
            border: '3px solid #e0e7ff',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        {/* Middle ring */}
        <div
          style={{
            position: 'absolute',
            inset: s.middle,
            border: '2px solid #ede9fe',
            borderBottomColor: '#a855f7',
            borderRadius: '50%',
            animation: 'spinReverse 1.1s linear infinite',
          }}
        />
        {/* Inner dot */}
        <div
          style={{
            position: 'absolute',
            inset: s.inner,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            animation: 'pulse 1s ease infinite',
          }}
        />
      </div>
      {text && (
        <p style={{ color: '#a5b4fc', fontSize: s.fontSize, fontWeight: 600, letterSpacing: '0.04em' }}>{text}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════════════════ */
export function SkeletonCard({ lines = 3, height, avatar = true }) {
  if (height) return <div className="shimmer" style={{ height, borderRadius: 14 }} />;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
      {avatar && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="shimmer" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="shimmer" style={{ height: 14, width: '55%' }} />
            <div className="shimmer" style={{ height: 10, width: '35%' }} />
          </div>
        </div>
      )}
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="shimmer" style={{ height: 11, width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════════════════════════ */
export function ProgressBar({ value = 0, max = 100, color = '#6366f1', height = 9, label, showPercent, animated = true }) {
  const pct = max ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const gradients = {
    '#6366f1': 'linear-gradient(90deg,#6366f1,#8b5cf6)',
    '#10b981': 'linear-gradient(90deg,#10b981,#34d399)',
    '#ef4444': 'linear-gradient(90deg,#ef4444,#f87171)',
    '#f59e0b': 'linear-gradient(90deg,#f59e0b,#fbbf24)',
  };
  const grad = gradients[color] || `linear-gradient(90deg,${color},${color}bb)`;

  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: '0.77rem', color: '#64748b' }}>
          {label && <span style={{ fontWeight: 600 }}>{label}</span>}
          {showPercent && (
            <span
              style={{
                fontWeight: 800,
                background: grad,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        style={{
          height,
          background: '#f0f2ff',
          borderRadius: 99,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: grad,
            borderRadius: 99,
            transition: animated ? 'width 1.2s cubic-bezier(.4,0,.2,1)' : 'none',
            boxShadow: `0 2px 8px ${color}55`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shine */}
          <div
            style={{
              position: 'absolute',
              inset: '0 0 0 0',
              background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.3) 50%,transparent 100%)',
              backgroundSize: '200% 100%',
              animation: animated ? 'shimmer 2s infinite' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOAST CONTAINER
═══════════════════════════════════════════════════════════════════════ */
function ToastContainer({ toasts, onRemove }) {
  const types = {
    success: { bg: 'linear-gradient(135deg,#10b981,#34d399)', icon: '✅' },
    error: { bg: 'linear-gradient(135deg,#ef4444,#f87171)', icon: '❌' },
    info: { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: '💡' },
    warning: { bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', icon: '⚠️' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {toasts.map((toast) => {
        const { bg, icon } = types[toast.type] || types.info;
        return (
          <div
            key={toast.id}
            className="toast-enter"
            style={{
              background: bg,
              color: 'white',
              padding: '14px 20px',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 280,
              maxWidth: 400,
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <X size={14} color="white" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STANDALONE TOAST
═══════════════════════════════════════════════════════════════════════ */
export function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: { bg: 'linear-gradient(135deg,#10b981,#34d399)', icon: '✅' },
    error: { bg: 'linear-gradient(135deg,#ef4444,#f87171)', icon: '❌' },
    info: { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: '💡' },
    warning: { bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', icon: '⚠️' },
  };

  const { bg, icon } = types[type];

  return (
    <div
      className={visible ? 'toast-enter' : 'toast-exit'}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        background: bg,
        color: 'white',
        padding: '14px 20px',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 280,
        fontWeight: 600,
        fontSize: '0.875rem',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={14} color="white" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOOLTIP
═══════════════════════════════════════════════════════════════════════ */
export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false);

  const positions = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="tooltip-content"
          style={{
            position: 'absolute',
            ...positions[position],
            background: '#1e293b',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════════════════════════════════════ */
export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: 8,
            minWidth: 180,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, icon, danger }) {
  return (
    <button className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════════════════ */
export function Avatar({ src, name, size = 40, status }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const statusColors = {
    online: '#10b981',
    offline: '#94a3b8',
    busy: '#ef4444',
    away: '#f59e0b',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {src ? (
        <img src={src} alt={name} className="avatar" style={{ width: size, height: size }} />
      ) : (
        <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
          {initials}
        </div>
      )}
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: statusColors[status] || '#94a3b8',
            border: '2px solid white',
          }}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ avatars = [], max = 4, size = 36 }) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="avatar-group">
      {visible.map((a, i) => (
        <Avatar key={i} {...a} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className="avatar"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.35,
            background: '#e2e8f0',
            color: '#64748b',
            marginLeft: -10,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHECKBOX
═══════════════════════════════════════════════════════════════════════ */
export function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <label
      className="checkbox-wrapper"
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className={`checkbox-box ${checked ? 'checked' : ''}`}>{checked && <Check size={14} color="white" />}</div>
      {label && <span>{label}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   RADIO
═══════════════════════════════════════════════════════════════════════ */
export function Radio({ checked, onChange, label, disabled, name }) {
  return (
    <label
      className="radio-wrapper"
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div className={`radio-box ${checked ? 'checked' : ''}`}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
      </div>
      {label && <span>{label}</span>}
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => !disabled && onChange()}
        style={{ display: 'none' }}
      />
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SWITCH / TOGGLE
═══════════════════════════════════════════════════════════════════════ */
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: '0.875rem',
        color: '#374151',
      }}
    >
      <div className={`switch-track ${checked ? 'active' : ''}`} onClick={() => !disabled && onChange(!checked)}>
        <div className="switch-thumb" />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DIVIDER
═══════════════════════════════════════════════════════════════════════ */
export function Divider({ text }) {
  if (!text) return <div className="divider" />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════════════════ */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: danger ? 'linear-gradient(135deg,#fee2e2,#fecaca)' : 'linear-gradient(135deg,#ede9fe,#e0e7ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: danger ? '0 4px 16px rgba(239,68,68,0.2)' : '0 4px 16px rgba(99,102,241,0.2)',
          }}
        >
          {danger ? <AlertCircle size={24} color="#ef4444" /> : <AlertCircle size={24} color="#6366f1" />}
        </div>
        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{message || 'Are you sure you want to proceed?'}</p>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" onClick={onClose}>
          {cancelText}
        </button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMING SOON
═══════════════════════════════════════════════════════════════════════ */
export function ComingSoon({ title = 'This Page' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ textAlign: 'center', padding: 48, maxWidth: 380 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 40px rgba(99,102,241,0.18)',
            animation: 'bounceSoft 2.5s ease infinite',
          }}
        >
          <span style={{ fontSize: '2.6rem' }}>🚧</span>
        </div>
        <h2
          style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: '#1e293b',
            marginBottom: 10,
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7 }}>
          This feature is under construction. We're working hard to bring it to you soon.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {['#6366f1', '#8b5cf6', '#a855f7'].map((c, i) => (
            <div
              key={c}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: c,
                animation: `pulse 1.4s ease infinite ${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════════════════════════════════ */
export default {
  // Theme
  THEME,
  
  // Toast System
  ToastProvider,
  useToast,
  Toast,
  
  // Layout
  PageHeader,
  Card,
  SectionCard,
  Divider,
  
  // Data Display
  Badge,
  StatCard,
  TableWrapper,
  InfoRow,
  Avatar,
  AvatarGroup,
  ProgressBar,
  
  // Navigation
  Pagination,
  Tabs,
  
  // Forms
  FormField,
  SearchInput,
  SelectFilter,
  FilterBar,
  Checkbox,
  Radio,
  Switch,
  
  // Feedback
  Alert,
  EmptyState,
  LoadingSpinner,
  SkeletonCard,
  ComingSoon,
  
  // Overlays
  Modal,
  Tooltip,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  ConfirmDialog,
};