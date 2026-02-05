-- CHRONOS OSS - FINAL PRODUCTION SCHEMA
-- For Supabase (Free Tier)

-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'operator', 'viewer')) DEFAULT 'viewer',
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Audit Logs (A7.2)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  input TEXT,
  output TEXT,
  risk TEXT CHECK (risk IN ('low', 'medium', 'high')),
  approved BOOLEAN DEFAULT false,
  approved_by BIGINT REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RDF Triples (Apache Jena / N3 Storage)
CREATE TABLE IF NOT EXISTS rdf_triples (
  id BIGSERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object TEXT NOT NULL,
  graph TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rdf_spo ON rdf_triples(subject, predicate, object);

-- 4. Self-Improvement Log (A4.4)
CREATE TABLE IF NOT EXISTS self_improvement_log (
  id BIGSERIAL PRIMARY KEY,
  action_id TEXT REFERENCES audit_logs(id),
  proposed_change JSONB NOT NULL,
  status TEXT CHECK (status IN ('proposed', 'approved', 'rejected', 'merged')) DEFAULT 'proposed',
  approved_by BIGINT REFERENCES users(id),
  github_pr_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Rate Limiting (A6.3)
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT PRIMARY KEY, -- IP or UserID
  hits INT DEFAULT 1,
  last_hit TIMESTAMPTZ DEFAULT NOW()
);
