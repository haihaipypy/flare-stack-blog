<div align="center">

[中文](../README.md) | English

# Flare Stack Blog

A self-hosted blog system for **「无辣的学习笔记」**, built on **Cloudflare Workers**<br>
Deeply integrated with D1, R2, KV, Workflows, Queues and other Serverless services.

[![License](https://img.shields.io/github/license/haihaipypy/flare-stack-blog?style=flat-square)](https://github.com/haihaipypy/flare-stack-blog/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/haihaipypy/flare-stack-blog?style=flat-square)](https://github.com/haihaipypy/flare-stack-blog/stargazers)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&style=flat-square)](https://react.dev)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-black?logo=tanstack&style=flat-square)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com)

[Live Site](https://blog.1day.vip) · [Core Features](#core-features) · [Deployment Guide](#deployment-guide) · [Local Development](#local-development) · [Changelog](../CHANGELOG.md)

</div>

---

> **Origin**: This project is a fork of [du2333/flare-stack-blog](https://github.com/du2333/flare-stack-blog), licensed under GPL-3.0.

> **Note**: This project is designed exclusively for the Cloudflare ecosystem and **only supports** deployment on Cloudflare Workers.

## Previews

<div align="center">
  <img src="./assets/home.png" alt="Home Preview" width="49%">
  <img src="./assets/admin.png" alt="Admin Preview" width="49%">
</div>

## Core Features

### Authoring

- **Rich Text Editor** — Powered by TipTap 3, with syntax highlighting, image uploads, tables, math formulas, and a draft/publish workflow.
- **Code Blocks** — Syntax highlighting for 67 languages, a searchable language picker, and lazy-loaded grammars.
- **Mermaid Diagrams** — Write a `mermaid` code block to render flowcharts, sequence diagrams and more, with theme-aware colors for light and dark mode.
- **Version History** — Automatic editor snapshots and post version rollback for safer recovery.
- **Import / Export** — Markdown import and export, preserving images and frontmatter.

### Organization

- **Categories & Tags** — A post can belong to multiple categories, forming a two-dimensional organization system together with tags.
- **Full-Text Search** — High-performance on-site search powered by Orama.
- **Previous / Next Navigation** — Post pages automatically link adjacent posts by publish time.
- **URL Hygiene** — Custom slugs, plus automatic 301 redirects for legacy Chinese slugs to avoid duplicate content.

### Engagement & Operations

- **Comment System** — Nested replies, email notifications, AI-assisted moderation, and richer moderation context.
- **Friend Links** — A full flow covering user applications, admin moderation, and email notifications.
- **Notification System** — Email and webhook channels with event-based subscriptions.
- **Analytics** — Self-hosted pageview tracking (with anonymized visitors), plus optional Umami and Google Analytics.

### Site & SEO

- **SEO Enhancements** — Canonical URLs, Schema.org structured data (BlogPosting), OG images, RSS / Sitemap / Robots.
- **Baidu Active Push** — Newly published post URLs are pushed to Baidu's "普通收录" channel to shorten indexing time.
- **Advertising** — Google AdSense integration with an `ads.txt` verification file.
- **Site Documents** — Standalone pages for About, Privacy Policy and Terms of Service, reachable from the top navigation.
- **Tools Page** — A dedicated `/tools` page whose title, description and content are editable from the admin panel.

### Platform Capabilities

- **Theme System** — Extensible theme templates that can fully replace every page and layout (bundled: `default` and `fuwari`).
- **Authentication** — Email/password and GitHub OAuth sign-in with role-based access control.
- **MCP Server** — 29 tools across 9 modules (posts, comments, tags, categories, friend links, media, search, analytics, system), connected to AI clients over OAuth.
- **AI Integration** — Cloudflare Workers AI integration.
- **Bilingual UI** — Chinese / English, powered by compile-time i18n (Paraglide).
- **Update Checker** — Detects new releases even without a GitHub token, consuming no API quota.

## Tech Stack

### Cloudflare Ecosystem

| Service         | Purpose                                                       |
| :-------------- | :------------------------------------------------------------ |
| Workers         | Edge computing and hosting                                    |
| D1              | SQLite database                                               |
| R2              | Object storage (media files)                                  |
| KV              | Caching layer                                                 |
| Durable Objects | Distributed rate limiting                                     |
| Workflows       | Asynchronous tasks (content moderation, scheduled publishing) |
| Queues          | Message queues (email notifications)                          |
| Workers AI      | AI capabilities                                               |
| Turnstile       | CAPTCHA                                                       |
| Images          | Image optimization                                            |

### Frontend

- **Framework**: React 19 + TanStack Router / Query
- **Styling**: TailwindCSS 4
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend

- **Gateway Layer**: Hono (auth routes, media services, cache control)
- **Business Layer**: TanStack Start (SSR, Server Functions)
- **Database**: Drizzle ORM + drizzle-zod
- **Search**: Orama
- **Authentication**: Better Auth (email/password + GitHub OAuth)

### Editor

TipTap 3 rich text + Shiki syntax highlighting + Mermaid diagram rendering

### Toolchain

Bun + Vite 7 + Biome + Vitest

### Directory Structure

```
src/
├── features/
│   ├── posts/                  # Post management (other modules share similar structure)
│   │   ├── api/                # Server Functions (Public APIs)
│   │   ├── data/               # Data access layer (Drizzle queries)
│   │   ├── posts.service.ts    # Business logic
│   │   ├── posts.schema.ts     # Zod Schemas + Cache Key Factories
│   │   ├── components/         # Feature-specific components
│   │   ├── queries/            # TanStack Query Hooks
│   │   └── workflows/          # Cloudflare Workflows
│   ├── categories/  # Post categories (many-to-many)
│   ├── tags/        # Tag management
│   ├── comments/    # Comments, nested replies, moderation
│   ├── media/       # Media uploads, R2 storage
│   ├── search/      # Orama full-text search
│   ├── auth/        # Authentication, permission control
│   ├── dashboard/   # Admin dashboard statistics
│   ├── pageview/    # Self-hosted pageview tracking
│   ├── email/       # Email notifications (Resend)
│   ├── notification/# Notification orchestration (email / webhook)
│   ├── webhook/     # Webhook delivery
│   ├── cache/       # KV caching services
│   ├── config/      # Blog configurations
│   ├── friend-links/# Friend links (applications, moderation)
│   ├── import-export/# Markdown importing/exporting
│   ├── site-documents/# About, Privacy, Terms of Service
│   ├── seo/         # Baidu active push and other SEO capabilities
│   ├── mcp/         # MCP Server (tools + OAuth authorization)
│   ├── version/     # Version update checker
│   ├── theme/       # Theme system (Contracts, registry, theme implementations)
│   └── ai/          # Workers AI integration
├── routes/
│   ├── _public/     # Public pages (home, post lists/details, search, tools, friend links)
│   ├── _auth/       # Login/Registration related pages
│   ├── _user/       # User specific pages
│   ├── admin/       # Admin panel (posts, comments, media, categories, tags, tools page, settings)
│   ├── oauth/       # OAuth consent page
│   ├── rss[.]xml.ts     # RSS Feed
│   ├── sitemap[.]xml.ts # Sitemap
│   └── robots[.]txt.ts  # Robots.txt
├── components/      # UI components (ui/, common/, content/, layout/)
├── lib/             # Infrastructure (db/, auth/, hono/, middlewares)
└── hooks/           # Custom React Hooks
```

### Theme System

All user-facing pages and layouts are decoupled from business logic via a **Theme Contract**. You can completely replace the visual presentation layer of the blog without modifying any routing or data logic.

→ **[Theme Development Guide](./theme-guide.en.md)** — Learn how to build a custom theme from scratch.

#### Available Themes

Site personalization such as title, description, social links, favicon, and default-theme background assets is managed from the admin **Settings** page. `src/blog.config.ts` mainly serves as seeded defaults and runtime fallback values; see the [Theme Development Guide](./theme-guide.en.md) for how themes should consume runtime `siteConfig`.

<table>
  <tr>
    <th>Theme</th>
    <th>Preview</th>
  </tr>
  <tr>
    <td><code>default</code></td>
    <td><img src="./assets/home.png" alt="Default theme preview" /></td>
  </tr>
  <tr>
    <td><code>fuwari</code></td>
    <td><img src="./assets/fuwari.png" alt="Fuwari theme preview" /></td>
  </tr>
</table>

### Request Flow

```
Request → Cloudflare CDN (Edge Cache)
             ↓ Miss
          server.ts (Hono Entry)
             ├── /api/auth/* → Better Auth
             ├── /images/*   → R2 Media Service
             └── Others      → TanStack Start
                                  ↓
                             Middleware Injection (db, auth, session)
                                  ↓
                             Route Matching + Loader Execution
                                  ↓
                      KV Cache ←→ Service Layer ←→ D1 Database
                                  ↓
                             SSR Rendering (with cache headers)
```

## Deployment Guide

### Prerequisites

- A Cloudflare account (the Workers / D1 / R2 / KV free tiers are enough to get started)
- A domain managed on Cloudflare

### 1. Create Cloudflare resources

```bash
npx wrangler d1 create blog-db        # note the database_id
npx wrangler r2 bucket create blog-media
npx wrangler kv namespace create CACHE # note the id
```

### 2. Configure GitHub OAuth

Go to [GitHub Developer Settings](https://github.com/settings/developers) and create an OAuth App:

- **Homepage URL**: `https://your-domain.com`
- **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`

### 3. Configure environment variables and secrets

Fill the resource IDs and credentials into `wrangler.jsonc` (copy it from `wrangler.example.jsonc`) and `.dev.vars`. See [Environment Variables Reference](#environment-variables-reference) below for the full list.

### 4. Deploy

**Option A: GitHub Actions (automatic)**

Configure the secrets and vars under repository Settings → Secrets and variables, then push to `main`.

- Uses `custom_domain` mode by default
- Set the repository variable `ROUTE=1` to switch to `routes` mode
- Add extra custom domains via `EXTRA_DOMAINS` (comma-separated)

**Option B: Manual deployment**

```bash
cp wrangler.example.jsonc wrangler.jsonc   # fill in your resource IDs
bun run db:migrate                          # apply D1 migrations
bun run deploy                              # build and deploy to Workers
```

For a more detailed walkthrough, see the [Deployment Guide](./deployment-guide.en.md).

---

## Environment Variables Reference

| File        | Purpose                                                       |
| :---------- | :------------------------------------------------------------ |
| `.env`      | Client-side variables (`VITE_*`), read by Vite                |
| `.dev.vars` | Server-side variables, injected into Worker `env` by Wrangler |

### Required

| Variable                     | Scope   | Description                                                          |
| :--------------------------- | :------ | :------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`       | CI/CD   | Cloudflare API Token (Worker deployment + D1 read/write permissions) |
| `CLOUDFLARE_ACCOUNT_ID`      | CI/CD   | Cloudflare Account ID                                                |
| `D1_DATABASE_ID`             | CI/CD   | D1 Database ID                                                       |
| `KV_NAMESPACE_ID`            | CI/CD   | KV Namespace ID                                                      |
| `BUCKET_NAME`                | CI/CD   | R2 Bucket Name                                                       |
| `BETTER_AUTH_SECRET`         | Runtime | Session encryption key. Generate using `openssl rand -hex 32`        |
| `BETTER_AUTH_URL`            | Runtime | Application URL (e.g., `https://blog.example.com`)                   |
| `ADMIN_EMAIL`                | Runtime | Administrator's email address                                        |
| `GITHUB_CLIENT_ID`           | Runtime | GitHub OAuth Client ID                                               |
| `GITHUB_CLIENT_SECRET`       | Runtime | GitHub OAuth Client Secret                                           |
| `CLOUDFLARE_ZONE_ID`         | Runtime | Cloudflare Zone ID                                                   |
| `CLOUDFLARE_PURGE_API_TOKEN` | Runtime | API token with Purge CDN permissions                                 |
| `DOMAIN`                     | Runtime | Blog's domain (e.g., `blog.example.com`)                             |

### Optional

| Variable                   | Scope      | Description                                                                                              |
| :------------------------- | :--------- | :------------------------------------------------------------------------------------------------------- |
| `THEME`                    | Build-time | Theme name, defaults to `default`. Refer to [Available Themes](#available-themes).                        |
| `LOCALE`                   | Runtime    | Default language: `zh` or `en`. Default: `zh`. Used for emails, webhooks, and background task messaging.  |
| `EXTRA_DOMAINS`            | CI/CD      | Extra custom domains bound to the same Worker, comma-separated.                                           |
| `CDN_DOMAIN`               | Runtime    | Standalone CDN domain (e.g., `cdn.example.com`), preferentially used during purge.                        |
| `ROUTE`                    | CI/CD      | Set to `1` to make GitHub Actions deploy use the Cloudflare `routes` mode instead of `custom_domain`.      |
| `ZONE_NAME`                | CI/CD      | Optional. Only needed when `ROUTE=1` and the zone cannot be derived from `DOMAIN`.                         |
| `PAGEVIEW_SALT`            | Runtime    | Salt for anonymizing pageview visitor hashes. Generate with `openssl rand -hex 16`.                       |
| `BAIDU_PUSH_TOKEN`         | Runtime    | Token for Baidu's "普通收录" push API. Pushing is skipped when unset.                                      |
| `UMAMI_SRC`                | Runtime    | Umami client-side tracking proxy URL (e.g., `https://cloud.umami.is`).                                    |
| `VITE_UMAMI_WEBSITE_ID`    | Build-time | Umami Website ID (client-side tracking).                                                                  |
| `VITE_GOOGLE_ANALYTICS_ID` | Build-time | Google Analytics measurement ID (e.g., `G-XXXXXXXXXX`). `gtag` is not injected when unset.                 |
| `TURNSTILE_SECRET_KEY`     | Runtime    | Cloudflare Turnstile Secret Key for CAPTCHA.                                                              |
| `VITE_TURNSTILE_SITE_KEY`  | Build-time | Cloudflare Turnstile Site Key.                                                                            |
| `GITHUB_TOKEN`             | Runtime    | GitHub API Token (for update checking to avoid rate limits; optional).                                    |

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- A Cloudflare account (for remote D1/R2/KV resources)

### Quick Start

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example .env            # Client-side variables
cp .dev.vars.example .dev.vars  # Server-side variables

# Configure Wrangler
cp wrangler.example.jsonc wrangler.jsonc
# Edit wrangler.jsonc to insert your Cloudflare resource IDs
# The sample uses custom_domain by default; you can switch to routes mode (e.g. blog.example.com/*)

# Start development server
bun dev
```

### Logging into the Admin Panel

**Method 1: Email and Password Registration (No third-party service required)**

1. Visit `http://localhost:3000`'s registration page and register using the `ADMIN_EMAIL` configured in `.dev.vars`.
2. In the development environment, the verification email isn't actually sent. A link is printed to the console — copy and visit it to complete verification.
3. After verification you are logged in automatically, and the system grants admin privileges based on `ADMIN_EMAIL`.

**Method 2: GitHub OAuth**

1. Navigate to [GitHub Developer Settings](https://github.com/settings/developers) to create a new OAuth App.
2. Homepage URL: `http://localhost:3000`, Authorization callback URL: `http://localhost:3000/api/auth/callback/github`.
3. Put the Client ID and Client Secret into `.dev.vars`.

### Common Commands

| Command                | Definition                                           |
| :--------------------- | :--------------------------------------------------- |
| `bun dev`              | Starts the local dev server (port 3000)               |
| `bun run build`        | Builds the production bundle                          |
| `bun run test`         | Runs the integration tests (Workers runtime)          |
| `bun run test:node`    | Runs the unit tests (Node environment)                |
| `bun lint`             | Runs the Biome checker                                |
| `bun check`            | Type checking + Lint + Code formatting                |
| `bun run i18n:compile` | Recompiles the i18n messages                          |

> After editing `messages/*.json`, you must run `bun run i18n:compile`, otherwise the `m.*` message types won't be updated.

### Database Commands

| Command                | Definition                                                  |
| :--------------------- | :---------------------------------------------------------- |
| `bun db:studio`        | Invokes the Drizzle Studio visual database interface        |
| `bun db:generate`      | Generates schema migration files                            |
| `bun db:migrate`       | Safely applies remote D1 migrations and auto-rolls back on failure |
| `bun db:migrate:local` | Safely applies local D1 migrations and auto-restores local state |
| `bun db:migrate:unsafe` | Applies remote D1 migrations directly without verification |

`bun db:migrate` and `bun db:migrate:local` reuse the schema-defined status constants and verify these counts before and after migration:

- `posts`: total post count and the count for each post status
- `comments`: total comments, root comments, reply comments, and the count for each comment status

The safety script also adds these safeguards:

- Remote mode: records a D1 Time Travel bookmark by default and automatically restores on verification failure
- Remote mode: if you also want a SQL snapshot for manual incident analysis, run `bun scripts/safe-d1-migrate/main.ts --remote --with-export`
- Local mode: snapshots `.wrangler/state` (or your custom `--persist-to` path) and restores it automatically on verification failure

### Simulating Cloudflare Resources Locally

The default workspace connects to remote D1/R2/KV resources. If an entirely local setup is needed, simply remove `remote: true` from `wrangler.jsonc` entries, allowing Miniflare to simulate these interfaces natively:

```jsonc
{
  "d1_databases": [{ "binding": "DB", ... }],  // remove "remote": true
  "r2_buckets": [{ "binding": "R2", ... }],    // remove "remote": true
  "kv_namespaces": [{ "binding": "KV", ... }]  // remove "remote": true
}
```

> **Note**: Locally simulated data is not synced to Cloudflare, making it safe for exploratory setups. For local database migrations, prefer:
>
> ```bash
> bun db:migrate:local
> ```

### Domain Binding Modes

The default configuration uses `custom_domain`. To take over `blog.example.com/*` via `routes` instead:

```jsonc
{
  "routes": [{ "pattern": "blog.example.com/*", "zone_name": "example.com" }]
}
```

When deploying with the bundled GitHub Actions workflow, you don't need to edit `wrangler.example.jsonc` by hand:

- Default: `custom_domain`
- Repository variable `ROUTE=1`: switches to `routes` automatically
- `pattern` uses `${DOMAIN}/*`
- `zone_name` is derived from `DOMAIN`; set `ZONE_NAME` for separately-hosted subdomain scenarios

## Changelog

Changes made in this fork are tracked in **[CHANGELOG.md](../CHANGELOG.md)**, maintained in reverse chronological order.

## Contributing

Issues and suggestions are welcome. Before changing business logic, please read the [Error Handling Quickstart](./error-handling-quickstart.en.md); development guidelines and code conventions live in [CONTRIBUTING.en.md](./CONTRIBUTING.en.md).

## License

[GPL-3.0](../LICENSE)
