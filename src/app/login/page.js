  'use client';
  import { useState, useEffect, useRef } from 'react';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/context/AuthContext';
  import { GraduationCap, Eye, EyeOff, LogIn, Sparkles, BookOpen, Users, Award, Bell } from 'lucide-react';

  /* ── Floating particle ─────────────────────────── */
  function Particle({ style }) {
    return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />;
  }

  /* ── Floating icon card ────────────────────────── */
  function FloatingCard({ icon, label, color, style }) {
    return (
      <div style={{
        position: 'absolute', display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '8px 14px', backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 10px ${color}22`,
        animation: 'floatY 4s ease-in-out infinite',
        ...style,
      }}>
        <div style={{ color, display: 'flex' }}>{icon}</div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    );
  }

  export default function LoginPage() {
    const { login }  = useAuth();
    const router     = useRouter();
    const canvasRef  = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd,  setShowPwd]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [mounted,  setMounted]  = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ── Canvas star field ───────────────────────── */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx    = canvas.getContext('2d');
      let raf;

      const resize = () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener('resize', resize);

      const stars = Array.from({ length: 120 }, () => ({
        x:    Math.random() * window.innerWidth,
        y:    Math.random() * window.innerHeight,
        r:    Math.random() * 1.4 + 0.3,
        a:    Math.random(),
        da:   (Math.random() - 0.5) * 0.008,
        speed: Math.random() * 0.15 + 0.05,
      }));

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
          s.y -= s.speed;
          s.a += s.da;
          if (s.a < 0) s.da = Math.abs(s.da);
          if (s.a > 1) s.da = -Math.abs(s.da);
          if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${s.a * 0.7})`;
          ctx.fill();
        });
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      const redirects = {
        'super-admin':   '/super-admin/dashboard',
        'branch-admin':  '/branch-admin/dashboard',
        'teacher-admin': '/teacher-admin/dashboard',
        'teacher':       '/teacher-admin/dashboard',  // ✅ safety
        'student':       '/student/dashboard',
      };

      const dest = redirects[data.user?.role];

      // ✅ Guard: if role is unknown, show error instead of redirect loop
      if (!dest) {
        setError(`Unknown role "${data.user?.role}". Contact admin.`);
        setLoading(false);
        return;
      }

      login(data.user);
      router.replace(dest);
      // ⚠️ Don't call setLoading(false) here — page is navigating away

    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };



  

    return (
      <div style={{ minHeight: '100vh', background: '#060c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden', fontFamily: 'inherit' }}>

        {/* Animated star canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

        {/* Deep glow orbs */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.22) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '30%', left: '60%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />


        {/* Floating particles */}
        

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28, animation: mounted ? 'fadeSlideDown 0.7s ease' : 'none' }}>
            {/* Animated logo ring */}
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 14px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #6366f1)', animation: 'spinRing 4s linear infinite', opacity: 0.7 }} />
              <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: '#060c1a' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={28} color="#818cf8" />
              </div>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
              School<span style={{ background: 'linear-gradient(90deg, #818cf8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ERP</span>
            </div>
            <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Smart School Management
            </p>

            {/* Animated underline */}
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)', margin: '10px auto 0', borderRadius: 2, animation: 'pulseBar 2s ease-in-out infinite' }} />
          </div>

          {/* Glass login card */}
          <div style={{
            background: 'rgba(15,20,40,0.7)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 22,
            padding: '34px 30px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px rgba(99,102,241,0.08) inset',
            animation: mounted ? 'fadeSlideUp 0.7s ease' : 'none',
          }}>

            {/* Card top accent line */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)', borderRadius: 1 }} />

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                Welcome back 👋
              </h2>
              <p style={{ color: '#475569', fontSize: '0.81rem' }}>
                Sign in to continue to your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} autoComplete="off">

              {/* Username */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4f46e5', display: 'flex', pointerEvents: 'none' }}>
                    <Users size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: 'white', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; e.target.style.background = 'rgba(99,102,241,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4f46e5', display: 'flex', pointerEvents: 'none' }}>
                    <Award size={15} />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '11px 40px 11px 38px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: 'white', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; e.target.style.background = 'rgba(99,102,241,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2 }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: '0.82rem', marginBottom: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>⚠</span> {error}
                </div>
              )}

              {/* Submit */}
              <button
    type="submit"
    disabled={loading}
    style={{
      width: '100%', padding: '13px', borderRadius: 11, border: 'none',
      // ── Split shorthand into individual properties ──────────
      backgroundColor: loading ? 'rgba(99,102,241,0.35)' : 'transparent',
      backgroundImage: loading ? 'none' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
      backgroundSize: '200% 200%',
      backgroundPosition: '0% 50%',
      // ───────────────────────────────────────────────────────
      color: 'white', fontWeight: 700, fontSize: '0.95rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset',
      transition: 'all 0.25s', fontFamily: 'inherit',
      animation: !loading ? 'gradientShift 3s ease infinite' : 'none',
    }}
    onMouseEnter={e => {
      if (!loading) {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.55), 0 0 0 1px rgba(255,255,255,0.1) inset';
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 24px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.1) inset';
    }}
  >
    {loading ? (
      <>
        <div style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Signing in...
      </>
    ) : (
      <><LogIn size={17} /> Sign In to Dashboard</>
    )}
  </button>

            </form>
          </div>


          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.7rem', color: '#1e293b' }}>
            © {new Date().getFullYear()} SchoolERP • Secure Management System
          </p>
        </div>

        <style>{`
          @keyframes spin         { to   { transform: rotate(360deg); } }
          @keyframes spinRing     { to   { transform: rotate(360deg); } }
          @keyframes pulseBar     { 0%,100% { opacity: 0.5; transform: scaleX(0.8); } 50% { opacity: 1; transform: scaleX(1.2); } }
          @keyframes floatY       { 0%,100% { transform: translateY(0px);  } 50% { transform: translateY(-12px); } }
          @keyframes floatParticle{ 0%,100% { transform: translateY(0px) scale(1);   opacity: 0.6; } 50% { transform: translateY(-20px) scale(1.3); opacity: 1; } }
          @keyframes fadeSlideDown{ from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeSlideUp  { from { opacity: 0; transform: translateY(20px);  } to { opacity: 1; transform: translateY(0); } }
          @keyframes gradientShift{ 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
          ::placeholder { color: #334155 !important; }
          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #0c1226 inset !important;
            -webkit-text-fill-color: white !important;
          }
          @media (max-width: 768px) {
            .float-card { display: none !important; }
          }
        `}</style>
      </div>
    );
  }
