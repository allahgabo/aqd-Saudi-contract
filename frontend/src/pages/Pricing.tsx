import React, { useState } from 'react';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import {
  Shield, Star, Crown, Check, Zap, ArrowRight,
  FileText, MessageSquare, GitCompare, Download, Users, Lock
} from 'lucide-react';

const PLANS = [
  {
    name: 'free' as const,
    label: 'Free', labelAr: 'مجاني',
    price: 0,
    period: '',
    color: 'var(--text-muted)',
    border: 'var(--border)',
    bg: 'var(--bg-card)',
    icon: Shield,
    badge: null,
    description: 'Perfect for individuals reviewing occasional contracts',
    features: [
      { text: '3 contract analyses per month',  ok: true },
      { text: 'Basic compliance report',          ok: true },
      { text: 'Saudi Labor Law 2025 check',        ok: true },
      { text: 'Arabic & English support',          ok: true },
      { text: 'PDF report download',              ok: false },
      { text: 'Chat with contract (AI Q&A)',       ok: false },
      { text: 'Compare two contracts',            ok: false },
      { text: 'Share contract report',            ok: false },
    ],
    cta: 'Current Plan',
    ctaStyle: 'ghost',
  },
  {
    name: 'pro' as const,
    label: 'Pro', labelAr: 'احترافي',
    price: 99,
    period: '/month',
    color: 'var(--primary)',
    border: 'rgba(59,130,246,0.4)',
    bg: 'rgba(59,130,246,0.04)',
    icon: Star,
    badge: 'MOST POPULAR',
    description: 'For professionals who regularly review employment contracts',
    features: [
      { text: '30 contract analyses per month', ok: true },
      { text: 'Full compliance report',          ok: true },
      { text: 'Saudi Labor Law 2025 check',       ok: true },
      { text: 'Arabic & English support',         ok: true },
      { text: 'PDF report download',             ok: true },
      { text: 'Chat with contract (AI Q&A)',      ok: true },
      { text: 'Compare two contracts',           ok: true },
      { text: 'Share contract report',           ok: true },
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'primary',
  },
  {
    name: 'enterprise' as const,
    label: 'Enterprise', labelAr: 'مؤسسي',
    price: 299,
    period: '/month',
    color: 'var(--gold)',
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.04)',
    icon: Crown,
    badge: 'UNLIMITED',
    description: 'For HR teams, law firms, and large organizations',
    features: [
      { text: 'Unlimited contract analyses',     ok: true },
      { text: 'All Pro features',                ok: true },
      { text: 'Team dashboard & admin panel',    ok: true },
      { text: 'Bulk contract upload',            ok: true },
      { text: 'API access',                      ok: true },
      { text: 'Priority email support',          ok: true },
      { text: 'Custom AI training on your docs', ok: true },
      { text: 'Dedicated account manager',       ok: true },
    ],
    cta: 'Upgrade to Enterprise',
    ctaStyle: 'gold',
  },
];

const COMPARISON = [
  { feature: 'Contract analyses', free: '3/mo', pro: '30/mo', enterprise: 'Unlimited' },
  { feature: 'Saudi Labor Law 2025', free: '✓', pro: '✓', enterprise: '✓' },
  { feature: 'Arabic & English', free: '✓', pro: '✓', enterprise: '✓' },
  { feature: 'Compliance score', free: '✓', pro: '✓', enterprise: '✓' },
  { feature: 'PDF report', free: '—', pro: '✓', enterprise: '✓' },
  { feature: 'Chat with contract', free: '—', pro: '✓', enterprise: '✓' },
  { feature: 'Compare contracts', free: '—', pro: '✓', enterprise: '✓' },
  { feature: 'Share report link', free: '—', pro: '✓', enterprise: '✓' },
  { feature: 'Admin dashboard', free: '—', pro: '—', enterprise: '✓' },
  { feature: 'API access', free: '—', pro: '—', enterprise: '✓' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, planName, refreshUser } = useAuth();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!isAuthenticated) { navigate('/register'); return; }
    if (plan === planName) return;
    if (plan === 'free') return;

    setUpgrading(plan);
    try {
      await authApi.upgradePlan(plan as any);
      await refreshUser();
      toast.success(`Upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div style={{ padding: '40px 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 60 }} className="animate-fade-up">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 99, background: 'var(--gold-glow)', border: '1px solid var(--border-gold)', marginBottom: 20 }}>
          <Zap size={11} color="var(--gold)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px' }}>TRANSPARENT PRICING</span>
        </div>
        <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 14 }}>
          Simple, honest pricing
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
          Start free — upgrade when you need more. All prices in Saudi Riyals.
        </p>
        {user && (
          <div style={{ marginTop: 16, fontSize: 15, color: 'var(--text-muted)' }}>
            Current plan: <strong style={{ color: 'var(--text)' }}>{user.profile?.plan?.display_name ?? 'Free'}</strong>
            {' · '}
            <Link to="/settings" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Manage account →</Link>
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 60 }} className="stagger">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrent = planName === plan.name;
          const isLoading = upgrading === plan.name;

          return (
            <div key={plan.name} style={{
              background: plan.bg, border: `1px solid ${isCurrent ? plan.color : plan.border}`,
              borderRadius: 18, padding: '28px',
              position: 'relative', overflow: 'hidden',
              boxShadow: isCurrent ? `0 0 30px ${plan.color}20` : 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${plan.color}15`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = isCurrent ? `0 0 30px ${plan.color}20` : 'none'; }}
            >
              {/* Background glow */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `${plan.color}15`, filter: 'blur(30px)', pointerEvents: 'none' }} />

              {/* Badge */}
              {plan.badge && (
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: plan.color, color: plan.name === 'enterprise' ? '#0A0D1A' : 'white', letterSpacing: '0.5px' }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: 16, right: plan.badge ? 88 : 16, fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)', letterSpacing: '0.5px' }}>
                  CURRENT
                </div>
              )}

              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${plan.color}18`, border: `1px solid ${plan.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={21} color={plan.color} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                    {plan.label}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}>{plan.labelAr}</div>
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: plan.price === 0 ? 'var(--text)' : plan.color, letterSpacing: '-2px' }}>
                  {plan.price === 0 ? 'Free' : `SAR ${plan.price}`}
                </span>
                {plan.period && <span style={{ fontSize: 15, color: 'var(--text-dim)', marginLeft: 4 }}>{plan.period}</span>}
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 22 }}>{plan.description}</p>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: f.ok ? 'var(--text)' : 'var(--text-dim)', textDecoration: f.ok ? 'none' : 'none' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: f.ok ? `${plan.color}15` : 'var(--bg-elevated)', border: `1px solid ${f.ok ? plan.color + '30' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {f.ok
                        ? <Check size={10} color={plan.color} />
                        : <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>—</span>}
                    </div>
                    {f.text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.name)}
                disabled={isCurrent || isLoading || plan.name === 'free'}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, cursor: isCurrent || plan.name === 'free' ? 'default' : 'pointer',
                  border: 'none', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  opacity: (isCurrent || plan.name === 'free') ? 0.6 : 1,
                  background: plan.ctaStyle === 'primary'
                    ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                    : plan.ctaStyle === 'gold'
                    ? 'linear-gradient(135deg, var(--gold), #CA8A04)'
                    : 'var(--bg-elevated)',
                  color: plan.ctaStyle === 'gold' ? '#0A0D1A' : plan.ctaStyle === 'ghost' ? 'var(--text-muted)' : 'white',
                  boxShadow: plan.ctaStyle === 'primary' ? '0 4px 16px rgba(59,130,246,0.3)' : plan.ctaStyle === 'gold' ? '0 4px 16px rgba(234,179,8,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {isLoading
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                  : isCurrent ? '✓ Your Current Plan'
                  : <>{plan.cta} <ArrowRight size={13} /></>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 48 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Full feature comparison</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>See exactly what you get with each plan</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>FEATURE</th>
                {['Free', 'Pro', 'Enterprise'].map((p, i) => (
                  <th key={p} style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 800, color: [PLANS[0].color, PLANS[1].color, PLANS[2].color][i] }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 20px', fontSize: 15, color: 'var(--text-muted)' }}>{row.feature}</td>
                  {[row.free, row.pro, row.enterprise].map((val, j) => (
                    <td key={j} style={{ padding: '12px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: val === '—' ? 'var(--text-dim)' : val === '✓' ? 'var(--green)' : 'var(--text)' }}>
                      {val === '✓' ? <Check size={14} color="var(--green)" style={{ margin: 'auto' }} /> : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ / reassurance */}
      <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <Lock size={24} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block' }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Your data stays private</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Contract files are used only for analysis. We never share, sell, or store your documents longer than needed.
          Cancel anytime — no lock-in.
        </p>
      </div>
    </div>
  );
}
