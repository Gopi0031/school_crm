'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  PageHeader, FilterBar, Badge, TableWrapper, Pagination,
  EmptyState, Modal, InfoRow, LoadingSpinner,
} from '@/components/ui';
import { Eye, Download, GraduationCap, Users, Building2, BookOpen } from 'lucide-react';

export default function SuperAdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [branch,   setBranch]   = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 10;

  useEffect(() => {
    fetch('/api/branches').then(r=>r.json()).then(b=>{ if(b.success) setBranches(b.data||[]); });
  }, []);

  useEffect(() => {
    setLoading(true); setTeachers([]);
    const url = branch ? `/api/teachers?branch=${encodeURIComponent(branch)}` : '/api/teachers';
    fetch(url).then(r=>r.json())
      .then(t=>{ if(t.success) setTeachers(t.data||[]); else setTeachers([]); })
      .catch(()=>setTeachers([]))
      .finally(()=>setLoading(false));
  }, [branch]);

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.employeeId?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);

  /* Subject color map */
  const SUBJECT_COLORS = { Math:'#6366f1', Science:'#10b981', English:'#f59e0b', History:'#ec4899', Physics:'#06b6d4', Chemistry:'#8b5cf6' };
  const subjectColor = s => SUBJECT_COLORS[s] || '#64748b';

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader
        title="Teacher Details"
        subtitle={loading ? 'Loading...' : `${filtered.length} teacher${filtered.length!==1?'s':''} ${branch?`in ${branch}`:'across all branches'}`}
      >
        <button className="btn btn-outline"><Download size={15} /> Export</button>
      </PageHeader>

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Teachers', value:filtered.length,   color:'#6366f1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', icon:<GraduationCap size={16}/> },
          { label:'Active',         value:filtered.filter(t=>t.status==='Active'||!t.status).length, color:'#10b981', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon:<Users size={16}/> },
          { label:'Branches',       value:branches.length,   color:'#f59e0b', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', icon:<Building2 size={16}/> },
          { label:'Subjects',       value:[...new Set(teachers.map(t=>t.subject).filter(Boolean))].length, color:'#8b5cf6', bg:'linear-gradient(135deg,#faf5ff,#f3e8ff)', icon:<BookOpen size={16}/> },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:'14px 18px', border:`1.5px solid ${c.color}20`, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:c.color, flexShrink:0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize:'1.3rem', fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
              <div style={{ fontSize:'0.68rem', color:'#64748b', fontWeight:600, marginTop:2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16 }}>
        <FilterBar
          filters={[{
            label:'All Branches', value:branch,
            onChange:v=>{ setBranch(v); setPage(1); setSearch(''); },
            options:branches.map(b=>({ value:b.name, label:b.name })),
          }]}
          onSearch={v=>{ setSearch(v); setPage(1); }}
          searchPlaceholder="Search name or employee ID..."
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingSpinner text="Loading teachers..." /> : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <th>S.No</th><th>Status</th><th>Emp ID</th><th>Name</th>
                  <th>Branch</th><th>Qualification</th><th>Subject</th><th>Salary</th><th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState message={search?`No results for "${search}"`:'No teachers found'} /></td></tr>
                ) : paginated.map((t, i) => (
                  <tr key={t._id}>
                    <td style={{ color:'#94a3b8', fontWeight:500 }}>{(page-1)*perPage+i+1}</td>
                    <td><Badge type={t.status==='Active'||!t.status?'success':'warning'}>{t.status||'Active'}</Badge></td>
                    <td>
                      <span style={{ fontWeight:800, color:'#6366f1', fontFamily:'monospace', fontSize:'0.82rem', background:'#eef2ff', padding:'2px 8px', borderRadius:6 }}>
                        {t.employeeId}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:800, color:'#6366f1', flexShrink:0, overflow:'hidden' }}>
                          {t.profileImage ? <img src={t.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : t.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight:700, color:'#1e293b', fontSize:'0.84rem' }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ color:'#475569', fontSize:'0.84rem' }}>{t.branch}</td>
                    <td style={{ color:'#64748b', fontSize:'0.83rem' }}>{t.qualification}</td>
                    <td>
                      <span style={{ padding:'2px 9px', borderRadius:99, fontSize:'0.72rem', fontWeight:700, background:`${subjectColor(t.subject)}18`, color:subjectColor(t.subject) }}>
                        {t.subject}
                      </span>
                    </td>
                    <td style={{ fontWeight:800, color:'#1e293b' }}>₹{(t.salary||0).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding:'5px 11px', fontSize:'0.75rem' }} onClick={() => setSelected(t)}>
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

      {/* Teacher Detail Modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} subtitle={`${selected.employeeId} • ${selected.branch}`} size="md">
          {/* Banner */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius:14, marginBottom:18, border:'1.5px solid #e0e7ff' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', fontWeight:900, color:'white', overflow:'hidden', flexShrink:0, boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
              {selected.profileImage ? <img src={selected.profileImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : selected.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:'1rem', color:'#1e293b' }}>{selected.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4, flexWrap:'wrap' }}>
                <Badge type="success">{selected.status||'Active'}</Badge>
                <span style={{ fontSize:'0.72rem', color:'#64748b' }}>{selected.branch}</span>
                {selected.subject && (
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:'0.68rem', fontWeight:700, background:`${subjectColor(selected.subject)}18`, color:subjectColor(selected.subject) }}>
                    {selected.subject}
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:'1.1rem', fontWeight:900, color:'#10b981' }}>₹{(selected.salary||0).toLocaleString()}</div>
              <div style={{ fontSize:'0.65rem', color:'#94a3b8', fontWeight:600 }}>/month</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <InfoRow label="Employee ID"   value={selected.employeeId} />
            <InfoRow label="Phone"         value={selected.phone} />
            <InfoRow label="Email"         value={selected.email} />
            <InfoRow label="Qualification" value={selected.qualification} />
            <InfoRow label="Experience"    value={selected.experience} />
            <InfoRow label="Class"         value={selected.class} />
            <InfoRow label="Section"       value={selected.section} />
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
