-- COOPECA cycle-product migration. Additive only; preserve legacy collections/remittances.
-- Existing clients are intentionally left without market/agent assignment until reviewed.

CREATE TYPE tontine_cycle_status AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CLOSED');
CREATE TYPE cycle_transaction_type AS ENUM ('DEPOSIT', 'COMMISSION', 'WITHDRAWAL');
CREATE TYPE withdrawal_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE cycle_event_type AS ENUM (
  'OPENED', 'SUSPENDED', 'RESUMED', 'COMPLETED', 'CLOSED',
  'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED'
);

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clients
  ADD COLUMN market_id UUID REFERENCES markets(id) ON DELETE RESTRICT,
  ADD COLUMN collection_agent_id UUID REFERENCES app_users(id) ON DELETE RESTRICT;
CREATE INDEX idx_clients_market_agent ON clients(market_id, collection_agent_id);

ALTER TABLE clients
  ADD CONSTRAINT client_cycle_assignment_pair CHECK (
    (market_id IS NULL AND collection_agent_id IS NULL)
    OR (market_id IS NOT NULL AND collection_agent_id IS NOT NULL)
  );

CREATE FUNCTION check_client_cycle_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  market_active BOOLEAN;
  agent_role user_role;
  agent_active BOOLEAN;
BEGIN
  IF NEW.market_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT is_active INTO market_active FROM markets WHERE id = NEW.market_id;
  SELECT role, is_active INTO agent_role, agent_active FROM app_users WHERE id = NEW.collection_agent_id;
  IF market_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Client must be assigned to an active market';
  END IF;
  IF agent_role IS DISTINCT FROM 'AGENT'::user_role OR agent_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Client must be assigned to an active AGENT user';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_client_cycle_assignment
BEFORE INSERT OR UPDATE OF market_id, collection_agent_id ON clients
FOR EACH ROW EXECUTE FUNCTION check_client_cycle_assignment();

CREATE TABLE tontine_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  opened_by_agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  fixed_amount_xaf BIGINT NOT NULL CHECK (fixed_amount_xaf > 0),
  target_installments INTEGER NOT NULL DEFAULT 31 CHECK (target_installments = 31),
  installment_count INTEGER NOT NULL DEFAULT 0 CHECK (installment_count BETWEEN 0 AND 31),
  total_collected_xaf BIGINT NOT NULL DEFAULT 0 CHECK (total_collected_xaf >= 0),
  status tontine_cycle_status NOT NULL DEFAULT 'ACTIVE',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  client_operation_id UUID NOT NULL UNIQUE,
  payload_hash VARCHAR(64) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT cycle_completion_fields CHECK (
    (status <> 'COMPLETED' OR (installment_count = 31 AND completed_at IS NOT NULL))
  ),
  CONSTRAINT cycle_close_fields CHECK (
    (status = 'CLOSED' AND closed_at IS NOT NULL)
    OR (status <> 'CLOSED' AND closed_at IS NULL)
  )
);
CREATE UNIQUE INDEX uq_cycle_one_unclosed_per_dossier
  ON tontine_cycles(dossier_id) WHERE status <> 'CLOSED';
CREATE INDEX idx_cycles_client_opened ON tontine_cycles(client_id, opened_at);
CREATE INDEX idx_cycles_market_status_opened ON tontine_cycles(market_id, status, opened_at);
CREATE INDEX idx_cycles_agent_status_opened ON tontine_cycles(opened_by_agent_id, status, opened_at);

CREATE FUNCTION check_tontine_cycle_references()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  dossier_client UUID;
  dossier_status dossier_status;
  client_market UUID;
  client_branch UUID;
  assigned_agent UUID;
  client_status client_status;
  market_active BOOLEAN;
  opener_role user_role;
  opener_active BOOLEAN;
BEGIN
  SELECT client_id, status INTO dossier_client, dossier_status
    FROM dossiers WHERE id = NEW.dossier_id;
  SELECT market_id, branch_id, collection_agent_id, status
    INTO client_market, client_branch, assigned_agent, client_status
    FROM clients WHERE id = NEW.client_id;
  SELECT is_active INTO market_active FROM markets WHERE id = NEW.market_id;
  SELECT role, is_active INTO opener_role, opener_active
    FROM app_users WHERE id = NEW.opened_by_agent_id;

  IF dossier_client IS DISTINCT FROM NEW.client_id OR dossier_status IS DISTINCT FROM 'OPEN'::dossier_status THEN
    RAISE EXCEPTION 'Cycle dossier must be open and belong to the client';
  END IF;
  IF client_market IS DISTINCT FROM NEW.market_id OR client_branch IS DISTINCT FROM NEW.branch_id
     OR assigned_agent IS DISTINCT FROM NEW.opened_by_agent_id OR client_status IS DISTINCT FROM 'ACTIVE'::client_status THEN
    RAISE EXCEPTION 'Cycle references must match the active client assignment';
  END IF;
  IF market_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Cycle market must be active';
  END IF;
  IF opener_role IS DISTINCT FROM 'AGENT'::user_role OR opener_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Cycle opener must be an active AGENT';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_tontine_cycle_references
BEFORE INSERT ON tontine_cycles
FOR EACH ROW EXECUTE FUNCTION check_tontine_cycle_references();

CREATE FUNCTION prevent_cycle_assignment_change_with_open_cycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.market_id IS DISTINCT FROM OLD.market_id
      OR NEW.collection_agent_id IS DISTINCT FROM OLD.collection_agent_id)
     AND EXISTS (
       SELECT 1 FROM tontine_cycles
       WHERE client_id = OLD.id AND status <> 'CLOSED'
     ) THEN
    RAISE EXCEPTION 'Client market/agent assignment cannot change while a cycle is unclosed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_prevent_client_cycle_assignment_change
BEFORE UPDATE OF market_id, collection_agent_id ON clients
FOR EACH ROW EXECUTE FUNCTION prevent_cycle_assignment_change_with_open_cycle();

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES tontine_cycles(id) ON DELETE RESTRICT,
  requested_by_agent_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reviewed_by_id UUID REFERENCES app_users(id) ON DELETE RESTRICT,
  amount_xaf BIGINT NOT NULL CHECK (amount_xaf > 0),
  closes_cycle BOOLEAN NOT NULL DEFAULT FALSE,
  status withdrawal_request_status NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  rejection_reason TEXT,
  idempotency_key UUID NOT NULL UNIQUE,
  payload_hash VARCHAR(64) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  transaction_id UUID UNIQUE,
  CONSTRAINT withdrawal_review_fields CHECK (
    (status = 'PENDING' AND reviewed_by_id IS NULL AND reviewed_at IS NULL AND transaction_id IS NULL)
    OR
    (status = 'APPROVED' AND reviewed_by_id IS NOT NULL AND reviewed_at IS NOT NULL AND transaction_id IS NOT NULL)
    OR
    (status = 'REJECTED' AND reviewed_by_id IS NOT NULL AND reviewed_at IS NOT NULL
      AND transaction_id IS NULL AND NULLIF(trim(rejection_reason), '') IS NOT NULL)
  )
);
CREATE INDEX idx_withdrawals_cycle_status_date
  ON withdrawal_requests(cycle_id, status, requested_at);
CREATE INDEX idx_withdrawals_agent_status_date
  ON withdrawal_requests(requested_by_agent_id, status, requested_at);

CREATE FUNCTION check_withdrawal_request_authority()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cycle_agent UUID;
  cycle_status tontine_cycle_status;
  requester_role user_role;
  reviewer_role user_role;
  reviewer_active BOOLEAN;
BEGIN
  SELECT c.opened_by_agent_id, c.status INTO cycle_agent, cycle_status
    FROM tontine_cycles c WHERE c.id = NEW.cycle_id;
  SELECT role INTO requester_role FROM app_users WHERE id = NEW.requested_by_agent_id;
  IF cycle_status IS NULL OR cycle_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Cannot request a withdrawal from a closed cycle';
  END IF;
  IF cycle_agent IS DISTINCT FROM NEW.requested_by_agent_id OR requester_role IS DISTINCT FROM 'AGENT'::user_role THEN
    RAISE EXCEPTION 'Withdrawal must be requested by the cycle collecting agent';
  END IF;
  IF NEW.status <> 'PENDING' THEN
    SELECT role, is_active INTO reviewer_role, reviewer_active FROM app_users WHERE id = NEW.reviewed_by_id;
    IF reviewer_role IS DISTINCT FROM 'SUPERVISOR'::user_role OR reviewer_active IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Withdrawal decision requires an active supervisor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_withdrawal_request_authority
BEFORE INSERT OR UPDATE OF status, reviewed_by_id, cycle_id, requested_by_agent_id
ON withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION check_withdrawal_request_authority();

CREATE TABLE cycle_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES tontine_cycles(id) ON DELETE RESTRICT,
  type cycle_transaction_type NOT NULL,
  amount_xaf BIGINT NOT NULL CHECK (amount_xaf > 0),
  actor_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  withdrawal_request_id UUID REFERENCES withdrawal_requests(id) ON DELETE RESTRICT,
  idempotency_key UUID NOT NULL UNIQUE,
  payload_hash VARCHAR(64) NOT NULL,
  client_occurred_at TIMESTAMPTZ,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cycle_transactions_cycle_date
  ON cycle_transactions(cycle_id, occurred_at);
CREATE INDEX idx_cycle_transactions_cycle_type_date
  ON cycle_transactions(cycle_id, type, occurred_at);

ALTER TABLE withdrawal_requests
  ADD CONSTRAINT withdrawal_transaction_fk
  FOREIGN KEY (transaction_id) REFERENCES cycle_transactions(id) ON DELETE RESTRICT;

CREATE TABLE cycle_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL UNIQUE REFERENCES tontine_cycles(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  amount_xaf BIGINT NOT NULL CHECK (amount_xaf > 0),
  transaction_id UUID NOT NULL UNIQUE REFERENCES cycle_transactions(id) ON DELETE RESTRICT,
  withdrawal_request_id UUID NOT NULL UNIQUE REFERENCES withdrawal_requests(id) ON DELETE RESTRICT,
  charged_by_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  charged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION check_cycle_commission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  fixed_amount BIGINT;
  cycle_branch UUID;
  transaction_cycle UUID;
  transaction_type cycle_transaction_type;
  request_cycle UUID;
  charger_role user_role;
  charger_active BOOLEAN;
BEGIN
  SELECT fixed_amount_xaf, branch_id INTO fixed_amount, cycle_branch
    FROM tontine_cycles WHERE id = NEW.cycle_id;
  SELECT cycle_id, type INTO transaction_cycle, transaction_type
    FROM cycle_transactions WHERE id = NEW.transaction_id;
  SELECT cycle_id INTO request_cycle FROM withdrawal_requests
    WHERE id = NEW.withdrawal_request_id AND status = 'PENDING';
  SELECT role, is_active INTO charger_role, charger_active FROM app_users WHERE id = NEW.charged_by_id;
  IF fixed_amount IS DISTINCT FROM NEW.amount_xaf OR cycle_branch IS DISTINCT FROM NEW.branch_id
     OR transaction_cycle IS DISTINCT FROM NEW.cycle_id OR transaction_type IS DISTINCT FROM 'COMMISSION'::cycle_transaction_type
    OR request_cycle IS DISTINCT FROM NEW.cycle_id
    OR charger_role IS DISTINCT FROM 'SUPERVISOR'::user_role OR charger_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Commission must equal the cycle installment and belong to its approved withdrawal';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_cycle_commission_consistency
BEFORE INSERT ON cycle_commissions
FOR EACH ROW EXECUTE FUNCTION check_cycle_commission();

CREATE TABLE tontine_cycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES tontine_cycles(id) ON DELETE RESTRICT,
  actor_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  event_type cycle_event_type NOT NULL,
  reason TEXT,
  request_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cycle_events_cycle_date ON tontine_cycle_events(cycle_id, created_at);

CREATE FUNCTION reject_cycle_event_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Cycle events are immutable';
END;
$$;
CREATE TRIGGER trg_cycle_events_immutable
BEFORE UPDATE OR DELETE ON tontine_cycle_events
FOR EACH ROW EXECUTE FUNCTION reject_cycle_event_mutation();

-- Keep the counter/cumulative total in lockstep with the append-only deposit ledger.
CREATE FUNCTION apply_tontine_deposit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_cycle tontine_cycles%ROWTYPE;
  next_count INTEGER;
BEGIN
  SELECT * INTO current_cycle FROM tontine_cycles WHERE id = NEW.cycle_id FOR UPDATE;
  IF current_cycle.id IS NULL THEN
    RAISE EXCEPTION 'Cycle not found';
  END IF;
  IF NEW.type <> 'DEPOSIT' THEN
    RETURN NEW;
  END IF;
  IF current_cycle.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Cycle does not accept deposits in current status';
  END IF;
  IF NEW.amount_xaf <> current_cycle.fixed_amount_xaf THEN
    RAISE EXCEPTION 'Deposit must equal the fixed cycle amount';
  END IF;
  IF current_cycle.installment_count >= current_cycle.target_installments THEN
    RAISE EXCEPTION 'Cycle installment target already reached';
  END IF;

  next_count := current_cycle.installment_count + 1;
  UPDATE tontine_cycles
  SET installment_count = next_count,
      total_collected_xaf = total_collected_xaf + NEW.amount_xaf,
      status = CASE WHEN next_count = target_installments THEN 'COMPLETED'::tontine_cycle_status ELSE status END,
      completed_at = CASE WHEN next_count = target_installments THEN now() ELSE completed_at END,
      version = version + 1
  WHERE id = NEW.cycle_id;

  IF next_count = current_cycle.target_installments THEN
    INSERT INTO tontine_cycle_events(cycle_id, actor_user_id, event_type, request_id)
    VALUES (NEW.cycle_id, NEW.actor_user_id, 'COMPLETED', gen_random_uuid());
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_tontine_deposit
BEFORE INSERT ON cycle_transactions
FOR EACH ROW EXECUTE FUNCTION apply_tontine_deposit();

-- Serialize withdrawal/commission posting on the cycle row and reject a negative ledger balance.
CREATE FUNCTION validate_tontine_financial_entry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_cycle tontine_cycles%ROWTYPE;
  current_balance BIGINT;
  request_row withdrawal_requests%ROWTYPE;
  commission_exists BOOLEAN;
BEGIN
  SELECT * INTO current_cycle FROM tontine_cycles WHERE id = NEW.cycle_id FOR UPDATE;
  IF current_cycle.id IS NULL THEN
    RAISE EXCEPTION 'Cycle not found';
  END IF;
  IF NEW.type = 'DEPOSIT' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(CASE WHEN type = 'DEPOSIT' THEN amount_xaf ELSE -amount_xaf END), 0)
    INTO current_balance
    FROM cycle_transactions WHERE cycle_id = NEW.cycle_id;
  SELECT EXISTS (
    SELECT 1 FROM cycle_transactions WHERE cycle_id = NEW.cycle_id AND type = 'COMMISSION'
  ) INTO commission_exists;

  IF NEW.type = 'COMMISSION' THEN
    IF commission_exists OR NEW.amount_xaf <> current_cycle.fixed_amount_xaf THEN
      RAISE EXCEPTION 'Commission already charged or amount is invalid';
    END IF;
    IF current_cycle.installment_count = 0 OR current_balance < NEW.amount_xaf THEN
      RAISE EXCEPTION 'Commission cannot exceed available balance';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM withdrawal_requests
      WHERE cycle_id = NEW.cycle_id AND status = 'PENDING' AND transaction_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Commission must be charged as part of an approved withdrawal';
    END IF;
    RETURN NEW;
  END IF;

  SELECT * INTO request_row
    FROM withdrawal_requests
    WHERE id = NEW.withdrawal_request_id AND cycle_id = NEW.cycle_id
      AND status = 'PENDING' AND transaction_id IS NULL
      AND amount_xaf = NEW.amount_xaf
    FOR UPDATE;
  IF request_row.id IS NULL OR request_row.cycle_id <> NEW.cycle_id
     OR request_row.amount_xaf <> NEW.amount_xaf THEN
    RAISE EXCEPTION 'Withdrawal transaction requires a matching approved request';
  END IF;
  IF current_balance < NEW.amount_xaf THEN
    RAISE EXCEPTION 'Withdrawal exceeds available cycle balance';
  END IF;
  IF NOT commission_exists THEN
    RAISE EXCEPTION 'Commission must be recorded before the first withdrawal';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_tontine_financial_entry
BEFORE INSERT ON cycle_transactions
FOR EACH ROW EXECUTE FUNCTION validate_tontine_financial_entry();

CREATE FUNCTION reject_cycle_transaction_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Cycle financial transactions are immutable';
END;
$$;
CREATE TRIGGER trg_cycle_transactions_immutable
BEFORE UPDATE OR DELETE ON cycle_transactions
FOR EACH ROW EXECUTE FUNCTION reject_cycle_transaction_mutation();

CREATE FUNCTION reject_cycle_commission_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Cycle commissions are immutable';
END;
$$;
CREATE TRIGGER trg_cycle_commissions_immutable
BEFORE UPDATE OR DELETE ON cycle_commissions
FOR EACH ROW EXECUTE FUNCTION reject_cycle_commission_mutation();
