
CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_threads_user_idx ON public.chat_threads(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads select" ON public.chat_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own threads insert" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own threads update" ON public.chat_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own threads delete" ON public.chat_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  parts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages select" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own messages insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own messages delete" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX saved_outputs_user_idx ON public.saved_outputs(user_id, kind, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_outputs TO authenticated;
GRANT ALL ON public.saved_outputs TO service_role;
ALTER TABLE public.saved_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outputs select" ON public.saved_outputs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outputs insert" ON public.saved_outputs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outputs update" ON public.saved_outputs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outputs delete" ON public.saved_outputs FOR DELETE TO authenticated USING (auth.uid() = user_id);
