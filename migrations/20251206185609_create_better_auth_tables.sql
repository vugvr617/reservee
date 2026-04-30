-- Better Auth tables in public schema

-- Users table
CREATE TABLE IF NOT EXISTS public.user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE
);

-- Accounts table (for storing password hashes)
CREATE TABLE IF NOT EXISTS public.account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table (for email verification tokens)
CREATE TABLE IF NOT EXISTS public.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session(user_id);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.account(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON public.verification(identifier);

-- Enable Row Level Security
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user table
CREATE POLICY "Users can view their own data"
  ON public.user
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own data"
  ON public.user
  FOR UPDATE
  USING (auth.uid()::text = id);

-- RLS Policies for session table
CREATE POLICY "Users can view their own sessions"
  ON public.session
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.session
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for account table
CREATE POLICY "Users can view their own accounts"
  ON public.account
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Verification table should only be accessed by the server
CREATE POLICY "Service role can manage verifications"
  ON public.verification
  FOR ALL
  USING (true);
