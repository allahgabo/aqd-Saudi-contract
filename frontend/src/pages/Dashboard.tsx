import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contractsApi, Contract, DashboardStats } from '../api';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import {
  Upload, FileText, CheckCircle, AlertTriangle, XCircle,
  ArrowRight, Clock, RefreshCw, BarChart3, Shield
} from 'lucide-react';
import { timeAgo } from '../utils';

const RISK_MAP = (lang: string) => ({
  valid:     { color: 'var(--green)',  bg: 'var(--green-bg)',  label: t(T.risk.valid, lang as any),     badge: 'badge-valid' },
  attention: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', label: t(T.risk.attention, lang as any), badge: 'badge-attention' },
  high_risk: { color: 'var(--red)',    bg: 'var(--red-bg)',    label: t(T.risk.high_risk, lang as any), badge: 'badge-risk' },
});

function StatCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}10`, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 48, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return (
    <svg width={116} height={116} viewBox="0 0 116 116">
      <circle cx={58} cy={58} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
      <circle cx={58} cy={58} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 1s ease' }} />
      <text x={58} y={62} textAnchor="middle" fill={color} fontSize={22} fontWeight={900} fontFamily="Cairo">{score}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { lang, isRTL } = useLang();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([contractsApi.stats(), contractsApi.list()]);
      setStats(s.data); setRecent(l.data.slice(0, 6));
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const riskMap = RISK_MAP(lang);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t(T.loading, lang)}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Greeting */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: isRTL ? 0 : '-0.5px', marginBottom: 6 }}>
              {t(T.dashboard.title, lang)}{user ? `, ${user.first_name || user.username}` : ''} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{t(T.dashboard.subtitle, lang)}</p>
          </div>
          <Link to="/upload" className="btn btn-gold" style={{ padding: '12px 22px', fontSize: 15, textDecoration: 'none' }}>
            <Upload size={15} /> {t(T.nav.analyze, lang)}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }} className="stagger animate-fade-up">
        <StatCard label={t(T.dashboard.totalAnalyzed, lang)}  value={stats?.total_contracts ?? 0}    sub={t(T.dashboard.allTime, lang)}        color="var(--primary)" icon={FileText} />
        <StatCard label={t(T.dashboard.validContracts, lang)}  value={stats?.valid_contracts ?? 0}    sub={t(T.dashboard.fullyCompliant, lang)}  color="var(--green)"   icon={CheckCircle} />
        <StatCard label={t(T.dashboard.needsAttention, lang)}  value={stats?.attention_contracts ?? 0} sub={t(T.dashboard.reviewRequired, lang)}  color="var(--yellow)"  icon={AlertTriangle} />
        <StatCard label={t(T.dashboard.highRisk, lang)}        value={stats?.high_risk_contracts ?? 0} sub={t(T.dashboard.immediateAction, lang)} color="var(--red)"     icon={XCircle} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Score card */}
        <div className="card animate-fade-up" style={{ display: 'flex', gap: 24, alignItems: 'center', animationDelay: '100ms', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <ScoreRing score={Math.round(stats?.average_compliance_score ?? 0)} />
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>{t(T.dashboard.avgCompliance, lang).toUpperCase()}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{Math.round(stats?.average_compliance_score ?? 0)}%</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              {t(T.dashboard.basedOn, lang)} {stats?.total_contracts ?? 0} {t(T.dashboard.contracts, lang)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { n: stats?.valid_contracts ?? 0,     color: 'var(--green)',  label: lang === 'ar' ? 'صحيح' : 'Valid' },
                { n: stats?.attention_contracts ?? 0,  color: 'var(--yellow)', label: lang === 'ar' ? 'تنبيه' : 'Warn' },
                { n: stats?.high_risk_contracts ?? 0,  color: 'var(--red)',    label: lang === 'ar' ? 'خطر'   : 'Risk' },
              ].map(({ n, color, label }) => (
                <div key={label} style={{ textAlign: 'center', flex: 1, padding: '8px 6px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{n}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: isRTL ? 0 : '1px', marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }}>
            {t(T.dashboard.quickActions, lang).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { to: '/upload',  icon: Upload,    label: t(T.dashboard.analyzeNew, lang),    color: 'var(--primary)', sub: 'PDF, DOCX' },
              { to: '/compare', icon: BarChart3, label: t(T.dashboard.compareTwoDesc, lang), color: 'var(--gold)',    sub: lang === 'ar' ? 'مقارنة ذكية' : 'AI side-by-side' },
              { to: '/history', icon: FileText,  label: t(T.dashboard.viewAllDesc, lang),    color: 'var(--accent)',  sub: `${stats?.total_contracts ?? 0} ${t(T.dashboard.contracts, lang)}` },
            ].map(({ to, icon: Icon, label, color, sub }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', transition: 'all 0.15s', cursor: 'pointer', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{sub}</div>
                  </div>
                  <ArrowRight size={13} color="var(--text-dim)" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent contracts */}
      <div className="card animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{t(T.dashboard.recentAnalyses, lang)}</div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{t(T.dashboard.latestReviews, lang)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}><RefreshCw size={13} /></button>
            <Link to="/history" style={{ fontSize: 14, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {t(T.viewAll, lang)} {isRTL ? null : <ArrowRight size={11} />}
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-glow)', border: '1px solid var(--border-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={24} color="var(--primary)" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t(T.dashboard.noContracts, lang)}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>{t(T.dashboard.uploadFirst, lang)}</p>
            <Link to="/upload" className="btn btn-primary" style={{ fontSize: 15, textDecoration: 'none', display: 'inline-flex' }}>
              <Upload size={14} /> {t(T.dashboard.analyzeFirst, lang)}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recent.map((c, i) => {
              const rm = (riskMap as any)[c.overall_risk] || riskMap.attention;
              return (
                <Link key={c.id} to={`/contracts/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', border: '1px solid var(--border)', transition: 'all 0.15s', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.borderColor = `${rm.color}30`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${rm.color}12`, border: `1px solid ${rm.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color={rm.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{c.file_name}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      {c.employer_name && <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>🏢 {c.employer_name}</span>}
                      <span style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {timeAgo(c.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: rm.color }}>{c.compliance_score ?? '—'}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t(T.history.score, lang)}</div>
                    </div>
                    <span className={`badge ${rm.badge}`}>{rm.label}</span>
                    <ArrowRight size={13} color="var(--text-dim)" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
