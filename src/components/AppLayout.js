'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, UserCheck,
  CreditCard, BarChart2, CalendarDays, LogIn, Building2,
  Bell, UserCircle, ClipboardList, BookOpen, PenSquare,
  Star, LogOut, Menu, X, ChevronRight, Sparkles,
  Calendar,    // ✅ ADD — no duplicate BookOpen
} from 'lucide-react';


/* ═══════════════════════════════════════════════════════════════════════
   NAV CONFIG
═══════════════════════════════════════════════════════════════════════ */
const NAV = {
  'super-admin': [
    { label: 'Dashboard',       href: '/super-admin/dashboard',         icon: LayoutDashboard },
    { label: 'Student Details', href: '/super-admin/students',          icon: Users },
    { label: 'Teacher Details', href: '/super-admin/teachers',          icon: GraduationCap },
    { label: 'Attendance',      href: '/super-admin/attendance',        icon: ClipboardList },
    { label: 'Fee Structure',   href: '/super-admin/fee',               icon: CreditCard },
    { label: 'Reports',         href: '/super-admin/reports',           icon: BarChart2 },
    { label: 'Events Calendar', href: '/super-admin/events',            icon: CalendarDays },
    { label: 'Admission',       href: '/super-admin/admission',         icon: LogIn },
    { label: 'Branch Creation', href: '/super-admin/branches',          icon: Building2 },
    { label: 'Profile',         href: '/super-admin/profile',           icon: UserCircle },
  ],
  'branch-admin': [
    { label: 'Dashboard',       href: '/branch-admin/dashboard',        icon: LayoutDashboard },
    { label: 'Student Details', href: '/branch-admin/students',         icon: Users },
    { label: 'Teacher Details', href: '/branch-admin/teachers',         icon: GraduationCap },
    { label: 'Attendance',      href: '/branch-admin/attendance',       icon: ClipboardList },
    { label: 'Fee Structure',   href: '/branch-admin/fee',              icon: CreditCard },
    { label: 'Reports',         href: '/branch-admin/reports',          icon: BarChart2 },
    { label: 'Events Calendar', href: '/branch-admin/events',           icon: CalendarDays },
    { label: 'Admission',       href: '/branch-admin/admission',        icon: LogIn },
    { label: 'Class Teacher',   href: '/branch-admin/class-teacher',    icon: Star },
    { label: 'Profile',         href: '/branch-admin/profile',          icon: UserCircle },
  ],
  'teacher-admin': [
    { label: 'Dashboard',       href: '/teacher-admin/dashboard',       icon: LayoutDashboard },
    { label: 'Mark Attendance', href: '/teacher-admin/mark-attendance', icon: PenSquare },
    { label: 'Attendance',      href: '/teacher-admin/attendance',      icon: ClipboardList },
    { label: 'Fee',             href: '/teacher-admin/fee',             icon: CreditCard },
    { label: 'Timetable', href: '/teacher-admin/timetable', icon: Calendar },
{ label: 'Syllabus',  href: '/teacher-admin/syllabus',  icon: BookOpen  },
    { label: 'Reports',         href: '/teacher-admin/reports',         icon: BarChart2 },
    { label: 'Events',          href: '/teacher-admin/events',          icon: CalendarDays },
    { label: 'Profile',         href: '/teacher-admin/profile',         icon: UserCircle },
  ],
  student: [
    { label: 'Dashboard',       href: '/student/dashboard',   icon: LayoutDashboard },
    { label: 'Timetable', href: '/student/timetable', icon: Calendar  },
{ label: 'Syllabus',  href: '/student/syllabus',  icon: BookOpen  },
    { label: 'My Results',      href: '/student/results',     icon: BookOpen },
    { label: 'Attendance',      href: '/student/attendance',  icon: ClipboardList },
    
    { label: 'Fee Details',     href: '/student/fee',         icon: CreditCard },
    { label: 'Events & Posts',  href: '/student/events',      icon: CalendarDays },
    { label: 'Profile',         href: '/student/profile',     icon: UserCircle },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   ROLE THEMING
═══════════════════════════════════════════════════════════════════════ */
const ROLE_THEME = {
  'super-admin': {
    gradient:  'linear-gradient(160deg, #0f0c29 0%, #302b63 45%, #24243e 100%)',
    accent:    '#818cf8',
    glow:      'rgba(99,102,241,0.5)',
    badge:     'linear-gradient(135deg,#6366f1,#8b5cf6)',
    label:     'Super Admin',
    dot:       '#818cf8',
  },
  'branch-admin': {
    gradient:  'linear-gradient(160deg, #0c1445 0%, #0a3d7e 45%, #0c5c9e 100%)',
    accent:    '#38bdf8',
    glow:      'rgba(14,165,233,0.5)',
    badge:     'linear-gradient(135deg,#0ea5e9,#06b6d4)',
    label:     'Branch Admin',
    dot:       '#38bdf8',
  },
  'teacher-admin': {
    gradient:  'linear-gradient(160deg, #052e16 0%, #065f3a 45%, #047857 100%)',
    accent:    '#34d399',
    glow:      'rgba(16,185,129,0.5)',
    badge:     'linear-gradient(135deg,#10b981,#34d399)',
    label:     'Teacher',
    dot:       '#34d399',
  },
  student: {
    gradient:  'linear-gradient(160deg, #2e1065 0%, #5b21b6 45%, #7c3aed 100%)',
    accent:    '#c084fc',
    glow:      'rgba(139,92,246,0.5)',
    badge:     'linear-gradient(135deg,#8b5cf6,#a855f7)',
    label:     'Student',
    dot:       '#c084fc',
  },
};

const REDIRECT_MAP = {
  'super-admin':   '/super-admin/dashboard',
  'branch-admin':  '/branch-admin/dashboard',
  'teacher-admin': '/teacher-admin/dashboard',
  student:         '/student/dashboard',
};

const normalizeRole = r => r === 'teacher' ? 'teacher-admin' : r;

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */
export default function AppLayout({ children, requiredRole }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!loading && mounted) {
      if (!user) { router.replace('/login'); return; }
      if (requiredRole) {
        const userRole = normalizeRole(user.role);
        const required = normalizeRole(requiredRole);
        if (userRole !== required) router.replace(REDIRECT_MAP[userRole] || '/login');
      }
    }
  }, [user, loading, mounted, requiredRole]);

  /* ── Loading Screen ── */
  if (!mounted || loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#f0f4ff 100%)' }}>
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        {/* Triple ring spinner */}
        <div style={{ position:'relative', width:56, height:56 }}>
          <div style={{ position:'absolute', inset:0, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
          <div style={{ position:'absolute', inset:8, border:'2px solid #ede9fe', borderBottomColor:'#a855f7', borderRadius:'50%', animation:'spinR 1.1s linear infinite' }} />
          <div style={{ position:'absolute', inset:18, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', animation:'pulse 1s ease infinite' }} />
        </div>
        <div>
          <p style={{ color:'#4338ca', fontSize:'0.9rem', fontWeight:700, margin:0 }}>SchoolERP</p>
          <p style={{ color:'#a5b4fc', fontSize:'0.75rem', marginTop:4 }}>Loading your workspace...</p>
        </div>
      </div>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes spinR { to { transform:rotate(-360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
      `}</style>
    </div>
  );

  if (!user) return null;

  const userRole = normalizeRole(user.role);
  const theme    = ROLE_THEME[userRole] || ROLE_THEME['super-admin'];
  const navItems = NAV[userRole] || [];
  const breadcrumb = pathname.split('/').filter(Boolean);

  const userInitial = user.name?.charAt(0)?.toUpperCase() || '?';

  /* ─────────────────────────────────────────────────────
     SIDEBAR CONTENT
  ───────────────────────────────────────────────────── */
  function SidebarContent() {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

        {/* ── Brand ── */}
        <div style={{ padding:'22px 18px 16px', position:'relative', overflow:'hidden' }}>
          {/* Decorative glow blob */}
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:theme.glow, filter:'blur(32px)', opacity:0.4, pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative' }}>
            <div style={{
              width:42, height:42, borderRadius:14,
              background:'rgba(255,255,255,0.15)',
              backdropFilter:'blur(8px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
              flexShrink:0, border:'1px solid rgba(255,255,255,0.15)',
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight:900, color:'white', fontSize:'1.05rem', letterSpacing:'-0.02em', lineHeight:1 }}>SchoolERP</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:theme.dot, boxShadow:`0 0 6px ${theme.glow}`, animation:'badgePulse 2s infinite' }} />
                <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>{theme.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── User Card ── */}
        <div style={{ margin:'0 12px 8px', background:'rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(4px)', position:'relative', overflow:'hidden' }}>
          {/* Subtle shimmer */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 50%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', gap:11, position:'relative' }}>
            {/* Avatar */}
            <div style={{
              width:38, height:38, borderRadius:'50%', flexShrink:0,
              background:theme.badge,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:900, color:'white', fontSize:'0.95rem',
              boxShadow:`0 4px 14px ${theme.glow}`,
              border:'2px solid rgba(255,255,255,0.25)',
              overflow:'hidden',
            }}>
              {user.profileImage
                ? <img src={user.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : userInitial}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontWeight:700, color:'white', fontSize:'0.83rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>{user.name}</div>
              <div style={{ fontSize:'0.64rem', color:'rgba(255,255,255,0.48)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {userRole === 'student'
                  ? `${user.class || ''}${user.section ? ' • ' + user.section : ''}${user.rollNo ? ' • ' + user.rollNo : ''}`
                  : (user.branch || user.username || theme.label)}
              </div>
            </div>
            <Sparkles size={13} color={theme.accent} style={{ flexShrink:0, opacity:0.7 }} />
          </div>
        </div>

        {/* ── Divider Label ── */}
        <div style={{ padding:'6px 20px 4px' }}>
          <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700 }}>Navigation</span>
        </div>

        {/* ── Nav Items ── */}
        <nav style={{ flex:1, overflowY:'auto', padding:'2px 10px 6px', scrollbarWidth:'none' }}>
          <style>{`.sidebar-nav::-webkit-scrollbar{display:none}`}</style>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:11, marginBottom:2,
                  textDecoration:'none', position:'relative', overflow:'hidden',
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.12)` : 'none',
                  border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                  transition:'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; } }}
              >
                {/* Active left glow */}
                {active && (
                  <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 2px 2px 0', background:theme.accent, boxShadow:`0 0 8px ${theme.glow}` }} />
                )}
                {/* Icon */}
                <div style={{
                  width:28, height:28, borderRadius:8, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: active ? `rgba(255,255,255,0.18)` : 'rgba(255,255,255,0.07)',
                  transition:'background 0.2s',
                }}>
                  <Icon size={14} color={active ? 'white' : 'rgba(255,255,255,0.65)'} />
                </div>
                {/* Label */}
                <span style={{
                  fontSize:'0.82rem', fontWeight: active ? 700 : 500,
                  color: active ? 'white' : 'rgba(255,255,255,0.65)',
                  flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  transition:'color 0.2s',
                }}>
                  {item.label}
                </span>
                {/* Active dot */}
                {active && (
                  <div style={{ width:6, height:6, borderRadius:'50%', background:theme.accent, boxShadow:`0 0 8px ${theme.glow}`, flexShrink:0, animation:'badgePulse 2s infinite' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding:'8px 10px 16px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:11,
              background:'rgba(239,68,68,0.15)',
              border:'1px solid rgba(239,68,68,0.2)',
              cursor:'pointer', color:'#fca5a5',
              transition:'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.28)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; e.currentTarget.style.color='#fecaca'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; e.currentTarget.style.color='#fca5a5'; }}
          >
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <LogOut size={14} color="#fca5a5" />
            </div>
            <span style={{ fontSize:'0.82rem', fontWeight:600 }}>Logout</span>
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     LAYOUT
  ───────────────────────────────────────────────────── */
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'linear-gradient(135deg,#f8f7ff 0%,#f0f4ff 50%,#fafbff 100%)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="desktop-sidebar" style={{
        width:240, flexShrink:0, background:theme.gradient,
        position:'sticky', top:0, height:'100vh', overflowY:'auto',
        boxShadow:'4px 0 30px rgba(0,0,0,0.15)', zIndex:30,
        scrollbarWidth:'none',
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          {/* Backdrop */}
          <div
            style={{ position:'absolute', inset:0, background:'rgba(5,5,20,0.65)', backdropFilter:'blur(6px)', animation:'fadeIn 0.22s ease' }}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside style={{
            position:'absolute', left:0, top:0, bottom:0, width:248,
            background:theme.gradient,
            display:'flex', flexDirection:'column',
            zIndex:201, animation:'slideInLeft 0.3s cubic-bezier(.34,1.2,.64,1)',
            boxShadow:'6px 0 32px rgba(0,0,0,0.3)',
          }}>
            {/* Close btn */}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'14px 14px 0' }}>
              <button onClick={() => setSidebarOpen(false)} style={{
                width:32, height:32, borderRadius:10,
                background:'rgba(255,255,255,0.15)',
                border:'1px solid rgba(255,255,255,0.2)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
              >
                <X size={15} color="white" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Column ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* ── Topbar ── */}
        <header style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'white',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? '#e0e7ff' : '#f4f4ff'}`,
          padding:'0 24px', height:60,
          display:'flex', alignItems:'center', gap:12,
          position:'sticky', top:0, zIndex:40,
          boxShadow: scrolled ? '0 4px 24px rgba(99,102,241,0.08)' : 'none',
          transition:'all 0.3s ease',
        }}>

          {/* Mobile Menu Btn */}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{
            background:'transparent', border:'none', cursor:'pointer',
            display:'none', padding:8, borderRadius:10, flexShrink:0,
            transition:'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <Menu size={21} color="#374151" />
          </button>

          {/* Breadcrumb */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:5, overflow:'hidden', minWidth:0 }}>
            {breadcrumb.map((seg, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, flexShrink: i < breadcrumb.length-1 ? 0 : 1, overflow:'hidden' }}>
                {i > 0 && <ChevronRight size={11} color="#c4b5fd" />}
                <span style={{
                  fontSize:'0.77rem',
                  fontWeight: i === breadcrumb.length-1 ? 700 : 400,
                  color: i === breadcrumb.length-1 ? '#1e293b' : '#94a3b8',
                  textTransform:'capitalize',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  background: i === breadcrumb.length-1
                    ? 'linear-gradient(135deg,#4338ca,#7c3aed)'
                    : 'none',
                  WebkitBackgroundClip: i === breadcrumb.length-1 ? 'text' : 'unset',
                  WebkitTextFillColor: i === breadcrumb.length-1 ? 'transparent' : 'unset',
                }}>
                  {seg.replace(/-/g, ' ')}
                </span>
              </span>
            ))}
          </div>

          {/* Right Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>

            {/* Notification Bell */}
         

            {/* Divider */}
            <div style={{ width:1, height:22, background:'linear-gradient(180deg,transparent,#e0e7ff,transparent)', flexShrink:0 }} />

            {/* Profile Pill */}
            <div ref={profileRef} style={{ position:'relative' }}>
              <button
                onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'5px 10px 5px 5px', borderRadius:40,
                  border:`1.5px solid ${profileOpen ? '#c4b5fd' : '#e0e7ff'}`,
                  background: profileOpen ? '#f5f3ff' : '#fafbff',
                  cursor:'pointer', transition:'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='#f5f3ff'; e.currentTarget.style.borderColor='#c4b5fd'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background='#fafbff'; e.currentTarget.style.borderColor='#e0e7ff'; e.currentTarget.style.transform='translateY(0)'; } }}
              >
                {/* Avatar */}
                <div style={{
                  width:30, height:30, borderRadius:'50%',
                  background:theme.badge,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:800, fontSize:'0.8rem',
                  overflow:'hidden', flexShrink:0,
                  boxShadow:`0 2px 10px ${theme.glow}`,
                }}>
                  {user.profileImage
                    ? <img src={user.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : userInitial}
                </div>
                <div style={{ textAlign:'left', minWidth:0 }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#1e293b', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>{user.name}</div>
                  <div style={{ fontSize:'0.62rem', color:'#94a3b8', fontWeight:500 }}>{theme.label}</div>
                </div>
                <ChevronRight size={12} color="#94a3b8" style={{ transform: profileOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s', flexShrink:0 }} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 10px)', right:0, width:220, zIndex:100,
                  background:'white', borderRadius:16,
                  boxShadow:'0 16px 50px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                  border:'1.5px solid #e0e7ff',
                  animation:'dropdownIn 0.22s cubic-bezier(.34,1.56,.64,1)',
                  overflow:'hidden',
                }}>
                  {/* User info */}
                  <div style={{ padding:'16px 16px 12px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:'1px solid #e0e7ff', textAlign:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:theme.badge, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.1rem', margin:'0 auto 8px', boxShadow:`0 4px 14px ${theme.glow}`, overflow:'hidden' }}>
                      {user.profileImage ? <img src={user.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : userInitial}
                    </div>
                    <p style={{ margin:0, fontWeight:800, fontSize:'0.875rem', color:'#1e293b' }}>{user.name}</p>
                    <p style={{ margin:'3px 0 0', fontSize:'0.68rem', color:'#94a3b8' }}>{user.email || user.username}</p>
                  </div>

                  {/* Menu items */}
                  {[
                    { icon:'👤', label:'My Profile', href:`/${userRole}/profile` },
                    { icon:'⚙️', label:'Settings', href:`/${userRole}/profile` },
                  ].map((item, i) => (
                    <Link key={i} href={item.href} onClick={() => setProfileOpen(false)} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
                      textDecoration:'none', color:'#374151', fontSize:'0.82rem', fontWeight:600,
                      borderBottom:'1px solid #f8f6ff', transition:'background 0.15s',
                      background:'white',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background='#fafbff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='white'; }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}

                  {/* Logout */}
                  <button
                    onClick={() => { logout(); router.replace('/login'); }}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:10,
                      padding:'10px 16px', background:'white',
                      border:'none', cursor:'pointer', color:'#ef4444',
                      fontSize:'0.82rem', fontWeight:700, transition:'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="main-content" style={{ flex:1, padding:'28px', overflowY:'auto' }}>
          <div style={{ animation:'pageFadeIn 0.35s ease', maxWidth:1440, margin:'0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Global Styles ── */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes spin          { to   { transform: rotate(360deg); } }
        @keyframes spinR         { to   { transform: rotate(-360deg); } }
        @keyframes fadeIn        { from { opacity: 0; }                               to { opacity: 1; } }
        @keyframes pageFadeIn    { from { opacity: 0; transform: translateY(10px); }  to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft   { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes dropdownIn    { from { opacity: 0; transform: scale(0.92) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeSlideUp   { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes scaleIn       { from { opacity: 0; transform: scale(0.88) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes countUp       { from { opacity: 0; transform: translateY(12px); }  to { opacity: 1; transform: translateY(0); } }
        @keyframes badgePulse    { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.55; transform:scale(0.88); } }
        @keyframes shimmer       { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes borderFlow    { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes floatUp       { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes pulse         { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.9); } }
        @keyframes bounceSoft    { 0%,100% { transform:translateY(0) rotate(0deg); } 30% { transform:translateY(-8px) rotate(-3deg); } }
        @keyframes spinReverse   { to { transform:rotate(-360deg); } }
        @keyframes progressFill  { from { width:0%; } to { width:var(--target-width,100%); } }
        @keyframes ripple        { 0% { transform:scale(0); opacity:0.6; } 100% { transform:scale(4); opacity:0; } }

        .card {
          background: white;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(99,102,241,0.05);
          border: 1px solid rgba(224,231,255,0.6);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }

        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 17px; border-radius: 10px; font-size: 0.82rem;
          font-weight: 700; cursor: pointer; border: none;
          transition: all 0.22s cubic-bezier(.34,1.56,.64,1);
          white-space: nowrap; text-decoration: none; letter-spacing: 0.01em;
        }
        .btn:hover   { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.13); }
        .btn:active  { transform: scale(0.96) translateY(0); }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .btn-primary:hover { background: linear-gradient(135deg, #4f46e5, #4338ca); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }

        .btn-outline {
          background: white; color: #374151;
          border: 1.5px solid #e0e7ff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .btn-outline:hover { background: #f5f3ff; border-color: #a5b4fc; color: #4338ca; box-shadow: 0 4px 14px rgba(99,102,241,0.15); }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white; box-shadow: 0 4px 14px rgba(239,68,68,0.3);
        }
        .btn-danger:hover { box-shadow: 0 8px 24px rgba(239,68,68,0.4); }

        .btn-green {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; box-shadow: 0 4px 14px rgba(16,185,129,0.3);
        }

        .input, .select {
          width: 100%; padding: 9px 13px; border-radius: 11px;
          border: 1.5px solid #e0e7ff; background: #fafbff;
          font-size: 0.84rem; color: #374151; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: inherit;
        }
        .input:focus, .select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          background: white;
        }
        .input::placeholder { color: #c4b5fd; }
        .select { cursor: pointer; }

        ::-webkit-scrollbar       { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: #8b5cf6; }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .main-content    { padding: 14px !important; }
        }

        @media print {
          .desktop-sidebar, .mobile-menu-btn, header, .no-print { display: none !important; }
          .main-content { padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
    </div>
  );
}
