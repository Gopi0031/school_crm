'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, FormField, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Camera, Save, Lock, CheckCircle, User, Eye, EyeOff,
  Shield, Mail, Phone, Sparkles, KeyRound, Send,
} from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg,#4338ca,#6366f1,#8b5cf6)';
const STEP = { IDLE:'idle', SENDING:'sending', VERIFY:'verify', SAVING:'saving', DONE:'done' };

export default function SuperAdminProfile() {
  const { user, updateUser } = useAuth();
  const uid = user?._id; // ✅ single source of truth

  const [form,    setForm]   = useState({ email:user?.email||'', phone:user?.phone||'' });
  const [pwd,     setPwd]    = useState({ newPwd:'', confirm:'' });
  const [pwdError, setPwdError] = useState('');
  const [saved,    setSaved]    = useState(false);
  const [preview,  setPreview]  = useState(user?.profileImage||null);
  const [uploading, setUploading] = useState(false);
  const [showNew,   setShowNew]  = useState(false);
  const [showConf,  setShowConf] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwdStep, setPwdStep] = useState(STEP.IDLE);
  const [otpError, setOtpError] = useState('');
  const [otpInput, setOtpInput] = useState('');

  /* ── Photo ── */
  const handlePhoto = async e => {
    const file = e.target.files[0];
    if (!file || file.size > 5*1024*1024) { alert('Max 5MB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res  = await fetch('/api/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ image:reader.result, folder:'profiles' }) });
        const data = await res.json();
        if (data.url) {
          setPreview(data.url);
          await fetch(`/api/users/${uid}`, { // ✅ FIXED — was user.id
            method:'PUT', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ profileImage:data.url, profileImagePublicId:data.publicId }),
          });
          updateUser({ profileImage:data.url });
        }
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSavingProfile(true);
    const res  = await fetch(`/api/users/${uid}`, { // ✅ FIXED — was user.id
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ email:form.email, phone:form.phone }),
    });
    const data = await res.json();
    if (data.success) {
      updateUser({ email:form.email, phone:form.phone });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    }
    setSavingProfile(false);
  };

  /* ── Step 1: Send OTP ── */
  const requestOtp = async () => {
    setPwdError(''); setOtpError('');
    if (pwd.newPwd.length < 8) { setPwdError('Minimum 8 characters required'); return; }
    if (pwd.newPwd !== pwd.confirm) { setPwdError('Passwords do not match'); return; }
    setPwdStep(STEP.SENDING);
    try {
      const res  = await fetch('/api/users/send-otp', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) { setPwdStep(STEP.VERIFY); }
      else { setPwdError(data.message || 'Failed to send OTP'); setPwdStep(STEP.IDLE); }
    } catch { setPwdError('Network error. Try again.'); setPwdStep(STEP.IDLE); }
  };

  /* ── Step 2: Verify OTP + save password ── */
  const confirmOtpAndSave = async () => {
    setOtpError('');
    if (otpInput.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setPwdStep(STEP.SAVING);
    try {
      const res  = await fetch(`/api/users/${uid}`, { // ✅ FIXED — was user.id
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ password:pwd.newPwd, otp:otpInput, email:user.email }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdStep(STEP.DONE);
        setPwd({ newPwd:'', confirm:'' }); setOtpInput('');
        setTimeout(() => setPwdStep(STEP.IDLE), 4000);
      } else { setOtpError(data.message || 'Invalid OTP'); setPwdStep(STEP.VERIFY); }
    } catch { setOtpError('Network error. Try again.'); setPwdStep(STEP.VERIFY); }
  };

  const cancelOtp = () => { setPwdStep(STEP.IDLE); setOtpInput(''); setOtpError(''); };

  const strength = !pwd.newPwd ? 0 : pwd.newPwd.length < 6 ? 1 : pwd.newPwd.length < 10 ? 2 : /[A-Z]/.test(pwd.newPwd) && /[0-9]/.test(pwd.newPwd) ? 4 : 3;
  const SM = [null,
    { label:'Weak',   color:'#ef4444', bg:'#fee2e2' },
    { label:'Fair',   color:'#f59e0b', bg:'#fef3c7' },
    { label:'Good',   color:'#3b82f6', bg:'#dbeafe' },
    { label:'Strong', color:'#10b981', bg:'#d1fae5' },
  ];
  const sm = SM[strength];

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Profile & Settings" subtitle="Manage your account information and security" />
      <div style={{ maxWidth:840, display:'flex', flexDirection:'column', gap:20 }}>

        {/* ══ Hero Card ══ */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ height:92, background:GRADIENT, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 60%)' }} />
            <div style={{ position:'absolute', top:-28, right:-28, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
            <div style={{ position:'absolute', top:16, right:20, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:99, padding:'4px 14px', display:'flex', alignItems:'center', gap:5 }}>
              <Sparkles size={11} color="white" />
              <span style={{ fontSize:'0.65rem', color:'white', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em' }}>Super Admin</span>
            </div>
          </div>
          <div style={{ padding:'0 28px 26px' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:18, marginTop:-42 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:84, height:84, borderRadius:'50%', background:GRADIENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:900, color:'white', overflow:'hidden', border:'4px solid white', boxShadow:'0 6px 24px rgba(99,102,241,0.45)' }}>
                  {preview ? <img src={preview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.name?.charAt(0)}
                </div>
                <label style={{ position:'absolute', bottom:2, right:2, width:29, height:29, background:GRADIENT, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2.5px solid white', boxShadow:'0 2px 10px rgba(99,102,241,0.5)' }}>
                  {uploading ? <div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> : <Camera size={13} color="white" />}
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
                </label>
              </div>
              <div style={{ paddingBottom:4 }}>
                <div style={{ fontWeight:900, fontSize:'1.25rem', color:'#0f172a' }}>{user?.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                  <span style={{ padding:'3px 11px', borderRadius:99, background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', color:'#4338ca', fontSize:'0.68rem', fontWeight:800 }}>Super Admin</span>
                  {uploading && <span style={{ fontSize:'0.7rem', color:'#6366f1', fontWeight:700 }}>Uploading...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Personal Details ══ */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:14, borderBottom:'1.5px solid #f0f2ff' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={17} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#1e293b' }}>Personal Details</div>
              <div style={{ fontSize:'0.7rem', color:'#a5b4fc', fontWeight:500 }}>Read-only fields are system-managed</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Full Name', value:user?.name||'', icon:<User size={13} /> },
              { label:'Role',      value:'Super Admin',  icon:<Shield size={13} /> },
            ].map(({ label, value, icon }) => (
              <FormField key={label} label={label}>
                <div style={{ position:'relative' }}>
                  <input className="input" value={value} disabled style={{ background:'#f5f3ff', color:'#94a3b8', cursor:'not-allowed', paddingLeft:38 }} />
                  <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#c4b5fd', display:'flex' }}>{icon}</div>
                </div>
              </FormField>
            ))}
            <FormField label="Email Address">
              <div style={{ position:'relative' }}>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="your@email.com" style={{ paddingLeft:38 }} />
                <Mail size={13} color="#a5b4fc" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              </div>
            </FormField>
            <FormField label="Phone Number">
              <div style={{ position:'relative' }}>
                <input className="input" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="10-digit number" style={{ paddingLeft:38 }} />
                <Phone size={13} color="#a5b4fc" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
              </div>
            </FormField>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center', marginTop:18, paddingTop:14, borderTop:'1.5px solid #f0f2ff' }}>
            {saved && <span style={{ color:'#10b981', display:'flex', alignItems:'center', gap:5, fontSize:'0.83rem', fontWeight:700, background:'#f0fdf4', padding:'6px 12px', borderRadius:10, border:'1px solid #bbf7d0' }}><CheckCircle size={14} /> Saved!</span>}
            <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* ══ Change Password ══ */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, paddingBottom:14, borderBottom:'1.5px solid #f0f2ff' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#fef3c7,#fde68a)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Lock size={17} color="#d97706" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.95rem', color:'#1e293b' }}>Change Password</div>
              <div style={{ fontSize:'0.7rem', color:'#a5b4fc', fontWeight:500 }}>An OTP will be sent to your registered email</div>
            </div>
          </div>

          {(pwdStep === STEP.IDLE || pwdStep === STEP.SENDING) && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <FormField label="New Password">
                  <div style={{ position:'relative' }}>
                    <input className="input" type={showNew?'text':'password'} value={pwd.newPwd}
                      onChange={e => setPwd({...pwd, newPwd:e.target.value})}
                      placeholder="Min 8 characters" style={{ paddingRight:40 }} disabled={pwdStep===STEP.SENDING} />
                    <button onClick={() => setShowNew(p=>!p)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#a5b4fc', display:'flex' }}>
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="Confirm Password">
                  <div style={{ position:'relative' }}>
                    <input className="input" type={showConf?'text':'password'} value={pwd.confirm}
                      onChange={e => setPwd({...pwd, confirm:e.target.value})}
                      placeholder="Re-enter password" style={{ paddingRight:40 }} disabled={pwdStep===STEP.SENDING} />
                    <button onClick={() => setShowConf(p=>!p)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#a5b4fc', display:'flex' }}>
                      {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormField>
              </div>
              {pwd.newPwd.length > 0 && sm && (
                <div style={{ marginTop:12, padding:'12px 14px', background:`${sm.bg}99`, borderRadius:12, border:`1px solid ${sm.color}30` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontSize:'0.7rem', color:'#64748b', fontWeight:600 }}>Password strength</span>
                    <span style={{ fontSize:'0.72rem', fontWeight:800, color:sm.color }}>{sm.label}</span>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {[1,2,3,4].map(s => (
                      <div key={s} style={{ flex:1, height:5, borderRadius:99, background:s<=strength?sm.color:'#e0e7ff', transition:'background 0.3s' }} />
                    ))}
                  </div>
                </div>
              )}
              {pwd.confirm.length > 0 && (
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', fontWeight:700,
                  color:pwd.newPwd===pwd.confirm?'#10b981':'#ef4444', padding:'7px 12px', borderRadius:10,
                  background:pwd.newPwd===pwd.confirm?'#f0fdf4':'#fff5f5',
                  border:`1px solid ${pwd.newPwd===pwd.confirm?'#bbf7d0':'#fecaca'}`,
                }}>
                  {pwd.newPwd===pwd.confirm ? <CheckCircle size={13} /> : '✗'}
                  {pwd.newPwd===pwd.confirm ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
              {pwdError && <div style={{ marginTop:10, padding:'9px 13px', background:'#fee2e2', color:'#991b1b', borderRadius:10, fontSize:'0.84rem', fontWeight:600 }}>{pwdError}</div>}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:18, paddingTop:14, borderTop:'1.5px solid #f0f2ff' }}>
                <button className="btn btn-primary" onClick={requestOtp} disabled={pwdStep===STEP.SENDING}>
                  {pwdStep===STEP.SENDING
                    ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Sending OTP...</>
                    : <><Send size={13} /> Send OTP to Email</>}
                </button>
              </div>
            </>
          )}

          {pwdStep === STEP.VERIFY && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius:14, padding:'14px 18px', border:'1.5px solid #bfdbfe', display:'flex', gap:12, alignItems:'flex-start' }}>
                <KeyRound size={18} color="#2563eb" style={{ flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontWeight:700, color:'#1e40af', fontSize:'0.88rem' }}>OTP sent to your email</div>
                  <div style={{ color:'#3b82f6', fontSize:'0.75rem', marginTop:3 }}>Check <strong>{user?.email}</strong> — valid for 10 minutes</div>
                </div>
              </div>
              <FormField label="Enter 6-digit OTP">
                <input className="input" value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="e.g. 823451" maxLength={6}
                  style={{ letterSpacing:'0.3em', fontSize:'1.3rem', fontWeight:800, textAlign:'center', color:'#4338ca' }}
                  autoFocus />
              </FormField>
              {otpError && <div style={{ padding:'9px 13px', background:'#fee2e2', color:'#991b1b', borderRadius:10, fontSize:'0.84rem', fontWeight:600 }}>{otpError}</div>}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:6 }}>
                <button className="btn btn-outline" onClick={cancelOtp}>Cancel</button>
                <button className="btn btn-outline" onClick={requestOtp} style={{ color:'#6366f1', borderColor:'#c7d2fe' }}>Resend OTP</button>
                <button className="btn btn-primary" onClick={confirmOtpAndSave}><Lock size={13} /> Verify & Update</button>
              </div>
            </div>
          )}

          {pwdStep === STEP.SAVING && (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#6366f1', fontWeight:700 }}>
              <div style={{ width:28, height:28, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
              Updating password...
            </div>
          )}

          {pwdStep === STEP.DONE && (
            <div style={{ textAlign:'center', padding:'28px 0' }}>
              <div style={{ width:52, height:52, background:'linear-gradient(135deg,#d1fae5,#a7f3d0)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 16px rgba(16,185,129,0.3)' }}>
                <CheckCircle size={26} color="#059669" />
              </div>
              <div style={{ fontWeight:800, color:'#059669', fontSize:'1rem' }}>Password updated successfully!</div>
              <div style={{ color:'#64748b', fontSize:'0.78rem', marginTop:6 }}>Use your new password on next login</div>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
