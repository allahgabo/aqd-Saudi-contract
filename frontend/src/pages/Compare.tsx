import React, { useEffect, useState } from 'react';
import { contractsApi, Contract } from '../api';
import { useLang } from '../LangContext';
import { BarChart3, FileText, ArrowRight, Loader, ChevronDown } from 'lucide-react';
import { PageSpinner } from '../components/shared';

export default function Compare() {
  const { lang, isRTL } = useLang();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const labels = {
    title:       lang === 'ar' ? 'مقارنة العقود' : 'Compare Contracts',
    subtitle:    lang === 'ar' ? 'اختر عقدين لإجراء تحليل مقارن بالذكاء الاصطناعي' : 'Select two contracts for a side-by-side AI analysis',
    need2:       lang === 'ar' ? 'تحتاج عقدين على الأقل' : 'Need at least 2 contracts',
    need2sub:    lang === 'ar' ? 'حلّل المزيد من العقود أولاً ثم ارجع للمقارنة.' : 'Analyze more contracts first, then come back to compare them.',
    analyzeFirst:lang === 'ar' ? 'تحليل عقد' : 'Analyze a Contract',
    contractA:   lang === 'ar' ? 'العقد أ' : 'Contract A',
    contractB:   lang === 'ar' ? 'العقد ب' : 'Contract B',
    select:      lang === 'ar' ? 'اختر عقداً…' : 'Select a contract…',
    compareBtn:  lang === 'ar' ? 'مقارنة بالذكاء الاصطناعي' : 'Compare with AI',
    comparing:   lang === 'ar' ? 'جاري المقارنة…' : 'Comparing…',
    errDiff:     lang === 'ar' ? 'اختر عقدين مختلفين' : 'Select two different contracts',
    errFail:     lang === 'ar' ? 'فشلت المقارنة. حاول مجدداً.' : 'Comparison failed. Please try again.',
    result:      lang === 'ar' ? 'تحليل المقارنة' : 'Comparison Analysis',
  };

  useEffect(() => {
    contractsApi.list()
      .then(r => setContracts(r.data.filter(c => c.status === 'completed')))
      .finally(() => setLoading(false));
  }, []);

  const compare = async () => {
    if (!c1 || !c2 || c1 === c2) { setError(labels.errDiff); return; }
    setComparing(true); setResult(''); setError('');
    try { const res = await contractsApi.compare(c1, c2); setResult(res.data.comparison); }
    catch { setError(labels.errFail); }
    finally { setComparing(false); }
  };

  const get = (id: string) => contracts.find(c => c.id === id);

  if (loading) return <PageSpinner label={lang === 'ar' ? 'جاري التحميل…' : 'Loading…'} />;

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ marginBottom: 32, textAlign: isRTL ? 'right' : 'left' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: isRTL ? 0 : '-0.5px', marginBottom: 6 }}>{labels.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{labels.subtitle}</p>
      </div>

      {contracts.length < 2 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <BarChart3 size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{labels.need2}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>{labels.need2sub}</p>
          <a href="/upload" className="btn btn-primary" style={{ display: 'inline-flex', fontSize: 15, textDecoration: 'none' }}>{labels.analyzeFirst}</a>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <ContractSelect label={labels.contractA} value={c1} onChange={setC1} contracts={contracts} exclude={c2} lang={lang} isRTL={isRTL} placeholder={labels.select} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={16} color="var(--text-dim)" />
            </div>
            <ContractSelect label={labels.contractB} value={c2} onChange={setC2} contracts={contracts} exclude={c1} lang={lang} isRTL={isRTL} placeholder={labels.select} />
          </div>

          {(c1 || c2) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[c1, c2].map((id, i) => {
                const c = get(id);
                if (!c) return <div key={i} className="card" style={{ opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: 15 }}>{labels.select}</span>
                </div>;
                const risk = { valid: 'var(--green)', attention: 'var(--yellow)', high_risk: 'var(--red)' }[c.overall_risk] || 'var(--yellow)';
                return (
                  <div key={i} className="card" style={{ border: `1px solid ${risk}25` }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${risk}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={risk} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.file_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{c.employer_name || c.contract_type_display}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: risk }}>{c.compliance_score}%</div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c.compliant_count}✓ · {c.attention_count}⚠ · {c.non_compliant_count}✗</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 14, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

          <button onClick={compare} disabled={!c1 || !c2 || c1 === c2 || comparing} className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 16, opacity: (!c1 || !c2 || c1 === c2) ? 0.4 : 1 }}>
            {comparing ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {labels.comparing}</> : <><BarChart3 size={15} /> {labels.compareBtn}</>}
          </button>

          {result && (
            <div className="card" style={{ marginTop: 24, border: '1px solid var(--border-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={14} color="white" />
                </div>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{labels.result}</span>
              </div>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.9, whiteSpace: 'pre-wrap', textAlign: isRTL ? 'right' : 'left' }}>{result}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ContractSelect({ label, value, onChange, contracts, exclude, lang, isRTL, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const selected = contracts.find((c: Contract) => c.id === value);
  const options = contracts.filter((c: Contract) => c.id !== exclude);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: isRTL ? 0 : '1px', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)', fontFamily: 'Cairo, sans-serif', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%', color: selected ? 'var(--text)' : 'var(--text-dim)' }}>
            {selected ? selected.file_name : placeholder}
          </span>
          <ChevronDown size={14} color="var(--text-dim)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>
        {open && (
          <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', maxHeight: 240, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
            {options.map((c: Contract) => {
              const risk = { valid: 'var(--green)', attention: 'var(--yellow)', high_risk: 'var(--red)' }[c.overall_risk] || 'var(--yellow)';
              return (
                <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); }} style={{ width: '100%', padding: '12px 14px', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: c.id === value ? 'var(--primary-glow)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10, textAlign: isRTL ? 'right' : 'left', fontFamily: 'Cairo, sans-serif', transition: 'background 0.1s', flexDirection: isRTL ? 'row-reverse' : 'row', color: 'var(--text)' }}
                  onMouseEnter={e => { if (c.id !== value) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (c.id !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${risk}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={12} color={risk} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.file_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{c.compliance_score}% · {c.employer_name || c.contract_type_display}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
