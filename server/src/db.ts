import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'cortex.db');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id TEXT NOT NULL UNIQUE,
    github_login TEXT NOT NULL,
    vault_inbox_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
