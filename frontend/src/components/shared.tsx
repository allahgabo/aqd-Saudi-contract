import React from 'react';

export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 14 }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(59,130,246,0.12)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
      <div style={{ marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>{message}</p>
      {action}
    </div>
  );
}

export function RiskBadge({ risk, size = 'md' }: { risk: string; size?: 'sm' | 'md' }) {
  const cfg: Record<string, { color: string; bg: string; border: string; label: string }> = {
    valid:     { color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'rgba(16,185,129,0.2)',  label: '✓ Valid' },
    attention: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'rgba(245,158,11,0.2)',  label: '⚠ Attention' },
    high_risk: { color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'rgba(239,68,68,0.2)',   label: '✗ High Risk' },
  };
  const s = cfg[risk] || cfg.attention;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: size === 'sm' ? 9 : 10, fontWeight: 700, letterSpacing: '0.3px',
      padding: size === 'sm' ? '2px 7px' : '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

export function ScoreBar({ score, height = 6, showLabel = true }: { score: number; height?: number; showLabel?: boolean }) {
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: 'var(--bg-elevated)', borderRadius: height, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{
          height: '100%', borderRadius: height, width: `${Math.min(100, Math.max(0, score))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 8px ${color}60`,
          transition: 'width 0.6s cubic-bezier(.16,1,.3,1)',
        }} />
      </div>
      {showLabel && <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{score}%</span>}
    </div>
  );
}
