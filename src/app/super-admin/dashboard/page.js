'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { StatCard, SectionCard } from '@/components/ui';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { Users, GraduationCap, Building2, TrendingUp, CreditCard, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/super-admin')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout requiredRole="super-admin">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'62vh', gap:18 }}>
        <div style={{ position:'relative', width:52, height:52 }}>
          <div style={{ position:'absolute', inset:0, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
          <div style={{ position:'absolute', inset:8, border:'2px solid #ede9fe', borderBottomColor:'#a855f7', borderRadius:'50%', animation:'spinR 1.1s linear infinite' }} />
          <div style={{ position:'absolute', inset:18, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', animation:'pulse 1s ease infinite' }} />
        </div>
        <p style={{ color:'#a5b4fc', fontSize:'0.875rem', fontWeight:600 }}>Loading dashboard...</p>
        <style>{`
          @keyframes spin  { to { transform:rotate(360deg); } }
          @keyframes spinR { to { transform:rotate(-360deg); } }
          @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        `}</style>
      </div>
    </AppLayout>
  );

  const s          = stats || {};
  const feePct     = s.totalFee    ? Math.round(s.paidFee / s.totalFee * 100) : 0;
  const attendPct  = s.totalStudents ? Math.round((s.presentToday || 0) / s.totalStudents * 100) : 0;
  const branchData = s.branchStats || [];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? '🌤️ Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  /* ── Custom Tooltip ── */
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'white', borderRadius:14, padding:'10px 14px', boxShadow:'0 8px 30px rgba(99,102,241,0.15)', border:'1.5px solid #e0e7ff', fontSize:'0.78rem' }}>
        <p style={{ fontWeight:700, color:'#1e293b', marginBottom:6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color:p.color, margin:'2px 0', fontWeight:600 }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  };

  return (
    <AppLayout requiredRole="super-admin">
      <div style={{ maxWidth:1440 }}>

        {/* ── Hero Header ── */}
        <div style={{ marginBottom:28, animation:'fadeSlideUp 0.5s ease' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 style={{ fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1, background:'linear-gradient(135deg,#0f172a,#4338ca,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {greeting}
              </h1>
              <p style={{ color:'#94a3b8', marginTop:6, fontSize:'0.875rem', fontWeight:500 }}>
                Here's what's happening across all your branches today.
              </p>
            </div>

            {/* Fee rate badge */}
            <div style={{ position:'relative', overflow:'hidden', borderRadius:18, padding:'16px 24px', background:'linear-gradient(135deg,#4338ca,#6366f1,#8b5cf6)', color:'white', textAlign:'right', boxShadow:'0 8px 30px rgba(99,102,241,0.4)', minWidth:160 }}>
              {/* Decorative orbs */}
              <div style={{ position:'absolute', top:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
              <div style={{ position:'absolute', bottom:-10, right:-10, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
              <div style={{ position:'relative' }}>
                <div style={{ fontSize:'0.65rem', opacity:0.75, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>Fee Collection Rate</div>
                <div style={{ fontSize:'2.4rem', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.03em' }}>{feePct}%</div>
                <div style={{ fontSize:'0.68rem', opacity:0.65, fontWeight:600 }}>of total fees</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:16, marginBottom:26 }}>
          {[
            { title:'Total Branches', value:s.totalBranches||0, color:'#6366f1', icon:<Building2 size={20} />,    delay:0   },
            { title:'Total Students', value:s.totalStudents||0, color:'#3b82f6', icon:<Users size={20} />,        delay:60  },
            { title:'Total Teachers', value:s.totalTeachers||0, color:'#f59e0b', icon:<GraduationCap size={20} />,delay:120 },
            { title:'Present Today',  value:s.presentToday||0,  color:'#10b981', icon:<TrendingUp size={20} />,   delay:180, sub:`${attendPct}% attendance` },
            { title:'Fee Collected',  value:`₹${((s.paidFee||0)/100000).toFixed(1)}L`, color:'#8b5cf6', icon:<CreditCard size={20} />, delay:240, sub:`${feePct}% of total` },
            { title:'Fee Due',        value:`₹${((s.dueFee||0)/100000).toFixed(1)}L`,  color:'#ef4444', icon:<Activity size={20} />,   delay:300 },
          ].map((c, i) => (
            <StatCard key={i} title={c.title} value={c.value} sub={c.sub} color={c.color} icon={c.icon} delay={c.delay} />
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20, marginBottom:20 }} className="dash-grid">

          {/* Branch Attendance Bar */}
          <SectionCard title="Branch-wise Attendance Today">
            {branchData.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#c4b5fd', fontSize:'0.875rem', fontWeight:600 }}>
                📊 No attendance data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={branchData} barSize={20} barCategoryGap="38%">
                  <defs>
                    <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ff" vertical={false} />
                  <XAxis dataKey="branch" tick={{ fontSize:11, fill:'#94a3b8', fontWeight:500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(99,102,241,0.05)', radius:8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.78rem', paddingTop:12 }} />
                  <Bar dataKey="present" name="Present" fill="url(#gradPresent)" radius={[7,7,0,0]} />
                  <Bar dataKey="absent"  name="Absent"  fill="url(#gradAbsent)"  radius={[7,7,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          {/* Pass/Fail Donut */}
          <SectionCard title="Pass / Fail Summary">
            <div style={{ position:'relative' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <defs>
                    <linearGradient id="gradPass" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gradFail" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[{ name:'Pass', value:s.passCount||0 },{ name:'Fail', value:s.failCount||0 }]}
                    dataKey="value" cx="50%" cy="50%"
                    innerRadius={58} outerRadius={86} paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={{ stroke:'#c4b5fd', strokeWidth:1 }}
                  >
                    <Cell fill="url(#gradPass)" />
                    <Cell fill="url(#gradFail)" />
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, background:'linear-gradient(135deg,#4338ca,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>
                  {(s.passCount||0)+(s.failCount||0)}
                </div>
                <div style={{ fontSize:'0.6rem', color:'#a5b4fc', fontWeight:800, letterSpacing:'0.1em', marginTop:3 }}>TOTAL</div>
              </div>
            </div>
            {/* Summary pills */}
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:12 }}>
              {[{ l:'Pass', v:s.passCount||0, bg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', c:'#065f46' },
                { l:'Fail', v:s.failCount||0, bg:'linear-gradient(135deg,#fee2e2,#fecaca)', c:'#991b1b' }].map(d => (
                <div key={d.l} style={{ textAlign:'center', padding:'10px 22px', borderRadius:14, background:d.bg, flex:1 }}>
                  <div style={{ fontSize:'1.3rem', fontWeight:900, color:d.c }}>{d.v}</div>
                  <div style={{ fontSize:'0.68rem', color:d.c, fontWeight:700, opacity:0.75, textTransform:'uppercase', letterSpacing:'0.06em' }}>{d.l}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── Fee Overview ── */}
        <SectionCard title="Fee Collection Overview">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:26, alignItems:'center' }} className="dash-grid">
            {/* Area Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[
                { month:'Apr', collected:(s.paidFee||0)*0.10, due:(s.dueFee||0)*0.20 },
                { month:'Jun', collected:(s.paidFee||0)*0.30, due:(s.dueFee||0)*0.50 },
                { month:'Aug', collected:(s.paidFee||0)*0.50, due:(s.dueFee||0)*0.70 },
                { month:'Oct', collected:(s.paidFee||0)*0.70, due:(s.dueFee||0)*0.90 },
                { month:'Dec', collected:(s.paidFee||0)*0.90, due:(s.dueFee||0)*0.95 },
                { month:'Mar', collected:s.paidFee||0,        due:s.dueFee||0        },
              ]}>
                <defs>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ff" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} formatter={v => `₹${(v/100000).toFixed(2)}L`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.78rem' }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2.5} fill="url(#gC)" dot={false} />
                <Area type="monotone" dataKey="due"       name="Due"       stroke="#f59e0b" strokeWidth={2.5} fill="url(#gD)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Fee summary + progress */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { l:'Total Fee',  v:`₹${((s.totalFee||0)/100000).toFixed(2)}L`, c:'#6366f1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)' },
                { l:'Collected',  v:`₹${((s.paidFee||0)/100000).toFixed(2)}L`,  c:'#10b981', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
                { l:'Due',        v:`₹${((s.dueFee||0)/100000).toFixed(2)}L`,   c:'#f59e0b', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)' },
              ].map(({ l, v, c, bg }, i) => (
                <div key={l} style={{ background:bg, borderRadius:14, padding:'13px 17px', borderLeft:`3px solid ${c}`, animation:`fadeSlideUp 0.4s ease ${i*80}ms both`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</div>
                  <div style={{ fontSize:'1.15rem', fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}

              {/* Progress */}
              <div style={{ background:'#f8f7ff', borderRadius:14, padding:'13px 17px', border:'1px solid #e0e7ff' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9 }}>
                  <span style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Collection Progress</span>
                  <span style={{ fontSize:'0.82rem', fontWeight:900, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{feePct}%</span>
                </div>
                <div style={{ background:'#e0e7ff', borderRadius:99, height:9, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#10b981,#6366f1,#8b5cf6)', width:`${feePct}%`, transition:'width 1.2s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 2px 10px rgba(99,102,241,0.4)', position:'relative' }}>
                    {/* Shimmer */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)', backgroundSize:'200% 100%', animation:'shimmer 2s infinite', borderRadius:99 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <style jsx global>{`
        @keyframes spin       { to { transform:rotate(360deg); } }
        @keyframes spinR      { to { transform:rotate(-360deg); } }
        @keyframes pulse      { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes fadeSlideUp{ from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @media (max-width:900px) { .dash-grid { grid-template-columns:1fr !important; } }
      `}</style>
    </AppLayout>
  );
}
