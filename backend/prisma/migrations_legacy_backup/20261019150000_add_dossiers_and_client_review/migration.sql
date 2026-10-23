-- Additive migration for databases already created from COOPECA Backend Schema v1.1.
-- Do not run on an empty database. No historical collection is attached automatically.

CREATE TYPE dossier_status AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE dossier_link_status AS ENUM ('LINKED', 'NOT_ESTABLISHED');
CREATE TYPE dossier_event_type AS ENUM ('OPENED', 'CLOSED', 'REOPENED');
CREATE TYPE duplicate_review_status AS ENUM ('OPEN', 'MERGED', 'DISMISSED');

CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  daily_amount_xaf BIGINT NOT NULL CHECK (daily_amount_xaf > 0),
  local_reference VARCHAR(100) NOT NULL UNIQUE,
  dossier_no VARCHAR(80) NOT NULL UNIQUE,
  client_operation_id UUID NOT NULL,
  device_id VARCHAR(120) NOT NULL,
  opened_at_declared TIMESTAMPTZ NOT NULL,
  opening_business_date DATE NOT NULL,
  status dossier_status NOT NULL DEFAULT 'OPEN',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  closure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT dossier_operation_per_agent UNIQUE (agent_id, client_operation_id),
  CONSTRAINT dossier_closure_fields_consistent CHECK (
    (status = 'OPEN' AND closed_at IS NULL AND closed_by IS NULL AND closure_reason IS NULL)
    OR
    (status = 'CLOSED' AND closed_at IS NOT NULL AND closed_by IS NOT NULL
      AND NULLIF(trim(closure_reason), '') IS NOT NULL)
  )
);

-- A client belongs to one agency in v1.1, so uniqueness is by client for its agency.
CREATE UNIQUE INDEX uq_dossiers_one_open_per_client
  ON dossiers(client_id) WHERE status = 'OPEN';
CREATE INDEX idx_dossiers_client_status ON dossiers(client_id, status);
CREATE INDEX idx_dossiers_agent_opening_date ON dossiers(agent_id, opening_business_date);

CREATE TABLE dossier_state_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE RESTRICT,
  event_type dossier_event_type NOT NULL,
  previous_status dossier_status,
  new_status dossier_status NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (NULLIF(trim(reason), '') IS NOT NULL),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id VARCHAR(120),
  request_id UUID NOT NULL UNIQUE
);
CREATE INDEX idx_dossier_state_events_dossier
  ON dossier_state_events(dossier_id, occurred_at);

CREATE TABLE client_aliases (
  source_client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE RESTRICT,
  target_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  decided_by UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (NULLIF(trim(reason), '') IS NOT NULL),
  request_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_alias_not_self CHECK (source_client_id <> target_client_id)
);
CREATE INDEX idx_client_aliases_target ON client_aliases(target_client_id);

CREATE TABLE client_duplicate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  candidate_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  matched_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  status duplicate_review_status NOT NULL DEFAULT 'OPEN',
  decision_note TEXT,
  decided_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  CONSTRAINT duplicate_review_not_self CHECK (candidate_client_id <> matched_client_id),
  CONSTRAINT duplicate_review_pair UNIQUE (candidate_client_id, matched_client_id),
  CONSTRAINT duplicate_review_decision_fields CHECK (
    (status = 'OPEN' AND decided_by IS NULL AND decided_at IS NULL)
    OR
    (status <> 'OPEN' AND decided_by IS NOT NULL AND decided_at IS NOT NULL
      AND NULLIF(trim(decision_note), '') IS NOT NULL)
  )
);
CREATE INDEX idx_duplicate_reviews_branch_status
  ON client_duplicate_reviews(branch_id, status, detected_at);

ALTER TABLE collections
  ADD COLUMN dossier_id UUID,
  ADD COLUMN dossier_link_status dossier_link_status NOT NULL DEFAULT 'NOT_ESTABLISHED',
  ADD CONSTRAINT collections_dossier_fk
    FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE RESTRICT,
  ADD CONSTRAINT collection_dossier_link_consistent CHECK (
    (dossier_id IS NOT NULL AND dossier_link_status = 'LINKED')
    OR
    (dossier_id IS NULL AND dossier_link_status = 'NOT_ESTABLISHED')
  );
CREATE INDEX idx_collections_dossier_date ON collections(dossier_id, business_date);

-- The legacy client_id remains for compatibility, but is not a second source of truth.
-- Inserts must provide a dossier; existing unlinked rows remain explicit historical records.
CREATE FUNCTION check_collection_dossier_consistency()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  client_branch UUID;
  dossier_client UUID;
BEGIN
  SELECT branch_id INTO client_branch FROM clients WHERE id = NEW.client_id;
  IF client_branch IS NULL OR client_branch <> NEW.branch_id THEN
    RAISE EXCEPTION 'Collection and client must belong to the same branch';
  END IF;

  IF NEW.dossier_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'New collections must reference a dossier';
    END IF;
    IF NEW.dossier_link_status <> 'NOT_ESTABLISHED' THEN
      RAISE EXCEPTION 'Unlinked historical collections require NOT_ESTABLISHED status';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.dossier_link_status <> 'LINKED' THEN
    RAISE EXCEPTION 'A collection with a dossier must have LINKED status';
  END IF;

  SELECT client_id INTO dossier_client FROM dossiers WHERE id = NEW.dossier_id;
  IF dossier_client IS NULL OR dossier_client <> NEW.client_id THEN
    RAISE EXCEPTION 'Collection client must match the dossier client';
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_collection_dossier_consistency
BEFORE INSERT OR UPDATE OF branch_id, client_id, dossier_id, dossier_link_status ON collections
FOR EACH ROW EXECUTE FUNCTION check_collection_dossier_consistency();

-- Keep alias links within the same agency and reject cycles in the alias graph.
CREATE FUNCTION check_client_alias_consistency()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  source_branch UUID;
  target_branch UUID;
  reaches_source BOOLEAN;
BEGIN
  SELECT branch_id INTO source_branch FROM clients WHERE id = NEW.source_client_id;
  SELECT branch_id INTO target_branch FROM clients WHERE id = NEW.target_client_id;
  IF source_branch IS NULL OR target_branch IS NULL OR source_branch <> target_branch THEN
    RAISE EXCEPTION 'Client aliases must belong to the same branch';
  END IF;

  WITH RECURSIVE alias_chain(client_id) AS (
    SELECT NEW.target_client_id
    UNION
    SELECT aliases.target_client_id
    FROM client_aliases aliases
    JOIN alias_chain chain ON aliases.source_client_id = chain.client_id
    WHERE aliases.source_client_id <> NEW.source_client_id
  )
  SELECT EXISTS (SELECT 1 FROM alias_chain WHERE client_id = NEW.source_client_id)
    INTO reaches_source;

  IF reaches_source THEN
    RAISE EXCEPTION 'Client alias cycle is not allowed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_client_alias_consistency
BEFORE INSERT OR UPDATE OF source_client_id, target_client_id ON client_aliases
FOR EACH ROW EXECUTE FUNCTION check_client_alias_consistency();

-- Duplicate candidates must be in the declared agency. Matching criteria and
-- phone normalization remain application policy and are not encoded here.
CREATE FUNCTION check_duplicate_review_branch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  candidate_branch UUID;
  matched_branch UUID;
BEGIN
  SELECT branch_id INTO candidate_branch FROM clients WHERE id = NEW.candidate_client_id;
  SELECT branch_id INTO matched_branch FROM clients WHERE id = NEW.matched_client_id;
  IF candidate_branch IS NULL OR matched_branch IS NULL
     OR candidate_branch <> NEW.branch_id OR matched_branch <> NEW.branch_id THEN
    RAISE EXCEPTION 'Duplicate review clients must belong to the declared branch';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_duplicate_review_branch
BEFORE INSERT OR UPDATE OF branch_id, candidate_client_id, matched_client_id
ON client_duplicate_reviews
FOR EACH ROW EXECUTE FUNCTION check_duplicate_review_branch();

-- These tables/columns require application-level transactional audit writes.
-- This migration intentionally does not backfill historical collections or
-- create inferred client aliases/duplicate reviews.
