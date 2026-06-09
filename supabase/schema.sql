-- Recordings table
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Recording',
  duration_seconds INTEGER DEFAULT 0,
  audio_url TEXT,
  language TEXT DEFAULT 'en-US',
  status TEXT DEFAULT 'done' CHECK (status IN ('recording', 'processing', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table (transcript lines)
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  speaker TEXT,
  start_ms INTEGER DEFAULT 0,
  end_ms INTEGER DEFAULT 0,
  confidence REAL DEFAULT 1.0,
  is_final BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Summaries
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  key_points JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  one_liner TEXT,
  template TEXT DEFAULT 'meeting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach chat history
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'ai')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their recordings" ON recordings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their segments" ON segments
  FOR ALL USING (
    recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own their summaries" ON summaries
  FOR ALL USING (
    recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own their coach messages" ON coach_messages
  FOR ALL USING (
    recording_id IN (SELECT id FROM recordings WHERE user_id = auth.uid())
  );
