-- COOPECA Backend Schema v1.1
-- PostgreSQL schema aligned with:
-- - NestJS REST API
-- - Multi-agency / multi-cashier organization
-- - Daily collections only (no savings balances, loans, interest ledger)
-- - Supervisor-authorized daily-closure reopening with reason + immutable history
--
-- Money: BIGINT in FCFA/XAF. Never use FLOAT/DOUBLE for financial amounts.
-- Production note: test migrations and business rules against real workflows before deployment.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Enumerations ----------
CREATE TYPE user_role AS ENUM (
  'AGENT', 'CASHIER', 'SUPERVISOR', 'ACCOUNTANT', 'ADMIN', 'AUDITOR'
);
CREATE TYPE client_status AS ENUM ('PROVISIONAL', 'ACTIVE', 'REJECTED', 'ARCHIVED');
CREATE TYPE collection_status AS ENUM ('RECORDED', 'REVERSED');
CREATE TYPE remittance_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'RECEIVED', 'PARTIAL', 'DISPUTED', 'CANCELLED'
);
CREATE TYPE closure_status AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REOPENED');
CREATE TYPE discrepancy_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE sync_status AS ENUM ('RECEIVED', 'APPLIED', 'REJECTED');

-- ---------- Agencies ----------
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  address TEXT,
  phone VARCHAR(40),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Users and agency permissions ----------
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(180) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  phone VARCHAR(40),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users can be assigned to one or more agencies.
-- ADMIN/AUDITOR cross-agency access must still be explicitly authorized by API policy.
CREATE TABLE user_branch_access (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  granted_by UUID REFERENCES app_users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, branch_id)
);
CREATE UNIQUE INDEX uq_user_primary_branch
  ON user_branch_access(user_id) WHERE is_primary = TRUE;
CREATE INDEX idx_user_branch_access_branch ON user_branch_access(branch_id, user_id);

-- ---------- Clients ----------
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  client_code VARCHAR(40) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(40),
  neighborhood VARCHAR(160),
  address_details TEXT,
  status client_status NOT NULL DEFAULT 'PROVISIONAL',
  created_by UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_offline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT client_review_fields_consistent CHECK (
    (status = 'PROVISIONAL' AND reviewed_at IS NULL)
    OR status <> 'PROVISIONAL'
  ),
  CONSTRAINT rejected_client_requires_reason CHECK (
    status <> 'REJECTED' OR NULLIF(trim(rejection_reason), '') IS NOT NULL
  )
);
CREATE INDEX idx_clients_branch_name ON clients(branch_id, last_name, first_name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_branch_status ON clients(branch_id, status);

-- ---------- Daily collections ----------
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  amount_xaf BIGINT NOT NULL CHECK (amount_xaf > 0),
  collected_at TIMESTAMPTZ NOT NULL,
  business_date DATE NOT NULL,
  client_receipt_no VARCHAR(80) NOT NULL UNIQUE,
  local_receipt_no VARCHAR(100),
  device_id VARCHAR(120),
  client_operation_id UUID NOT NULL,
  status collection_status NOT NULL DEFAULT 'RECORDED',
  sync_received_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, client_operation_id),
  CONSTRAINT collection_reversal_fields_consistent CHECK (
    (status = 'REVERSED' AND reversed_at IS NOT NULL
       AND reversed_by IS NOT NULL AND NULLIF(trim(reversal_reason), '') IS NOT NULL)
    OR
    (status = 'RECORDED' AND reversed_at IS NULL AND reversed_by IS NULL
       AND reversal_reason IS NULL)
  )
);
CREATE INDEX idx_collections_branch_date ON collections(branch_id, business_date);
CREATE INDEX idx_collections_client_date ON collections(client_id, business_date);
CREATE INDEX idx_collections_agent_date ON collections(agent_id, business_date);
CREATE INDEX idx_collections_sync_received ON collections(sync_received_at);

-- Ensure client and collection belong to the same agency.
CREATE OR REPLACE FUNCTION check_collection_client_branch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE client_branch UUID;
BEGIN
  SELECT branch_id INTO client_branch FROM clients WHERE id = NEW.client_id;
  IF client_branch IS NULL OR client_branch <> NEW.branch_id THEN
    RAISE EXCEPTION 'Collection and client must belong to the same branch';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_collection_client_branch
BEFORE INSERT OR UPDATE OF client_id, branch_id ON collections
FOR EACH ROW EXECUTE FUNCTION check_collection_client_branch();

-- ---------- Remittances ----------
CREATE TABLE remittances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  remittance_no VARCHAR(80) NOT NULL UNIQUE,
  status remittance_status NOT NULL DEFAULT 'DRAFT',
  declared_total_xaf BIGINT NOT NULL DEFAULT 0 CHECK (declared_total_xaf >= 0),
  received_total_xaf BIGINT CHECK (received_total_xaf >= 0),
  submitted_at TIMESTAMPTZ,
  received_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  received_at TIMESTAMPTZ,
  cashier_note TEXT,
  client_operation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, client_operation_id),
  CONSTRAINT remittance_receipt_fields_consistent CHECK (
    (status IN ('RECEIVED','PARTIAL') AND received_by IS NOT NULL
      AND received_at IS NOT NULL AND received_total_xaf IS NOT NULL)
    OR status NOT IN ('RECEIVED','PARTIAL')
  )
);

CREATE TABLE remittance_items (
  remittance_id UUID NOT NULL REFERENCES remittances(id) ON DELETE RESTRICT,
  collection_id UUID NOT NULL UNIQUE REFERENCES collections(id) ON DELETE RESTRICT,
  amount_xaf BIGINT NOT NULL CHECK (amount_xaf > 0),
  PRIMARY KEY (remittance_id, collection_id)
);
CREATE INDEX idx_remittance_items_collection ON remittance_items(collection_id);

-- Remittance item must match collection amount and branch.
CREATE OR REPLACE FUNCTION check_remittance_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  c_branch UUID;
  c_amount BIGINT;
  r_branch UUID;
BEGIN
  SELECT branch_id, amount_xaf INTO c_branch, c_amount
  FROM collections WHERE id = NEW.collection_id;
  SELECT branch_id INTO r_branch FROM remittances WHERE id = NEW.remittance_id;
  IF c_branch IS NULL OR r_branch IS NULL OR c_branch <> r_branch THEN
    RAISE EXCEPTION 'Remittance and collection must belong to the same branch';
  END IF;
  IF NEW.amount_xaf <> c_amount THEN
    RAISE EXCEPTION 'Remittance item amount must equal the collection amount';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_remittance_item_check
BEFORE INSERT OR UPDATE OF remittance_id, collection_id, amount_xaf ON remittance_items
FOR EACH ROW EXECUTE FUNCTION check_remittance_item();

-- ---------- Daily closures ----------
CREATE TABLE daily_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  business_date DATE NOT NULL,
  closure_no VARCHAR(80) NOT NULL UNIQUE,
  declared_collection_total_xaf BIGINT NOT NULL DEFAULT 0 CHECK (declared_collection_total_xaf >= 0),
  declared_remittance_total_xaf BIGINT NOT NULL DEFAULT 0 CHECK (declared_remittance_total_xaf >= 0),
  collection_count INTEGER NOT NULL DEFAULT 0 CHECK (collection_count >= 0),
  status closure_status NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  reopen_count INTEGER NOT NULL DEFAULT 0 CHECK (reopen_count >= 0),
  client_operation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, business_date),
  UNIQUE (agent_id, client_operation_id)
);
CREATE INDEX idx_closures_branch_date ON daily_closures(branch_id, business_date);
CREATE INDEX idx_closures_status ON daily_closures(branch_id, status, business_date);

-- Every reopening is separately recorded and immutable by application policy.
CREATE TABLE closure_reopen_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_id UUID NOT NULL REFERENCES daily_closures(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  reopened_by UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  previous_status closure_status NOT NULL,
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 5),
  reopened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id VARCHAR(120),
  request_id UUID NOT NULL UNIQUE
);
CREATE INDEX idx_closure_reopen_events_closure ON closure_reopen_events(closure_id, reopened_at);

-- Reopening must happen in a transaction:
-- 1) authorize supervisor access to the closure's branch;
-- 2) update closure status to REOPENED and increment reopen_count;
-- 3) insert closure_reopen_events with a meaningful reason;
-- 4) insert audit_logs.
-- Only the backend DB role/service should perform these writes.

-- ---------- Discrepancies ----------
CREATE TABLE discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  remittance_id UUID REFERENCES remittances(id) ON DELETE RESTRICT,
  closure_id UUID REFERENCES daily_closures(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  status discrepancy_status NOT NULL DEFAULT 'OPEN',
  expected_total_xaf BIGINT,
  actual_total_xaf BIGINT,
  difference_xaf BIGINT,
  description TEXT NOT NULL,
  resolution_note TEXT,
  resolved_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT discrepancy_reference_required CHECK (
    remittance_id IS NOT NULL OR closure_id IS NOT NULL
  ),
  CONSTRAINT discrepancy_resolution_fields CHECK (
    status <> 'RESOLVED' OR
    (resolved_by IS NOT NULL AND resolved_at IS NOT NULL
      AND NULLIF(trim(resolution_note), '') IS NOT NULL)
  )
);
CREATE INDEX idx_discrepancies_branch_status ON discrepancies(branch_id, status, created_at);

-- ---------- Offline synchronization / idempotency ----------
CREATE TABLE sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  device_id VARCHAR(120) NOT NULL,
  client_operation_id UUID NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  payload_hash VARCHAR(128) NOT NULL,
  status sync_status NOT NULL DEFAULT 'RECEIVED',
  response_code VARCHAR(60),
  response_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (user_id, device_id, client_operation_id)
);
CREATE INDEX idx_sync_events_status ON sync_events(status, received_at);
CREATE INDEX idx_sync_events_branch ON sync_events(branch_id, received_at);

-- ---------- Audit log ----------
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  request_id UUID,
  device_id VARCHAR(120),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at);
CREATE INDEX idx_audit_branch_date ON audit_logs(branch_id, created_at);

-- ---------- Settings ----------
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Convention: branch_id NULL means global setting.
CREATE UNIQUE INDEX uq_global_setting_key ON system_settings(setting_key) WHERE branch_id IS NULL;
CREATE UNIQUE INDEX uq_branch_setting_key ON system_settings(branch_id, setting_key) WHERE branch_id IS NOT NULL;

COMMIT;

-- ---------- Required service-layer rules ----------
-- A. NestJS must use transactions for collection sync, remittance submit/receive,
--    closure submit/reopen, and discrepancy resolution.
-- B. Idempotency: retrying the same client_operation_id with the same payload_hash
--    returns the original result; a different hash for the same key is rejected.
-- C. Multi-agency: every query/mutation is scoped to branches the authenticated user can access.
--    Never trust branch_id supplied by the client without authorization checks.
-- D. Reopen closure: only SUPERVISOR with access to the closure's branch; reason required;
--    update closure + insert closure_reopen_events + audit_logs atomically.
-- E. No hard deletes for financial operations. Reverse collections with reason and actor.
-- F. A collection can only be assigned to one remittance. Server recomputes remittance totals
--    from remittance_items; never trust declared totals sent by Android.
-- G. Receipt numbering: offline receipt is device-scoped/provisional; server assigns official
--    receipt number at sync and preserves the mapping to the local reference.
-- H. Do not add account balances, savings ledger, loans or interest tables in this version.
-- I. Recommended NestJS modules: Auth, Users, Branches, Clients, Collections, Remittances,
--    DailyClosures, Discrepancies, Sync, Audit, Reports, Settings.
-- J. Recommended API guards: JWT authentication + role guard + branch-access guard.
