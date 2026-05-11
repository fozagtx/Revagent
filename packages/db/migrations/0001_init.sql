CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE audit_outcome AS ENUM ('won', 'lost');
CREATE TYPE audit_classification AS ENUM ('matches_won_pattern', 'matches_lost_pattern', 'novel');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed');

CREATE TABLE founders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pitch_analyses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id            UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  deck_filename         TEXT NOT NULL,
  deck_url              TEXT NOT NULL,
  num_slides            INTEGER,
  frame_score           INTEGER,
  offer_score           INTEGER,
  desire_score          INTEGER,
  weakest_slide_idx     INTEGER,
  slide_critiques       JSONB NOT NULL,
  rewrites              JSONB,
  strongest_archetype   TEXT,
  narration_audio_url   TEXT,
  gemini_request_id     TEXT,
  status                TEXT NOT NULL DEFAULT 'processing',
  error_message         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pitch_frame_chk  CHECK (frame_score  IS NULL OR (frame_score  BETWEEN 1 AND 10)),
  CONSTRAINT pitch_offer_chk  CHECK (offer_score  IS NULL OR (offer_score  BETWEEN 1 AND 10)),
  CONSTRAINT pitch_desire_chk CHECK (desire_score IS NULL OR (desire_score BETWEEN 1 AND 10))
);
CREATE INDEX idx_pitch_founder ON pitch_analyses(founder_id, created_at DESC);

CREATE TABLE calls (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id               UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  started_at               TIMESTAMPTZ NOT NULL,
  ended_at                 TIMESTAMPTZ,
  duration_sec             INTEGER,
  transcript               JSONB,
  switch_chart             JSONB,
  follow_ups               JSONB,
  speechmatics_session_id  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_calls_founder ON calls(founder_id, started_at DESC);

CREATE TABLE audits (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id                  UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  deal_id                     TEXT NOT NULL,
  outcome                     audit_outcome NOT NULL,
  source_call_ids             JSONB,
  transcript_text             TEXT,
  objections                  JSONB,
  jtbd_patterns               JSONB,
  classification              audit_classification,
  classification_evidence     JSONB,
  buyer_language              JSONB,
  digest_pdf_url              TEXT,
  featherless_model_versions  JSONB,
  pipeline_checkpoint         TEXT NOT NULL DEFAULT 'queued',
  error_message               TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                TIMESTAMPTZ
);
CREATE INDEX idx_audits_outcome ON audits(founder_id, outcome, created_at DESC);

CREATE TABLE weekly_digests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id     UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  week_starting  DATE NOT NULL,
  audit_ids      JSONB NOT NULL,
  pdf_url        TEXT NOT NULL,
  sent_at        TIMESTAMPTZ,
  opened_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id      UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,
  status        job_status NOT NULL DEFAULT 'queued',
  payload       JSONB,
  result        JSONB,
  attempts      INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  claimed_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_jobs_status ON audit_jobs(status, created_at);
CREATE INDEX idx_audit_jobs_audit  ON audit_jobs(audit_id, stage);
