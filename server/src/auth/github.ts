import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const router = Router();

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

// In-memory CSRF state store — fine for a single-server personal app
const pendingStates = new Set<string>();

router.get('/github', (_req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.add(state);
  setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.SERVER_URL}/auth/github/callback`,
    scope: 'read:user',
    state,
  });

  res.redirect(`${GITHUB_AUTH_URL}?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state || !pendingStates.has(state)) {
    res.status(400).send('Invalid or expired OAuth state. Please try again.');
    return;
  }
  pendingStates.delete(state);

  // Exchange code for access token
  const tokenRes = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.SERVER_URL}/auth/github/callback`,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    res.status(400).send('GitHub token exchange failed. Please try again.');
    return;
  }

  // Fetch the authenticated GitHub user
  const userRes = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const githubUser = (await userRes.json()) as { id: number; login: string };

  // Allowlist check — fail-secure: deny all if ALLOWED_GITHUB_LOGINS is not configured
  const allowedLogins = (process.env.ALLOWED_GITHUB_LOGINS ?? '')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);

  if (allowedLogins.length === 0) {
    res.status(403).send('Server not configured: ALLOWED_GITHUB_LOGINS is not set.');
    return;
  }
  if (!allowedLogins.includes(githubUser.login)) {
    res.status(403).send('Access denied: your GitHub account is not on the allowlist for this server.');
    return;
  }

  // Upsert user — update login in case it changed
  db.prepare(`
    INSERT INTO users (github_id, github_login)
    VALUES (?, ?)
    ON CONFLICT (github_id) DO UPDATE SET github_login = excluded.github_login
  `).run(String(githubUser.id), githubUser.login);

  const user = db
    .prepare('SELECT id FROM users WHERE github_id = ?')
    .get(String(githubUser.id)) as { id: number };

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.redirect(process.env.CLIENT_URL!);
});

export default router;
