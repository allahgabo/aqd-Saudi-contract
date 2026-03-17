import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contractsApi, Contract, ClauseAnalysis, Assessment, RiskLevel, ChatMessage } from '../api';
import { PageSpinner } from '../components/shared';
import {
  CheckCircle, AlertTriangle, XCircle, Download, ArrowLeft,
  FileText, Info, AlertCircle, ChevronDown, ChevronUp,
  MessageSquare, Scale, Building, User, DollarSign, Calendar,
  Clock, MapPin, Shield, Briefcase, Send, Bot, Sparkles, Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_COLORS: Record<string, string> = {
  valid: 'var(--green)', attention: 'var(--yellow)', high_risk: 'var(--red)',
};

const RISK_CFG: Record<RiskLevel, { color: string; bg: string }> = {
  low:      { color: 'var(--green)',  bg: 'var(--green-bg)' },
  medium:   { color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  high:     { color: 'var(--red)',    bg: 'var(--red-bg)' },
  critical: { color: '#fff',          bg: 'var(--red)' },
};

function getAssessmentCfg(assessment: Assessment, lang: string) {
  const map: Record<Assessment, { color: string; bg: string; icon: any; label: string }> = {
    compliant:           { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: CheckCircle,   label: lang === 'ar' ? 'متوافق'         : 'Compliant' },
    needs_clarification: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertTriangle, label: lang === 'ar' ? 'يحتاج توضيح'   : 'Needs Clarification' },
    may_non_compliant:   { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: XCircle,       label: lang === 'ar' ? 'قد لا يتوافق' : 'May Be Non-Compliant' },
    missing:             { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: XCircle,       label: lang === 'ar' ? 'مفقود'         : 'Missing' },
    ambiguous:           { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: Info,          label: lang === 'ar' ? 'غامض'          : 'Ambiguous' },
    unusual:             { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertCircle,   label: lang === 'ar' ? 'غير معتاد'     : 'Unusual' },
  };
  return map[assessment] || map.needs_clarification;
}

function ScoreRing({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return (
    <svg width={108} height={108} viewBox="0 0 108 108">
      <circle cx={54} cy={54} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
      <circle cx={54} cy={54} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s ease' }} />
      <text x={54} y={58} textAnchor="middle" fill={color} fontSize={20} fontWeight={900} fontFamily="Cairo">{score}%</text>
    </svg>
  );
}

function ClauseCard({ clause, lang, isRTL }: { clause: ClauseAnalysis; lang: string; isRTL: boolean }) {
  const cfg = getAssessmentCfg(clause.assessment, lang);
  const [open, setOpen] = useState(clause.assessment !== 'compliant');
  const riskCfg = RISK_CFG[clause.risk_level] || RISK_CFG.medium;
  const Icon = cfg.icon;

  const riskLabel: Record<string, string> = {
    low: lang === 'ar' ? 'منخفض' : 'LOW',
    medium: lang === 'ar' ? 'متوسط' : 'MEDIUM',
    high: lang === 'ar' ? 'عالٍ' : 'HIGH',
    critical: lang === 'ar' ? 'حرج' : 'CRITICAL',
  };

  return (
    <div style={{ border: `1px solid ${open ? cfg.color + '30' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 8, transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: open ? `${cfg.color}06` : 'var(--bg-card)', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row', transition: 'background 0.2s' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={cfg.color} />
        </div>
        <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{clause.clause_title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 1 }}>{clause.category_display}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', border: `1px solid ${cfg.color}20` }}>{cfg.label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: riskCfg.bg, color: riskCfg.color }}>{riskLabel[clause.risk_level] || clause.risk_level.toUpperCase()}</span>
          {open ? <ChevronUp size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '16px', borderTop: `1px solid ${cfg.color}20`, background: 'var(--bg-elevated)' }}>
          {clause.clause_text && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, borderLeft: isRTL ? 'none' : `3px solid ${cfg.color}`, borderRight: isRTL ? `3px solid ${cfg.color}` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 5, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === 'ar' ? 'نص العقد' : 'CONTRACT TEXT'}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7, textAlign: isRTL ? 'right' : 'left' }}>"{clause.clause_text}"</p>
            </div>
          )}
          {clause.explanation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 5, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === 'ar' ? 'التقييم' : 'ASSESSMENT'}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, textAlign: isRTL ? 'right' : 'left' }}>{clause.explanation}</p>
            </div>
          )}
          {clause.regulatory_reference && (
            <div style={{ marginBottom: 12, padding: '9px 12px', background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid var(--border-blue)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <Scale size={9} /> {lang === 'ar' ? 'المرجع القانوني' : 'LEGAL REFERENCE'}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>{clause.regulatory_reference}</p>
            </div>
          )}
          {clause.recommendation && (
            <div style={{ padding: '10px 12px', background: `${cfg.color}08`, borderRadius: 8, border: `1px solid ${cfg.color}20` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                💡 {lang === 'ar' ? 'التوصية' : 'RECOMMENDATION'}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500, textAlign: isRTL ? 'right' : 'left' }}>{clause.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatPanel({ contractId, lang, isRTL }: { contractId: string; lang: string; isRTL: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || sending) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await contractsApi.chat(contractId, q, [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: lang === 'ar' ? 'عذراً، لم أتمكن من معالجة سؤالك. حاول مجدداً.' : 'Sorry, I could not process that question. Please try again.', timestamp: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{lang === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'Contract AI Assistant'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{lang === "ar" ? "اسأل أي شيء عن هذا العقد" : "Ask any question about this contract"}</div>
        </div>
        <div style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{lang === "ar" ? "الذكاء الاصطناعي جاهز" : "AI READY"}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Sparkles size={32} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>{lang === "ar" ? "اسأل أي شيء عن هذا العقد" : "Ask any question about this contract"}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {T.detail.chatSuggestions.map((s: any, i: number) => (
                <button key={i} onClick={() => send(s[lang as 'ar' | 'en'])} style={{ padding: '7px 13px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', transition: 'all 0.15s', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >{s[lang as 'ar' | 'en']}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? (isRTL ? 'row' : 'row-reverse') : (isRTL ? 'row-reverse' : 'row'), animation: 'fadeUp 0.3s ease both' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                  <Bot size={14} color="white" />
                </div>
              )}
              <div style={{ maxWidth: '78%', padding: '10px 14px', borderRadius: 14, background: m.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-elevated)', border: m.role === 'user' ? 'none' : '1px solid var(--border)', fontSize: 15, lineHeight: 1.7, color: m.role === 'user' ? 'white' : 'var(--text)', textAlign: isRTL ? 'right' : 'left' }}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input className="input" value={input} placeholder={lang === "ar" ? "اسأل عن الراتب، فترة التجربة..." : "Ask about salary, probation, non-compete..."}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ flex: 1, fontSize: 15 }} />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            className="btn btn-primary" style={{ padding: '10px 14px', flexShrink: 0, opacity: (!input.trim() || sending) ? 0.5 : 1 }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLang();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState<'overview'|'clauses'|'missing'|'questions'|'chat'>('overview');
  const [sharing, setSharing]   = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (contract) setIsShared(contract.is_shared);
  }, [contract]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await contractsApi.share(contract!.id);
      const nowShared = res.data.share_token !== undefined;
      setIsShared(!isShared);
      if (!isShared) {
        const url = `${window.location.origin}/shared/${res.data.share_token}`;
        await navigator.clipboard.writeText(url);
        toast.success(lang === 'ar' ? 'تم نسخ رابط المشاركة! 🔗' : 'Share link copied! 🔗');
      } else {
        toast.success(lang === 'ar' ? 'تم إلغاء المشاركة' : 'Sharing disabled');
      }
    } catch {
      toast.error(lang === 'ar' ? 'فشل إنشاء رابط المشاركة' : 'Failed to create share link');
    } finally { setSharing(false); }
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try { setContract((await contractsApi.get(id!)).data); }
    catch (err: any) { setError(err.response?.status === 404 ? '404' : 'network'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner label={t(T.loading, lang)} />;

  if (error) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
        {error === '404' ? t(T.detail.notFound, lang) : t(T.detail.couldNotLoad, lang)}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>
        {error === '404' ? t(T.detail.deleted, lang) : t(T.detail.backendOffline, lang)}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link to="/history" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          {t(T.detail.backToHistory, lang)}
        </Link>
        {error !== '404' && (
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 15, fontFamily: 'Cairo, sans-serif' }}>
            {t(T.retry, lang)}
          </button>
        )}
      </div>
    </div>
  );

  if (!contract) return null;

  const riskColor = RISK_COLORS[contract.overall_risk] || 'var(--yellow)';
  const riskLabel = {
    valid:     t(T.risk.VALID, lang),
    attention: t(T.risk.ATTENTION, lang),
    high_risk: t(T.risk.HIGH_RISK, lang),
  }[contract.overall_risk] || '';

  const TABS = [
    { key: 'overview',   label: t(T.detail.overview, lang) },
    { key: 'clauses',    label: `${t(T.detail.clauses, lang)} (${contract.clauses?.length || 0})` },
    { key: 'missing',    label: `${t(T.detail.missing, lang)} (${contract.missing_clauses?.length || 0})` },
    { key: 'questions',  label: `${t(T.detail.questions, lang)} (${contract.suggested_questions?.length || 0})` },
    { key: 'chat',       label: t(T.detail.chat, lang) },
  ] as const;

  const infoItems = [
    { icon: Building,   label: t(T.detail.employer,     lang), value: contract.employer_name },
    { icon: User,       label: t(T.detail.employee,     lang), value: contract.employee_name },
    { icon: Briefcase,  label: t(T.detail.jobTitle,     lang), value: contract.job_title },
    { icon: DollarSign, label: t(T.detail.basicSalary,  lang), value: contract.basic_salary },
    { icon: DollarSign, label: t(T.detail.grossSalary,  lang), value: contract.gross_salary },
    { icon: MapPin,     label: t(T.detail.location,     lang), value: contract.work_location },
    { icon: Calendar,   label: t(T.detail.startDate,    lang), value: contract.start_date },
    { icon: Clock,      label: t(T.detail.duration,     lang), value: contract.contract_duration },
    { icon: Shield,     label: t(T.detail.probation,    lang), value: contract.probation_period },
  ].filter(i => i.value);

  const priorityLabel = (p: string) => ({
    high:   t(T.detail.highPriority,   lang),
    medium: t(T.detail.mediumPriority, lang),
    low:    t(T.detail.lowPriority,    lang),
  }[p] || p.toUpperCase());

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 960, margin: '0 auto' }} className="animate-fade-up">
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontFamily: 'Cairo, sans-serif' }}>
          <ArrowLeft size={15} style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} /> {t(T.back, lang)}
        </button>
        <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <button onClick={handleShare} disabled={sharing} className={isShared ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: '9px 14px', fontSize: 15 }}>
            <Share2 size={13} />
            {sharing
              ? (lang === 'ar' ? 'جاري التحديث…' : 'Updating…')
              : isShared
                ? (lang === 'ar' ? 'مشارك ✓' : 'Shared ✓')
                : t(T.share, lang)}
          </button>
          <button onClick={() => contractsApi.downloadReport(contract.id)} className="btn btn-gold" style={{ padding: '9px 18px', fontSize: 15 }}>
            <Download size={14} /> {t(T.detail.downloadPDF, lang)}
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--bg-card), rgba(59,130,246,0.04))', border: `1px solid ${riskColor}25` }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <div style={{ flex: 1, minWidth: 200, textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>{contract.contract_type_display}</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: 'break-word' }}>{contract.file_name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span style={{ fontSize: 13, padding: '3px 9px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {contract.language === 'ar' ? '🇸🇦 عربي' : '🇬🇧 English'}
              </span>
              <span style={{ fontSize: 13, padding: '3px 9px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {new Date(contract.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </div>

          <ScoreRing score={contract.compliance_score || 0} />

          <div style={{ padding: '14px 20px', borderRadius: 12, textAlign: 'center', background: `${riskColor}10`, border: `2px solid ${riskColor}40`, minWidth: 140 }}>
            <div style={{ fontSize: 13, color: riskColor, fontWeight: 800, letterSpacing: lang === 'en' ? '1px' : 0 }}>{riskLabel}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: riskColor, marginTop: 4 }}>{contract.compliance_score}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{t(T.detail.overview, lang)}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { n: contract.compliant_count,      label: t(T.detail.compliant, lang),  color: 'var(--green)' },
              { n: contract.attention_count,       label: t(T.detail.attention, lang),  color: 'var(--yellow)' },
              { n: contract.non_compliant_count,   label: t(T.detail.issues, lang),     color: 'var(--red)' },
              { n: contract.missing_clauses_count, label: t(T.detail.missingLabel, lang), color: 'var(--text-dim)' },
            ].map(({ n, label, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color }}>{n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as any)} style={{
            flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', borderRadius: 6,
            background: tab === tb.key ? 'var(--primary)' : 'transparent',
            color: tab === tb.key ? 'white' : 'var(--text-muted)',
            fontSize: 14, fontWeight: tab === tb.key ? 700 : 400,
            transition: 'all 0.15s', fontFamily: 'Cairo, sans-serif',
            boxShadow: tab === tb.key ? 'var(--shadow-blue)' : 'none',
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'overview' && (
          <div>
            {contract.executive_summary && (
              <div style={{ padding: '18px 20px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-blue)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>
                  {t(T.detail.executiveSummary, lang)}
                </div>
                <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.8, textAlign: isRTL ? 'right' : 'left' }}>{contract.executive_summary}</p>
              </div>
            )}
            {infoItems.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }}>
                  {t(T.detail.contractDetails, lang)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {infoItems.map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      <Icon size={13} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700 }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'clauses' && (
          <div>
            {contract.clauses?.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{lang === 'ar' ? 'لا توجد بنود محللة' : 'No clauses analyzed.'}</div>
              : contract.clauses?.map(c => <ClauseCard key={c.id} clause={c} lang={lang} isRTL={isRTL} />)}
          </div>
        )}

        {tab === 'missing' && (
          <div>
            {contract.missing_clauses?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t(T.detail.noMissingClauses, lang)}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t(T.detail.allPresent, lang)}</div>
              </div>
            ) : contract.missing_clauses?.map(m => {
              const ic = m.importance === 'required' ? 'var(--red)' : m.importance === 'recommended' ? 'var(--yellow)' : 'var(--text-dim)';
              const impLabel = m.importance === 'required' ? (lang === 'ar' ? 'مطلوب' : 'REQUIRED') : m.importance === 'recommended' ? (lang === 'ar' ? 'موصى به' : 'RECOMMENDED') : (lang === 'ar' ? 'اختياري' : 'OPTIONAL');
              return (
                <div key={m.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{m.clause_name}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: `${ic}15`, color: ic, border: `1px solid ${ic}25` }}>{impLabel}</span>
                  </div>
                  {m.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{m.description}</p>}
                  {m.regulatory_reference && <div style={{ fontSize: 14, color: 'var(--primary)', fontStyle: 'italic', textAlign: isRTL ? 'right' : 'left' }}>📜 {m.regulatory_reference}</div>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'questions' && (
          <div>
            <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 14, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <MessageSquare size={14} />
              {t(T.detail.questionsBanner, lang)}
            </div>
            {contract.suggested_questions?.map((q, i) => {
              const pc = q.priority === 'high' ? 'var(--red)' : q.priority === 'medium' ? 'var(--yellow)' : 'var(--green)';
              return (
                <div key={q.id} className="card" style={{ marginBottom: 10, display: 'flex', gap: 14, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{q.question}</p>
                    <div style={{ display: 'flex', gap: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                      {q.related_clause && <span style={{ fontSize: 12, color: 'var(--text-dim)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>{q.related_clause}</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: pc, background: `${pc}10`, padding: '2px 8px', borderRadius: 99, border: `1px solid ${pc}20` }}>{priorityLabel(q.priority)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'chat' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <ChatPanel contractId={contract.id} lang={lang} isRTL={isRTL} />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, textAlign: isRTL ? 'right' : 'left' }}>
        {t(T.detail.disclaimer, lang)}
      </div>
    </div>
  );
}
