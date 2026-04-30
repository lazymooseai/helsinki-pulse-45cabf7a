CREATE TABLE public.feature_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature TEXT NOT NULL,
  context TEXT,
  message TEXT NOT NULL,
  rating TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback" ON public.feature_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.feature_feedback FOR SELECT TO anon, authenticated USING (true);