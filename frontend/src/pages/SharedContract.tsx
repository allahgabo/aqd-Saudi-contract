import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, Contract, ClauseAnalysis, Assessment } from '../api';
import { Shield, CheckCircle, AlertTriangle, XCircle, Download,
         ChevronDown, ChevronUp, Scale, Info, AlertCircle } from 'lucide-react';

const ASSESSMENT_CFG: Record<Assessment, { color: string; bg: string; icon: any; label: string }> = {
  compliant:           { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: CheckCircle, label: 'Compliant' },
  needs_clarification: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertTriangle, label: 'Needs Clarification' },
  may_non_compliant:   { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: XCircle, label: 'May Be Non-Compliant' },
  missing:             { color: 'var(--red)',    bg: 'var(--red-bg)',    icon: XCircle, label: 'Missing' },
  ambiguous:           { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: Info, label: 'Ambiguous' },
  unusual:             { color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertCircle, label: 'Unusual' },
};

const backendBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function ClauseCard({ clause }: { clause: ClauseAnalysis }) {
  const [open, setOpen] = useState(clause.assessment !== 'compliant');
  const cfg = ASSESSMENT_CFG[clause.assessment] || ASSESSMENT_CFG.needs_clarification;
  const Icon = cfg.icon;
  return (
    <div style={{ border: `1px solid ${open ? cfg.color + '30' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 8, transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: open ? `${cfg.color}06` : 'var(--bg-card)', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={cfg.color} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{clause.clause_title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{clause.category_display}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, whiteSpace: 'nowrap' }}>{cfg.label}</span>
        {open ? <ChevronUp size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${cfg.color}18`, background: 'var(--bg-elevated)' }}>
          {clause.clause_text && (
            <div style={{ marginBottom: 12, padding: '9px 12px', background: 'var(--bg-card)', borderRadius: 7, borderLeft: `3px solid ${cfg.color}` }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>"{clause.clause_text}"</p>
            </div>
          )}
          {clause.explanation && <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, marginBottom: 10 }}>{clause.explanation}</p>}
          {clause.regulatory_reference && (
            <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.05)', borderRadius: 7, border: '1px solid var(--border-blue)', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}><Scale size={9} /> LEGAL REFERENCE</div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{clause.regulatory_reference}</p>
            </div>
          )}
          {clause.recommendation && (
            <div style={{ padding: '9px 12px', background: `${cfg.color}08`, borderRadius: 7, border: `1px solid ${cfg.color}20` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, marginBottom: 3 }}>💡 RECOMMENDATION</div>
              <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>{clause.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SharedContract() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<Contract>(`/contracts/shared/${token}/`)
      .then(r => setContract(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (error || !contract) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: 32 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Contract not found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          This shared contract link is invalid or has been disabled by the owner.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          Go to AQD →
        </Link>
      </div>
    </div>
  );

  const riskColor = { valid: 'var(--green)', attention: 'var(--yellow)', high_risk: 'var(--red)' }[contract.overall_risk] || 'var(--yellow)';
  const riskLabel = { valid: '✓ VALID', attention: '⚠ REQUIRES ATTENTION', high_risk: '✗ HIGH RISK' }[contract.overall_risk] || '';

  return (
    <div style={{ background: 'var(--bg-deep)', minHeight: '100vh', padding: '0 0 60px' }}>
      {/* Shared header banner */}
      <div style={{ background: 'rgba(8,13,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 14 }}>AQD <span style={{ color: 'var(--gold)' }}>·</span> <span style={{ fontFamily: 'Playfair Display, serif' }}>عقد</span></span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 8px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>Shared Report</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.open(`${backendBase}/reports/${contract.id}/download/`, '_blank')} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Download size={12} /> Download PDF
          </button>
          <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: 12, padding: '7px 14px' }}>
            Analyze Your Contract Free →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '32px auto', padding: '0 24px' }}>
        {/* Contract header */}
        <div className="card" style={{ marginBottom: 20, border: `1px solid ${riskColor}25` }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4 }}>
                {contract.contract_type_display}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, wordBreak: 'break-word' }}>{contract.file_name}</h1>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{contract.language === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English'}</span>
              </div>
            </div>

            {/* Score ring */}
            <svg width={90} height={90} viewBox="0 0 90 90">
              <circle cx={45} cy={45} r={36} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
              <circle cx={45} cy={45} r={36} fill="none" stroke={riskColor} strokeWidth={8}
                strokeDasharray={`${((contract.compliance_score||0)/100)*2*Math.PI*36} ${2*Math.PI*36}`}
                strokeDashoffset={2*Math.PI*36/4} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${riskColor})` }} />
              <text x={45} y={49} textAnchor="middle" fill={riskColor} fontSize={18} fontWeight={900} fontFamily="Outfit">{contract.compliance_score}%</text>
            </svg>

            <div style={{ padding: '12px 18px', borderRadius: 10, background: `${riskColor}10`, border: `2px solid ${riskColor}40`, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: riskColor, fontWeight: 800, letterSpacing: '1px' }}>{riskLabel}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {[
                  { n: contract.compliant_count,    label: 'OK',      color: 'var(--green)' },
                  { n: contract.attention_count,     label: 'Warn',    color: 'var(--yellow)' },
                  { n: contract.non_compliant_count, label: 'Issue',   color: 'var(--red)' },
                ].map(({ n, label, color }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color }}>{n}</div>
                    <div style={{ fontSize: 8, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {contract.executive_summary && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>
              {contract.executive_summary}
            </div>
          )}
        </div>

        {/* Key info */}
        {[contract.employer_name, contract.job_title, contract.basic_salary, contract.work_location].some(Boolean) && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 14 }}>CONTRACT DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Employer',  value: contract.employer_name  },
                { label: 'Job Title', value: contract.job_title      },
                { label: 'Salary',    value: contract.basic_salary   },
                { label: 'Location',  value: contract.work_location  },
                { label: 'Probation', value: contract.probation_period },
                { label: 'Start Date',value: contract.start_date     },
              ].filter(i => i.value).map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 3 }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clauses */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Clause Analysis</h2>
          {contract.clauses?.map(c => <ClauseCard key={c.id} clause={c} />)}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-muted)' }}>⚠ Disclaimer:</strong> This AI-generated report is for informational purposes only. Not legal advice. Consult a qualified Saudi labor attorney for critical decisions.
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24, textAlign: 'center', padding: '28px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(234,179,8,0.06))', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Analyze your own contract</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>Get AI-powered Saudi Labor Law compliance review in seconds — free to start.</p>
          <Link to="/register" className="btn btn-gold" style={{ textDecoration: 'none', display: 'inline-flex', fontSize: 13, padding: '11px 24px' }}>
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
