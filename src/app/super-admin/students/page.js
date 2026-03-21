'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  PageHeader, FilterBar, Badge, TableWrapper,
  Pagination, EmptyState, Modal, InfoRow, LoadingSpinner,
} from '@/components/ui';
import { Eye, Download, Printer, Users, GraduationCap, UserCheck, TrendingDown } from 'lucide-react';

export default function SuperAdminStudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [branch,   setBranch]   = useState('');
  const [cls,      setCls]      = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (branch) params.set('branch', branch);
    if (cls)    params.set('class', cls);
    const [sRes, bRes] = await Promise.all([fetch(`/api/students?${params}`), fetch('/api/branches')]);
    const [sData, bData] = await Promise.all([sRes.json(), bRes.json()]);
    if (sData.success) setStudents(sData.data);
    if (bData.success) setBranches(bData.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [branch, cls]);

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);

  /* ── Quick stats ── */
  const activeCount  = filtered.filter(s => s.status === 'Active').length;
  const presentCount = filtered.filter(s => s.todayAttendance === 'Present').length;
  const absentCount  = filtered.filter(s => s.todayAttendance === 'Absent').length;

  const QUICK_STATS = [
    { label:'Total Students', value:filtered.length, color:'#6366f1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', icon:<Users size={16} color="#6366f1" /> },
    { label:'Active',         value:activeCount,     color:'#10b981', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon:<UserCheck size={16} color="#10b981" /> },
    { label:'Present Today',  value:presentCount,    color:'#3b82f6', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)', icon:<GraduationCap size={16} color="#3b82f6" /> },
    { label:'Absent Today',   value:absentCount,     color:'#ef4444', bg:'linear-gradient(135deg,#fff5f5,#fee2e2)', icon:<TrendingDown size={16} color="#ef4444" /> },
  ];

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Student Details" subtitle={`${filtered.length} students across all branches`}>
        <button className="btn btn-outline" onClick={() => window.print()}><Printer size={15} /> Print</button>
        <button className="btn btn-outline"><Download size={15} /> Export</button>
      </PageHeader>

      {/* Quick stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:14, marginBottom:20 }}>
        {QUICK_STATS.map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:'14px 18px', border:`1.5px solid ${s.color}22`, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 2px 8px ${s.color}25`, flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize:'1.3rem', fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.68rem', color:'#64748b', fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16 }}>
        <FilterBar
          filters={[
            { label:'All Branches', value:branch, onChange:v=>{ setBranch(v); setPage(1); }, options:branches.map(b => b.name) },
            { label:'All Classes',  value:cls,    onChange:v=>{ setCls(v); setPage(1); },    options:['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'] },
          ]}
          onSearch={v=>{ setSearch(v); setPage(1); }}
          searchPlaceholder="Search name or roll no..."
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingSpinner text="Loading students..." /> : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <th>S.No</th><th>Status</th><th>Student Name</th>
                  <th>Class & Section</th><th>Parent</th><th>Phone</th>
                  <th>Today Att.</th><th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState message={search ? `No results for "${search}"` : 'No students found'} /></td></tr>
                ) : paginated.map((s, i) => (
                  <tr key={s._id} style={{ transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ color:'#94a3b8', fontWeight:600 }}>{(page-1)*perPage+i+1}</td>
                    <td><Badge>{s.status}</Badge></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        {/* Mini avatar */}
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'0.78rem', flexShrink:0, overflow:'hidden' }}>
                          {s.profileImage
                            ? <img src={s.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : s.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, color:'#1e293b', fontSize:'0.84rem' }}>{s.name}</div>
                          <div style={{ fontSize:'0.7rem', color:'#a5b4fc', fontWeight:600 }}>{s.rollNo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding:'3px 10px', borderRadius:99, background:'#f0f2ff', color:'#4338ca', fontSize:'0.73rem', fontWeight:700 }}>
                        {s.class} — {s.section}
                      </span>
                    </td>
                    <td style={{ color:'#64748b', fontSize:'0.83rem' }}>{s.parentName}</td>
                    <td style={{ color:'#64748b', fontSize:'0.83rem' }}>{s.phone}</td>
                    <td>
                      <span style={{
                        padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700,
                        background: s.todayAttendance==='Present' ? '#dcfce7' : s.todayAttendance==='Absent' ? '#fee2e2' : '#f1f5f9',
                        color:      s.todayAttendance==='Present' ? '#16a34a' : s.todayAttendance==='Absent' ? '#dc2626' : '#94a3b8',
                      }}>
                        {s.todayAttendance || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding:'5px 11px', fontSize:'0.74rem' }} onClick={() => setSelected(s)}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} subtitle={`${selected.rollNo} • ${selected.class} — ${selected.section}`} size="lg">
          {/* Fee progress bar */}
          {selected.totalFee > 0 && (
            <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius:14, padding:'14px 18px', marginBottom:18, border:'1.5px solid #e0e7ff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#4338ca' }}>Fee Collection</span>
                <span style={{ fontSize:'0.78rem', fontWeight:900, color:'#6366f1' }}>
                  {Math.round((selected.paidFee||0)/selected.totalFee*100)}%
                </span>
              </div>
              <div style={{ background:'#e0e7ff', borderRadius:99, height:8, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#10b981,#6366f1)', width:`${Math.round((selected.paidFee||0)/selected.totalFee*100)}%`, transition:'width 0.8s ease', boxShadow:'0 2px 8px rgba(99,102,241,0.4)' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:'0.68rem', color:'#10b981', fontWeight:700 }}>Paid ₹{(selected.paidFee||0).toLocaleString()}</span>
                <span style={{ fontSize:'0.68rem', color:'#ef4444', fontWeight:700 }}>Due ₹{Math.max(0,(selected.totalFee||0)-(selected.paidFee||0)).toLocaleString()}</span>
              </div>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <InfoRow label="Roll No"         value={selected.rollNo} />
            <InfoRow label="Class & Section" value={`${selected.class} — ${selected.section}`} />
            <InfoRow label="Gender"          value={selected.gender} />
            <InfoRow label="Blood Group"     value={selected.bloodGroup} />
            <InfoRow label="Branch"          value={selected.branch} />
            <InfoRow label="Status"          value={<Badge>{selected.status}</Badge>} />
            <InfoRow label="Parent Name"     value={selected.parentName} />
            <InfoRow label="Phone"           value={selected.phone} />
            <InfoRow label="Email"           value={selected.email} />
            <InfoRow label="Total Fee"       value={`₹${(selected.totalFee||0).toLocaleString()}`} />
            <InfoRow label="Paid Fee"        value={`₹${(selected.paidFee||0).toLocaleString()}`} />
            <InfoRow label="Due Fee"         value={`₹${((selected.totalFee||0)-(selected.paidFee||0)).toLocaleString()}`} />
            <InfoRow label="Attendance"      value={`${selected.presentDays||0} / ${selected.totalWorkingDays||220} days`} />
          </div>
        </Modal>
      )}

      <style jsx global>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
