import { Link } from 'react-router-dom';

const FUTURE_MODULES = [
  { emoji: '📅', title: 'Daily Note', desc: 'Append to today’s journal' },
  { emoji: '🔍', title: 'Vault Search', desc: 'Find notes on the go' },
];

export default function Home() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Cortex</h1>
          <p className="header-sub">Mobile suite</p>
        </div>
        <Link to="/settings" className="icon-btn" aria-label="Settings">
          ⚙︎
        </Link>
      </header>

      <Link to="/capture" className="module-card">
        <span className="module-emoji">⚡</span>
        <span>
          <span className="module-title">Quick Capture</span>
          <span className="module-desc">Send a note straight to your vault inbox</span>
        </span>
      </Link>

      {FUTURE_MODULES.map((m) => (
        <div key={m.title} className="module-card disabled" aria-disabled="true">
          <span className="module-emoji">{m.emoji}</span>
          <span>
            <span className="module-title">{m.title}</span>
            <span className="module-desc">{m.desc} · coming soon</span>
          </span>
        </div>
      ))}
    </div>
  );
}
