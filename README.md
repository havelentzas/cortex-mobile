# Cortex Mobile — Quick Capture

A phone-installable PWA for instantly capturing thoughts, tasks, links, and calendar notes to your [Obsidian](https://obsidian.md) vault inbox. Open it from your home screen, type, tap **Capture** — done.

This is the first module of **Cortex Mobile**, a personal knowledge management companion designed around Obsidian vaults. The architecture is built to grow: authentication, the server, and the module hub are all in place for additional modules (Daily Note, Search, etc.) to be added over time.

> **Adapting this for your own setup?** See [Adapting for Your Vault](#adapting-for-your-vault) below. The key variables are your GitHub OAuth app credentials, your vault's inbox path, and the address your server runs on.

---

## Features

- **Installable PWA** — add to your iOS or Android home screen; launches as a standalone app
- **GitHub OAuth** — server-side flow; client secret never reaches the browser
- **Home hub** — a central screen for all Cortex modules (Quick Capture active; more coming)
- **Four capture types** — Thought, Task, Link, Calendar — each stamped in YAML frontmatter
- **Zettelkasten filenames** — notes land as `YYYYMMDDHHmm {slug}.md` in your vault inbox
- **Configurable vault path** — set and change the inbox path from the in-app Settings screen; no server restart required
- **Honest offline state** — iOS Safari has no Background Sync API; the app disables capture when offline rather than silently queuing and losing notes

## How it works

```
Phone (PWA)                   Server (Tailscale)             Vault (OneDrive/local)
──────────────────────────    ──────────────────────────    ────────────────────
Login via GitHub OAuth    →   Server issues httpOnly JWT    
Tap Quick Capture         →   POST /api/capture             →  fs.writeFile()
                                                            →  202606281432 Note.md
Settings screen           →   PUT /api/settings             →  vault_inbox_path in SQLite
```

The server writes `.md` files directly to the filesystem path where your vault is synced (OneDrive, iCloud, Dropbox, or local). No Obsidian plugin or API is required.

## Prerequisites

- **Node 20+** and **pnpm 9+**
- A **24/7 accessible server** — the repo is designed for a machine on [Tailscale](https://tailscale.com), but any reachable HTTPS host works
- Your **Obsidian vault synced to the server's filesystem** (OneDrive, Syncthing, etc.)
- A **GitHub OAuth App** (free) — [create one here](https://github.com/settings/developers)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/havelentzas/cortex-mobile.git
cd cortex-mobile
pnpm install
```

### 2. Create a GitHub OAuth App

Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**:

| Field | Value |
|---|---|
| Application name | Cortex Mobile (or anything) |
| Homepage URL | `https://your-server-address` |
| Authorization callback URL | `https://your-server-address/auth/github/callback` |

Copy the **Client ID** and generate a **Client Secret**.

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Must match the callback URL registered in your GitHub OAuth App
SERVER_URL=https://your-tailscale-address-or-domain

# Secret used to sign JWT cookies — generate with: openssl rand -hex 32
JWT_SECRET=your_random_secret

# Redirect here after login (your PWA's origin)
CLIENT_URL=https://your-server-address
```

### 4. Build and run

```bash
# Development (server + PWA with hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

The server listens on port `3000` by default (`PORT` env var to change).

### 5. Install the PWA

Open `https://your-server-address` in **Safari on iOS** (or Chrome on Android), then:
- iOS: tap the **Share** button → **Add to Home Screen**
- Android: tap the browser menu → **Install App** / **Add to Home Screen**

### 6. Set your vault inbox path

After logging in, tap the **gear icon** in the top-right of the Home screen → **Settings**. Enter the absolute server-side path to your vault's inbox folder (e.g. `/Users/harry/OneDrive/Vault/Inbox`) and tap **Save**. The next capture will land there.

## Note format

Every capture creates a file like:

```
202606281432 Look into Obsidian plugins.md
```

```yaml
---
date: 2026-06-28T14:32:00.000Z
type: thought
source: cortex-capture
tags: []
---

Look into Obsidian plugins — specifically the Dataview approach for task rollups.
```

The `source: cortex-capture` tag makes it easy to build Dataview queries that scope to mobile captures.

## Project structure

```
cortex-mobile/
├── apps/
│   └── capture/              # Vite + React PWA
│       ├── public/
│       │   └── manifest.json
│       └── src/
│           ├── pages/
│           │   ├── Home.tsx       # Module hub
│           │   ├── Capture.tsx    # Quick Capture module
│           │   └── Settings.tsx   # Vault path config
│           ├── hooks/
│           │   └── useNetworkStatus.ts
│           └── api/client.ts
└── server/
    └── src/
        ├── auth/
        │   ├── github.ts          # OAuth flow
        │   └── middleware.ts      # JWT cookie → req.userId
        ├── routes/
        │   ├── capture.ts         # POST /api/capture
        │   └── settings.ts        # GET/PUT /api/settings
        └── vault/
            ├── writer.ts          # Zettelkasten filename + fs.writeFile
            └── frontmatter.ts     # YAML header builder
```

## Adapting for your vault

This project is designed to be adapted. The main things you'll change:

| What | Where | Notes |
|---|---|---|
| **Vault sync method** | `server/.env` → `vault_inbox_path` per user in Settings | Works with any path the server can write to |
| **Auth provider** | `server/src/auth/` | Currently GitHub OAuth; swap for any OAuth 2.0 provider |
| **Capture types** | `apps/capture/src/pages/Capture.tsx` | Add/rename the `type` pills; update the TypeScript union in `vault/writer.ts` |
| **Frontmatter fields** | `server/src/vault/frontmatter.ts` | Add any YAML fields your vault templates expect |
| **Filename format** | `server/src/vault/writer.ts` — `writeCapture()` | Change the `ts` + `slug` construction to whatever convention you use |
| **New modules** | `apps/capture/src/pages/Home.tsx` | Add a new card to the hub and a new route |
| **Port / reverse proxy** | `server/src/index.ts`, `server/.env` | Set `PORT`; put nginx/Caddy in front for HTTPS |

If you want multiple users with separate vaults (family, team), the `vault_inbox_path` is already per-user in SQLite — each user sets their own path in Settings.

## Contributing

Issues and PRs are welcome. If you're building a new Cortex module or adapting this for a different vault tool, feel free to open a discussion.

## License

[MIT](LICENSE) — use it, fork it, build on it.
