'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  PageHeader, FilterBar, Badge, TableWrapper,
  Pagination, EmptyState, Modal, InfoRow, StatCard, LoadingSpinner,
} from '@/components/ui';
import { Printer, Download, Bell, Eye, CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const CLASS_OPTIONS   = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
const SECTION_OPTIONS = ['A','B','C','D','E'];
const YEAR_OPTIONS    = ['2023-24','2024-25','2025-26'];

function getFeeStatus(s) {
  if (!s.totalFee || s.totalFee === 0) return 'N/A';
  if (s.paidFee >= s.totalFee) return 'Paid';
  if (!s.paidFee || s.paidFee === 0) return 'Due';
  return 'Pending';
}

const STATUS_STYLE = {
  Paid:    { bg:'linear-gradient(135deg,#dcfce7,#bbf7d0)', color:'#15803d', border:'#86efac' },
  Due:     { bg:'linear-gradient(135deg,#fee2e2,#fecaca)', color:'#dc2626', border:'#fca5a5' },
  Pending: { bg:'linear-gradient(135deg,#fef9c3,#fef08a)', color:'#854d0e', border:'#fde047' },
  'N/A':   { bg:'#f1f5f9',                                 color:'#94a3b8', border:'#e2e8f0' },
};

/* Custom Recharts tooltip */
const FeeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', borderRadius:14, padding:'10px 16px', boxShadow:'0 8px 30px rgba(99,102,241,0.15)', border:'1.5px solid #e0e7ff', fontSize:'0.78rem' }}>
      <p style={{ fontWeight:800, color:'#1e293b', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'2px 0', fontWeight:600 }}>
          {p.name}: <strong>₹{(p.value/100000).toFixed(2)}L</strong>
        </p>
      ))}
    </div>
  );
};

export default function SuperAdminFee() {
  const [students,  setStudents]  = useState([]);
  const [branches,  setBranches]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [branch,    setBranch]    = useState('');
  const [cls,       setCls]       = useState('');
  const [sec,       setSec]       = useState('');
  const [year,      setYear]      = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);
  const [notify,    setNotify]    = useState(null);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branch) params.set('branch', branch);
      if (cls)    params.set('class', cls);
      if (sec)    params.set('section', sec);
      if (year)   params.set('academicYear', year);
      const [sRes, bRes] = await Promise.all([fetch(`/api/students?${params}`), fetch('/api/branches')]);
      const [sData, bData] = await Promise.all([sRes.json(), bRes.json()]);
      if (sData.success) setStudents(sData.data);
      if (bData.success) setBranches(bData.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [branch, cls, sec, year]);

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);

  /* ── Stats ── */
  const totalFeeAll  = filtered.reduce((a,s) => a+(s.totalFee||0), 0);
  const totalPaid    = filtered.reduce((a,s) => a+(s.paidFee||0), 0);
  const totalDue     = totalFeeAll - totalPaid;
  const paidStudents = filtered.filter(s => getFeeStatus(s)==='Paid').length;
  const feePct       = totalFeeAll ? Math.round(totalPaid/totalFeeAll*100) : 0;

  /* ── Branch chart data ── */
  const branchFeeMap = {};
  students.forEach(s => {
    const b = s.branch || 'Unknown';
    if (!branchFeeMap[b]) branchFeeMap[b] = { branch:b, paid:0, pending:0 };
    branchFeeMap[b].paid    += s.paidFee||0;
    branchFeeMap[b].pending += Math.max(0,(s.totalFee||0)-(s.paidFee||0));
  });
  const feeGraph = Object.values(branchFeeMap);

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Fee Structure" subtitle="Fee management across all branches">
        <button className="btn btn-outline" onClick={() => window.print()}><Printer size={15} /> Print</button>
        <button className="btn btn-outline"><Download size={15} /> Export</button>
        <button className="btn btn-outline"><Bell size={15} /> Notify All</button>
      </PageHeader>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))', gap:16, marginBottom:20 }}>
        {[
          { title:'Total Fee',     value:`₹${(totalFeeAll/100000).toFixed(1)}L`, color:'#6366f1', icon:<CreditCard size={18} /> },
          { title:'Collected',     value:`₹${(totalPaid/100000).toFixed(1)}L`,   color:'#10b981', icon:<CheckCircle2 size={18} /> },
          { title:'Pending Due',   value:`₹${(totalDue/100000).toFixed(1)}L`,    color:'#ef4444', icon:<AlertCircle size={18} /> },
          { title:'Paid Students', value:paidStudents,                            color:'#f59e0b', icon:<TrendingUp size={18} /> },
        ].map((c,i) => (
          <StatCard key={i} title={c.title} value={c.value} color={c.color} icon={c.icon} />
        ))}
      </div>

      {/* ── Collection progress banner ── */}
      <div style={{ background:'linear-gradient(135deg,#4338ca,#6366f1,#8b5cf6)', borderRadius:18, padding:'20px 26px', marginBottom:20, color:'white', position:'relative', overflow:'hidden', boxShadow:'0 8px 30px rgba(99,102,241,0.35)' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
        <div style={{ position:'absolute', bottom:-20, left:200, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:14, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:'0.68rem', opacity:0.75, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Overall Collection Rate</div>
            <div style={{ fontSize:'2.5rem', fontWeight:900, lineHeight:1, letterSpacing:'-0.03em' }}>{feePct}%</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.7rem', opacity:0.7 }}>Collected / Total</div>
            <div style={{ fontWeight:800, fontSize:'1.1rem' }}>₹{(totalPaid/100000).toFixed(2)}L / ₹{(totalFeeAll/100000).toFixed(2)}L</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:99, height:10, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#a7f3d0,white)', width:`${feePct}%`, transition:'width 1.2s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 2px 10px rgba(255,255,255,0.4)' }} />
        </div>
      </div>

      {/* ── Branch-wise Chart ── */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <h3 style={{ fontWeight:800, color:'#1e293b', margin:0 }}>Branch-wise Fee Status</h3>
            <p style={{ color:'#a5b4fc', fontSize:'0.72rem', margin:'3px 0 0', fontWeight:500 }}>💡 Click a Paid bar to filter by branch</p>
          </div>
          {branch && (
            <button className="btn btn-outline" style={{ fontSize:'0.75rem' }} onClick={() => setBranch('')}>
              ✕ Clear filter
            </button>
          )}
        </div>
        {feeGraph.length === 0 ? (
          <EmptyState message="No fee data yet" icon={<CreditCard size={28} color="#a5b4fc" />} />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={feeGraph} barSize={22} barCategoryGap="35%">
              <defs>
                <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2ff" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize:11, fill:'#94a3b8', fontWeight:500 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<FeeTooltip />} cursor={{ fill:'rgba(99,102,241,0.05)', radius:8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:'0.78rem', paddingTop:10 }} />
<Bar dataKey="paid"    name="Paid"    fill="url(#gPaid)"    radius={[7,7,0,0]} onClick={e => { setBranch(e.branch); setPage(1); }} style={{ cursor:'pointer' }} />
<Bar dataKey="pending" name="Pending" fill="url(#gPending)" radius={[7,7,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <FilterBar
          filters={[
            { label:'All Branches',  value:branch, onChange:v=>{ setBranch(v); setPage(1); }, options:branches.map(b=>b.name) },
            { label:'Academic Year', value:year,   onChange:v=>{ setYear(v);   setPage(1); }, options:YEAR_OPTIONS },
            { label:'All Classes',   value:cls,    onChange:v=>{ setCls(v);    setPage(1); }, options:CLASS_OPTIONS },
            { label:'All Sections',  value:sec,    onChange:v=>{ setSec(v);    setPage(1); }, options:SECTION_OPTIONS },
          ]}
          onSearch={v=>{ setSearch(v); setPage(1); }}
          searchPlaceholder="Search student or roll no..."
        />
      </div>

      {/* ── Table ── */}
      <div className="card">
        {loading ? <LoadingSpinner text="Loading fee records..." /> : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <th>S.No</th><th>Status</th><th>Roll No</th><th>Student Name</th>
                  <th>Parent</th><th>Phone</th><th>Total Fee</th>
                  <th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={11}><EmptyState message={search?`No results for "${search}"`:'No students found'} /></td></tr>
                ) : paginated.map((s, i) => {
                  const status = getFeeStatus(s);
                  const ss = STATUS_STYLE[status] || STATUS_STYLE['N/A'];
                  return (
                    <tr key={s._id} style={{ transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ color:'#94a3b8', fontWeight:600 }}>{(page-1)*perPage+i+1}</td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'0.7rem', fontWeight:700, background:ss.bg, color:ss.color, border:`1px solid ${ss.border}` }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ fontWeight:700, color:'#6366f1', fontFamily:'monospace', fontSize:'0.82rem' }}>{s.rollNo}</td>
                      <td>
                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:'0.84rem' }}>{s.name}</div>
                        <div style={{ fontSize:'0.69rem', color:'#94a3b8' }}>{s.class} — {s.section}</div>
                      </td>
                      <td style={{ color:'#64748b', fontSize:'0.83rem' }}>{s.parentName}</td>
                      <td style={{ color:'#64748b', fontSize:'0.83rem' }}>{s.phone}</td>
                      <td style={{ fontWeight:800, color:'#1e293b' }}>₹{(s.totalFee||0).toLocaleString()}</td>
                      {[s.term1, s.term2, s.term3].map((amt, ti) => (
                        <td key={ti}>
                          <span style={{ fontWeight:700, color:(amt||0)>0?'#059669':'#dc2626', fontSize:'0.83rem' }}>
                            ₹{(amt||0).toLocaleString()}
                          </span>
                        </td>
                      ))}
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn btn-primary" style={{ padding:'5px 9px', fontSize:'0.72rem' }} onClick={() => setSelected(s)}>
                            <Eye size={12} />
                          </button>
                          <button className="btn btn-outline" style={{ padding:'5px 9px', fontSize:'0.72rem', borderColor:'#e0e7ff' }} onClick={() => setNotify(s)}>
                            <Bell size={12} color="#6366f1" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrapper>
            <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
          </>
        )}
      </div>

      {/* ── Fee Detail Modal ── */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={`Fee Details`} subtitle={selected.name} size="md">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
            <InfoRow label="Student"       value={selected.name} />
            <InfoRow label="Roll No"       value={selected.rollNo} />
            <InfoRow label="Class"         value={`${selected.class} — ${selected.section}`} />
            <InfoRow label="Academic Year" value={selected.academicYear} />
            <InfoRow label="Branch"        value={selected.branch} />
            <InfoRow label="Phone"         value={selected.phone} />
          </div>

          {/* Term breakdown */}
          <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius:14, padding:'16px', border:'1.5px solid #e0e7ff', marginBottom:14 }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4338ca', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Term Breakdown</div>
            {[['Term 1',selected.term1||0],['Term 2',selected.term2||0],['Term 3',selected.term3||0]].map(([t,amt]) => (
              <div key={t} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #e0e7ff' }}>
                <span style={{ color:'#64748b', fontWeight:600, fontSize:'0.84rem' }}>{t}</span>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontWeight:800, color:'#1e293b' }}>₹{amt.toLocaleString()}</span>
                  <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'0.68rem', fontWeight:700, background:amt>0?'#dcfce7':'#fee2e2', color:amt>0?'#16a34a':'#dc2626', border:`1px solid ${amt>0?'#86efac':'#fca5a5'}` }}>
                    {amt>0?'Paid':'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius:12, padding:'12px 16px', border:'1.5px solid #bbf7d0' }}>
              <div style={{ fontSize:'0.68rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Paid</div>
              <div style={{ fontSize:'1.25rem', fontWeight:900, color:'#059669', marginTop:3 }}>₹{(selected.paidFee||0).toLocaleString()}</div>
            </div>
            <div style={{ flex:1, background:'linear-gradient(135deg,#fff5f5,#fee2e2)', borderRadius:12, padding:'12px 16px', border:'1.5px solid #fca5a5' }}>
              <div style={{ fontSize:'0.68rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Amount Due</div>
              <div style={{ fontSize:'1.25rem', fontWeight:900, color:'#dc2626', marginTop:3 }}>₹{Math.max(0,(selected.totalFee||0)-(selected.paidFee||0)).toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── WhatsApp Notify Modal ── */}
      {notify && (
        <Modal open onClose={() => setNotify(null)} title="Send Fee Reminder" subtitle={`To parent of ${notify.name}`} size="sm">
          {/* Preview message box */}
          <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius:14, padding:'16px 18px', marginBottom:18, border:'1.5px solid #e0e7ff', fontSize:'0.82rem', lineHeight:1.9, whiteSpace:'pre-wrap', color:'#374151', fontFamily:'monospace' }}>
{`Dear Parent of ${notify.name},

This is a fee reminder from SchoolERP.

Student : ${notify.name} (${notify.rollNo})
Class   : ${notify.class} - ${notify.section}
Total   : ₹${(notify.totalFee||0).toLocaleString()}
Paid    : ₹${(notify.paidFee||0).toLocaleString()}
Due     : ₹${Math.max(0,(notify.totalFee||0)-(notify.paidFee||0)).toLocaleString()}

Please clear the pending fee at the earliest.
Thank you.`}
          </div>

          {/* Due amount highlight */}
          <div style={{ background:'linear-gradient(135deg,#fff5f5,#fee2e2)', borderRadius:12, padding:'12px 16px', marginBottom:16, border:'1.5px solid #fca5a5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.78rem', color:'#64748b', fontWeight:600 }}>Outstanding Amount</span>
            <span style={{ fontSize:'1.2rem', fontWeight:900, color:'#dc2626' }}>
              ₹{Math.max(0,(notify.totalFee||0)-(notify.paidFee||0)).toLocaleString()}
            </span>
          </div>

          <div style={{ display:'flex', gap:9 }}>
            <a href={`https://wa.me/91${notify.phone}?text=${encodeURIComponent(`Fee reminder for ${notify.name} (${notify.rollNo})\nDue: ₹${Math.max(0,(notify.totalFee||0)-(notify.paidFee||0)).toLocaleString()}\nPlease clear at the earliest. Thank you.`)}`}
              target="_blank" rel="noreferrer"
              style={{ flex:1, padding:'11px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'white', borderRadius:12, fontWeight:700, textAlign:'center', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:'0.875rem', boxShadow:'0 4px 14px rgba(34,197,94,0.4)', transition:'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              📲 Send via WhatsApp
            </a>
            <button className="btn btn-outline" onClick={() => setNotify(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      <style jsx global>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
