import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { loginWithGitHub } from './api/client';
import Home from './pages/Home';
import Capture from './pages/Capture';
import Settings from './pages/Settings';

function Loading() {
  return (
    <div className="app-shell">
      <div className="center-screen">
        <span className="brand">⚡</span>
        <p className="muted">Loading…</p>
      </div>
    </div>
  );
}

function Login() {
  return (
    <div className="app-shell">
      <div className="center-screen">
        <span className="brand">⚡</span>
        <div>
          <h1>Cortex</h1>
          <p className="muted">Quick capture to your Obsidian vault.</p>
        </div>
        <button className="btn" onClick={loginWithGitHub} style={{ maxWidth: 280 }}>
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}

function Routed() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Login />;

  // First-run guard: force Settings until the vault path is configured.
  const needsSetup = user.vault_inbox_path == null;

  return (
    <Routes>
      <Route
        path="/"
        element={needsSetup ? <Navigate to="/settings" replace /> : <Home />}
      />
      <Route
        path="/capture"
        element={needsSetup ? <Navigate to="/settings" replace /> : <Capture />}
      />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </AuthProvider>
  );
}
