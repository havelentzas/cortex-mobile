import fs from 'fs/promises';
import path from 'path';
import { buildFrontmatter } from './frontmatter';
import { db } from '../db';

export interface Capture {
  content: string;
  type: 'thought' | 'task' | 'link' | 'calendar';
  capturedAt: string;
  userId: number;
}

export class VaultNotConfiguredError extends Error {
  constructor() {
    super('Vault inbox path is not configured. Visit Settings to set it.');
    this.name = 'VaultNotConfiguredError';
  }
}

export async function writeCapture(c: Capture): Promise<string> {
  const user = db
    .prepare('SELECT vault_inbox_path FROM users WHERE id = ?')
    .get(c.userId) as { vault_inbox_path: string | null };

  if (!user?.vault_inbox_path) {
    throw new VaultNotConfiguredError();
  }

  const d = new Date(c.capturedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}`;

  // Slug: first 50 chars, strip punctuation, collapse whitespace
  const slug = c.content
    .slice(0, 50)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  const filename = `${ts} ${slug}.md`;
  const filepath = path.join(user.vault_inbox_path, filename);

  await fs.writeFile(filepath, buildFrontmatter(c) + '\n\n' + c.content, 'utf-8');
  return filepath;
}
