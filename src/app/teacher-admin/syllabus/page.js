'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Plus, Trash2, Save, CheckCircle, ChevronDown, ChevronUp, Circle, Clock, CheckSquare } from 'lucide-react';

const STATUS_CONFIG = {
  'pending':     { label:'Pending',     color:'#94a3b8', bg:'#f1f5f9',  icon:'○' },
  'in-progress': { label:'In Progress', color:'#f59e0b', bg:'#fef3c7',  icon:'◑' },
  'completed':   { label:'Completed',   color:'#10b981', bg:'#d1fae5',  icon:'●' },
};

export default function TeacherSyllabus() {
  const { user } = useAuth();
  const [subject,  setSubject]  = useState('');
  const [units,    setUnits]    = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState({});

  // Subjects the teacher teaches — derive from user or hardcode
  const subjects = user?.subjects || ['Mathematics','Science','English','Social','Telugu','Hindi'];

  const loadSyllabus = async (subj) => {
    if (!subj) return;
    setLoading(true);
    const res  = await fetch(`/api/syllabus?branch=${user.branch}&class=${user.class}&subject=${subj}`);
    const data = await res.json();
    if (data.data?.units?.length) {
      setUnits(data.data.units);
    } else {
      // Default 3 empty units
      setUnits([1,2,3].map(u => ({ unitNo:u, title:'', topics:[] })));
    }
    setLoading(false);
  };

  const addUnit = () => setUnits(prev => [...prev, { unitNo: prev.length+1, title:'', topics:[] }]);

  const removeUnit = (uIdx) => setUnits(prev => prev.filter((_,i) => i !== uIdx).map((u,i) => ({ ...u, unitNo:i+1 })));

  const updateUnit = (uIdx, field, value) =>
    setUnits(prev => prev.map((u,i) => i !== uIdx ? u : { ...u, [field]: value }));

  const addTopic = (uIdx) =>
    setUnits(prev => prev.map((u,i) => i !== uIdx ? u : { ...u, topics:[...u.topics, { title:'', status:'pending', completedOn:null }] }));

  const removeTopic = (uIdx, tIdx) =>
    setUnits(prev => prev.map((u,i) => i !== uIdx ? u : { ...u, topics: u.topics.filter((_,ti) => ti !== tIdx) }));

  const updateTopic = (uIdx, tIdx, field, value) =>
    setUnits(prev => prev.map((u,i) => i !== uIdx ? u : {
      ...u,
      topics: u.topics.map((t,ti) => ti !== tIdx ? t : {
        ...t,
        [field]: value,
        ...(field === 'status' && value === 'completed' ? { completedOn: new Date() } : {}),
      }),
    }));

  const save = async () => {
    if (!subject) return;
    setSaving(true);
    await fetch('/api/syllabus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch:user.branch, class:user.class, subject, units, updatedBy:user.name }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const progress = (unit) => {
    const total     = unit.topics.length;
    const completed = unit.topics.filter(t => t.status === 'completed').length;
    return total ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <AppLayout requiredRole="teacher-admin">
      <style jsx global>{`
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .unit-card { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <PageHeader title="Syllabus Manager" subtitle={`${user?.class} — ${user?.branch}`} />

      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Subject selector ── */}
        <div className="card" style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <BookOpen size={18} color="#4f46e5" />
          <span style={{ fontWeight:700, color:'#1e293b', fontSize:'0.9rem' }}>Select Subject:</span>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {subjects.map(s => (
              <button key={s}
                onClick={() => { setSubject(s); loadSyllabus(s); }}
                style={{
                  padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.8rem',
                  background: subject===s ? '#4f46e5' : '#f1f5f9',
                  color: subject===s ? 'white' : '#64748b',
                  boxShadow: subject===s ? '0 3px 10px rgba(79,70,229,0.35)' : 'none',
                  transition:'all 0.2s',
                }}>
                {s}
              </button>
            ))}
          </div>
          {subject && (
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              {saving ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</> : saved ? <><CheckCircle size={13} /> Saved!</> : <><Save size={13} /> Save Syllabus</>}
            </button>
          )}
        </div>

        {!subject && (
          <div style={{ textAlign:'center', padding:'50px 0', color:'#94a3b8' }}>
            <BookOpen size={40} style={{ margin:'0 auto 12px', opacity:0.3 }} />
            <div style={{ fontWeight:600 }}>Select a subject to manage its syllabus</div>
          </div>
        )}

        {subject && loading && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#6366f1' }}>
            <div style={{ width:28, height:28, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
            Loading syllabus...
          </div>
        )}

        {subject && !loading && units.map((unit, uIdx) => {
          const pct      = progress(unit);
          const isExpand = expanded[uIdx] !== false; // default expanded

          return (
            <div key={uIdx} className="unit-card" style={{ animationDelay:`${uIdx*0.07}s` }}>
              <div className="card" style={{ padding:0, overflow:'hidden', border:`1.5px solid ${pct===100?'#a7f3d0':'#e8edff'}` }}>

                {/* Unit header */}
                <div style={{ padding:'14px 18px', background: pct===100 ? '#f0fdf4' : '#f8faff', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}
                  onClick={() => setExpanded(p => ({ ...p, [uIdx]: !isExpand }))}>
                  <div style={{ width:32, height:32, borderRadius:8, background: pct===100?'#10b981':'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'0.8rem', flexShrink:0 }}>
                    U{unit.unitNo}
                  </div>
                  <div style={{ flex:1 }}>
                    <input className="input"
                      placeholder={`Unit ${unit.unitNo} title...`}
                      value={unit.title}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateUnit(uIdx, 'title', e.target.value)}
                      style={{ fontWeight:700, border:'none', background:'transparent', padding:'2px 4px', fontSize:'0.9rem', color:'#1e293b', width:'100%', outline:'none' }} />
                  </div>
                  {/* Progress bar */}
                  <div style={{ width:100, flexShrink:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:'0.65rem', color:'#64748b' }}>{unit.topics.filter(t=>t.status==='completed').length}/{unit.topics.length} done</span>
                      <span style={{ fontSize:'0.65rem', fontWeight:700, color: pct===100?'#10b981':'#4f46e5' }}>{pct}%</span>
                    </div>
                    <div style={{ height:5, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct===100?'#10b981':'#4f46e5', borderRadius:99, transition:'width 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {isExpand ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    <button onClick={e => { e.stopPropagation(); removeUnit(uIdx); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', display:'flex', padding:2 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Topics */}
                {isExpand && (
                  <div style={{ padding:'10px 16px 14px' }}>
                    {unit.topics.length === 0 && (
                      <div style={{ color:'#94a3b8', fontSize:'0.8rem', padding:'10px 0', textAlign:'center' }}>No topics yet — add below</div>
                    )}
                    {unit.topics.map((topic, tIdx) => (
                      <div key={tIdx} style={{ display:'grid', gridTemplateColumns:'1fr 140px 28px', gap:8, alignItems:'center', marginBottom:6,
                        background:'#fafafa', borderRadius:8, padding:'8px 10px', border:'1px solid #f1f5f9',
                        borderLeft:`3px solid ${STATUS_CONFIG[topic.status].color}`,
                      }}>
                        <input className="input" placeholder={`Topic ${tIdx+1}`} value={topic.title}
                          onChange={e => updateTopic(uIdx, tIdx, 'title', e.target.value)}
                          style={{ border:'none', background:'transparent', fontSize:'0.84rem', padding:'2px 4px', outline:'none', color:'#1e293b' }} />
                        <select value={topic.status}
                          onChange={e => updateTopic(uIdx, tIdx, 'status', e.target.value)}
                          style={{ padding:'4px 8px', borderRadius:8, border:`1px solid ${STATUS_CONFIG[topic.status].color}30`, background:STATUS_CONFIG[topic.status].bg, color:STATUS_CONFIG[topic.status].color, fontSize:'0.75rem', fontWeight:700, cursor:'pointer', outline:'none' }}>
                          {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                            <option key={k} value={k}>{v.icon} {v.label}</option>
                          ))}
                        </select>
                        <button onClick={() => removeTopic(uIdx, tIdx)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#fca5a5', display:'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addTopic(uIdx)}
                      style={{ marginTop:6, padding:'6px 14px', background:'#eff6ff', color:'#4f46e5', border:'1px dashed #a5b4fc', borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                      <Plus size={13} /> Add Topic
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {subject && !loading && (
          <button onClick={addUnit}
            style={{ padding:'11px', background:'white', border:'2px dashed #c7d2fe', borderRadius:12, cursor:'pointer', color:'#6366f1', fontWeight:700, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s' }}>
            <Plus size={16} /> Add Unit
          </button>
        )}

      </div>
    </AppLayout>
  );
}
