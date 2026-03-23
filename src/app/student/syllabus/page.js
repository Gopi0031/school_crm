'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle, Clock, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  'pending':     { label:'Pending',     color:'#94a3b8', bg:'#f1f5f9',  dot:'⬜' },
  'in-progress': { label:'In Progress', color:'#f59e0b', bg:'#fef3c7',  dot:'🔶' },
  'completed':   { label:'Completed',   color:'#10b981', bg:'#d1fae5',  dot:'✅' },
};

const SUBJECT_ICONS = { Mathematics:'📐', Science:'🔬', English:'📖', Social:'🌍', Telugu:'📜', Hindi:'🪔' };

export default function StudentSyllabus() {
  const { user }   = useAuth();
  const [syllabi,  setSyllabi]  = useState([]);
  const [active,   setActive]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) return;
    fetch(`/api/syllabus?branch=${user.branch}&class=${user.class}`)
      .then(r => r.json())
      .then(d => {
        setSyllabi(d.data || []);
        if (d.data?.length) setActive(d.data[0].subject);
        setLoading(false);
      });
  }, [user]);

  const current = syllabi.find(s => s.subject === active);

  const overallProgress = (syl) => {
    const allTopics = syl.units.flatMap(u => u.topics);
    const done      = allTopics.filter(t => t.status === 'completed').length;
    return allTopics.length ? Math.round((done / allTopics.length) * 100) : 0;
  };

  return (
    <AppLayout requiredRole="student">
      <style jsx global>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .syl-card { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      <PageHeader title="Syllabus" subtitle={`${user?.class} — ${user?.branch}`} />

      <div style={{ maxWidth:820, display:'flex', flexDirection:'column', gap:18 }}>

        {loading && (
          <div style={{ textAlign:'center', padding:'50px 0', color:'#94a3b8' }}>
            <div style={{ width:28, height:28, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
            Loading syllabus...
          </div>
        )}

        {!loading && syllabi.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
            <BookOpen size={44} style={{ margin:'0 auto 14px', opacity:0.25 }} />
            <div style={{ fontWeight:700, fontSize:'1rem' }}>No syllabus available yet</div>
            <div style={{ fontSize:'0.8rem', marginTop:4 }}>Your teacher will update it soon</div>
          </div>
        )}

        {!loading && syllabi.length > 0 && (
          <>
            {/* ── Subject overview cards ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
              {syllabi.map((syl, idx) => {
                const pct    = overallProgress(syl);
                const isAct  = active === syl.subject;
                const topics = syl.units.flatMap(u => u.topics);
                return (
                  <div key={idx} className="syl-card"
                    onClick={() => setActive(syl.subject)}
                    style={{ animationDelay:`${idx*0.07}s`, cursor:'pointer', borderRadius:14,
                      background: isAct ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'white',
                      border: isAct ? 'none' : '1.5px solid #e8edff',
                      padding:'16px', boxShadow: isAct ? '0 6px 20px rgba(79,70,229,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
                      transition:'all 0.25s',
                    }}>
                    <div style={{ fontSize:'1.6rem', marginBottom:8 }}>{SUBJECT_ICONS[syl.subject] || '📚'}</div>
                    <div style={{ fontWeight:800, fontSize:'0.85rem', color: isAct?'white':'#1e293b', marginBottom:6 }}>{syl.subject}</div>
                    {/* Mini progress bar */}
                    <div style={{ height:4, borderRadius:99, background: isAct?'rgba(255,255,255,0.25)':'#e2e8f0', overflow:'hidden', marginBottom:4 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: isAct?'white':'#4f46e5', borderRadius:99, transition:'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize:'0.68rem', fontWeight:700, color: isAct?'rgba(255,255,255,0.8)':'#64748b' }}>
                      {pct}% complete • {topics.filter(t=>t.status==='completed').length}/{topics.length} topics
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Unit details ── */}
            {current && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontWeight:800, color:'#1e293b', fontSize:'1rem', display:'flex', alignItems:'center', gap:8 }}>
                  {SUBJECT_ICONS[current.subject] || '📚'} {current.subject}
                  <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500 }}>— updated by {current.updatedBy || 'Teacher'}</span>
                </div>

                {current.units.map((unit, uIdx) => {
                  const pct      = unit.topics.length ? Math.round(unit.topics.filter(t=>t.status==='completed').length / unit.topics.length * 100) : 0;
                  const isExpand = expanded[uIdx] !== false;
                  return (
                    <div key={uIdx} className="syl-card" style={{ animationDelay:`${uIdx*0.08}s` }}>
                      <div className="card" style={{ padding:0, overflow:'hidden', border:`1.5px solid ${pct===100?'#a7f3d0':'#e8edff'}` }}>
                        {/* Unit header */}
                        <div style={{ padding:'14px 18px', background: pct===100?'#f0fdf4':'#f8faff', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}
                          onClick={() => setExpanded(p => ({ ...p, [uIdx]: !isExpand }))}>
                          <div style={{ width:30, height:30, borderRadius:8, background: pct===100?'#10b981':'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'0.75rem', flexShrink:0 }}>
                            U{unit.unitNo}
                          </div>
                          <div style={{ fontWeight:700, color:'#1e293b', fontSize:'0.88rem', flex:1 }}>
                            {unit.title || `Unit ${unit.unitNo}`}
                          </div>
                          <div style={{ width:80, flexShrink:0 }}>
                            <div style={{ height:5, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background: pct===100?'#10b981':'#4f46e5', borderRadius:99, transition:'width 0.4s' }} />
                            </div>
                            <div style={{ fontSize:'0.62rem', fontWeight:700, color: pct===100?'#10b981':'#4f46e5', marginTop:3, textAlign:'right' }}>{pct}%</div>
                          </div>
                          {isExpand ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                        </div>

                        {/* Topics */}
                        {isExpand && (
                          <div style={{ padding:'8px 16px 14px' }}>
                            {unit.topics.length === 0 && (
                              <div style={{ color:'#94a3b8', fontSize:'0.78rem', padding:'8px 0', textAlign:'center' }}>No topics added yet</div>
                            )}
                            {unit.topics.map((topic, tIdx) => {
                              const sc = STATUS_CONFIG[topic.status];
                              return (
                                <div key={tIdx} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:4,
                                  background:sc.bg, borderRadius:8, border:`1px solid ${sc.color}20`,
                                  borderLeft:`3px solid ${sc.color}`,
                                }}>
                                  <span style={{ fontSize:'0.85rem' }}>{sc.dot}</span>
                                  <span style={{ flex:1, fontSize:'0.83rem', fontWeight:600, color:'#1e293b' }}>{topic.title}</span>
                                  <span style={{ fontSize:'0.68rem', fontWeight:700, color:sc.color, background:'white', padding:'2px 8px', borderRadius:99 }}>{sc.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
