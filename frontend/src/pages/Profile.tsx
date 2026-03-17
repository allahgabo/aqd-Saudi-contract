import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { contractsApi, DashboardStats } from '../api';
import { User, Mail, Shield, LogOut, CheckCircle, FileText, BarChart3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => { contractsApi.stats().then(r => setStats(r.data)).catch(() => {}); }, []);

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  if (!user) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>You must be signed in to view your profile.</p>
      <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Sign In</Link>
    </div>
  );

  const statCards = [
    { icon: FileText,      color: 'var(--primary)', label: 'Total Analyzed',  value: stats?.total_contracts ?? '—' },
    { icon: CheckCircle,   color: 'var(--green)',   label: 'Valid Contracts', value: stats?.valid_contracts ?? '—' },
    { icon: AlertTriangle, color: 'var(--yellow)',  label: 'Needs Attention', value: stats?.attention_contracts ?? '—' },
    { icon: BarChart3,     color: 'var(--accent)',  label: 'Avg Score',       value: stats ? `${Math.round(stats.average_compliance_score)}%` : '—' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your account and view your stats</p>
      </div>

      {/* Avatar card */}
      <div className="card" style={{
        display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20,
        background: 'linear-gradient(135deg, var(--bg-card), rgba(59,130,246,0.06))',
        border: '1px solid var(--border-blue)',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 900, color: 'white',
          boxShadow: '0 0 30px rgba(59,130,246,0.4)',
        }}>
          {(user.first_name?.[0] || user.username[0]).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>
            {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.2)', width: 'fit-content' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.5px' }}>ACTIVE ACCOUNT</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {statCards.map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Icon size={16} color={color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.3px' }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1.5px', marginBottom: 16 }}>ACCOUNT INFORMATION</div>
        {[
          { icon: User, label: 'Username', value: user.username },
          { icon: Mail, label: 'Email', value: user.email },
          { icon: Shield, label: 'Plan', value: 'Standard — Free' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--primary-glow)', border: '1px solid var(--border-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={13} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1.5px', marginBottom: 14 }}>QUICK ACTIONS</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/upload" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', fontSize: 13, padding: '10px' }}>
            <FileText size={13} /> Analyze Contract
          </Link>
          <Link to="/history" className="btn btn-ghost" style={{ flex: 1, textDecoration: 'none', fontSize: 13, padding: '10px' }}>
            <BarChart3 size={13} /> View History
          </Link>
        </div>
      </div>

      <button onClick={handleLogout} style={{
        width: '100%', padding: '13px', background: 'var(--red-bg)',
        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)',
        color: 'var(--red)', cursor: 'pointer', fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'Outfit', transition: 'background 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)'}
      >
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );
}
