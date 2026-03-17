import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import { LangProvider } from './LangContext';
import Layout from './components/Layout';
import Landing        from './pages/Landing';
import Dashboard      from './pages/Dashboard';
import Upload         from './pages/Upload';
import ContractDetail from './pages/ContractDetail';
import History        from './pages/History';
import Compare        from './pages/Compare';
import Settings       from './pages/Settings';
import Pricing        from './pages/Pricing';
import AdminDashboard from './pages/AdminDashboard';
import SharedContract from './pages/SharedContract';
import AuthPage       from './pages/AuthPage';
import './index.css';

// ── Error boundary ─────────────────────────────────────────────────
class ErrorBoundary extends Component<{children:ReactNode},{hasError:boolean;error:string}> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(e: Error) { return { hasError: true, error: e.message }; }
  componentDidCatch(e: Error, i: ErrorInfo) { console.error('App error:', e, i); }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)', padding:32 }}>
        <div style={{ maxWidth:480, textAlign:'center', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'40px 32px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Something went wrong</h2>
          <p style={{ color:'var(--text-muted)', fontSize:15, marginBottom:20 }}>{this.state.error}</p>
          <button onClick={() => { this.setState({hasError:false,error:''}); window.location.href='/login'; }}
            className="btn btn-primary" style={{ padding:'10px 20px' }}>← Back to Login</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Guard: wraps any route that requires authentication ────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    // Save the page they tried to visit so we can redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

// ── Guard: wraps admin-only routes ─────────────────────────────────
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin)         return <Navigate to="/"     replace />;
  return <>{children}</>;
}

// ── Main routes ────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)' }}>
      <div style={{ width:44, height:44, border:'3px solid var(--primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <Routes>
      {/* ── Fully public (no auth required) ─────────────────────── */}
      <Route path="/landing"       element={<Landing />} />
      <Route path="/login"         element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
      <Route path="/register"      element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
      <Route path="/shared/:token" element={<SharedContract />} />

      {/* ── Everything else requires login ──────────────────────── */}
      <Route path="/*" element={
        <RequireAuth>
          <Layout>
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/upload"        element={<Upload />} />
              <Route path="/contracts/:id" element={<ContractDetail />} />
              <Route path="/history"       element={<History />} />
              <Route path="/compare"       element={<Compare />} />
              <Route path="/pricing"       element={<Pricing />} />
              <Route path="/settings"      element={<Settings />} />
              <Route path="/profile"       element={<Navigate to="/settings" replace />} />
              <Route path="/admin"         element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users"   element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </RequireAuth>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-elevated)', color: 'var(--text)',
                border: '1px solid var(--border-light)', fontFamily: 'Cairo, sans-serif',
                fontSize: 15, borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-deep)' } },
              error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg-deep)' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}

export default App;
