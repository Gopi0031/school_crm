// src/app/student/results/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Trophy, TrendingUp, X, Award, BookOpen, FileDown } from 'lucide-react';

const getId = (item) => item?._id || item?.id || '';

// ── Group reports by Exam ────────────────────────────────────────────────────
function groupByExam(reports) {
  const grouped = {};
  reports.forEach(r => {
    const key = r.exam || 'General';
    if (!grouped[key]) {
      grouped[key] = {
        exam: key,
        academicYear: r.academicYear,
        subjects: [],
        totalObtained: 0,
        totalMax: 0,
      };
    }
    grouped[key].subjects.push(r);
    grouped[key].totalObtained += Number(r.marksObtained) || 0;
    grouped[key].totalMax += Number(r.totalMarks) || 0;
  });

  return Object.values(grouped).map(g => ({
    ...g,
    subjectCount: g.subjects.length,
    percentage: g.totalMax > 0 ? Math.round((g.totalObtained / g.totalMax) * 100) : 0,
    status: g.totalMax > 0 && (g.totalObtained / g.totalMax) >= 0.35 ? 'Pass' : 'Fail',
  }));
}

// ── Exam Badge Color ─────────────────────────────────────────────────────────
function getExamColor(exam) {
  const colors = {
    'Unit Test 1': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'Unit Test 2': { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
    'Mid Term':    { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    'Half Yearly': { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' },
    'Annual':      { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
  };
  return colors[exam] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
}

const getColor = (pct) => pct >= 75 ? '#10b981' : pct >= 35 ? '#f59e0b' : '#ef4444';

export default function StudentResults() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // Holds grouped exam data

  useEffect(() => {
    if (!user) return;
    const id = user.studentId || user.id;
    setLoading(true);
    fetch(`/api/reports?studentId=${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReports(d.data || []); })
      .finally(() => setLoading(false));
  }, [user]);

  // Group by exam
  const groupedExams = useMemo(() => groupByExam(reports), [reports]);

  // Overall stats
  const totalExams = groupedExams.length;
  const passedExams = groupedExams.filter(g => g.status === 'Pass').length;
  const overallPct = groupedExams.length
    ? Math.round(groupedExams.reduce((s, g) => s + g.percentage, 0) / groupedExams.length)
    : 0;
  const topExam = groupedExams.length
    ? groupedExams.reduce((a, b) => a.percentage > b.percentage ? a : b)
    : null;

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="My Results" subtitle="Term-wise Academic Performance" />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }} className="results-stats">
        {[
          { l: 'Overall Avg', v: `${overallPct}%`, c: '#7c3aed', icon: '📊' },
          { l: 'Exams Passed', v: passedExams, c: '#10b981', icon: '✅' },
          { l: 'Exams Failed', v: totalExams - passedExams, c: '#ef4444', icon: '❌' },
          { l: 'Best Exam', v: topExam?.exam || '—', c: '#f59e0b', icon: '🏆', small: true },
        ].map(({ l, v, c, icon, small }, i) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}`, animation:'fadeSlideUp 0.4s ease both', animationDelay:`${i*70}ms` }}>
            <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize: small ? '0.85rem' : '1.4rem', fontWeight:800, color:c, lineHeight:1.2 }}>{v}</div>
            <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:4, fontWeight:600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      {groupedExams.length > 0 && (
        <div className="card" style={{ marginBottom:18, animation:'fadeSlideUp 0.4s ease both', animationDelay:'200ms' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={15} color="#7c3aed" />
              <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Overall Performance</span>
            </div>
            <span style={{ fontWeight:800, color:getColor(overallPct) }}>{overallPct}%</span>
          </div>
          <div style={{ height:12, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${overallPct}%`, background:`linear-gradient(90deg, ${getColor(overallPct)}, ${getColor(overallPct)}aa)`, borderRadius:99, transition:'width 1s ease' }} />
          </div>
          <div style={{ display:'flex', gap:16, marginTop:10, fontSize:'0.72rem' }}>
            {[
              { label:'🟢 75%+ Distinction', color:'#10b981' },
              { label:'🟡 35–74% Pass', color:'#f59e0b' },
              { label:'🔴 Below 35% Fail', color:'#ef4444' },
            ].map(({ label, color }) => (
              <span key={label} style={{ color, fontWeight:600 }}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[1, 2].map(i => (
            <div key={`skeleton-${i}`} className="card" style={{ height:120, background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : groupedExams.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 24px', animation:'fadeSlideUp 0.4s ease' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📋</div>
          <p style={{ color:'#94a3b8', fontWeight:600 }}>No results found</p>
        </div>
      ) : (
        /* Exam Cards */
        <div style={{ display:'grid', gap:16 }}>
          {groupedExams.map((g, gi) => {
            const examColor = getExamColor(g.exam);
            return (
              <div key={`exam-${g.exam}-${gi}`} className="card" style={{ animation:'fadeSlideUp 0.4s ease both', animationDelay:`${gi*80}ms`, cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => setSelected(g)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  {/* Left: Exam Info */}
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:50, height:50, borderRadius:12, background:examColor.bg, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${examColor.border}` }}>
                      <Trophy size={22} color={examColor.text} />
                    </div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1.05rem', color:'#1e293b' }}>{g.exam}</div>
                      <div style={{ display:'flex', gap:12, marginTop:4, fontSize:'0.78rem', color:'#64748b' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <BookOpen size={12} /> {g.subjectCount} Subjects
                        </span>
                        <span>{g.academicYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Marks */}
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>
                      {g.totalObtained} <span style={{ color:'#94a3b8', fontWeight:400 }}>/ {g.totalMax}</span>
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:2 }}>Total Marks</div>
                  </div>

                  {/* Right: Percentage & Result */}
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'1.8rem', fontWeight:900, color:getColor(g.percentage) }}>{g.percentage}%</div>
                      <div style={{ height:6, width:80, background:'#f1f5f9', borderRadius:3, marginTop:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${g.percentage}%`, background:getColor(g.percentage), borderRadius:3 }} />
                      </div>
                    </div>
                    <span style={{ padding:'6px 16px', borderRadius:20, fontSize:'0.82rem', fontWeight:700, background: g.status==='Pass'?'#dcfce7':'#fee2e2', color: g.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {g.status}
                    </span>
                    <Eye size={18} color="#94a3b8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal - Subjects */}
      {selected && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }}>
          <div style={{ background:'white', borderRadius:20, padding:0, width:'100%', maxWidth:600, maxHeight:'90vh', overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', animation:'scaleIn 0.25s cubic-bezier(.34,1.2,.64,1)' }}>
            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${getExamColor(selected.exam).bg},${getExamColor(selected.exam).border}20)`, padding:'20px 24px', borderBottom:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
                    <Award size={22} color={getExamColor(selected.exam).text} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b', margin:0 }}>{selected.exam}</h3>
                    <p style={{ color:'#64748b', fontSize:'0.78rem', margin:'2px 0 0' }}>{selected.academicYear}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width:36, height:36, borderRadius:'50%', background:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
                  <X size={16} color="#64748b" />
                </button>
              </div>

              {/* Score Summary */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, padding:'12px 16px', background:'white', borderRadius:12 }}>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:600 }}>Total Score</div>
                  <div style={{ fontWeight:800, fontSize:'1.3rem', color:'#1e293b' }}>
                    {selected.totalObtained} <span style={{ color:'#94a3b8', fontWeight:400 }}>/ {selected.totalMax}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'2rem', fontWeight:900, color:getColor(selected.percentage) }}>{selected.percentage}%</div>
                  <span style={{ padding:'4px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:700, background: selected.status==='Pass'?'#dcfce7':'#fee2e2', color: selected.status==='Pass'?'#16a34a':'#dc2626' }}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject List */}
            <div style={{ padding:'16px 24px', maxHeight:'50vh', overflowY:'auto' }}>
              <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', marginBottom:12, textTransform:'uppercase' }}>
                Subject-wise Breakdown ({selected.subjectCount} subjects)
              </div>
              
              {selected.subjects.map((s, i) => (
                <div key={getId(s) || `subject-${i}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom: i < selected.subjects.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.9rem' }}>{s.subject}</div>
                    <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>
                      {s.marksObtained} / {s.totalMarks} marks
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:60, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${s.percentage}%`, background:getColor(s.percentage), borderRadius:3 }} />
                    </div>
                    <span style={{ fontWeight:700, color:getColor(s.percentage), fontSize:'0.9rem', minWidth:45, textAlign:'right' }}>{s.percentage}%</span>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background: s.status==='Pass'?'#dcfce7':'#fee2e2', color: s.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Stats */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', background:'#f8fafc' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { label:'Passed', value: selected.subjects.filter(s => s.status === 'Pass').length, color:'#10b981' },
                  { label:'Failed', value: selected.subjects.filter(s => s.status === 'Fail').length, color:'#ef4444' },
                  { label:'Best', value: Math.max(...selected.subjects.map(s => s.percentage)) + '%', color:'#7c3aed' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:800, fontSize:'1.2rem', color }}>{value}</div>
                    <div style={{ fontSize:'0.68rem', color:'#64748b' }}>{label}</div>
                  </div>
                ))}
              </div>              {/* Footer buttons */}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
                <button 
                  className="btn btn-outline" 
                  style={{ display:'flex', alignItems:'center', gap:6 }}
                  onClick={() => {
                    // Print single exam report
                    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${selected.exam} Report</title>
                    <style>
                      *{margin:0;padding:0;box-sizing:border-box}
                      body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#1e293b}
                      .header{background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:20px;border-radius:12px;margin-bottom:20px}
                      table{width:100%;border-collapse:collapse}
                      th{background:#7c3aed;color:white;padding:10px;text-align:left}
                      td{padding:10px;border-bottom:1px solid #e2e8f0}
                      .pass{color:#16a34a;font-weight:700}
                      .fail{color:#dc2626;font-weight:700}
                      @media print{.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
                    </style></head><body>
                    <div class="header">
                      <h1 style="font-size:20px;margin-bottom:8px">📊 ${selected.exam} — Report Card</h1>
                      <div style="font-size:13px;opacity:0.9">
                        Student: <b>${user?.name}</b> | Roll No: <b>${user?.rollNo}</b> | Class: <b>${user?.class}-${user?.section}</b> | Year: ${selected.academicYear}
                      </div>
                    </div>
                    <table>
                      <thead><tr><th>Subject</th><th>Marks</th><th>Total</th><th>%</th><th>Result</th></tr></thead>
                      <tbody>
                        ${selected.subjects.map((s, i) => `
                          <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
                            <td style="font-weight:600">${s.subject}</td>
                            <td style="font-weight:700">${s.marksObtained}</td>
                            <td>${s.totalMarks}</td>
                            <td style="font-weight:700;color:${s.percentage>=75?'#10b981':s.percentage>=35?'#f59e0b':'#ef4444'}">${s.percentage}%</td>
                            <td class="${s.status==='Pass'?'pass':'fail'}">${s.status}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr style="background:#f1f5f9;font-weight:700">
                          <td>GRAND TOTAL</td>
                          <td style="color:#7c3aed">${selected.totalObtained}</td>
                          <td>${selected.totalMax}</td>
                          <td style="color:${selected.percentage>=75?'#10b981':selected.percentage>=35?'#f59e0b':'#ef4444'}">${selected.percentage}%</td>
                          <td class="${selected.status==='Pass'?'pass':'fail'}">${selected.status}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between">
                      <span>SchoolERP</span>
                      <span>Generated: ${new Date().toLocaleString('en-IN')}</span>
                    </div>
                    </body></html>`;
                    const win = window.open('', '_blank');
                    win.document.write(html);
                    win.document.close();
                    setTimeout(() => win.print(), 500);
                  }}
                >
                  <FileDown size={13} /> Print Report
                </button>
                <button className="btn btn-primary" style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)' }} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @media (max-width: 600px) { .results-stats { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </AppLayout>
  );
}