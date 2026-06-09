-- NOTA AI — Supabase Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE recordings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Untitled Recording',
  language    TEXT NOT NULL DEFAULT 'en-US',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE segments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  speaker      INTEGER NOT NULL DEFAULT 0,
  start_sec    NUMERIC(10,3) NOT NULL,
  end_sec      NUMERIC(10,3) NOT NULL,
  text         TEXT NOT NULL,
  is_final     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE summaries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id  UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE UNIQUE,
  tldr          TEXT NOT NULL DEFAULT '',
  bullet_points JSONB NOT NULL DEFAULT '[]',
  action_items  JSONB NOT NULL DEFAULT '[]',
  sentiment     TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive','neutral','negative')),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE recordings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_recordings"    ON recordings    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_segments"      ON segments      FOR ALL USING (recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid()));
CREATE POLICY "own_summaries"     ON summaries     FOR ALL USING (recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid()));
CREATE POLICY "own_chat_messages" ON chat_messages FOR ALL USING (recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid()));
