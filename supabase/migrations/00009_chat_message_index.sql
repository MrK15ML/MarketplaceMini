-- Migration 00009: Performance — composite index for chat ordering
--
-- Problem:
--   Chat page loads fetch all messages for a job_request_id ordered by
--   created_at ASC (conversation history). The existing index
--   idx_messages_job_request covers only (job_request_id), so PostgreSQL
--   must perform a full sort pass on every matched set after the index scan.
--   For a job with 100+ messages this means 100+ rows sorted in memory on
--   every page view, every mark-as-read call, and every response-time
--   calculation in recalculate_handshake_score().
--
-- Fix:
--   Composite index on (job_request_id, created_at) lets PostgreSQL satisfy
--   both the WHERE clause and the ORDER BY in a single ordered index scan —
--   no sort step required.
--
-- Safety:
--   Pure additive change. No existing indexes, rows, or policies are altered.
--   idx_messages_job_request (00001) is now functionally superseded by this
--   index (the leftmost prefix covers all its use cases) but is retained here
--   to avoid a destructive DROP. It can be dropped in a future cleanup migration.
--
--   idx_messages_first_response (00003) covers (job_request_id, sender_id, created_at)
--   for the response-time LATERAL join and is unaffected.

CREATE INDEX IF NOT EXISTS idx_messages_chat
  ON public.messages(job_request_id, created_at);
