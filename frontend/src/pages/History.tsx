import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contractsApi, Contract } from '../api';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { FileText, Upload, Trash2, Clock, Search, ArrowRight, CheckCircle, AlertTriangle, XCircle, Filter, Download } from 'lucide-react';
import { timeAgo, exportContractsCSV } from '../utils';
import toast from 'react-hot-toast';

type F = 'all' | 'valid' | 'attention' | 'high_risk';

export default function History() {
  const { lang, isRTL } = useLang();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<F>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const RISK_MAP = {
    valid:     { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: CheckCircle,   label: t(T.risk.valid,     lang), badge: 'badge-valid' },
    attention: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertTriangle, label: t(T.risk.attention, lang), badge: 'badge-attention' },
    high_risk: { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: XCircle,       label: t(T.risk.high_risk, lang), badge: 'badge-risk' },
  };

  const FILTERS: { key: F; label: string }[] = [
    { key: 'all',       label: t(T.history.all, lang) },
    { key: 'valid',     label: t(T.risk.valid, lang) },
    { key: 'attention', label: t(T.risk.attention, lang) },
    { key: 'high_risk', label: t(T.risk.high_risk, lang) },
  ];

  const load = useCallback(() => {
    setLoading(true);
    contractsApi.list()
      .then(r => setContracts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm(lang === 'ar' ? 'حذف هذا التحليل؟ لا يمكن التراجع.' : 'Delete this analysis? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await contractsApi.delete(id);
      setContracts(c => c.filter(x => x.id !== id));
      toast.success(lang === 'ar' ? 'تم حذف التحليل' : 'Contract analysis deleted');
    } catch {
      toast.error(lang === 'ar' ? 'فشل الحذف' : 'Failed to delete — please try again');
    } finally { setDeleting(null); }
  };

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.file_name.toLowerCase().includes(q) || (c.employer_name || '').toLowerCase().includes(q) || (c.job_title || '').toLowerCase().includes(q);
    return match && (filter === 'all' || c.overall_risk === filter);
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: 920, margin: '0 auto' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: isRTL ? 0 : '-0.5px' }}>{t(T.nav.myContracts, lang)}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {contracts.length} {contracts.length === 1 ? t(T.history.analyzed, lang) : t(T.history.analyzedPlural, lang)}
            {filtered.length !== contracts.length && ` · ${filtered.length} ${t(T.history.shown, lang)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {contracts.length > 0 && (
            <button onClick={() => { exportContractsCSV(contracts); toast.success(lang === 'ar' ? 'تم التصدير!' : 'Exported!'); }}
              className="btn btn-ghost" style={{ fontSize: 12, padding: '10px 14px', cursor: 'pointer' }}>
              <Download size={13} /> {t(T.history.exportCSV, lang)}
            </button>
          )}
          <Link to="/upload" className="btn btn-gold" style={{ padding: '11px 20px', fontSize: 13, textDecoration: 'none' }}>
            <Upload size={14} /> {t(T.history.analyzeNew, lang)}
          </Link>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', [isRTL ? 'right' : 'left']: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t(T.history.search, lang)}
            className="input" style={{ [isRTL ? 'paddingRight' : 'paddingLeft']: 32, fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            const color = key === 'all' ? 'var(--primary)' : (RISK_MAP as any)[key]?.color;
            const count = key === 'all' ? contracts.length : contracts.filter(c => c.overall_risk === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)} style={{ padding: '7px 13px', borderRadius: 99, cursor: 'pointer', fontFamily: 'Cairo, Outfit, sans-serif', background: active ? `${color}15` : 'var(--bg-elevated)', color: active ? color : 'var(--text-muted)', border: `1px solid ${active ? `${color}30` : 'var(--border)'}`, fontSize: 11, fontWeight: active ? 700 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                {key === 'all' && <Filter size={10} />}
                {label}
                <span style={{ fontSize: 9, background: active ? color : 'var(--border)', color: active ? 'white' : 'var(--text-dim)', borderRadius: 99, padding: '1px 5px', fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            {contracts.length === 0 ? t(T.history.noContracts, lang) : t(T.history.noMatch, lang)}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            {contracts.length === 0 ? t(T.history.uploadFirst, lang) : t(T.history.adjustSearch, lang)}
          </p>
          {contracts.length === 0
            ? <Link to="/upload" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', fontSize: 13 }}><Upload size={14} /> {t(T.history.analyzeNew, lang)}</Link>
            : <button onClick={() => { setSearch(''); setFilter('all'); }} className="btn btn-ghost" style={{ cursor: 'pointer' }}>{t(T.history.clearFilters, lang)}</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c, i) => {
            const rm = (RISK_MAP as any)[c.overall_risk] || RISK_MAP.attention;
            const Icon = rm.icon;
            return (
              <Link key={c.id} to={`/contracts/${c.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', transition: 'all 0.15s', flexDirection: isRTL ? 'row-reverse' : 'row' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${rm.color}40`; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: rm.bg, border: `1px solid ${rm.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={19} color={rm.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.file_name}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    {c.employer_name && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>🏢 {c.employer_name}</span>}
                    {c.job_title    && <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>💼 {c.job_title}</span>}
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {timeAgo(c.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: rm.color, lineHeight: 1 }}>{c.compliance_score ?? '—'}%</div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', fontWeight: 600 }}>{t(T.history.score, lang)}</div>
                  </div>
                  <span className={`badge ${rm.badge}`}>{rm.label}</span>
                  <button onClick={e => del(c.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, borderRadius: 6, display: 'flex' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}
                  >
                    {deleting === c.id
                      ? <div style={{ width: 13, height: 13, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <Trash2 size={13} />}
                  </button>
                  <ArrowRight size={13} color="var(--text-dim)" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
