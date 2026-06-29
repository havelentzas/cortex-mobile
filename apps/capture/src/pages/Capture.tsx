import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, type CaptureType } from '../api/client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const TYPES: { value: CaptureType; label: string; emoji: string }[] = [
  { value: 'thought', label: 'Thought', emoji: '💭' },
  { value: 'task', label: 'Task', emoji: '✅' },
  { value: 'link', label: 'Link', emoji: '🔗' },
  { value: 'calendar', label: 'Calendar', emoji: '📅' },
];

export default function Capture() {
  const navigate = useNavigate();
  const online = useNetworkStatus();

  const [type, setType] = useState<CaptureType>('thought');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = online && content.trim().length > 0 && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.createCapture(content.trim(), type);
      setContent('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VAULT_NOT_CONFIGURED') {
        navigate('/settings');
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        navigate('/');
        return;
      }
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>
            ‹ Home
          </button>
          <h1>Quick Capture</h1>
        </div>
      </header>

      {!online && (
        <div className="banner offline">
          ⚠︎ You’re offline — captures are disabled until you reconnect.
        </div>
      )}
      {saved && <div className="banner success">✓ Saved to your vault inbox</div>}
      {error && <div className="banner error">⚠︎ {error}</div>}

      <div className="type-grid">
        {TYPES.map((t) => (
          <button
            key={t.value}
            className={`type-pill ${type === t.value ? 'active' : ''}`}
            onClick={() => setType(t.value)}
            disabled={!online}
          >
            <span className="emoji">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        className="capture-input"
        placeholder={online ? 'What’s on your mind?' : 'Reconnect to capture…'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!online}
        autoFocus
      />

      <button className="btn" onClick={submit} disabled={!canSubmit}>
        {saving ? 'Saving…' : 'Capture'}
      </button>
    </div>
  );
}
