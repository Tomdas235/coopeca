-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('AGENT', 'CASHIER', 'SUPERVISOR', 'ACCOUNTANT', 'ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "client_status" AS ENUM ('PROVISIONAL', 'ACTIVE', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "collection_status" AS ENUM ('RECORDED', 'REVERSED');

-- CreateEnum
CREATE TYPE "dossier_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "dossier_link_status" AS ENUM ('LINKED', 'NOT_ESTABLISHED');

-- CreateEnum
CREATE TYPE "dossier_event_type" AS ENUM ('OPENED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "remittance_status" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED', 'PARTIAL', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "closure_status" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REOPENED');

-- CreateEnum
CREATE TYPE "discrepancy_status" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "sync_status" AS ENUM ('RECEIVED', 'APPLIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "duplicate_review_status" AS ENUM ('OPEN', 'MERGED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "tontine_cycle_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "cycle_transaction_type" AS ENUM ('DEPOSIT', 'COMMISSION', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "withdrawal_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "cycle_event_type" AS ENUM ('OPENED', 'SUSPENDED', 'RESUMED', 'COMPLETED', 'CLOSED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED');

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(40),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "market_id" UUID NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(180) NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(40),
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_branch_access" (
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "market_id" UUID,
    "zone_id" UUID,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_branch_access_pkey" PRIMARY KEY ("user_id","branch_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "client_code" VARCHAR(40) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(40),
    "neighborhood" VARCHAR(160),
    "address_details" TEXT,
    "status" "client_status" NOT NULL DEFAULT 'PROVISIONAL',
    "created_by" UUID NOT NULL,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_offline_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "market_id" UUID,
    "collection_agent_id" UUID,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_aliases" (
    "source_client_id" UUID NOT NULL,
    "target_client_id" UUID NOT NULL,
    "decided_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "request_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_aliases_pkey" PRIMARY KEY ("source_client_id")
);

-- CreateTable
CREATE TABLE "client_duplicate_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "candidate_client_id" UUID NOT NULL,
    "matched_client_id" UUID NOT NULL,
    "status" "duplicate_review_status" NOT NULL DEFAULT 'OPEN',
    "decision_note" TEXT,
    "decided_by" UUID,
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),

    CONSTRAINT "client_duplicate_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "daily_amount_xaf" BIGINT NOT NULL,
    "local_reference" VARCHAR(100) NOT NULL,
    "dossier_no" VARCHAR(80) NOT NULL,
    "client_operation_id" UUID NOT NULL,
    "device_id" VARCHAR(120) NOT NULL,
    "opened_at_declared" TIMESTAMPTZ(6) NOT NULL,
    "opening_business_date" DATE NOT NULL,
    "status" "dossier_status" NOT NULL DEFAULT 'OPEN',
    "accepted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by" UUID,
    "closure_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_state_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "event_type" "dossier_event_type" NOT NULL,
    "previous_status" "dossier_status",
    "new_status" "dossier_status" NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" VARCHAR(120),
    "request_id" UUID NOT NULL,

    CONSTRAINT "dossier_state_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "dossier_id" UUID,
    "dossier_link_status" "dossier_link_status" NOT NULL DEFAULT 'NOT_ESTABLISHED',
    "agent_id" UUID NOT NULL,
    "amount_xaf" BIGINT NOT NULL,
    "collected_at" TIMESTAMPTZ(6) NOT NULL,
    "business_date" DATE NOT NULL,
    "client_receipt_no" VARCHAR(80) NOT NULL,
    "local_receipt_no" VARCHAR(100),
    "device_id" VARCHAR(120),
    "client_operation_id" UUID NOT NULL,
    "status" "collection_status" NOT NULL DEFAULT 'RECORDED',
    "sync_received_at" TIMESTAMPTZ(6),
    "reversed_by" UUID,
    "reversed_at" TIMESTAMPTZ(6),
    "reversal_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "remittance_no" VARCHAR(80) NOT NULL,
    "status" "remittance_status" NOT NULL DEFAULT 'DRAFT',
    "declared_total_xaf" BIGINT NOT NULL DEFAULT 0,
    "received_total_xaf" BIGINT,
    "submitted_at" TIMESTAMPTZ(6),
    "received_by" UUID,
    "received_at" TIMESTAMPTZ(6),
    "cashier_note" TEXT,
    "client_operation_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_items" (
    "remittance_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "amount_xaf" BIGINT NOT NULL,

    CONSTRAINT "remittance_items_pkey" PRIMARY KEY ("remittance_id","collection_id")
);

-- CreateTable
CREATE TABLE "daily_closures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "business_date" DATE NOT NULL,
    "closure_no" VARCHAR(80) NOT NULL,
    "declared_collection_total_xaf" BIGINT NOT NULL DEFAULT 0,
    "declared_remittance_total_xaf" BIGINT NOT NULL DEFAULT 0,
    "collection_count" INTEGER NOT NULL DEFAULT 0,
    "status" "closure_status" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "review_note" TEXT,
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "client_operation_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure_reopen_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "closure_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "reopened_by" UUID NOT NULL,
    "previous_status" "closure_status" NOT NULL,
    "reason" TEXT NOT NULL,
    "reopened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" VARCHAR(120),
    "request_id" UUID NOT NULL,

    CONSTRAINT "closure_reopen_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discrepancies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "remittance_id" UUID,
    "closure_id" UUID,
    "opened_by" UUID NOT NULL,
    "assigned_to" UUID,
    "status" "discrepancy_status" NOT NULL DEFAULT 'OPEN',
    "expected_total_xaf" BIGINT,
    "actual_total_xaf" BIGINT,
    "difference_xaf" BIGINT,
    "description" TEXT NOT NULL,
    "resolution_note" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discrepancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "device_id" VARCHAR(120) NOT NULL,
    "client_operation_id" UUID NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" UUID,
    "payload_hash" VARCHAR(128) NOT NULL,
    "status" "sync_status" NOT NULL DEFAULT 'RECEIVED',
    "response_code" VARCHAR(60),
    "response_message" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_user_id" UUID,
    "branch_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "reason" TEXT,
    "request_id" UUID,
    "device_id" VARCHAR(120),
    "ip_address" inet,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "markets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "zoneId" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontine_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dossier_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "opened_by_agent_id" UUID NOT NULL,
    "fixed_amount_xaf" BIGINT NOT NULL,
    "target_installments" INTEGER NOT NULL DEFAULT 31,
    "installment_count" INTEGER NOT NULL DEFAULT 0,
    "total_collected_xaf" BIGINT NOT NULL DEFAULT 0,
    "status" "tontine_cycle_status" NOT NULL DEFAULT 'ACTIVE',
    "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "client_operation_id" UUID NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tontine_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "type" "cycle_transaction_type" NOT NULL,
    "amount_xaf" BIGINT NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "withdrawal_request_id" UUID,
    "idempotency_key" UUID NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "client_occurred_at" TIMESTAMPTZ(6),
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "requested_by_agent_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "amount_xaf" BIGINT NOT NULL,
    "closes_cycle" BOOLEAN NOT NULL DEFAULT false,
    "status" "withdrawal_request_status" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "rejection_reason" TEXT,
    "idempotency_key" UUID NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),
    "transaction_id" UUID,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cycle_commissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "amount_xaf" BIGINT NOT NULL,
    "transaction_id" UUID NOT NULL,
    "withdrawal_request_id" UUID NOT NULL,
    "charged_by_id" UUID NOT NULL,
    "charged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tontine_cycle_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "event_type" "cycle_event_type" NOT NULL,
    "reason" TEXT,
    "request_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tontine_cycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "idx_branch_market" ON "branches"("market_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_branch" ON "user_branch_access"("branch_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_market" ON "user_branch_access"("market_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_user_branch_access_zone" ON "user_branch_access"("zone_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE INDEX "idx_clients_branch_name" ON "clients"("branch_id", "last_name", "first_name");

-- CreateIndex
CREATE INDEX "idx_clients_phone" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "idx_clients_branch_status" ON "clients"("branch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "client_aliases_request_id_key" ON "client_aliases"("request_id");

-- CreateIndex
CREATE INDEX "idx_client_aliases_target" ON "client_aliases"("target_client_id");

-- CreateIndex
CREATE INDEX "idx_duplicate_reviews_branch_status" ON "client_duplicate_reviews"("branch_id", "status", "detected_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_duplicate_review_pair" ON "client_duplicate_reviews"("candidate_client_id", "matched_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_local_reference_key" ON "dossiers"("local_reference");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_dossier_no_key" ON "dossiers"("dossier_no");

-- CreateIndex
CREATE INDEX "idx_dossiers_client_status" ON "dossiers"("client_id", "status");

-- CreateIndex
CREATE INDEX "idx_dossiers_agent_opening_date" ON "dossiers"("agent_id", "opening_business_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dossiers_agent_operation" ON "dossiers"("agent_id", "client_operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_state_events_request_id_key" ON "dossier_state_events"("request_id");

-- CreateIndex
CREATE INDEX "idx_dossier_state_events_dossier" ON "dossier_state_events"("dossier_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_client_receipt_no_key" ON "collections"("client_receipt_no");

-- CreateIndex
CREATE INDEX "idx_collections_branch_date" ON "collections"("branch_id", "business_date");

-- CreateIndex
CREATE INDEX "idx_collections_client_date" ON "collections"("client_id", "business_date");

-- CreateIndex
CREATE INDEX "idx_collections_agent_date" ON "collections"("agent_id", "business_date");

-- CreateIndex
CREATE INDEX "idx_collections_sync_received" ON "collections"("sync_received_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_agent_id_client_operation_id_key" ON "collections"("agent_id", "client_operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "remittances_remittance_no_key" ON "remittances"("remittance_no");

-- CreateIndex
CREATE UNIQUE INDEX "remittances_agent_id_client_operation_id_key" ON "remittances"("agent_id", "client_operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "remittance_items_collection_id_key" ON "remittance_items"("collection_id");

-- CreateIndex
CREATE INDEX "idx_remittance_items_collection" ON "remittance_items"("collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closures_closure_no_key" ON "daily_closures"("closure_no");

-- CreateIndex
CREATE INDEX "idx_closures_branch_date" ON "daily_closures"("branch_id", "business_date");

-- CreateIndex
CREATE INDEX "idx_closures_status" ON "daily_closures"("branch_id", "status", "business_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closures_agent_id_business_date_key" ON "daily_closures"("agent_id", "business_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closures_agent_id_client_operation_id_key" ON "daily_closures"("agent_id", "client_operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "closure_reopen_events_request_id_key" ON "closure_reopen_events"("request_id");

-- CreateIndex
CREATE INDEX "idx_closure_reopen_events_closure" ON "closure_reopen_events"("closure_id", "reopened_at");

-- CreateIndex
CREATE INDEX "idx_discrepancies_branch_status" ON "discrepancies"("branch_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_sync_events_status" ON "sync_events"("status", "received_at");

-- CreateIndex
CREATE INDEX "idx_sync_events_branch" ON "sync_events"("branch_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "sync_events_user_id_device_id_client_operation_id_key" ON "sync_events"("user_id", "device_id", "client_operation_id");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_audit_branch_date" ON "audit_logs"("branch_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "markets_code_key" ON "markets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tontine_cycles_client_operation_id_key" ON "tontine_cycles"("client_operation_id");

-- CreateIndex
CREATE INDEX "idx_cycles_client_opened" ON "tontine_cycles"("client_id", "opened_at");

-- CreateIndex
CREATE INDEX "idx_cycles_market_status_opened" ON "tontine_cycles"("market_id", "status", "opened_at");

-- CreateIndex
CREATE INDEX "idx_cycles_agent_status_opened" ON "tontine_cycles"("opened_by_agent_id", "status", "opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_transactions_idempotency_key_key" ON "cycle_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_cycle_transactions_cycle_date" ON "cycle_transactions"("cycle_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_cycle_transactions_cycle_type_date" ON "cycle_transactions"("cycle_id", "type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_idempotency_key_key" ON "withdrawal_requests"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_transaction_id_key" ON "withdrawal_requests"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_withdrawals_cycle_status_date" ON "withdrawal_requests"("cycle_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "idx_withdrawals_agent_status_date" ON "withdrawal_requests"("requested_by_agent_id", "status", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_commissions_cycle_id_key" ON "cycle_commissions"("cycle_id");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_commissions_transaction_id_key" ON "cycle_commissions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_commissions_withdrawal_request_id_key" ON "cycle_commissions"("withdrawal_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "tontine_cycle_events_request_id_key" ON "tontine_cycle_events"("request_id");

-- CreateIndex
CREATE INDEX "idx_cycle_events_cycle_date" ON "tontine_cycle_events"("cycle_id", "created_at");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch_access" ADD CONSTRAINT "user_branch_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_collection_agent_id_fkey" FOREIGN KEY ("collection_agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_aliases" ADD CONSTRAINT "client_aliases_source_client_id_fkey" FOREIGN KEY ("source_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_aliases" ADD CONSTRAINT "client_aliases_target_client_id_fkey" FOREIGN KEY ("target_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_aliases" ADD CONSTRAINT "client_aliases_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_duplicate_reviews" ADD CONSTRAINT "client_duplicate_reviews_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_duplicate_reviews" ADD CONSTRAINT "client_duplicate_reviews_candidate_client_id_fkey" FOREIGN KEY ("candidate_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_duplicate_reviews" ADD CONSTRAINT "client_duplicate_reviews_matched_client_id_fkey" FOREIGN KEY ("matched_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_duplicate_reviews" ADD CONSTRAINT "client_duplicate_reviews_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_state_events" ADD CONSTRAINT "dossier_state_events_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_state_events" ADD CONSTRAINT "dossier_state_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_reversed_by_fkey" FOREIGN KEY ("reversed_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_items" ADD CONSTRAINT "remittance_items_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "remittances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_items" ADD CONSTRAINT "remittance_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_reopen_events" ADD CONSTRAINT "closure_reopen_events_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "daily_closures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_reopen_events" ADD CONSTRAINT "closure_reopen_events_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_reopen_events" ADD CONSTRAINT "closure_reopen_events_reopened_by_fkey" FOREIGN KEY ("reopened_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "remittances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "daily_closures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycles" ADD CONSTRAINT "tontine_cycles_opened_by_agent_id_fkey" FOREIGN KEY ("opened_by_agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_transactions" ADD CONSTRAINT "cycle_transactions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "tontine_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_transactions" ADD CONSTRAINT "cycle_transactions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_transactions" ADD CONSTRAINT "cycle_transactions_withdrawal_request_id_fkey" FOREIGN KEY ("withdrawal_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "tontine_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_requested_by_agent_id_fkey" FOREIGN KEY ("requested_by_agent_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "cycle_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_commissions" ADD CONSTRAINT "cycle_commissions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "tontine_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_commissions" ADD CONSTRAINT "cycle_commissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_commissions" ADD CONSTRAINT "cycle_commissions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "cycle_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_commissions" ADD CONSTRAINT "cycle_commissions_withdrawal_request_id_fkey" FOREIGN KEY ("withdrawal_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_commissions" ADD CONSTRAINT "cycle_commissions_charged_by_id_fkey" FOREIGN KEY ("charged_by_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycle_events" ADD CONSTRAINT "tontine_cycle_events_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "tontine_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tontine_cycle_events" ADD CONSTRAINT "tontine_cycle_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
