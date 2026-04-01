// src/app/super-admin/attendance/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { RefreshCw, Calendar } from 'lucide-react';

export default function SuperAdminAttendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [studentsRes, branchesRes, attendanceRes] = await Promise.all([
        fetch(`/api/students${branch ? `?branch=${encodeURIComponent(branch)}` : ''}`),
        fetch('/api/branches'),
        fetch(`/api/attendance?entityType=student&date=${date}${branch ? `&branch=${encodeURIComponent(branch)}` : ''}`),
      ]);

      const [sData, bData, aData] = await Promise.all([
        studentsRes.json(),
        branchesRes.json(),
        attendanceRes.json(),
      ]);

      if (sData.success) setStudents(sData.data || []);
      if (bData.success) setBranches(bData.data || []);
      if (aData.success) setAttendance(aData.data || []);

    } catch (err) {
      console.error('[Attendance] Load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [branch, date]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach(a => {
      const key = String(a.entityId);
      map[key] = a.status;
    });
    return map;
  }, [attendance]);

  const studentsWithAttendance = useMemo(() => {
    return students.map(s => {
      const studentId = String(s._id || s.id);
      return {
        ...s,
        todayAttendance: attendanceMap[studentId] || 'N/A',
      };
    });
  }, [students, attendanceMap]);

  const filtered = useMemo(() => studentsWithAttendance.filter(s =>
    !search || 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [studentsWithAttendance, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalPresent = filtered.filter(s => s.todayAttendance === 'Present').length;
  const totalAbsent = filtered.filter(s => s.todayAttendance === 'Absent').length;
  const notMarked = filtered.filter(s => s.todayAttendance === 'N/A').length;
  const attendancePct = filtered.length ? Math.round(totalPresent / filtered.length * 100) : 0;

  const chartData = branches.map(b => {
    const branchStudents = studentsWithAttendance.filter(s => s.branch === b.name);
    const present = branchStudents.filter(s => s.todayAttendance === 'Present').length;
    const absent = branchStudents.filter(s => s.todayAttendance === 'Absent').length;
    return {
      branch: b.name,
      present,
      absent,
      total: branchStudents.length,
    };
  });

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Attendance Overview" subtitle={`Viewing attendance for ${date}`}>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { t: 'Total Students', v: filtered.length, c: '#4f46e5' },
          { t: 'Present', v: totalPresent, c: '#10b981' },
          { t: 'Absent', v: totalAbsent, c: '#ef4444' },
          { t: 'Not Marked', v: notMarked, c: '#94a3b8' },
          { t: "Today's Rate", v: `${attendancePct}%`, c: '#f59e0b' },
        ].map(({ t, v, c }) => (
          <div key={t} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, padding: 14 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Branch-wise Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Branch-wise Attendance — {date}</h3>
        {chartData.length === 0 || chartData.every(d => d.total === 0) ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            No attendance data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.8rem' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem', paddingTop: 10 }} />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            className="select" 
            value={branch} 
            onChange={e => { setBranch(e.target.value); setPage(1); }}
            style={{ minWidth: 160 }}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b._id || b.id} value={b.name}>{b.name}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#64748b" />
            <input 
              type="date" 
              className="input" 
              value={date} 
              max={new Date().toISOString().split('T')[0]}
              onChange={e => { setDate(e.target.value); setPage(1); }}
              style={{ maxWidth: 160 }}
            />
          </div>

          <input 
            className="input" 
            placeholder="Search student name or roll no..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            style={{ maxWidth: 280, flex: 1 }} 
          />

          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>
            {filtered.length} students
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Status</th>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Branch</th>
              <th>Today ({date})</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Loading attendance...</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={7}><EmptyState message={search ? `No results for "${search}"` : 'No students found'} /></td>
              </tr>
            ) : paginated.map((s, i) => {
              const todayStatus = s.todayAttendance;
              
              return (
                <tr key={s._id || s.id || `row-${i}`}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{(page - 1) * perPage + i + 1}</td>
                  <td><Badge>{s.status || 'Active'}</Badge></td>
                  <td style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.83rem' }}>{s.rollNo}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.gender}</div>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{s.class} — {s.section}</td>
                  <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{s.branch}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      fontSize: '0.73rem', 
                      fontWeight: 700, 
                      background: todayStatus === 'Present' ? '#dcfce7' : todayStatus === 'Absent' ? '#fee2e2' : '#f1f5f9', 
                      color: todayStatus === 'Present' ? '#16a34a' : todayStatus === 'Absent' ? '#dc2626' : '#94a3b8' 
                    }}>
                      {todayStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9' }}>
          <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
}