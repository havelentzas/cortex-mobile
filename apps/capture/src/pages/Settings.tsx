import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstRun = user != null && user.vault_inbox_path == null;

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setPath(s.vaultInboxPath ?? ''))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) navigate('/');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function save() {
    if (path.trim().length === 0 || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateSettings(path.trim());
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          {!firstRun && (
            <button className="back-link" onClick={() => navigate('/')}>
              ‹ Home
            </button>
          )}
          <h1>Settings</h1>
        </div>
      </header>

      {firstRun && (
        <div className="banner info">
          👋 Welcome{user ? `, ${user.github_login}` : ''}. Set your vault inbox
          path to start capturing.
        </div>
      )}
      {saved && <div className="banner success">✓ Saved</div>}
      {error && <div className="banner error">⚠︎ {error}</div>}

      <label className="field-label" htmlFor="vault-path">
        Vault inbox path (absolute, server-side)
      </label>
      <input
        id="vault-path"
        className="text-input"
        type="text"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="/Users/harry/OneDrive/Vault/Inbox"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        disabled={loading}
      />
      <p className="muted">
        Captures are written here as <code>YYYYMMDDHHmm slug.md</code>. The folder
        must already exist and be writable by the server.
      </p>

      <button
        className="btn"
        onClick={save}
        disabled={loading || saving || path.trim().length === 0}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>

      <div className="spacer" style={{ minHeight: 32 }} />

      <a className="btn danger" href="/auth/logout" style={{ textAlign: 'center' }}>
        Sign out
      </a>
    </div>
  );
}
