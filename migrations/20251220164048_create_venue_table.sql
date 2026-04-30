-- Venue table with onboarding tracking
CREATE TABLE public.venue (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
  
  -- Step 1: Owner Info
  "managerName" TEXT,
  "managerEmail" TEXT,
  "managerPhone" TEXT,
  "venueName" TEXT,
  "fallbackPhone" TEXT,
  
  -- Step 2: Business Details
  address TEXT,
  city TEXT DEFAULT 'Budapest',
  country TEXT DEFAULT 'Hungary',
  "reservationWindow" INTEGER DEFAULT 30,
  "reservationDuration" INTEGER DEFAULT 90,
  "minHeadsUp" INTEGER DEFAULT 1,
  schedule JSONB,
  
  -- Onboarding tracking
  "onboardingStatus" TEXT NOT NULL DEFAULT 'in-progress' CHECK ("onboardingStatus" IN ('in-progress', 'completed')),
  "onboardingStep" INTEGER NOT NULL DEFAULT 1,
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE("userId")
);

-- Index for user lookup
CREATE INDEX idx_venue_user_id ON public.venue("userId");

-- Enable RLS
ALTER TABLE public.venue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own venue"
  ON public.venue FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own venue"
  ON public.venue FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own venue"
  ON public.venue FOR UPDATE
  USING (auth.uid()::text = "userId");
