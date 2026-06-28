import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { db } from '../db';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT vault_inbox_path FROM users WHERE id = ?')
    .get(req.userId) as { vault_inbox_path: string | null };
  res.json({ vaultInboxPath: row?.vault_inbox_path ?? null });
});

router.put('/', requireAuth, (req, res) => {
  const { vaultInboxPath } = req.body as { vaultInboxPath?: unknown };

  if (!vaultInboxPath || typeof vaultInboxPath !== 'string' || vaultInboxPath.trim() === '') {
    res.status(400).json({ error: 'vaultInboxPath must be a non-empty string' });
    return;
  }

  db.prepare('UPDATE users SET vault_inbox_path = ? WHERE id = ?').run(
    vaultInboxPath.trim(),
    req.userId
  );

  res.json({ vaultInboxPath: vaultInboxPath.trim() });
});

export default router;
