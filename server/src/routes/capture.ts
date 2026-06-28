import { Router } from 'express';
import { requireAuth } from '../auth/middleware';
import { writeCapture, VaultNotConfiguredError } from '../vault/writer';

const router = Router();

const VALID_TYPES = ['thought', 'task', 'link', 'calendar'] as const;
type CaptureType = (typeof VALID_TYPES)[number];

router.post('/', requireAuth, async (req, res) => {
  const { content, type } = req.body as { content?: unknown; type?: unknown };

  if (!content || typeof content !== 'string' || content.trim() === '') {
    res.status(400).json({ error: 'content must be a non-empty string' });
    return;
  }

  if (!type || !VALID_TYPES.includes(type as CaptureType)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }

  try {
    const filepath = await writeCapture({
      content: content.trim(),
      type: type as CaptureType,
      capturedAt: new Date().toISOString(),
      userId: req.userId,
    });
    res.status(201).json({ ok: true, filepath });
  } catch (err) {
    if (err instanceof VaultNotConfiguredError) {
      res.status(422).json({ error: err.message, code: 'VAULT_NOT_CONFIGURED' });
      return;
    }
    const message = err instanceof Error ? err.message : 'Failed to write capture';
    res.status(500).json({ error: message });
  }
});

export default router;
