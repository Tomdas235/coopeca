-- COOPECA geographic hierarchy migration: add Zone, Market -> Branch relation.
-- Additive only: preserve legacy collections/remittances and existing client data.

-- Zone table (top of geographic hierarchy: Zone 1 -- n Market)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Market: add zone_id foreign key (Market belongs to exactly one Zone)
ALTER TABLE markets
  ADD COLUMN zone_id UUID REFERENCES zones(id) ON DELETE RESTRICT;

-- Create index on markets.zone_id
CREATE INDEX idx_markets_zone_id ON markets(zone_id);

-- Branch: add market_id foreign key (Branch belongs to exactly one Market)
ALTER TABLE branches
  ADD COLUMN market_id UUID REFERENCES markets(id) ON DELETE RESTRICT;

-- Create index on branches.market_id
CREATE INDEX idx_branches_market_id ON branches(market_id);

-- ============================================================
-- Data backfill instructions (manual, if needed):
-- ============================================================
-- Add zone to markets:
--   UPDATE markets SET zone_id = 'zone-uuid' WHERE code = 'market-code';
-- Add market to branches:
--   UPDATE branches SET market_id = 'market-uuid' WHERE code = 'branch-code';
-- ============================================================
