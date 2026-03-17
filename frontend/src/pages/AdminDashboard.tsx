import React, { useEffect, useState } from 'react';
import { useLang } from '../LangContext';
import { t, translations as T } from '../i18n';
import { useAuth } from '../AuthContext';
import { adminApi, authApi, AdminUser, PlanName } from '../api';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, BarChart3, TrendingUp, Crown, Star, Shield,
  Search, ChevronDown, CheckCircle, AlertTriangle, XCircle,
  FileText, Calendar
} from 'lucide-react';

function PlanPill({ plan }: { plan: string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    free:       { color: 'var(--text-dim)',  bg: 'var(--bg-elevated)' },
    pro:        { color: 'var(--primary)',   bg: 'var(--primary-glow)' },
    enterprise: { color: 'var(--gold)',      bg: 'var(--gold-glow)' },
  };
  const s = cfg[plan] || cfg.free;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: s.bg, color: s.color, letterSpacing: '0.5px', border: `1px solid ${s.color}25` }}>
      {plan.toUpperCase()}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: `${color}10`, filter: 'blur(16px)', pointerEvents: 'none' }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all'|PlanName>('all');
  const [changingPlan, setChangingPlan] = useState<number | null>(null);
  const [openPlanMenu, setOpenPlanMenu] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    Promise.all([adminApi.users(), adminApi.stats()])
      .then(([u, s]) => { setUsers(u.data); setStats(s.data); })
      .finally(() => setLoading(false));
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <AlertTriangle size={40} color="var(--red)" style={{ margin: '0 auto 16px', display: 'block' }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)' }}>Admin privileges required.</p>
    </div>
  );

  const changePlan = async (userId: number, plan: PlanName) => {
    setChangingPlan(userId);
    try {
      await adminApi.updatePlan(userId, plan);
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, profile: u.profile ? { ...u.profile, plan: { name: plan, display_name: plan.charAt(0).toUpperCase() + plan.slice(1), monthly_limit: plan === 'free' ? 3 : plan === 'pro' ? 30 : -1, price_sar: 0, features: [] } } : u.profile }
        : u
      ));
      toast.success(`Plan updated to ${plan}`);
    } catch { toast.error('Failed to update plan'); }
    finally { setChangingPlan(null); setOpenPlanMenu(null); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const match = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q);
    const pf = planFilter === 'all' || (u.profile?.plan?.name === planFilter);
    return match && pf;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={15} color="var(--gold)" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>Admin Dashboard</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage users, plans, and monitor platform usage</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }} className="stagger">
        <StatCard icon={Users}     label="Total Users"      value={stats?.total_users ?? 0}         sub="All accounts"        color="var(--primary)" />
        <StatCard icon={Star}      label="Pro Users"         value={stats?.pro_users ?? 0}           sub="Active subscriptions"  color="var(--primary)" />
        <StatCard icon={Crown}     label="Enterprise"        value={stats?.enterprise_users ?? 0}    sub="Enterprise plan"     color="var(--gold)" />
        <StatCard icon={FileText}  label="Contracts Today"  value={stats?.contracts_today ?? 0}     sub="Last 24 hours"       color="var(--accent)" />
        <StatCard icon={BarChart3} label="Total Analyses"   value={stats?.total_contracts ?? 0}     sub="All time"            color="var(--green)" />
        <StatCard icon={TrendingUp}label="Avg Score"        value={`${stats?.avg_compliance ?? 0}%`} sub="Compliance avg"      color="var(--yellow)" />
      </div>

      {/* Users table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="input" style={{ paddingLeft: 30, fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {(['all','free','pro','enterprise'] as const).map(f => (
              <button key={f} onClick={() => setPlanFilter(f)} style={{
                padding: '7px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'Outfit',
                background: planFilter === f ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                color: planFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                border: `1px solid ${planFilter === f ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                fontSize: 11, fontWeight: planFilter === f ? 700 : 400,
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ marginLeft: 5, fontSize: 9, background: planFilter === f ? 'var(--primary)' : 'var(--border)', color: planFilter === f ? 'white' : 'var(--text-dim)', borderRadius: 99, padding: '1px 5px', fontWeight: 700 }}>
                  {f === 'all' ? users.length : users.filter(u => u.profile?.plan?.name === f).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{filtered.length} users</div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User','Email','Plan','Contracts','Joined','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users found</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${u.profile?.avatar_color || '#3B82F6'}, var(--accent))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {(u.first_name?.[0] || u.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                          {u.profile?.is_admin && <span style={{ marginLeft: 6, fontSize: 8, background: 'rgba(234,179,8,0.15)', color: 'var(--gold)', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>ADMIN</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 18px' }}><PlanPill plan={u.profile?.plan?.name || 'free'} /></td>
                  <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{u.contract_count}</td>
                  <td style={{ padding: '12px 18px', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(u.date_joined).toLocaleDateString('en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setOpenPlanMenu(openPlanMenu === u.id ? null : u.id)}
                        disabled={changingPlan === u.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Outfit', transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                      >
                        {changingPlan === u.id
                          ? <div style={{ width: 11, height: 11, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          : <>Change Plan <ChevronDown size={10} /></>}
                      </button>
                      {openPlanMenu === u.id && (
                        <div style={{ position: 'absolute', right: 0, top: '105%', zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 140 }}>
                          {(['free','pro','enterprise'] as PlanName[]).map(p => (
                            <button key={p} onClick={() => changePlan(u.id, p)} style={{ width: '100%', padding: '10px 14px', background: u.profile?.plan?.name === p ? 'var(--primary-glow)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: 600, color: u.profile?.plan?.name === p ? 'var(--primary)' : 'var(--text)', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.1s', borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={e => { if (u.profile?.plan?.name !== p) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                              onMouseLeave={e => { if (u.profile?.plan?.name !== p) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              {u.profile?.plan?.name === p && <CheckCircle size={10} color="var(--primary)" />}
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
