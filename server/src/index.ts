import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { db } from './db'; // run migration on startup
import authRouter from './auth/github';
import { requireAuth } from './auth/middleware';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);

// Session check — lets the PWA know whether the user is logged in
app.get('/api/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, github_login, vault_inbox_path FROM users WHERE id = ?')
    .get(req.userId) as { id: number; github_login: string; vault_inbox_path: string | null };
  res.json(user);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
