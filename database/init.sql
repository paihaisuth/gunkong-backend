-- ============================================================================
-- Gunkong Backend - Database Initialization Script
-- ============================================================================
-- This script creates all necessary tables, enums, indexes, and constraints
-- for the Gunkong escrow transaction platform.
-- It is idempotent and can be safely run multiple times.
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
        CREATE TYPE enum_users_role AS ENUM ('USER', 'ADMIN');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transaction_rooms_status') THEN
        CREATE TYPE enum_transaction_rooms_status AS ENUM (
            'CREATED',
            'PENDING_PAYMENT',
            'PAID',
            'SHIPPED',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transaction_rooms_payment_status') THEN
        CREATE TYPE enum_transaction_rooms_payment_status AS ENUM (
            'PENDING',
            'HELD',
            'RELEASED',
            'REFUNDED'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_payments_status') THEN
        CREATE TYPE enum_payments_status AS ENUM (
            'PENDING',
            'HELD',
            'RELEASED',
            'REFUNDED'
        );
    END IF;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table
-- ----------------------------------------------------------------------------
-- Stores user accounts (buyers, sellers, admins)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    full_name VARCHAR(200),
    password VARCHAR(255) NOT NULL,
    role enum_users_role NOT NULL DEFAULT 'USER',
    bank_account_number VARCHAR(12),
    bank_code VARCHAR(3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Transaction Rooms Table
-- ----------------------------------------------------------------------------
-- Core table for escrow transactions
-- Note: shipping_address_id FK constraint added later to avoid circular dependency
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transaction_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(30) NOT NULL UNIQUE,
    creator_id UUID NOT NULL,
    buyer_id UUID,
    seller_id UUID,
    status enum_transaction_rooms_status NOT NULL DEFAULT 'CREATED',
    item_title VARCHAR(255) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    item_price_cents INTEGER NOT NULL CHECK (item_price_cents >= 0),
    shipping_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee_cents >= 0),
    platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    item_images JSONB,
    shipping_address_id UUID,
    tracking_number VARCHAR(120),
    paid_at TIMESTAMPTZ,
    payment_verified_at TIMESTAMPTZ,
    payment_verified_by UUID,
    shipped_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT,
    expires_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    payment_status enum_transaction_rooms_payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Shipping Addresses Table
-- ----------------------------------------------------------------------------
-- Stores delivery addresses for each transaction room
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    district VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Payments Table
-- ----------------------------------------------------------------------------
-- Tracks all payment transactions and escrow status
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    status enum_payments_status NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(120),
    held_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    slip_image JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Archived Transactions Table
-- ----------------------------------------------------------------------------
-- Historical record of completed/cancelled transactions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS archived_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID,
    room_code VARCHAR(30),
    buyer_id UUID,
    seller_id UUID,
    item_title VARCHAR(255),
    total_cents INTEGER CHECK (total_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'THB',
    platform_fee_earned_cents INTEGER DEFAULT 0 CHECK (platform_fee_earned_cents >= 0),
    completed_at TIMESTAMPTZ,
    room_snapshot JSONB,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Transaction Rooms constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_creator'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_creator
            FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_buyer'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_buyer
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_seller'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_seller
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_payment_verified_by'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_payment_verified_by
            FOREIGN KEY (payment_verified_by) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_cancelled_by'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_cancelled_by
            FOREIGN KEY (cancelled_by) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

-- Shipping Addresses constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_shipping_addresses_room'
    ) THEN
        ALTER TABLE shipping_addresses
            ADD CONSTRAINT fk_shipping_addresses_room
            FOREIGN KEY (room_id) REFERENCES transaction_rooms (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Transaction Rooms to Shipping Addresses (added after both tables exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_transaction_rooms_shipping_address'
    ) THEN
        ALTER TABLE transaction_rooms
            ADD CONSTRAINT fk_transaction_rooms_shipping_address
            FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses (id) ON DELETE SET NULL;
    END IF;
END $$;

-- Payments constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_room'
    ) THEN
        ALTER TABLE payments
            ADD CONSTRAINT fk_payments_room
            FOREIGN KEY (room_id) REFERENCES transaction_rooms (id) ON DELETE CASCADE;
    END IF;
END $$;

-- Archived Transactions constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_archived_transactions_room'
    ) THEN
        ALTER TABLE archived_transactions
            ADD CONSTRAINT fk_archived_transactions_room
            FOREIGN KEY (room_id) REFERENCES transaction_rooms (id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_archived_transactions_buyer'
    ) THEN
        ALTER TABLE archived_transactions
            ADD CONSTRAINT fk_archived_transactions_buyer
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_archived_transactions_seller'
    ) THEN
        ALTER TABLE archived_transactions
            ADD CONSTRAINT fk_archived_transactions_seller
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Transaction Rooms indexes
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_room_code ON transaction_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_creator_id ON transaction_rooms (creator_id);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_buyer_id ON transaction_rooms (buyer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_seller_id ON transaction_rooms (seller_id);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_status ON transaction_rooms (status);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_payment_status ON transaction_rooms (payment_status);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_expires_at ON transaction_rooms (expires_at);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_created_at ON transaction_rooms (created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_rooms_status_created_at ON transaction_rooms (status, created_at);

-- Shipping Addresses indexes
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_room_id ON shipping_addresses (room_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_room_id ON payments (room_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at ON payments (status, created_at);

-- Archived Transactions indexes
CREATE INDEX IF NOT EXISTS idx_archived_transactions_room_id ON archived_transactions (room_id);
CREATE INDEX IF NOT EXISTS idx_archived_transactions_buyer_id ON archived_transactions (buyer_id);
CREATE INDEX IF NOT EXISTS idx_archived_transactions_seller_id ON archived_transactions (seller_id);
CREATE INDEX IF NOT EXISTS idx_archived_transactions_completed_at ON archived_transactions (completed_at);
CREATE INDEX IF NOT EXISTS idx_archived_transactions_archived_at ON archived_transactions (archived_at);

COMMIT;
