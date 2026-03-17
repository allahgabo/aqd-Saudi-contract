import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { Eye, EyeOff, Shield, Zap, ArrowRight, CheckCircle, Languages } from 'lucide-react';

const FEATURES = (lang: string) => [
  lang === 'ar' ? 'تحليل كل بند بالذكاء الاصطناعي'       : 'AI-powered clause-by-clause analysis',
  lang === 'ar' ? 'مطابقة نظام العمل السعودي 2025'         : 'Saudi Labor Law 2025 compliance check',
  lang === 'ar' ? 'دعم العقود العربية والإنجليزية'         : 'Arabic & English contract support',
  lang === 'ar' ? 'تقرير PDF قابل للتنزيل'               : 'Downloadable PDF risk report',
  lang === 'ar' ? 'كشف البنود المفقودة'                   : 'Missing clause detection',
];

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { lang, setLang, isRTL } = useLang();
  const isLogin = mode === 'login';
  const from = (location.state as any)?.from || '/';

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', first_name: '', last_name: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => { setForm(f => ({...f, [k]: v})); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && form.password !== form.confirmPassword) { setError(t(T.auth.passwordMismatch, lang)); return; }
    setLoading(true); setError('');
    try {
      if (isLogin) { await login(form.username, form.password); }
      else { await register({ username: form.username, email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name }); }
      navigate(from, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data;
      setError(typeof detail === 'object' ? Object.entries(detail).map(([k,v]) => `${Array.isArray(v) ? (v as any)[0] : v}`).join(' · ') : detail || 'Authentication failed');
    } finally { setLoading(false); }
  };

  const inputStyle = { fontSize: 13 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden', direction: isRTL ? 'rtl' : 'ltr' as any }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(234,179,8,0.10)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Language toggle top-right */}
      <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} style={{ position: 'absolute', top: 20, [isRTL ? 'left' : 'right']: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 99, cursor: 'pointer', color: 'var(--primary)', fontSize: 12, fontWeight: 600, fontFamily: 'Cairo, Outfit, sans-serif' }}>
        <Languages size={13} /> {lang === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Left branding panel */}
      <div className="hide-mobile" style={{ width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', zIndex: 1, textAlign: isRTL ? 'right' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
            <Shield size={24} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{t(T.appName, lang)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500, letterSpacing: isRTL ? 0 : '1px' }}>{t(T.appTagline, lang).toUpperCase()}</div>
          </div>
        </div>

        <h1 style={{ fontSize: 48, lineHeight: 1.1, fontWeight: 900, marginBottom: 20, letterSpacing: isRTL ? 0 : '-1px' }}>
          {t(T.auth.knowRights, lang)}<br />
          <span className="gradient-text" style={{ fontFamily: isRTL ? 'Cairo, sans-serif' : 'Playfair Display, serif', fontStyle: isRTL ? 'normal' : 'italic' }}>
            {t(T.auth.beforeYouSign, lang)}
          </span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
          {lang === 'ar'
            ? 'مراجعة عقد العمل بالذكاء الاصطناعي وفق نظام العمل السعودي. احمِ نفسك قبل التوقيع.'
            : 'AI-powered employment contract review aligned with Saudi Labor Law. Protect yourself before signing anything.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FEATURES(lang).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={12} color="var(--green)" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'var(--gold-glow)', border: '1px solid var(--border-gold)', width: 'fit-content', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Zap size={13} color="var(--gold)" />
          <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{t(T.auth.poweredBy, lang)}</span>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 440 }} className="animate-scale-in">
          <div style={{ background: 'rgba(12,20,40,0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '40px', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>

            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
              {isLogin ? t(T.auth.welcomeBack, lang) : t(T.auth.createAccount, lang)}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28, textAlign: isRTL ? 'right' : 'left' }}>
              {isLogin ? t(T.auth.signInSubtitle, lang) : t(T.auth.signUpSubtitle, lang)}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!isLogin && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { key: 'first_name', label: t(T.auth.firstName, lang), ph: lang === 'ar' ? 'أحمد' : 'Ahmed' },
                      { key: 'last_name',  label: t(T.auth.lastName, lang),  ph: lang === 'ar' ? 'الراشدي' : 'Al-Rashidi' },
                    ].map(({ key, label, ph }) => (
                      <div key={key}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>{label}</label>
                        <input className="input" value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                )}
                {!isLogin && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>{t(T.auth.email, lang)}</label>
                    <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>{t(T.auth.username, lang)}</label>
                  <input className="input" value={form.username} onChange={e => set('username', e.target.value)} placeholder={lang === 'ar' ? 'اسم_المستخدم' : 'your_username'} required autoComplete="username" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>{t(T.auth.password, lang)}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, [isRTL ? 'paddingLeft' : 'paddingRight']: 44 }} autoComplete={isLogin ? 'current-password' : 'new-password'} />
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2 }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {!isLogin && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: 5 }}>{t(T.auth.confirmPassword, lang)}</label>
                    <input className="input" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" required style={inputStyle} />
                  </div>
                )}
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 14, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading
                    ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {t(T.auth.processing, lang)}</>
                    : <>{isLogin ? t(T.signIn, lang) : t(T.signUp, lang)} <ArrowRight size={15} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /></>}
                </button>
              </div>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{isLogin ? t(T.auth.noAccount, lang) : t(T.auth.haveAccount, lang)}</span>
              <Link to={isLogin ? '/register' : '/login'} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {isLogin ? t(T.auth.signUpFree, lang) : t(T.signIn, lang)}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
