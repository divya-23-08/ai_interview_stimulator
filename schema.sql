-- ============================================================
-- Unified Skill Swap + AI Interview Simulator - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  skills_teach  TEXT[] DEFAULT '{}',   -- skills this user can teach
  skills_learn  TEXT[] DEFAULT '{}',   -- skills this user wants to learn
  avg_rating    NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MATCHES (skill-swap pairings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_a_teaches TEXT NOT NULL,  -- what user_a teaches user_b
  skill_b_teaches TEXT NOT NULL,  -- what user_b teaches user_a
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

-- ============================================================
-- CHAT MESSAGES (real-time via Supabase Realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id      UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ============================================================
-- SESSIONS (scheduled mentoring sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id      UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  host_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER DEFAULT 60,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meeting_link  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSION REVIEWS (ratings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.session_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

-- Auto-update avg_rating on profiles
CREATE OR REPLACE FUNCTION public.update_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.session_reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM public.session_reviews WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON public.session_reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON public.session_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_avg_rating();

-- ============================================================
-- INTERVIEWS (AI Interview Sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL CHECK (topic IN ('Technical', 'HR', 'Mixed')),
  subtopic      TEXT,           -- e.g. 'JavaScript', 'System Design', 'Behavioral'
  difficulty    TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  total_score   NUMERIC(5,2) DEFAULT 0,
  max_score     NUMERIC(5,2) DEFAULT 0,
  percentage    NUMERIC(5,2) DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ============================================================
-- INTERVIEW QUESTIONS & ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id  UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'open_ended',
  order_num     INTEGER NOT NULL,
  user_answer   TEXT,
  ai_feedback   TEXT,
  score         NUMERIC(4,2),
  max_score     NUMERIC(4,2) DEFAULT 10,
  model_answer  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: users can see their own matches
CREATE POLICY "Users can view their matches" ON public.matches FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_a_id);
CREATE POLICY "Users can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Chat: users can see and send messages in their matches
CREATE POLICY "Users can view chat in their matches" ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())));
CREATE POLICY "Users can send messages in their matches" ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())));

-- Sessions: participants can view
CREATE POLICY "Session participants can view" ON public.sessions FOR SELECT USING (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "Host can create sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Participants can update sessions" ON public.sessions FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Reviews: anyone can read, only the reviewer can write
CREATE POLICY "Reviews are public" ON public.session_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write their own reviews" ON public.session_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Interviews: users can only see/manage their own
CREATE POLICY "Users can view their interviews" ON public.interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their interviews" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);

-- Interview questions: tied to user's interview
CREATE POLICY "Users can view their questions" ON public.interview_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can insert their questions" ON public.interview_questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can update their questions" ON public.interview_questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.user_id = auth.uid()));

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match ON public.chat_messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_host ON public.sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_guest ON public.sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user ON public.interviews(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_questions_interview ON public.interview_questions(interview_id, order_num);
