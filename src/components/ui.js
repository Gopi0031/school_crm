'use client';
import { AlertCircle, Inbox, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL STYLES & ANIMATIONS
═══════════════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeSlideDown  { from { opacity:0; transform:translateY(-16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fadeSlideUp    { from { opacity:0; transform:translateY(20px)  scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fadeIn         { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn        { from { opacity:0; transform:scale(0.88) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
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
  @keyframes progressFill   { from { width:0%; } to { width:var(--target-width,100%); } }

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
  .btn-anim {
    transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
    position: relative; overflow: hidden;
  }
  .btn-anim:hover { transform: translateY(-2px) scale(1.03); }
  .btn-anim:active { transform: scale(0.96); }
  .btn-anim .ripple-el {
    position:absolute; border-radius:50%;
    background:rgba(255,255,255,0.35);
    animation: ripple 0.6s linear;
    pointer-events:none;
  }

  /* ── Modal ── */
  .modal-panel { animation: scaleIn 0.32s cubic-bezier(.34,1.56,.64,1); }
  .modal-backdrop { animation: fadeIn 0.22s ease; }

  /* ── Shimmer ── */
  .shimmer {
    background: linear-gradient(90deg,#f0f4ff 25%,#e8eeff 50%,#f0f4ff 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 10px;
  }

  /* ── Badge ── */
  .badge-el {
    display: inline-flex; align-items: center; gap: 5px;
    white-space: nowrap; letter-spacing: 0.03em;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .badge-el:hover { transform: scale(1.06); }
  .badge-dot { border-radius: 50%; display: inline-block; flex-shrink: 0; animation: pulse 2.2s infinite; }

  /* ── FilterBar ── */
  .filter-select {
    padding: 9px 13px; border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #fafbff;
    font-size: 0.83rem; cursor: pointer; color: #374151;
    outline: none; font-weight: 500;
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
    border-color: #6366f1; background: #eef2ff; color: #4338ca; font-weight: 700;
  }

  /* ── Tabs ── */
  .tab-pill {
    padding: 8px 18px; border-radius: 10px;
    font-size: 0.8rem; border: none; cursor: pointer;
    transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
    display: flex; align-items: center; gap: 7px; white-space: nowrap; font-weight: 500;
    position: relative;
  }
  .tab-pill:hover:not(.tab-active) { background: rgba(99,102,241,0.07); color: #4338ca; transform: translateY(-1px); }
  .tab-pill.tab-active { background: white; color: #1e293b; font-weight: 700; box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06); }

  /* ── Pagination btn ── */
  .pg-btn {
    width: 34px; height: 34px; border-radius: 9px; font-size: 0.79rem;
    border: 1.5px solid #e2e8f0; background: white; color: #374151;
    cursor: pointer; font-weight: 500;
    transition: all 0.18s cubic-bezier(.34,1.56,.64,1);
    display: flex; align-items: center; justify-content: center;
  }
  .pg-btn:hover:not(:disabled):not(.pg-active) {
    border-color: #6366f1; color: #4338ca;
    transform: translateY(-2px) scale(1.08);
    box-shadow: 0 4px 12px rgba(99,102,241,0.2);
  }
  .pg-btn.pg-active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-color: transparent; color: white; font-weight: 700;
    box-shadow: 0 4px 16px rgba(99,102,241,0.45);
    transform: translateY(-1px);
  }
  .pg-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  /* ── InfoRow ── */
  .info-row {
    padding: 10px 0;
    border-bottom: 1px solid #f4f6fb;
    animation: fadeSlideUp 0.3s ease both;
    transition: background 0.18s;
    border-radius: 6px;
  }
  .info-row:hover { background: #fafbff; padding-left: 8px; }

  /* ── Alert ── */
  .alert-el { animation: slideInRight 0.3s cubic-bezier(.34,1.56,.64,1); }

  /* ── Card ── */
  .card-animate { animation: fadeSlideUp 0.4s ease both; }

  /* ── Progress ── */
  .progress-fill { animation: progressFill 1.2s cubic-bezier(.4,0,.2,1) both; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .sc-wrap { padding: 14px 16px !important; }
    .modal-panel { border-radius: 16px !important; }
    .pg-btn { width: 30px; height: 30px; font-size: 0.73rem; }
    .filter-bar-wrap { flex-direction: column; align-items: stretch !important; }
    .filter-bar-wrap > * { width: 100% !important; max-width: 100% !important; }
  }
`;

function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE HEADER
═══════════════════════════════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, children }) {
  return (
    <>
      <GlobalStyles />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 30, flexWrap: 'wrap', gap: 14,
        animation: 'fadeSlideDown 0.45s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Accent line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 4, height: 28, borderRadius: 4,
              background: 'linear-gradient(180deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.45)',
              flexShrink: 0,
            }} />
            <h2 style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.65rem)',
              fontWeight: 900, color: '#0f172a',
              lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0,
              background: 'linear-gradient(135deg, #0f172a 0%, #4338ca 60%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{title}</h2>
          </div>
          {subtitle && (
            <p style={{
              color: '#94a3b8', fontSize: '0.83rem', margin: '0 0 0 14px',
              fontWeight: 500, animation: 'fadeSlideDown 0.45s ease 0.08s both',
            }}>{subtitle}</p>
          )}
        </div>

        {children && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
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
  Active:   { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Inactive: { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Pass:     { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Fail:     { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Paid:     { bg: 'linear-gradient(135deg,#d1fae5,#bbf7d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Pending:  { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', text: '#78350f', dot: '#f59e0b', shadow: 'rgba(245,158,11,0.3)' },
  Due:      { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Present:  { bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', text: '#065f46', dot: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  Absent:   { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', text: '#991b1b', dot: '#ef4444', shadow: 'rgba(239,68,68,0.3)' },
  Default:  { bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', text: '#475569', dot: '#94a3b8', shadow: 'rgba(148,163,184,0.3)' },
};

export function Badge({ children }) {
  const c = BADGE_THEMES[children] || BADGE_THEMES.Default;
  return (
    <span className="badge-el" style={{
      padding: '4px 11px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      background: c.bg, color: c.text,
      boxShadow: `0 2px 8px ${c.shadow}, 0 0 0 1px ${c.shadow}`,
    }}>
      <span className="badge-dot" style={{ width: 5, height: 5, background: c.dot, boxShadow: `0 0 6px ${c.shadow}` }} />
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════════════ */
export function StatCard({ title, value, sub, color = '#6366f1', icon, delay = 0 }) {
  // Map color to gradient
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
    <div className="sc-wrap card"
      style={{
        '--sc-gradient': grad,
        padding: '20px 22px',
        display: 'flex', gap: 16, alignItems: 'center',
        animationDelay: `${delay}ms`,
        background: 'white',
        border: '1px solid #f1f5f9',
      }}
    >
      {/* Icon bubble */}
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
        boxShadow: `0 8px 24px ${color}44`,
        animation: `floatUp 3s ease infinite ${delay}ms`,
      }}>
        {icon || <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{String(value)?.[0] || '#'}</span>}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 'clamp(1.4rem,3vw,1.7rem)', fontWeight: 900, color: '#0f172a',
          lineHeight: 1, letterSpacing: '-0.02em',
          animation: `countUp 0.6s cubic-bezier(.34,1.56,.64,1) ${delay + 120}ms both`,
        }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
        {sub && (
          <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: 4, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{sub}</div>
        )}
      </div>

      {/* Decorative orb */}
      <div style={{ position: 'absolute', right: -14, bottom: -14, width: 72, height: 72, borderRadius: '50%', background: `${color}0d`, pointerEvents: 'none' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════════════════════════ */
export function SectionCard({ title, children, action }) {
  return (
    <div className="card card-animate" style={{ padding: 0, overflow: 'hidden' }}>
      {title && (
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid #f4f6fb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #fafbff 0%, #f4f6fb 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg,#6366f1,#a855f7)' }} />
            <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.92rem', margin: 0 }}>{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TABLE WRAPPER
═══════════════════════════════════════════════════════════════════════ */
export function TableWrapper({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
      <div className="ui-tw">
        <table>{children}</table>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════════════════ */
export function Pagination({ total, page, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const dot = <span style={{ color: '#c4b5fd', fontSize: '0.85rem', padding: '0 3px', fontWeight: 700 }}>•••</span>;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 18, paddingTop: 16,
      borderTop: '1.5px solid #f0f2ff',
      flexWrap: 'wrap', gap: 12,
      animation: 'fadeSlideUp 0.35s ease',
    }}>
      {/* Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>{page}</span>
        </div>
        <span style={{ fontSize: '0.77rem', color: '#94a3b8', fontWeight: 500 }}>
          Showing{' '}
          <strong style={{ color: '#4338ca' }}>{Math.min((page-1)*perPage+1,total)}</strong>–
          <strong style={{ color: '#4338ca' }}>{Math.min(page*perPage,total)}</strong>
          {' '}of <strong style={{ color: '#4338ca' }}>{total}</strong>
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <button className="pg-btn" onClick={() => onChange(page-1)} disabled={page <= 1}>
          <ChevronLeft size={14} />
        </button>

        {start > 1 && (<>
          <button className={`pg-btn${1===page?' pg-active':''}`} onClick={() => onChange(1)}>1</button>
          {start > 2 && dot}
        </>)}

        {pages.map(p => (
          <button key={p} className={`pg-btn${p===page?' pg-active':''}`} onClick={() => onChange(p)}>{p}</button>
        ))}

        {end < totalPages && (<>
          {end < totalPages - 1 && dot}
          <button className={`pg-btn${totalPages===page?' pg-active':''}`} onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>)}

        <button className="pg-btn" onClick={() => onChange(page+1)} disabled={page >= totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════ */
export function EmptyState({ message = 'No data found', icon, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fadeSlideUp 0.5s ease' }}>
      {/* Icon ring */}
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 22px' }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(99,102,241,0.15)',
          animation: 'floatUp 3s ease infinite',
        }}>
          {icon || <Inbox size={32} color="#8b5cf6" />}
        </div>
        {/* Rings */}
        <div style={{ position:'absolute', inset:-8, borderRadius:'50%', border:'1.5px dashed #c4b5fd', animation:'spin 12s linear infinite', opacity:0.5 }} />
        <div style={{ position:'absolute', inset:-16, borderRadius:'50%', border:'1px dashed #ddd6fe', animation:'spinReverse 18s linear infinite', opacity:0.3 }} />
      </div>

      <p style={{ color: '#4338ca', fontSize: '0.98rem', fontWeight: 700, marginBottom: 6 }}>{message}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: action ? 20 : 0, lineHeight: 1.6 }}>
        No records to display right now.
      </p>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════════════════ */
export function Modal({ open, onClose, title, children, size = 'md', subtitle }) {
  if (!open) return null;
  const widths = { sm: 420, md: 580, lg: 760, xl: 980 };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px' }}>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{ position:'absolute', inset:0, background:'rgba(10,10,30,0.58)', backdropFilter:'blur(8px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="modal-panel" style={{
        position:'relative', background:'white',
        borderRadius: 22,
        boxShadow: '0 40px 100px rgba(0,0,0,0.28), 0 8px 24px rgba(99,102,241,0.12)',
        maxWidth: widths[size] || 580, width:'100%',
        maxHeight:'90vh', overflowY:'auto',
        display:'flex', flexDirection:'column',
        border: '1px solid rgba(99,102,241,0.1)',
      }}>
        {/* Gradient top strip */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b)', backgroundSize:'300% 100%', animation:'borderFlow 3s ease infinite', borderRadius:'22px 22px 0 0' }} />

        {/* Header */}
        <div style={{
          padding: '20px 26px 16px', borderBottom: '1px solid #f4f6fb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'white', zIndex: 10,
          borderRadius: '0',
        }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0f172a', lineHeight: 1.3, margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ color: '#94a3b8', fontSize: '0.79rem', marginTop: 4, margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            marginLeft: 14, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.15) rotate(90deg)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(239,68,68,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1) rotate(0deg)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(239,68,68,0.2)'; }}
          >
            <X size={14} color="#dc2626" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px 28px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FORM FIELD
═══════════════════════════════════════════════════════════════════════ */
export function FormField({ label, required, children, hint, error }) {
  return (
    <div style={{ animation: 'fadeSlideUp 0.32s ease both', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '0.76rem', fontWeight: 800, color: '#374151',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ width: 3, height: 12, borderRadius: 2, background: required ? 'linear-gradient(#6366f1,#8b5cf6)' : '#e2e8f0', display: 'inline-block', flexShrink: 0 }} />
        {label}
        {required && <span style={{ color: '#ef4444', fontSize: '0.9rem', lineHeight: 1 }}>*</span>}
      </label>
      {children}
      {hint  && <p style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{hint}</p>}
      {error && (
        <p style={{ fontSize: '0.71rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, margin: 0, background: '#fff5f5', padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INFO ROW
═══════════════════════════════════════════════════════════════════════ */
export function InfoRow({ label, value, highlight }) {
  return (
    <div className="info-row" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 8px 10px 0', borderBottom: '1px solid #f4f6fb', transition: 'all 0.18s', cursor: 'default' }}>
      <div style={{ fontSize: '0.63rem', color: '#a5b4fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: highlight || '#0f172a' }}>{value ?? '—'}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ALERT
═══════════════════════════════════════════════════════════════════════ */
export function Alert({ type = 'info', message, onClose }) {
  const themes = {
    info:    { bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '#bfdbfe', color: '#1d4ed8', icon: '💡', glow: 'rgba(59,130,246,0.15)' },
    success: { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#bbf7d0', color: '#15803d', icon: '✅', glow: 'rgba(16,185,129,0.15)' },
    error:   { bg: 'linear-gradient(135deg,#fff1f2,#fee2e2)', border: '#fecaca', color: '#dc2626', icon: '⚠️', glow: 'rgba(239,68,68,0.15)' },
    warning: { bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '#fde68a', color: '#b45309', icon: '🚨', glow: 'rgba(245,158,11,0.15)' },
  };
  const s = themes[type] || themes.info;
  return (
    <div className="alert-el" style={{
      background: s.bg, border: `1.5px solid ${s.border}`, color: s.color,
      borderRadius: 14, padding: '13px 17px',
      display: 'flex', alignItems: 'flex-start', gap: 11,
      fontSize: '0.84rem', fontWeight: 600, lineHeight: 1.55,
      boxShadow: `0 4px 20px ${s.glow}`,
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.65, padding: 0, display: 'flex', transition: 'opacity 0.2s, transform 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1.2) rotate(90deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='0.65'; e.currentTarget.style.transform='scale(1) rotate(0deg)'; }}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════════════════ */
export function FilterBar({ filters = [], onSearch, searchPlaceholder = 'Search...' }) {
  return (
    <div className="filter-bar-wrap" style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', animation:'fadeSlideUp 0.35s ease both' }}>
      {onSearch && <SearchInput onChange={onSearch} placeholder={searchPlaceholder} />}
      {filters.map((f, i) => (
        <SelectFilter key={i} value={f.value} onChange={f.onChange} options={f.options} placeholder={f.label} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SEARCH INPUT
═══════════════════════════════════════════════════════════════════════ */
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: '#fafbff', borderRadius: 12,
      padding: '8px 13px',
      border: '1.5px solid #e0e7ff',
      flex: 1, minWidth: 190, maxWidth: 320,
      transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    }}
      onFocusCapture={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)'; e.currentTarget.style.background='white'; }}
      onBlurCapture={e => { e.currentTarget.style.borderColor='#e0e7ff'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='#fafbff'; }}
    >
      <Search size={14} color="#a5b4fc" style={{ flexShrink:0 }} />
      <input
        style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.84rem', flex:1, color:'#374151', minWidth:0 }}
        placeholder={placeholder} value={value || ''} onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'none', cursor:'pointer', padding:'2px 4px', display:'flex', borderRadius:6, transition:'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
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
    <select
      className="filter-select"
      data-active={!!value}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map(opt =>
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════════════════════════════ */
export function Tabs({ tabs = [], active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
      borderRadius: 14, padding: 5,
      width: 'fit-content',
      animation: 'fadeSlideUp 0.35s ease',
      boxShadow: 'inset 0 2px 8px rgba(99,102,241,0.08)',
      border: '1px solid #e0e7ff',
    }}>
      {tabs.map(({ key, label, count, icon }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`tab-pill${active===key?' tab-active':''}`}
          style={{ color: active===key ? '#1e293b' : '#6366f1' }}
        >
          {icon && <span style={{ display:'flex', alignItems:'center' }}>{icon}</span>}
          {label}
          {count !== undefined && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px',
              borderRadius: 99, minWidth: 20, textAlign: 'center',
              background: active===key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e0e7ff',
              color: active===key ? 'white' : '#6366f1',
              boxShadow: active===key ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            }}>{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LOADING SPINNER
═══════════════════════════════════════════════════════════════════════ */
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:72, gap:18 }}>
      <div style={{ position:'relative', width:52, height:52 }}>
        {/* Outer ring */}
        <div style={{ width:'100%', height:'100%', border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
        {/* Middle ring */}
        <div style={{ position:'absolute', inset:7, border:'2px solid #ede9fe', borderBottomColor:'#a855f7', borderRadius:'50%', animation:'spinReverse 1.1s linear infinite' }} />
        {/* Inner dot */}
        <div style={{ position:'absolute', inset:17, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', animation:'pulse 1s ease infinite' }} />
      </div>
      <p style={{ color:'#a5b4fc', fontSize:'0.875rem', fontWeight:600, letterSpacing:'0.04em' }}>{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════════════════ */
export function SkeletonCard({ lines = 3, height }) {
  if (height) return <div className="shimmer" style={{ height, borderRadius: 14 }} />;
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:12, padding:20 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div className="shimmer" style={{ width:44, height:44, borderRadius:12, flexShrink:0 }} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          <div className="shimmer" style={{ height:14, width:'55%' }} />
          <div className="shimmer" style={{ height:10, width:'35%' }} />
        </div>
      </div>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="shimmer" style={{ height:11, width:`${90-i*12}%` }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════════════════════════ */
export function ProgressBar({ value = 0, max = 100, color = '#6366f1', height = 9, label, showPercent }) {
  const pct = max ? Math.min(Math.round(value / max * 100), 100) : 0;
  const gradients = {
    '#6366f1':  'linear-gradient(90deg,#6366f1,#8b5cf6)',
    '#10b981':  'linear-gradient(90deg,#10b981,#34d399)',
    '#ef4444':  'linear-gradient(90deg,#ef4444,#f87171)',
    '#f59e0b':  'linear-gradient(90deg,#f59e0b,#fbbf24)',
  };
  const grad = gradients[color] || `linear-gradient(90deg,${color},${color}bb)`;

  return (
    <div>
      {(label || showPercent) && (
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7, fontSize:'0.77rem', color:'#64748b' }}>
          {label && <span style={{ fontWeight:600 }}>{label}</span>}
          {showPercent && (
            <span style={{ fontWeight:800, background:grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div style={{ height, background:'#f0f2ff', borderRadius:99, overflow:'hidden', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{
          height:'100%', width:`${pct}%`, background:grad, borderRadius:99,
          transition:'width 1.2s cubic-bezier(.4,0,.2,1)',
          boxShadow:`0 2px 8px ${color}55`,
          position:'relative', overflow:'hidden',
        }}>
          {/* Shine */}
          <div style={{ position:'absolute', inset:'0 0 0 0', background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.3) 50%,transparent 100%)', backgroundSize:'200% 100%', animation:'shimmer 2s infinite' }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COMING SOON
═══════════════════════════════════════════════════════════════════════ */
export function ComingSoon({ title = 'This Page' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:420, animation:'fadeIn 0.4s ease' }}>
      <div style={{ textAlign:'center', padding:48, maxWidth:380 }}>
        <div style={{
          width:96, height:96, borderRadius:28, margin:'0 auto 24px',
          background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 16px 40px rgba(99,102,241,0.18)',
          animation:'bounceSoft 2.5s ease infinite',
        }}>
          <span style={{ fontSize:'2.6rem' }}>🚧</span>
        </div>
        <h2 style={{ fontSize:'1.45rem', fontWeight:900, color:'#1e293b', marginBottom:10, background:'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          {title}
        </h2>
        <p style={{ color:'#94a3b8', fontSize:'0.875rem', lineHeight:1.7 }}>
          This feature is under construction. We're working hard to bring it to you soon.
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:20 }}>
          {['#6366f1','#8b5cf6','#a855f7'].map((c, i) => (
            <div key={c} style={{ width:8, height:8, borderRadius:'50%', background:c, animation:`pulse 1.4s ease infinite ${i*200}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
