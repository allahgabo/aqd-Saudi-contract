import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import {
  User, Mail, Building, Phone, Shield, LogOut,
  Crown, Star, Zap, Save, AlertTriangle,
  ArrowRight, Languages
} from 'lucide-react';

const COLORS = ['#3B82F6','#8B5CF6','#EC4899','#EF4444','#F97316','#10B981','#06B6D4','#EAB308'];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, refreshUser, planName, remainingAnalyses } = useAuth();
  const { lang, setLang, isRTL } = useLang();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name:   user?.first_name   ?? '',
    last_name:    user?.last_name    ?? '',
    company:      user?.profile?.company ?? '',
    phone:        user?.profile?.phone   ?? '',
    avatar_color: user?.profile?.avatar_color ?? '#3B82F6',
  });

  if (!user) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Sign in to access settings.</p>
      <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Sign In</Link>
    </div>
  );

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login'); };

  const plan = user.profile?.plan;
  const planIcons: Record<string, any> = { free: Shield, pro: Star, enterprise: Crown };
  const PlanIcon = planIcons[planName] || Shield;
  const planColors: Record<string, string> = { free: 'var(--text-muted)', pro: 'var(--primary)', enterprise: 'var(--gold)' };
  const planColor = planColors[planName] || 'var(--text-muted)';

  return (
    <div style={{ padding: '32px', maxWidth: 720, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Manage your profile, plan, and preferences</p>
      </div>

      {/* Avatar + identity card */}
      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--bg-card), rgba(59,130,246,0.04))', border: '1px solid var(--border-blue)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Avatar preview */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${form.avatar_color}, ${form.avatar_color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 10, boxShadow: `0 0 24px ${form.avatar_color}50` }}>
              {(form.first_name?.[0] || user.username[0]).toUpperCase()}
            </div>
            {/* Color picker */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 76 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => set('avatar_color', c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: form.avatar_color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: 'none', transition: 'transform 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5, letterSpacing: '0.5px' }}>FIRST NAME</label>
                <input className="input" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Ahmed" style={{ fontSize: 15 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5, letterSpacing: '0.5px' }}>LAST NAME</label>
                <input className="input" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Al-Rashidi" style={{ fontSize: 15 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5, letterSpacing: '0.5px' }}>COMPANY (OPTIONAL)</label>
                <input className="input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Your company" style={{ fontSize: 15 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5, letterSpacing: '0.5px' }}>PHONE (OPTIONAL)</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+966 5x xxx xxxx" style={{ fontSize: 15 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 15, opacity: saving ? 0.7 : 1 }}>
            {saving ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</> : <><Save size={13} /> Save Changes</>}
          </button>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'center', fontSize: 14, color: 'var(--text-dim)' }}>
            <Mail size={12} /> {user.email}
            <span style={{ color: 'var(--border-light)' }}>·</span>
            <User size={12} /> @{user.username}
          </div>
        </div>
      </div>

      {/* Plan & Usage */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1.5px', marginBottom: 16 }}>PLAN & USAGE</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px', background: `${planColor}08`, border: `1px solid ${planColor}25`, borderRadius: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${planColor}15`, border: `1px solid ${planColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlanIcon size={20} color={planColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: planColor }}>{plan?.display_name ?? 'Free'} Plan</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
              {plan?.monthly_limit === -1
                ? 'Unlimited analyses per month'
                : `${plan?.monthly_limit ?? 3} analyses per month · ${remainingAnalyses} remaining`}
            </div>
          </div>
          {planName !== 'enterprise' && (
            <Link to="/pricing" className="btn btn-ghost" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} /> Upgrade <ArrowRight size={11} />
            </Link>
          )}
        </div>

        {/* Usage bar */}
        {plan?.monthly_limit !== -1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-dim)', marginBottom: 6 }}>
              <span>This month's usage</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                {user.profile?.contracts_this_month ?? 0} / {plan?.monthly_limit ?? 3}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
                width: `${Math.min(100, ((user.profile?.contracts_this_month ?? 0) / (plan?.monthly_limit ?? 3)) * 100)}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1.5px', marginBottom: 14 }}>ACCOUNT INFO</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { icon: User, label: 'Username', value: `@${user.username}` },
            { icon: Mail, label: 'Email address', value: user.email },
            { icon: Building, label: 'Company', value: form.company || 'Not set' },
            { icon: Shield, label: 'Member since', value: user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString('en-SA', { year: 'numeric', month: 'long' }) : 'Unknown' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--primary-glow)', border: '1px solid var(--border-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={12} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: isRTL ? 0 : '1.5px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Languages size={11} /> {isRTL ? 'اللغة' : 'LANGUAGE'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { code: 'en' as const, label: 'English 🇬🇧', sub: 'English interface' },
            { code: 'ar' as const, label: 'العربية 🇸🇦',  sub: 'واجهة عربية' },
          ].map(({ code, label, sub }) => (
            <button key={code} onClick={() => setLang(code)} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: lang === code ? 'var(--primary-glow)' : 'var(--bg-elevated)',
              border: `1px solid ${lang === code ? 'var(--primary)' : 'var(--border)'}`,
              color: lang === code ? 'var(--primary)' : 'var(--text-muted)',
              fontFamily: 'Cairo, sans-serif', transition: 'all 0.15s',
              fontWeight: lang === code ? 700 : 400,
            }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--red)', letterSpacing: '1.5px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={11} /> DANGER ZONE
        </div>
        <button onClick={handleLogout} style={{ padding: '11px 20px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, color: 'var(--red)', cursor: 'pointer', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Cairo, sans-serif', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut size={14} /> Sign Out of All Devices
        </button>
      </div>
    </div>
  );
}
