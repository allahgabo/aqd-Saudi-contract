import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { contractsApi, ContractType } from '../api';
import { useAuth } from '../AuthContext';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { Upload as UploadIcon, FileText, X, CheckCircle, AlertCircle, Loader, ChevronDown, Zap, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Upload() {
  const navigate = useNavigate();
  const { canAnalyze, remainingAnalyses, planName, isAuthenticated } = useAuth();
  const { lang, isRTL } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<ContractType>('employment_contract');
  const [step, setStep] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [openType, setOpenType] = useState(false);

  const CONTRACT_TYPES = [
    { value: 'employment_contract' as ContractType, label: t(T.upload.types.employment_contract, lang), desc: lang === 'ar' ? 'عقد توظيف قياسي' : 'Standard employment agreement', icon: '📄' },
    { value: 'offer_letter'        as ContractType, label: t(T.upload.types.offer_letter,        lang), desc: lang === 'ar' ? 'خطاب عرض عمل'    : 'Job offer / appointment letter', icon: '📋' },
    { value: 'addendum'            as ContractType, label: t(T.upload.types.addendum,            lang), desc: lang === 'ar' ? 'تعديل أو ملحق'    : 'Amendment or addendum', icon: '📎' },
    { value: 'other'               as ContractType, label: t(T.upload.types.other,               lang), desc: lang === 'ar' ? 'وثيقة أخرى'      : 'Other employment-related doc', icon: '📁' },
  ];

  const STEPS = [
    t(T.upload.steps.s1, lang), t(T.upload.steps.s2, lang), t(T.upload.steps.s3, lang),
    t(T.upload.steps.s4, lang), t(T.upload.steps.s5, lang), t(T.upload.steps.s6, lang),
    t(T.upload.steps.s7, lang),
  ];

  const handleFile = useCallback((f: File) => {
    if (f.size > 20 * 1024 * 1024) { setError(lang === 'ar' ? 'حجم الملف كبير — الحد الأقصى 20 ميجابايت' : 'File too large — max 20MB'); return; }
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!['.pdf','.docx','.doc','.png','.jpg','.jpeg','.txt'].includes(ext)) {
      setError(lang === 'ar' ? 'صيغة غير مدعومة — استخدم PDF أو DOCX أو JPG أو PNG' : 'Unsupported format — use PDF, DOCX, JPG, PNG');
      return;
    }
    setFile(f); setError('');
  }, [lang]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const submit = async () => {
    if (!file) return;
    setStep('analyzing'); setError('');
    let si = 0;
    const iv = setInterval(() => { si++; if (si < STEPS.length) setAnalysisStep(si); else clearInterval(iv); }, 2000);
    try {
      const res = await contractsApi.upload(file, contractType);
      clearInterval(iv); setAnalysisStep(STEPS.length - 1); setStep('done');
      setTimeout(() => navigate(`/contracts/${res.data.id}`), 800);
    } catch (err: any) {
      clearInterval(iv); setStep('error');
      setError(err.response?.data?.error || (lang === 'ar' ? 'فشل الرفع. حاول مجدداً.' : 'Upload failed. Please try again.'));
    }
  };

  const selectedType = CONTRACT_TYPES.find(t => t.value === contractType)!;

  // ── Analyzing state ────────────────────────────────────────────
  if (step === 'analyzing') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 24 }}>
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }} className="animate-scale-in">
        <div style={{ width: 100, height: 120, margin: '0 auto 32px', position: 'relative', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-blue)' }}>
          <FileText size={40} color="var(--primary)" />
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent)', boxShadow: '0 0 12px var(--primary)', animation: 'scanline 2s ease-in-out infinite' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{t(T.upload.analyzing, lang)}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 36 }}>{t(T.upload.analysisDesc, lang)}</p>
        <div style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i > analysisStep ? 0.3 : 1, transition: 'opacity 0.4s', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i < analysisStep ? <CheckCircle size={16} color="var(--green)" /> :
                 i === analysisStep ? <Loader size={16} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} /> :
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-dim)' }} />}
              </div>
              <span style={{ fontSize: 15, color: i === analysisStep ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === analysisStep ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${((analysisStep + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))', transition: 'width 0.6s cubic-bezier(.16,1,.3,1)', boxShadow: '0 0 10px var(--primary)' }} />
        </div>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }} className="animate-scale-in">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-bg)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
          <CheckCircle size={36} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{t(T.upload.complete, lang)}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{t(T.upload.redirecting, lang)}</p>
      </div>
    </div>
  );

  // ── Main form ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ marginBottom: 32, textAlign: isRTL ? 'right' : 'left' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6, letterSpacing: isRTL ? 0 : '-0.5px' }}>{t(T.upload.title, lang)}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>{t(T.upload.subtitle, lang)}</p>
      </div>

      {/* Quota warning */}
      {isAuthenticated && !canAnalyze && (
        <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <AlertTriangle size={20} color="var(--yellow)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--yellow)', marginBottom: 3 }}>{t(T.upload.limitWarning, lang)}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t(T.upload.limitDesc, lang)}</div>
          </div>
          <Link to="/pricing" className="btn btn-gold" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 14px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Zap size={12} /> {t(T.upgrade, lang)}
          </Link>
        </div>
      )}

      {/* Remaining quota pill */}
      {isAuthenticated && canAnalyze && remainingAnalyses <= 3 && (
        <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.05)', border: '1px solid var(--border-blue)', borderRadius: 8, marginBottom: 16, fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <Zap size={12} color="var(--primary)" />
          <span>
            <strong style={{ color: 'var(--primary)' }}>{remainingAnalyses}</strong>{' '}
            {t(T.misc.remaining, lang)} ·{' '}
            <Link to="/pricing" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>{t(T.misc.upgradePrompt, lang)}</Link>
          </span>
        </div>
      )}

      {/* Step 1: Document type */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: isRTL ? 0 : '1.5px', marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
          {t(T.upload.step1, lang)}
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpenType(!openType)} style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '13px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span style={{ fontSize: 20 }}>{selectedType.icon}</span>
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedType.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{selectedType.desc}</div>
              </div>
            </div>
            <ChevronDown size={16} color="var(--text-dim)" style={{ transform: openType ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          </button>
          {openType && (
            <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
              {CONTRACT_TYPES.map(ct => (
                <button key={ct.value} onClick={() => { setContractType(ct.value); setOpenType(false); }} style={{ width: '100%', padding: '13px 16px', border: 'none', cursor: 'pointer', background: ct.value === contractType ? 'var(--primary-glow)' : 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', textAlign: isRTL ? 'right' : 'left', transition: 'background 0.1s', flexDirection: isRTL ? 'row-reverse' : 'row', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => { if (ct.value !== contractType) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (ct.value !== contractType) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 20 }}>{ct.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{ct.label}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{ct.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: File upload */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: isRTL ? 0 : '1.5px', marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
          {t(T.upload.step2, lang)}
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !file && fileRef.current?.click()}
          style={{ border: `2px dashed ${drag ? 'var(--primary)' : file ? 'var(--green)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-sm)', padding: '40px 24px', textAlign: 'center', cursor: file ? 'default' : 'pointer', background: drag ? 'var(--primary-glow)' : file ? 'var(--green-bg)' : 'var(--bg-elevated)', transition: 'all 0.2s' }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: 'none' }} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <CheckCircle size={22} color="var(--green)" />
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{file.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · {lang === 'ar' ? 'جاهز للتحليل' : 'Ready to analyze'}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', borderRadius: 6, padding: '5px 8px', color: 'var(--red)' }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <UploadIcon size={22} color={drag ? 'var(--primary)' : 'var(--text-dim)'} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                {drag ? (lang === 'ar' ? 'أفلت هنا' : 'Drop it here') : t(T.upload.dragDrop, lang)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{t(T.upload.supported, lang)}</div>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Privacy note */}
      <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-blue)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, textAlign: isRTL ? 'right' : 'left' }}>
        {t(T.upload.privacy, lang)}
      </div>

      <button onClick={submit} disabled={!file || (isAuthenticated && !canAnalyze)} className="btn btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: 16, opacity: !file || (isAuthenticated && !canAnalyze) ? 0.4 : 1 }}>
        {!canAnalyze && isAuthenticated
          ? <><AlertTriangle size={15} /> {t(T.upload.limitReached, lang)}</>
          : <><Zap size={15} /> {t(T.upload.startAnalysis, lang)}</>}
      </button>
    </div>
  );
}
