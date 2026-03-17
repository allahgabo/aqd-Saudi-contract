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
const ASSESSMENT_CFG: Record<Assessment, { color: string; bg: string; icon: any; label: string }> = {
  compliant:            { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: CheckCircle, label: 'Compliant' },
  needs_clarification:  { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertTriangle, label: 'Needs Clarification' },
  may_non_compliant:    { color: 'var(--red)',     bg: 'var(--red-bg)',    icon: XCircle, label: 'May Be Non-Compliant' },
  missing:              { color: 'var(--red)',     bg: 'var(--red-bg)',    icon: XCircle, label: 'Missing' },
  ambiguous:            { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: Info, label: 'Ambiguous' },
  unusual:              { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertCircle, label: 'Unusual' },
};
const RISK_CFG: Record<RiskLevel, { color: string; bg: string }> = {
  low:      { color: 'var(--green)',  bg: 'var(--green-bg)' },
  medium:   { color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  high:     { color: 'var(--red)',    bg: 'var(--red-bg)' },
  critical: { color: '#fff',          bg: 'var(--red)' },
};

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
      <text x={54} y={58} textAnchor="middle" fill={color} fontSize={20} fontWeight={900} fontFamily="Outfit">{score}%</text>
    </svg>
  );
}

function ClauseCard({ clause }: { clause: ClauseAnalysis }) {
  const [open, setOpen] = useState(clause.assessment !== 'compliant');
  const cfg = ASSESSMENT_CFG[clause.assessment] || ASSESSMENT_CFG.needs_clarification;
  const riskCfg = RISK_CFG[clause.risk_level] || RISK_CFG.medium;
  const Icon = cfg.icon;

  return (
    <div style={{ border: `1px solid ${open ? cfg.color + '30' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', overflow: 'hidden', transition: 'border-color 0.2s', marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: open ? `${cfg.color}06` : 'var(--bg-card)',
        border: 'none', cursor: 'pointer', padding: '13px 16px',
        display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s',
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={cfg.color} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{clause.clause_title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{clause.category_display}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', border: `1px solid ${cfg.color}20` }}>{cfg.label}</span>
          <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: riskCfg.bg, color: riskCfg.color }}>{clause.risk_level.toUpperCase()}</span>
          {open ? <ChevronUp size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '16px', borderTop: `1px solid ${cfg.color}20`, background: 'var(--bg-elevated)' }}>
          {clause.clause_text && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, borderLeft: `3px solid ${cfg.color}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: 5 }}>CONTRACT TEXT</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>"{clause.clause_text}"</p>
            </div>
          )}
          {clause.explanation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: 5 }}>ASSESSMENT</div>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>{clause.explanation}</p>
            </div>
          )}
          {clause.regulatory_reference && (
            <div style={{ marginBottom: 12, padding: '9px 12px', background: 'rgba(59,130,246,0.05)', borderRadius: 8, border: '1px solid var(--border-blue)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Scale size={9} /> LEGAL REFERENCE
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{clause.regulatory_reference}</p>
            </div>
          )}
          {clause.recommendation && (
            <div style={{ padding: '10px 12px', background: `${cfg.color}08`, borderRadius: 8, border: `1px solid ${cfg.color}20` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>💡 RECOMMENDATION</div>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>{clause.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatPanel({ contractId }: { contractId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    'Is my non-compete clause enforceable?',
    'What is my end-of-service gratuity?',
    'Can my employer deduct my salary?',
    'Explain the probation terms in simple words',
  ];

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that question. Please try again.', timestamp: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Contract AI Assistant</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Ask anything about this contract</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)' }}>AI READY</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Sparkles size={32} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Ask any question about this contract
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  padding: '7px 13px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 20,
                  cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', animation: 'fadeUp 0.3s ease both' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                  <Bot size={14} color="white" />
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-elevated)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: 13, lineHeight: 1.7,
                color: m.role === 'user' ? 'white' : 'var(--text)',
              }}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input" value={input} placeholder="Ask about salary, probation, non-compete…"
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            style={{ flex: 1, fontSize: 13 }}
          />
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
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview'|'clauses'|'missing'|'questions'|'chat'>('overview');

  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await contractsApi.share(contract!.id);
      const url = `${window.location.origin}/shared/${res.data.share_token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to create share link');
    } finally { setSharing(false); }
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setContract((await contractsApi.get(id!)).data); }
    catch (err: any) { setError(err.response?.status === 404 ? '404' : 'network'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner label="Loading analysis…" />;
  if (error === '404') return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Contract not found</div>
      <Link to="/history" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to history</Link>
    </div>
  );
  if (error) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <FileText size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
        {error === '404' ? 'Contract not found' : 'Could not load contract'}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        {error === '404'
          ? 'This analysis may have been deleted.'
          : 'Make sure the backend server is running, then try again.'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link to="/history" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
          ← Back to history
        </Link>
        {error !== '404' && (
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 13, fontFamily: 'Outfit' }}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
  if (!contract) return null;

  const riskColor = RISK_COLORS[contract.overall_risk] || 'var(--yellow)';
  const riskLabel = { valid: 'VALID', attention: 'REQUIRES ATTENTION', high_risk: 'HIGH RISK' }[contract.overall_risk] || 'UNKNOWN';

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'clauses',    label: `Clauses (${contract.clauses?.length || 0})` },
    { key: 'missing',    label: `Missing (${contract.missing_clauses?.length || 0})` },
    { key: 'questions',  label: `Questions (${contract.suggested_questions?.length || 0})` },
    { key: 'chat',       label: '💬 Ask AI' },
  ] as const;

  const infoItems = [
    { icon: Building,  label: 'Employer',  value: contract.employer_name },
    { icon: User,      label: 'Employee',  value: contract.employee_name },
    { icon: Briefcase, label: 'Job Title', value: contract.job_title },
    { icon: DollarSign,label: 'Basic Salary', value: contract.basic_salary },
    { icon: DollarSign,label: 'Gross Salary', value: contract.gross_salary },
    { icon: MapPin,    label: 'Location',  value: contract.work_location },
    { icon: Calendar,  label: 'Start Date',value: contract.start_date },
    { icon: Clock,     label: 'Duration',  value: contract.contract_duration },
    { icon: Shield,    label: 'Probation', value: contract.probation_period },
  ].filter(i => i.value);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 960, margin: '0 auto' }} className="animate-fade-up">
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'Outfit' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShare} disabled={sharing} className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 13 }}>
            <Share2 size={13} /> {sharing ? 'Copying…' : 'Share'}
          </button>
          <button onClick={() => contractsApi.downloadReport(contract.id)} className="btn btn-gold" style={{ padding: '9px 18px', fontSize: 13 }}>
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--bg-card), rgba(59,130,246,0.04))', border: `1px solid ${riskColor}25` }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 6 }}>
              {contract.contract_type_display}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: 'break-word', letterSpacing: '-0.3px' }}>
              {contract.file_name}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 500 }}>
                {contract.language === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English'}
              </span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {new Date(contract.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <ScoreRing score={contract.compliance_score || 0} />

          <div style={{ padding: '14px 20px', borderRadius: 12, textAlign: 'center', background: `${riskColor}10`, border: `2px solid ${riskColor}40`, minWidth: 140 }}>
            <div style={{ fontSize: 10, color: riskColor, fontWeight: 800, letterSpacing: '1px' }}>{riskLabel}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: riskColor, marginTop: 4 }}>{contract.compliance_score}%</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>Compliance Score</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { n: contract.compliant_count,      label: 'Compliant', color: 'var(--green)' },
              { n: contract.attention_count,       label: 'Attention', color: 'var(--yellow)' },
              { n: contract.non_compliant_count,   label: 'Issues',    color: 'var(--red)' },
              { n: contract.missing_clauses_count, label: 'Missing',   color: 'var(--text-dim)' },
            ].map(({ n, label, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: `${color}08`, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color }}>{n}</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', borderRadius: 6,
            background: tab === t.key ? 'var(--primary)' : 'transparent',
            color: tab === t.key ? 'white' : 'var(--text-muted)',
            fontSize: 11, fontWeight: tab === t.key ? 700 : 400,
            transition: 'all 0.15s', fontFamily: 'Outfit',
            boxShadow: tab === t.key ? 'var(--shadow-blue)' : 'none',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab === 'overview' && (
          <div>
            {contract.executive_summary && (
              <div style={{ padding: '18px 20px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border-blue)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: 8 }}>EXECUTIVE SUMMARY</div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>{contract.executive_summary}</p>
              </div>
            )}
            {infoItems.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 16 }}>CONTRACT DETAILS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {infoItems.map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Icon size={13} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>{value}</div>
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
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No clauses analyzed.</div>
              : contract.clauses?.map(c => <ClauseCard key={c.id} clause={c} />)}
          </div>
        )}

        {tab === 'missing' && (
          <div>
            {contract.missing_clauses?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No critical missing clauses</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>All essential clauses appear to be present.</div>
              </div>
            ) : contract.missing_clauses?.map(m => {
              const ic = m.importance === 'required' ? 'var(--red)' : m.importance === 'recommended' ? 'var(--yellow)' : 'var(--text-dim)';
              return (
                <div key={m.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{m.clause_name}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: `${ic}15`, color: ic, border: `1px solid ${ic}25` }}>
                      {m.importance.toUpperCase()}
                    </span>
                  </div>
                  {m.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8 }}>{m.description}</p>}
                  {m.regulatory_reference && <div style={{ fontSize: 11, color: 'var(--primary)', fontStyle: 'italic' }}>📜 {m.regulatory_reference}</div>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'questions' && (
          <div>
            <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={14} />
              Ask your employer these questions before signing to clarify important terms.
            </div>
            {contract.suggested_questions?.map((q, i) => {
              const pc = q.priority === 'high' ? 'var(--red)' : q.priority === 'medium' ? 'var(--yellow)' : 'var(--green)';
              return (
                <div key={q.id} className="card" style={{ marginBottom: 10, display: 'flex', gap: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, marginBottom: 8 }}>{q.question}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {q.related_clause && <span style={{ fontSize: 9, color: 'var(--text-dim)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)' }}>{q.related_clause}</span>}
                      <span style={{ fontSize: 9, fontWeight: 700, color: pc, background: `${pc}10`, padding: '2px 8px', borderRadius: 99, border: `1px solid ${pc}20` }}>{q.priority.toUpperCase()} PRIORITY</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'chat' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <ChatPanel contractId={contract.id} />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-muted)' }}>⚠ Disclaimer:</strong> AI-generated for informational purposes only. Not legal advice. Consult a qualified Saudi labor law attorney for critical findings.
      </div>
    </div>
  );
}
