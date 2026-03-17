import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, FileText, CheckCircle, ArrowRight, Star,
  Lock, Globe, BarChart3, MessageSquare, Download,
  AlertTriangle, Clock, Upload
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap, color: 'var(--gold)', bg: 'rgba(234,179,8,0.1)',
    title: 'Instant AI Analysis',
    desc: 'Upload any contract and get a full compliance report in under 30 seconds powered by GPT-4o.',
  },
  {
    icon: Shield, color: 'var(--primary)', bg: 'var(--primary-glow)',
    title: 'Saudi Labor Law 2025',
    desc: 'Every clause is checked against the latest labor law amendments effective February 19, 2025.',
  },
  {
    icon: Globe, color: 'var(--accent)', bg: 'rgba(6,182,212,0.1)',
    title: 'Arabic & English',
    desc: 'Analyze contracts in both Arabic and English. Native support for both languages.',
  },
  {
    icon: BarChart3, color: 'var(--green)', bg: 'var(--green-bg)',
    title: 'Compare Contracts',
    desc: 'Have two offers? Compare them side-by-side and get an AI recommendation on which is better.',
  },
  {
    icon: MessageSquare, color: '#A855F7', bg: 'rgba(168,85,247,0.1)',
    title: 'Chat with Your Contract',
    desc: 'Ask plain-language questions about any clause and get instant expert explanations.',
  },
  {
    icon: Download, color: 'var(--red)', bg: 'var(--red-bg)',
    title: 'PDF Risk Report',
    desc: 'Download a professional, shareable PDF report with color-coded risk assessment.',
  },
];

const STATS = [
  { value: '17+', label: 'Clause Types Analyzed' },
  { value: '95%', label: 'Accuracy Rate' },
  { value: '<30s', label: 'Analysis Time' },
  { value: '2025', label: 'Law Updated' },
];

const TESTIMONIALS = [
  {
    text: 'Found a non-compete clause that would have locked me in for 5 years. AQD flagged it immediately.',
    name: 'Khalid A.', role: 'Software Engineer, Riyadh',
    rating: 5,
  },
  {
    text: 'The probation period in my offer was 6 months — illegal under Saudi law. Saved me before I signed.',
    name: 'Nora M.', role: 'Marketing Manager, Jeddah',
    rating: 5,
  },
  {
    text: 'Arabic contract analysis is flawless. Explained every clause in simple terms I could understand.',
    name: 'Ahmed S.', role: 'Finance Analyst, Dammam',
    rating: 5,
  },
];

const HOW_IT_WORKS = [
  { step: '01', icon: Upload,       title: 'Upload Your Contract',   desc: 'PDF, DOCX, or image — Arabic or English' },
  { step: '02', icon: Zap,          title: 'AI Analyzes Every Clause', desc: 'GPT-4o reviews against Saudi Labor Law 2025' },
  { step: '03', icon: AlertTriangle,title: 'Get Risk Report',         desc: 'Compliance score, flags, and recommendations' },
  { step: '04', icon: CheckCircle,  title: 'Know Before You Sign',    desc: 'Download PDF or ask follow-up questions' },
];

function FloatingParticle({ size, x, y, color, delay, duration }: any) {
  return (
    <div style={{
      position: 'absolute', borderRadius: '50%', width: size, height: size,
      left: x, top: y, background: color, filter: 'blur(60px)', opacity: 0.25,
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`, pointerEvents: 'none',
    }} />
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return (
    <span style={{
      fontSize: 42, fontWeight: 900, letterSpacing: '-1px',
      background: 'linear-gradient(135deg, #fff 0%, var(--gold-light) 60%, var(--primary) 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      {target}
    </span>
  );
}

export default function Landing() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ background: 'var(--bg-deep)', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(4,8,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)',
          }}>
            <Shield size={16} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.3px' }}>
            AQD <span style={{ color: 'var(--gold)' }}>·</span>{' '}
            <span style={{ fontFamily: 'Playfair Display, serif' }}>عقد</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 18px', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 18px', textDecoration: 'none' }}>
            Get Started Free <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px' }}>
        {/* Ambient orbs */}
        <FloatingParticle size={500} x="-10%" y="-20%" color="rgba(59,130,246,0.5)" delay={0} duration={8} />
        <FloatingParticle size={400} x="60%" y="30%" color="rgba(234,179,8,0.4)" delay={2} duration={10} />
        <FloatingParticle size={300} x="20%" y="60%" color="rgba(6,182,212,0.3)" delay={4} duration={7} />

        {/* Grid */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 820 }} className="animate-fade-up">
          {/* Label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99, marginBottom: 28,
            background: 'rgba(234,179,8,0.08)', border: '1px solid var(--border-gold)',
          }}>
            <Zap size={12} color="var(--gold)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px' }}>
              UPDATED FOR SAUDI LABOR LAW — FEBRUARY 2025
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Know Your Rights<br />
            <span style={{
              fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
              background: 'linear-gradient(135deg, var(--gold-light) 0%, var(--primary) 70%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Before You Sign
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            AI-powered employment contract review. Upload your contract in Arabic or English 
            and get a full Saudi Labor Law compliance report in seconds.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <Link to="/upload" className="btn btn-gold" style={{ padding: '15px 32px', fontSize: 15, textDecoration: 'none' }}>
              <Upload size={17} /> Analyze Your Contract Free
            </Link>
            <Link to="/register" className="btn btn-ghost" style={{ padding: '15px 32px', fontSize: 15, textDecoration: 'none' }}>
              Create Account <ArrowRight size={15} />
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: Lock, text: 'Your data is private' },
              { icon: CheckCircle, text: 'No legal expertise needed' },
              { icon: Globe, text: 'Arabic & English' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                <Icon size={13} color="var(--primary)" /> {text}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          animation: 'float 2s ease-in-out infinite',
        }}>
          <div style={{ width: 24, height: 38, border: '2px solid var(--border-light)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4 }}>
            <div style={{ width: 3, height: 8, borderRadius: 99, background: 'var(--primary)', animation: 'float 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────── */}
      <section style={{
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: '40px 48px',
        background: 'rgba(11,18,40,0.6)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{
              textAlign: 'center', padding: '8px 24px',
              borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <AnimatedCounter target={value} />
              <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', marginBottom: 14 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 14 }}>
            Four steps to contract clarity
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            From upload to insight in under a minute
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
            <div key={step} style={{
              padding: '32px 28px', position: 'relative',
              background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: i === 0 ? '14px 0 0 14px' : i === HOW_IT_WORKS.length - 1 ? '0 14px 14px 0' : '0',
              transition: 'background 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-blue)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'var(--bg-card)' : 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 16 }}>{step}</div>
              <div style={{
                width: 46, height: 46, borderRadius: 13, background: 'var(--primary-glow)',
                border: '1px solid var(--border-blue)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 18,
              }}>
                <Icon size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={{
                  position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                }}>
                  <ArrowRight size={13} color="var(--primary)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'rgba(11,18,40,0.4)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', marginBottom: 14 }}>FEATURES</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1px' }}>
              Everything you need to review any contract
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card" style={{ transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────── */}
      <section style={{ padding: '100px 48px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px', marginBottom: 16 }}>
          WHAT USERS SAY
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 48 }}>
          Trusted by employees across Saudi Arabia
        </h2>

        <div style={{
          position: 'relative', minHeight: 200, marginBottom: 32,
          background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
          borderRadius: 20, padding: '40px 48px',
          boxShadow: 'var(--shadow-gold)',
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              position: 'absolute', inset: '40px 48px',
              opacity: i === activeTestimonial ? 1 : 0,
              transform: i === activeTestimonial ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.4s ease',
              pointerEvents: i === activeTestimonial ? 'auto' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 20 }}>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} color="var(--gold)" fill="var(--gold)" />
                ))}
              </div>
              <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 24 }}>
                "{t.text}"
              </p>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{t.role}</div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActiveTestimonial(i)} style={{
              width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 99,
              background: i === activeTestimonial ? 'var(--primary)' : 'var(--border-light)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s', padding: 0,
            }} />
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(6,182,212,0.08) 50%, rgba(234,179,8,0.08) 100%)',
        borderTop: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>
            Don't sign blind.<br />
            <span style={{ color: 'var(--primary)' }}>Analyze first.</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 36 }}>
            Free to start. No legal expertise required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-gold" style={{ padding: '15px 36px', fontSize: 15, textDecoration: 'none' }}>
              <Upload size={17} /> Analyze Your Contract
            </Link>
            <Link to="/register" className="btn btn-ghost" style={{ padding: '15px 28px', fontSize: 15, textDecoration: 'none' }}>
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={15} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>AQD · عقد</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
          AI-assisted guidance only — not legal advice. Consult a qualified attorney for legal decisions.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/login" style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ fontSize: 12, color: 'var(--text-dim)', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
