-- ============================================================================
-- Add OAuth Fields Migration
-- ============================================================================
-- This migration adds Google OAuth support fields to the users table
-- ============================================================================

BEGIN;

-- Add OAuth provider enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_auth_provider') THEN
        CREATE TYPE enum_users_auth_provider AS ENUM ('local', 'google');
    END IF;
END $$;

-- Add OAuth fields to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'auth_provider'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_provider enum_users_auth_provider NOT NULL DEFAULT 'local';
    END IF;
END $$;

-- Make password nullable for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users (auth_provider);

COMMIT;
