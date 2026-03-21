'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import { Users, GraduationCap, UserCheck, CreditCard, TrendingUp, Activity } from 'lucide-react';

function StatCard({ title, value, sub, color, icon, delay = 0 }) {
  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}`, display: 'flex', gap: 14, alignItems: 'center', animation: `fadeSlideUp 0.4s ease ${delay}s both`, cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
        <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: '0.68rem', color, fontWeight: 700, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbff' }}>
        <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.93rem', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export default function BranchAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attFilter, setAttFilter] = useState('');
  const [feeFilter, setFeeFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

 // ✅ KEEP ONLY THIS ONE (the fetchStats version with refreshKey)
const fetchStats = async () => {
  if (!user?.branch) return;
  setLoading(true);
  try {
    const r = await fetch(`/api/stats/branch-admin?branch=${encodeURIComponent(user.branch)}&branchId=${user.branchId || ''}&t=${Date.now()}`);
    const d = await r.json();
    if (d.success) setStats(d.data);
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchStats(); }, [user, refreshKey]);

 
  if (loading) return (
    <AppLayout requiredRole="branch-admin">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
        <div style={{ width: 42, height: 42, border: '3px solid #e2e8f0', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading dashboard...</p>
      </div>
    </AppLayout>
  );

  const s = stats || {};
  const attendPct = s.totalStudents ? Math.round((s.presentStudents || 0) / s.totalStudents * 100) : 0;
  const feePct    = s.totalFee     ? Math.round((s.paidFee || 0) / s.totalFee * 100) : 0;

  const classWise  = s.classWise  || [];
  const feeClsWise = s.feeClassWise || [];

  const filteredAtt = attFilter ? classWise.filter(c => c.class === attFilter) : classWise;
  const filteredFee = feeFilter ? feeClsWise.filter(c => c.class === feeFilter) : feeClsWise;
  const classOptions = [...new Set(classWise.map(c => c.class))];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout requiredRole="branch-admin">
      <div style={{ maxWidth: 1400 }}>

        {/* Header */}
        <div style={{ marginBottom: 26, animation: 'fadeSlideUp 0.4s ease' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>{greeting} 👋</h1>
      <p style={{ color: '#94a3b8', marginTop: 4, fontSize: '0.875rem' }}>{user?.branch} — Today's overview</p>
    </div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {/* Refresh button */}
      <button
        onClick={() => setRefreshKey(k => k + 1)}
        style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: '0.78rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
        🔄 Refresh
      </button>
     
    </div>
  </div>
</div>


        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          <StatCard title="Total Students"  value={s.totalStudents   || 0} color="#0891b2" icon={<Users size={20} />}        delay={0} />
          <StatCard title="Male"            value={s.maleStudents    || 0} color="#3b82f6" icon={<Users size={20} />}        delay={0.05} />
          <StatCard title="Female"          value={s.femaleStudents  || 0} color="#ec4899" icon={<Users size={20} />}        delay={0.1} />
          <StatCard title="Present Today"   value={s.presentStudents || 0} color="#10b981" icon={<UserCheck size={20} />}   delay={0.15} sub={`${attendPct}% rate`} />
          <StatCard title="Teachers"        value={s.totalTeachers   || 0} color="#f59e0b" icon={<GraduationCap size={20} />} delay={0.2} />
          <StatCard title="Fee Collected"   value={`₹${((s.paidFee||0)/1000).toFixed(0)}K`} color="#8b5cf6" icon={<CreditCard size={20} />} delay={0.25} sub={`${feePct}% collected`} />
        </div>

        {/* Row 1: Attendance + Teacher Attendance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 18 }} className="grid-r">
          <SectionCard title="Class-wise Student Attendance">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <select value={attFilter} onChange={e => setAttFilter(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.78rem', background: '#fafbff', color: '#374151', cursor: 'pointer' }}>
                <option value="">All Classes</option>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={filteredAtt} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '0.8rem' }} cursor={{ fill: 'rgba(8,145,178,0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[6,6,0,0]} />
                <Bar dataKey="absent"  name="Absent"  fill="#f87171" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

         </div>

        {/* Row 2: Pass/Fail + Fee */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 18 }} className="grid-r">
          <SectionCard title="Pass / Fail Summary">
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pass', value: s.passCount || 0 },
                      { name: 'Fail', value: s.failCount || 0 },
                    ]}
                    dataKey="value" cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{(s.passCount||0)+(s.failCount||0)}</div>
                <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              {[{ l:'Pass', v:s.passCount||0, c:'#10b981'},{ l:'Fail', v:s.failCount||0, c:'#f87171'}].map(d=>(
                <div key={d.l} style={{ textAlign:'center', padding:'8px 20px', borderRadius:10, background:`${d.c}10` }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:800, color:d.c }}>{d.v}</div>
                  <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{d.l}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Fee Collection Overview">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <select value={feeFilter} onChange={e => setFeeFilter(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.78rem', background: '#fafbff', color: '#374151', cursor: 'pointer' }}>
                <option value="">All Classes</option>
                {[...new Set(feeClsWise.map(c => c.class))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={filteredFee}>
                  <defs>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `₹${(v/1000).toFixed(1)}K`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '0.8rem' }} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="paid" name="Paid" stroke="#10b981" strokeWidth={2.5} fill="url(#gP)" dot={false} />
                  <Area type="monotone" dataKey="due"  name="Due"  stroke="#f59e0b" strokeWidth={2.5} fill="url(#gD)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'Total',     v: `₹${((s.totalFee||0)/100000).toFixed(2)}L`, c: '#0891b2', bg: '#e0f2fe' },
                  { l: 'Collected', v: `₹${((s.paidFee||0)/100000).toFixed(2)}L`,  c: '#10b981', bg: '#f0fdf4' },
                  { l: 'Due',       v: `₹${((s.dueFee||0)/100000).toFixed(2)}L`,   c: '#f59e0b', bg: '#fffbeb' },
                ].map(({ l, v, c, bg }) => (
                  <div key={l} style={{ background: bg, borderRadius: 10, padding: '10px 14px', borderLeft: `3px solid ${c}` }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{l}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .grid-r { }
        @media (max-width: 900px) { .grid-r { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}
