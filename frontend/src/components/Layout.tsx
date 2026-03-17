import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import BackendStatus from './BackendStatus';
import {
  LayoutDashboard, Upload, History, Menu, X, Shield,
  LogOut, Settings, ChevronRight, GitCompare, Zap, Crown, Star, Languages
} from 'lucide-react';

const SIDEBAR_W = 260;

function UsageMeter({ remaining, limit }: { remaining: number; limit: number }) {
  const { lang } = useLang();
  if (limit === -1) return (
    <div style={{ padding: '10px 14px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Crown size={11} color="var(--gold)" />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: lang === 'en' ? '0.5px' : 0 }}>
          {t(T.misc.unlimited, lang).toUpperCase()}
        </span>
      </div>
      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Enterprise</span>
    </div>
  );
  const used = limit - remaining;
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow)' : 'var(--primary)';
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)' }}>
          {lang === 'ar' ? 'التحليلات هذا الشهر' : 'ANALYSES THIS MONTH'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{remaining}/{limit}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${color}60` }} />
      </div>
      {remaining === 0
        ? <Link to="/pricing" style={{ fontSize: 9.5, color: 'var(--yellow)', textDecoration: 'none', fontWeight: 700 }}>{t(T.misc.upgradePrompt, lang)}</Link>
        : <span style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>{remaining} {t(T.misc.remaining, lang)} · {t(T.misc.resetsMonthly, lang)}</span>}
    </div>
  );
}

function NavItem({ to, icon: Icon, label, sub, onClick }: any) {
  const { pathname } = useLocation();
  const { isRTL } = useLang();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));
  return (
    <Link to={to} onClick={onClick} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px',
        borderRadius: 10, transition: 'all 0.15s',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(59,130,246,0.22)' : 'transparent'}`,
        position: 'relative', cursor: 'pointer',
        flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {active && (
          <div style={{
            position: 'absolute',
            [isRTL ? 'right' : 'left']: 0,
            top: '22%', bottom: '22%', width: 3,
            borderRadius: isRTL ? '3px 0 0 3px' : '0 3px 3px 0',
            background: 'linear-gradient(to bottom, var(--primary), var(--accent))',
          }} />
        )}
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={active ? 'var(--primary)' : 'var(--text-dim)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : 'var(--text-muted)' }}>{label}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1 }}>{sub}</div>
        </div>
        {active && <ChevronRight size={11} color="var(--primary)" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />}
      </div>
    </Link>
  );
}

function LangToggle() {
  const { lang, setLang, isRTL } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, width: '100%',
        padding: '8px 12px', marginBottom: 6,
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 8, cursor: 'pointer', fontFamily: 'Outfit, Cairo, sans-serif',
        color: 'var(--primary)', fontSize: 12, fontWeight: 600,
        transition: 'all 0.15s', flexDirection: isRTL ? 'row-reverse' : 'row',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.12)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)'}
      title={lang === 'en' ? 'Switch to Arabic' : 'التبديل للإنجليزية'}
    >
      <Languages size={13} />
      <span>{lang === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, isAdmin, remainingAnalyses, planName } = useAuth();
  const { lang, isRTL } = useLang();
  const navigate = useNavigate();
  const profile = user?.profile;
  const limit = profile?.plan?.monthly_limit ?? 3;

  const NAV = [
    { to: '/',        icon: LayoutDashboard, label: t(T.nav.dashboard,   lang), sub: lang === 'ar' ? 'نظرة عامة وإحصائيات' : 'Overview & stats' },
    { to: '/upload',  icon: Upload,          label: t(T.nav.analyze,     lang), sub: lang === 'ar' ? 'ارفع عقدك'           : 'Upload contract' },
    { to: '/history', icon: History,         label: t(T.nav.myContracts, lang), sub: lang === 'ar' ? 'جميع التحليلات'     : 'All analyses' },
    { to: '/compare', icon: GitCompare,      label: t(T.nav.compare,     lang), sub: lang === 'ar' ? 'قارن عقدين'          : 'Two contracts' },
  ];

  return (
    <div style={{ width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(6,10,20,0.98)', backdropFilter: 'blur(20px)', borderRight: isRTL ? 'none' : '1px solid var(--border)', borderLeft: isRTL ? '1px solid var(--border)' : 'none' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            <Shield size={17} color="white" />
          </div>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>
              {lang === 'ar' ? <><span style={{ fontFamily: 'Cairo, sans-serif' }}>عقد</span> <span style={{ color: 'var(--gold)' }}>·</span> AQD</> : <>AQD <span style={{ color: 'var(--gold)' }}>·</span> <span style={{ fontFamily: 'Playfair Display, serif' }}>عقد</span></>}
            </div>
            <div style={{ fontSize: 7.5, color: 'var(--text-dim)', letterSpacing: lang === 'en' ? '1.5px' : 0, fontWeight: 600 }}>
              {lang === 'ar' ? 'محلل العقود السعودية' : 'SAUDI CONTRACT ANALYZER'}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '14px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 8.5, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: lang === 'en' ? '1.5px' : 0, padding: '0 8px 10px', textAlign: isRTL ? 'right' : 'left' }}>
          {lang === 'ar' ? 'القائمة الرئيسية' : 'MAIN MENU'}
        </div>
        {NAV.map(n => <NavItem key={n.to} {...n} onClick={onClose} />)}

        {isAdmin && (
          <>
            <div style={{ fontSize: 8.5, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: lang === 'en' ? '1.5px' : 0, padding: '16px 8px 10px', textAlign: isRTL ? 'right' : 'left' }}>
              {lang === 'ar' ? 'الإدارة' : 'ADMIN'}
            </div>
            <NavItem to="/admin" icon={Shield} label={t(T.admin.title, lang)} sub={lang === 'ar' ? 'المستخدمون والإحصائيات' : 'Users & analytics'} onClick={onClose} />
          </>
        )}

        <div style={{ padding: '16px 4px 0' }}>
          {user && <UsageMeter remaining={remainingAnalyses} limit={limit} />}
          {planName === 'free' && (
            <Link to="/pricing" onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(59,130,246,0.08))',
              border: '1px solid var(--border-gold)', borderRadius: 10,
              textDecoration: 'none', transition: 'all 0.15s', marginBottom: 4,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(234,179,8,0.14), rgba(59,130,246,0.14))'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(59,130,246,0.08))'}
            >
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={13} color="var(--gold)" />
              </div>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>{t(T.misc.upgradeToPro, lang)}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t(T.misc.upgradeSub, lang)}</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Language toggle + user section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <LangToggle />
        {user ? (
          <>
            <Link to="/settings" onClick={onClose} style={{ textDecoration: 'none', display: 'block', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${user.profile?.avatar_color || 'var(--primary)'}, var(--accent))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>
                  {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                    {planName === 'free' ? (lang === 'ar' ? 'الخطة المجانية' : 'Free Plan') : planName === 'pro' ? 'Pro' : 'Enterprise'}
                  </div>
                </div>
                <Settings size={12} color="var(--text-dim)" />
              </div>
            </Link>
            <button onClick={() => { logout(); navigate('/login'); onClose?.(); }} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: 'var(--red)', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'Outfit, Cairo, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <LogOut size={11} /> {t(T.signOut, lang)}
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Link to="/login" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, fontSize: 11, padding: '8px', textDecoration: 'none', justifyContent: 'center' }}>{t(T.signIn, lang)}</Link>
            <Link to="/register" onClick={onClose} className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: '8px', textDecoration: 'none', justifyContent: 'center' }}>{t(T.signUp, lang)}</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { isRTL } = useLang();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      {/* Desktop sidebar */}
      <div style={{ position: 'fixed', top: 0, [isRTL ? 'right' : 'left']: 0, bottom: 0, width: SIDEBAR_W, zIndex: 40, display: 'none' }} id="aqd-sidebar">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)}>
          <div style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 0, top: 0, bottom: 0, width: SIDEBAR_W }} onClick={e => e.stopPropagation()}>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: 16, top: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text)' }}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }} id="aqd-main">
        {/* Mobile topbar */}
        <header style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'rgba(6,10,20,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 30, flexDirection: isRTL ? 'row-reverse' : 'row' }} id="aqd-topbar">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', color: 'var(--text)' }}>
            <Menu size={17} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Shield size={15} color="var(--primary)" />
            <span style={{ fontWeight: 900, fontSize: 15 }}>AQD <span style={{ color: 'var(--gold)' }}>·</span> <span style={{ fontFamily: 'Playfair Display, Cairo, serif' }}>عقد</span></span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 11, fontWeight: 600, fontFamily: 'Cairo, Outfit, sans-serif' }} />
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              {user ? (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${user.profile?.avatar_color || 'var(--primary)'}, var(--accent))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>
                  {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                </div>
              ) : null}
            </Link>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          <BackendStatus />
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          #aqd-sidebar { display: flex !important; }
          #aqd-main    { ${isRTL ? 'margin-right' : 'margin-left'}: ${SIDEBAR_W}px; }
          #aqd-topbar  { display: none !important; }
        }
        @media (max-width: 768px) {
          #aqd-sidebar { display: none !important; }
          #aqd-main    { margin-left: 0 !important; margin-right: 0 !important; }
          #aqd-topbar  { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
