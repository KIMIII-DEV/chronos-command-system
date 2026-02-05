# CHRONOS OSS - DEPLOYMENT GUIDE (PRODUCTION-READY)

This guide outlines the steps to deploy the Chronos OSS AI Stack to Cloudflare Pages & Workers, leveraging Supabase Free Tier for a zero-cost, production-ready setup.

## 1. Prerequisites
- GitHub Account
- Cloudflare Account
- Supabase Account (Free Tier)
- `pnpm` installed locally

## 2. Supabase Setup
1. **Create a new Supabase Project:** Go to [Supabase](https://app.supabase.com/) and create a new project.
2. **Run Migrations:** Execute the SQL in `supabase_schema.sql` (located in the root of this repository) in your Supabase SQL Editor to set up all necessary tables (users, audit_logs, rdf_triples, self_improvement_log, sessions, rate_limits).
3. **Retrieve API Keys:** From your Supabase project settings, note down:
   - `Project URL` (e.g., `https://your-project-ref.supabase.co`)
   - `Anon Public Key`
   - `Service Role Key` (use with caution, keep secret!)

## 3. Cloudflare Pages & Workers Deployment
1. **Connect to GitHub:**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
   - Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your GitHub repository containing the Chronos OSS code.
2. **Configure Build Settings:**
   - **Framework preset:** `Vite`
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
3. **Add Environment Variables (Secrets):**
   - Go to **Settings** > **Environment Variables** for your Cloudflare Pages project.
   - Add the following variables for both `Production` and `Preview` environments:
     - `SUPABASE_URL`: Your Supabase Project URL
     - `SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
     - `JWT_SECRET`: A strong, random secret for JWT signing (e.g., generated with `openssl rand -base64 32`)
     - `COOKIE_SECRET`: A strong, random secret for cookie signing
     - `ENABLE_OSS_AI`: `true`
     - `MODE`: `oss`
     - `GITHUB_TOKEN`: (Optional, for Self-Improvement PRs) A GitHub Personal Access Token with `repo` scope.
     - `GITHUB_REPO`: (Optional) Your GitHub repository in `owner/repo` format (e.g., `KIMIII-DEV/chronos-command-system`)

## 4. Edge-Native Authentication Notes
- **TOTP:** The system now uses `@epic-web/totp`, which is fully compatible with Cloudflare Workers' Web Crypto API, replacing the Node.js-dependent `otplib`.
- **Session Management:** Sessions are handled via HTTP-Only, Secure, SameSite=Strict cookies, providing robust protection against XSS attacks.

## 5. Persistent Jena Memory
- The `JenaMemory` component (`server/chronos_oss/mem-bridge.ts`) no longer relies on in-memory state.
- All RDF triples (knowledge graph data) are now persistently stored in the `rdf_triples` table within your Supabase Postgres database.
- This ensures that Chronos's learned knowledge and context are preserved across Cloudflare Worker restarts.

## 6. Verification
- The `VERIFY.sh` script in the root of this repository can be used to perform a comprehensive check of the system's integrity, Edge compatibility, and core functionalities.
- It validates source code presence, TOTP implementation, memory persistence, LangChain authority, RBAC, and Public Layer immutability.

Your Chronos OSS AI Stack is now ready for deployment. Enjoy zero-cost, secure, and self-improving AI operations!
