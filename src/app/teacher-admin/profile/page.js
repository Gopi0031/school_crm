'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Camera, Save, Lock, CheckCircle, User, Eye, EyeOff, Shield } from 'lucide-react';

export default function TeacherProfile() {
  const { user, updateUser } = useAuth();
  const uid = user?._id;  // ✅ ONLY use this everywhere

  const [form, setForm]             = useState({ email: user?.email || '', phone: user?.phone || '' });
  const [pwd, setPwd]               = useState({ newPwd:'', confirm:'' });
  const [pwdError, setPwdError]     = useState('');
  const [saved, setSaved]           = useState(false);
  const [pwdSaved, setPwdSaved]     = useState(false);
  const [preview, setPreview]       = useState(user?.profileImage || null);
  const [uploading, setUploading]   = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingProfile, setSavingProfile]   = useState(false);
  const [savingPwd, setSavingPwd]           = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res  = await fetch('/api/upload', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ image: reader.result, folder:'profiles' }) });
        const data = await res.json();
        if (data.url) {
          setPreview(data.url);
          await fetch(`/api/users/${uid}`, {  // ✅ uid
            method:'PUT', headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ profileImage: data.url, profileImagePublicId: data.publicId }),
          });
          updateUser({ profileImage: data.url });
        }
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const res  = await fetch(`/api/users/${uid}`, {  // ✅ uid
      method:'PUT', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email: form.email, phone: form.phone }),
    });
    const data = await res.json();
    if (data.success) {
      updateUser({ email: form.email, phone: form.phone });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } else {
      alert(data.message || 'Save failed');
    }
    setSavingProfile(false);
  };

  const savePwd = async () => {
    setPwdError('');
    if (pwd.newPwd.length < 8) { setPwdError('Min 8 characters'); return; }
    if (pwd.newPwd !== pwd.confirm) { setPwdError('Passwords do not match'); return; }
    setSavingPwd(true);
    const res  = await fetch(`/api/users/${uid}`, {  // ✅ uid
      method:'PUT', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ password: pwd.newPwd }),
    });
    const data = await res.json();
    if (data.success) {
      setPwdSaved(true); setPwd({ newPwd:'', confirm:'' });
      setTimeout(() => setPwdSaved(false), 2500);
    } else {
      setPwdError(data.message || 'Failed to update password');
    }
    setSavingPwd(false);
  };

  const strength = !pwd.newPwd ? 0 : pwd.newPwd.length < 6 ? 1 : pwd.newPwd.length < 10 ? 2 : /[A-Z]/.test(pwd.newPwd) && /[0-9]/.test(pwd.newPwd) ? 4 : 3;
  const strengthLabel = ['','Weak','Fair','Good','Strong'];
  const strengthColor = ['','#ef4444','#f59e0b','#3b82f6','#10b981'];

  return (
    <AppLayout requiredRole="teacher-admin">
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <PageHeader title="My Profile" subtitle="Manage your account details" />

      <div style={{ maxWidth:820, display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Profile Card ── */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ height:72, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', position:'relative' }} />
          <div style={{ padding:'0 24px 20px' }}>
            <div style={{ position:'relative', display:'inline-block', marginTop:-36 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', fontWeight:800, color:'white', overflow:'hidden', border:'3px solid white', boxShadow:'0 4px 12px rgba(79,70,229,0.3)' }}>
                {preview ? <img src={preview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.name?.charAt(0)}
              </div>
              <label style={{ position:'absolute', bottom:0, right:0, width:26, height:26, background:'#4f46e5', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid white', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}>
                {uploading ? <div style={{ width:11, height:11, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> : <Camera size={12} color="white" />}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
              </label>
            </div>
            <div style={{ marginTop:10 }}>
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>{user?.name}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ background:'#eff6ff', color:'#4f46e5', padding:'2px 9px', borderRadius:20, fontWeight:600, fontSize:'0.7rem' }}>Teacher Admin</span>
                <span>•</span><span>{user?.branch}</span>
                <span>•</span><span>{user?.class} — Section {user?.section}</span>
              </div>
              {uploading && <div style={{ fontSize:'0.72rem', color:'#4f46e5', marginTop:4, fontWeight:600 }}>⏳ Uploading photo...</div>}
            </div>
          </div>
        </div>

        {/* ── Personal Details ── */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}><User size={16} color="#4f46e5" /></div>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#1e293b' }}>Personal Details</div>
              <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Read-only fields are set by admin</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              ['Full Name',       user?.name   || ''],
              ['Role',            'Teacher Admin'],
              ['Branch',          user?.branch || ''],
              ['Class — Section', `${user?.class || ''} — ${user?.section || ''}`],
            ].map(([label, value]) => (
              <FormField key={label} label={label}>
                <div style={{ position:'relative' }}>
                  <input className="input" value={value} disabled style={{ background:'#f8fafc', color:'#94a3b8', cursor:'not-allowed', paddingRight:32 }} />
                  <Shield size={12} color="#cbd5e1" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)' }} />
                </div>
              </FormField>
            ))}
            <FormField label="Email">
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            </FormField>
            <FormField label="Phone">
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" />
            </FormField>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center', marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
            {saved && <span style={{ color:'#10b981', display:'flex', alignItems:'center', gap:5, fontSize:'0.83rem', fontWeight:600 }}><CheckCircle size={15} /> Changes saved!</span>}
            <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}><Lock size={16} color="#d97706" /></div>
            <div>
              <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#1e293b' }}>Change Password</div>
              <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>Minimum 8 characters recommended</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <FormField label="New Password">
              <div style={{ position:'relative' }}>
                <input className="input" type={showNewPwd ? 'text' : 'password'} value={pwd.newPwd}
                  onChange={e => setPwd({ ...pwd, newPwd: e.target.value })} placeholder="Min 8 characters" style={{ paddingRight:38 }} />
                <button onClick={() => setShowNewPwd(p => !p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                  {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm Password">
              <div style={{ position:'relative' }}>
                <input className="input" type={showConfirmPwd ? 'text' : 'password'} value={pwd.confirm}
                  onChange={e => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Re-enter password" style={{ paddingRight:38 }} />
                <button onClick={() => setShowConfirmPwd(p => !p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                  {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>
          </div>
          {pwd.newPwd.length > 0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,3,4].map(s => <div key={s} style={{ flex:1, height:4, borderRadius:3, background: s <= strength ? strengthColor[strength] : '#e2e8f0', transition:'background 0.3s' }} />)}
              </div>
              <div style={{ fontSize:'0.72rem', color: strengthColor[strength], fontWeight:600, marginTop:4 }}>{strengthLabel[strength]}</div>
            </div>
          )}
          {pwd.confirm.length > 0 && (
            <div style={{ marginTop:8, fontSize:'0.75rem', fontWeight:600, color: pwd.newPwd === pwd.confirm ? '#10b981' : '#ef4444', display:'flex', alignItems:'center', gap:5 }}>
              {pwd.newPwd === pwd.confirm ? <><CheckCircle size={13} /> Passwords match</> : '✗ Passwords do not match'}
            </div>
          )}
          {pwdError && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'9px 12px', borderRadius:9, fontSize:'0.83rem', marginTop:10 }}>⚠️ {pwdError}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', alignItems:'center', marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
            {pwdSaved && <span style={{ color:'#10b981', display:'flex', alignItems:'center', gap:5, fontSize:'0.83rem', fontWeight:600 }}><CheckCircle size={15} /> Password updated!</span>}
            <button className="btn btn-primary" onClick={savePwd} disabled={savingPwd}>
              {savingPwd ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Updating...</> : <><Lock size={13} /> Update Password</>}
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
