SET search_path TO "$user", public, extensions;

-- ==============================================================================
-- SIYAYASAN — STAGE 6 DEFINITIVE ISOLATED STAGING MIGRATION SCRIPT
-- Scope: Isolated Staging Environment ONLY
-- Production Execution: STRICTLY PROHIBITED
-- Date: 2026-11-05
-- ==============================================================================

-- ==============================================================================
-- PART 1: EXTENSIONS & SCHEMAS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- SUPABASE RESILIENCY WRAPPERS
-- Supabase manages extensions in schema "extensions" by default.
-- Provide public wrapper functions so any legacy or explicit public.* calls succeed.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.uuid_generate_v4() 
RETURNS uuid LANGUAGE sql AS 'SELECT gen_random_uuid()';

DO $$
BEGIN
    -- Alias for digest in public
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'digest' AND pronargs = 2) THEN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'extensions' AND p.proname = 'digest') THEN
            CREATE OR REPLACE FUNCTION public.digest(data text, type text) 
            RETURNS bytea LANGUAGE sql AS 'SELECT extensions.digest(data, type)';
            CREATE OR REPLACE FUNCTION public.digest(data bytea, type text) 
            RETURNS bytea LANGUAGE sql AS 'SELECT extensions.digest(data, type)';
        END IF;
    END IF;

    -- Alias for crypt in public
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'crypt') THEN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'extensions' AND p.proname = 'crypt') THEN
            CREATE OR REPLACE FUNCTION public.crypt(key text, salt text) 
            RETURNS text LANGUAGE sql AS 'SELECT extensions.crypt(key, salt)';
        END IF;
    END IF;

    -- Alias for gen_salt in public
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'gen_salt') THEN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'extensions' AND p.proname = 'gen_salt') THEN
            CREATE OR REPLACE FUNCTION public.gen_salt(type text, iter_count integer) 
            RETURNS text LANGUAGE sql AS 'SELECT extensions.gen_salt(type, iter_count)';
        END IF;
    END IF;

    -- Alias for gen_random_bytes in public
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'gen_random_bytes') THEN
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'extensions' AND p.proname = 'gen_random_bytes') THEN
            CREATE OR REPLACE FUNCTION public.gen_random_bytes(count integer) 
            RETURNS bytea LANGUAGE sql AS 'SELECT extensions.gen_random_bytes(count)';
        END IF;
    END IF;
END $$;

-- Internal Private Schema (Isolated from PostgREST Data API)
CREATE SCHEMA IF NOT EXISTS auth_internal;
REVOKE ALL ON SCHEMA auth_internal FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- PART 2: STRUCTURAL TABLES & CANONICAL DEFINITIONS
-- ==============================================================================

-- 2.1 Table: Dedicated Student Internal Notes (Non-Cascading Deletion)
CREATE TABLE IF NOT EXISTS public.student_internal_notes (
    student_id VARCHAR(50) PRIMARY KEY REFERENCES public.students(id) ON DELETE RESTRICT,
    notes TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Table: User Sessions (Cryptographic SHA-256 Token Hash Storage Only)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hex digest of bearer token
    user_id VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) REFERENCES public.students(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,          -- Sliding TTL (24h)
    absolute_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Hard Limit (7d)
    is_revoked BOOLEAN DEFAULT FALSE,
    revocation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash 
ON public.user_sessions (token_hash, is_revoked, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
ON public.user_sessions (user_id, is_revoked);

-- 2.3 Table: Atomic Login Rate Limits
CREATE TABLE IF NOT EXISTS public.login_rate_limits (
    attempt_key TEXT PRIMARY KEY,
    failed_count INT NOT NULL DEFAULT 1,
    first_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON public.login_rate_limits (attempt_key, locked_until);

-- 2.4 Table: PPDB Status Checking Rate Limits
CREATE TABLE IF NOT EXISTS public.ppdb_status_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_no TEXT NOT NULL,
    ip_address TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ppdb_attempts_lookup 
ON public.ppdb_status_attempts (registration_no, ip_address, attempted_at);

-- 2.5 Table: Educational Fee Plans (Master Perencanaan SPP)
CREATE TABLE IF NOT EXISTS public.educational_fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year VARCHAR(20) NOT NULL,
    level VARCHAR(50) NOT NULL,
    program VARCHAR(100) NOT NULL,
    standard_monthly_fee NUMERIC(12,2) NOT NULL CHECK (standard_monthly_fee >= 0),
    effective_start_date DATE NOT NULL,
    effective_end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    
    CONSTRAINT chk_fee_plan_effective_dates 
        CHECK (effective_end_date IS NULL OR effective_end_date >= effective_start_date),
        
    CONSTRAINT exclude_overlapping_active_fee_plans 
        EXCLUDE USING gist (
            level WITH =,
            program WITH =,
            academic_year WITH =,
            daterange(effective_start_date, COALESCE(effective_end_date, '9999-12-31'::date), '[]') WITH &&
        ) WHERE (status = 'active')
);

-- ==============================================================================
-- PART 3: COLUMN ADJUSTMENTS & DATA MIGRATION
-- ==============================================================================

-- 3.1 Users Column Enhancements (NO Plaintext Secrets)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temporary_password_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- Safely drop plaintext secret column if present from earlier prototypes
ALTER TABLE public.users DROP COLUMN IF EXISTS temporary_password_secret;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_salt;

-- 3.2 Students Column Enhancements & Removal of Static Default
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS monthly_spp_amount INTEGER,
ADD COLUMN IF NOT EXISTS form_metadata JSONB DEFAULT '{}'::jsonb;

-- Remove hardcoded default to enforce master fee plan inheritance
ALTER TABLE public.students ALTER COLUMN monthly_spp_amount DROP DEFAULT;

-- 3.3 Data Migration: Migrate Existing Notes to Dedicated Table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'notes'
    ) THEN
        INSERT INTO public.student_internal_notes (student_id, notes, updated_by, updated_at)
        SELECT id, notes, 'pre_stage6_migration', NOW()
        FROM public.students
        WHERE notes IS NOT NULL AND TRIM(notes) <> ''
        ON CONFLICT (student_id) DO UPDATE
        SET notes = EXCLUDED.notes;

        -- Neutralize and drop legacy column
        UPDATE public.students SET notes = NULL WHERE notes IS NOT NULL;
        ALTER TABLE public.students DROP COLUMN notes;
    END IF;
END $$;

-- 3.4 Invoices Unique Index (Idempotency Protection)
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_student_month_period 
ON public.invoices (student_id, month, period)
WHERE (student_id IS NOT NULL AND month IS NOT NULL AND period IS NOT NULL);

-- ==============================================================================
-- PART 4: INTERNAL HELPER FUNCTIONS (IN auth_internal SCHEMA)
-- ==============================================================================

-- 4.1 Extract Trusted Client IP from Gateway Headers
CREATE OR REPLACE FUNCTION auth_internal.get_trusted_client_ip()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    SELECT COALESCE(
        current_setting('request.headers', true)::jsonb->>'cf-connecting-ip',
        current_setting('request.headers', true)::jsonb->>'x-real-ip',
        SPLIT_PART(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', ',', 1),
        '127.0.0.1'
    );
$$;

-- 4.2 Internal Audit Logger (Append-Only)
CREATE OR REPLACE FUNCTION auth_internal.log_activity(
    p_user_id VARCHAR(50),
    p_action TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    INSERT INTO public.activity_logs (
        id, user_id, action, details, ip_address, created_at
    ) VALUES (
        gen_random_uuid()::TEXT,
        p_user_id,
        p_action,
        p_details,
        auth_internal.get_trusted_client_ip(),
        NOW()
    );
END;
$$;

-- 4.3 Atomic Rate Limit Evaluator
CREATE OR REPLACE FUNCTION auth_internal.evaluate_rate_limit(
    p_key TEXT,
    p_max_attempts INT DEFAULT 5,
    p_lockout_seconds INT DEFAULT 900
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record
    FROM public.login_rate_limits
    WHERE attempt_key = p_key;

    IF FOUND AND v_record.locked_until IS NOT NULL AND v_record.locked_until > NOW() THEN
        RETURN FALSE; -- Currently locked out
    END IF;

    RETURN TRUE;
END;
$$;

-- 4.4 Atomic Rate Limit Failure Recorder
CREATE OR REPLACE FUNCTION auth_internal.record_rate_limit_failure(
    p_key TEXT,
    p_max_attempts INT DEFAULT 5,
    p_lockout_seconds INT DEFAULT 900
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    INSERT INTO public.login_rate_limits (attempt_key, failed_count, first_failed_at, last_failed_at, locked_until)
    VALUES (p_key, 1, NOW(), NOW(), NULL)
    ON CONFLICT (attempt_key) DO UPDATE
    SET failed_count = CASE 
            WHEN public.login_rate_limits.last_failed_at < NOW() - (p_lockout_seconds || ' seconds')::INTERVAL THEN 1 
            ELSE public.login_rate_limits.failed_count + 1 
        END,
        first_failed_at = CASE 
            WHEN public.login_rate_limits.last_failed_at < NOW() - (p_lockout_seconds || ' seconds')::INTERVAL THEN NOW() 
            ELSE public.login_rate_limits.first_failed_at 
        END,
        last_failed_at = NOW(),
        locked_until = CASE 
            WHEN (CASE WHEN public.login_rate_limits.last_failed_at < NOW() - (p_lockout_seconds || ' seconds')::INTERVAL THEN 1 ELSE public.login_rate_limits.failed_count + 1 END) >= p_max_attempts 
            THEN NOW() + (p_lockout_seconds || ' seconds')::INTERVAL 
            ELSE NULL 
        END;
END;
$$;

-- 4.5 Atomic Rate Limit Reset
CREATE OR REPLACE FUNCTION auth_internal.reset_rate_limit(p_key TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    DELETE FROM public.login_rate_limits WHERE attempt_key = p_key;
$$;

-- ==============================================================================
-- PART 5: PUBLIC AUTHENTICATION & SESSION LIFECYCLE PROCEDURES
-- ==============================================================================

-- 5.1 Extract Custom Session Token from Headers
CREATE OR REPLACE FUNCTION public.get_current_session_token()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    SELECT COALESCE(
        current_setting('request.headers', true)::jsonb->>'x-session-token',
        NULL
    );
$$;

-- 5.2 Verify Session Token (STABLE — SHA-256 Token Hash Lookup)
CREATE OR REPLACE FUNCTION public.verify_session_token(p_raw_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_token_hash VARCHAR(64);
    v_session RECORD;
    v_user RECORD;
BEGIN
    IF p_raw_token IS NULL OR LENGTH(TRIM(p_raw_token)) = 0 THEN
        RETURN jsonb_build_object('is_valid', false, 'reason', 'TOKEN_MISSING');
    END IF;

    -- Compute SHA-256 hash for lookup
    v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

    SELECT * INTO v_session
    FROM public.user_sessions
    WHERE token_hash = v_token_hash
      AND is_revoked = FALSE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_valid', false, 'reason', 'SESSION_NOT_FOUND_OR_REVOKED');
    END IF;

    -- Verify sliding expiration (24h)
    IF v_session.expires_at < NOW() THEN
        RETURN jsonb_build_object('is_valid', false, 'reason', 'SESSION_SLIDING_EXPIRED');
    END IF;

    -- Verify absolute expiration (7d)
    IF v_session.absolute_expires_at < NOW() THEN
        RETURN jsonb_build_object('is_valid', false, 'reason', 'SESSION_ABSOLUTE_EXPIRED');
    END IF;

    -- Verify user status
    SELECT id, username, full_name, role, status, student_id, must_change_password
    INTO v_user
    FROM public.users
    WHERE id = v_session.user_id;

    IF NOT FOUND OR v_user.status <> 'active' THEN
        RETURN jsonb_build_object('is_valid', false, 'reason', 'USER_INACTIVE_OR_DELETED');
    END IF;

    RETURN jsonb_build_object(
        'is_valid', true,
        'user_id', v_user.id,
        'username', v_user.username,
        'full_name', v_user.full_name,
        'role', v_user.role,
        'student_id', v_user.student_id,
        'must_change_password', v_user.must_change_password
    );
END;
$$;

-- 5.3 Touch Session (VOLATILE — Validates Revocation, Absolute Expiry, and User Status)
CREATE OR REPLACE FUNCTION public.auth_touch_session(p_raw_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_token_hash VARCHAR(64);
    v_session RECORD;
    v_user_status TEXT;
BEGIN
    IF p_raw_token IS NULL OR LENGTH(TRIM(p_raw_token)) = 0 THEN
        RETURN FALSE;
    END IF;

    v_token_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

    SELECT * INTO v_session
    FROM public.user_sessions
    WHERE token_hash = v_token_hash;

    IF NOT FOUND OR v_session.is_revoked IS TRUE THEN
        RETURN FALSE;
    END IF;

    IF v_session.expires_at < NOW() OR v_session.absolute_expires_at < NOW() THEN
        RETURN FALSE;
    END IF;

    -- Verify user account is still active
    SELECT status INTO v_user_status
    FROM public.users
    WHERE id = v_session.user_id;

    IF v_user_status IS DISTINCT FROM 'active' THEN
        UPDATE public.user_sessions
        SET is_revoked = TRUE, revocation_reason = 'USER_DEACTIVATED'
        WHERE id = v_session.id;
        RETURN FALSE;
    END IF;

    -- Refresh sliding TTL up to absolute boundary
    UPDATE public.user_sessions
    SET last_activity_at = NOW(),
        expires_at = LEAST(NOW() + INTERVAL '24 hours', absolute_expires_at)
    WHERE id = v_session.id;

    RETURN TRUE;
END;
$$;

-- 5.4 RLS Helper: Get Current Authenticated Context
CREATE OR REPLACE FUNCTION public.get_authenticated_user()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    SELECT public.verify_session_token(public.get_current_session_token());
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    SELECT COALESCE(
        (public.get_authenticated_user()->>'role') IN ('super_admin', 'admin', 'admin_tu', 'admin_ppdb', 'admin_keuangan', 'kepala_sekolah'),
        FALSE
    );
$$;

CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS VARCHAR(50)
LANGUAGE sql
STABLE
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
    SELECT NULLIF(public.get_authenticated_user()->>'student_id', '');
$$;

-- 5.5 Main Authentication Procedure: auth_login
CREATE OR REPLACE FUNCTION public.auth_login(
    p_identifier TEXT,
    p_password TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_clean_id TEXT;
    v_client_ip TEXT;
    v_attempt_key TEXT;
    v_user RECORD;
    v_raw_token TEXT;
    v_token_hash VARCHAR(64);
BEGIN
    v_clean_id := LOWER(TRIM(p_identifier));
    v_client_ip := auth_internal.get_trusted_client_ip();
    v_attempt_key := v_clean_id || '::' || v_client_ip;

    -- 1. Input Length & Format Standard Validation
    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username atau NIS wajib diisi.');
    END IF;

    IF p_password IS NULL OR octet_length(p_password) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password minimal 8 karakter.');
    END IF;

    IF octet_length(p_password) > 72 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password melebihi batas maksimum 72 byte.');
    END IF;

    -- 2. Concurrency-Safe Atomic Rate Limiting Evaluation
    IF NOT auth_internal.evaluate_rate_limit(v_attempt_key, 5, 900) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Terlalu banyak percobaan login gagal. Akses dibatasi sementara selama 15 menit.');
    END IF;

    -- 3. Lookup User Identity
    SELECT * INTO v_user
    FROM public.users
    WHERE LOWER(TRIM(username)) = v_clean_id
       OR LOWER(TRIM(email)) = v_clean_id
       OR LOWER(TRIM(nis)) = v_clean_id;

    IF NOT FOUND THEN
        PERFORM auth_internal.record_rate_limit_failure(v_attempt_key, 5, 900);
        RETURN jsonb_build_object('success', false, 'error', 'Kredensial login tidak valid.');
    END IF;

    IF v_user.status <> 'active' THEN
        PERFORM auth_internal.record_rate_limit_failure(v_attempt_key, 5, 900);
        RETURN jsonb_build_object('success', false, 'error', 'Akun Anda dinonaktifkan. Silakan hubungi Tata Usaha.');
    END IF;

    -- 4. Temporary Credential Expiration Enforcement
    IF v_user.must_change_password IS TRUE THEN
        IF v_user.temporary_password_expires_at IS NULL OR NOW() > v_user.temporary_password_expires_at THEN
            PERFORM auth_internal.record_rate_limit_failure(v_attempt_key, 5, 900);
            RETURN jsonb_build_object('success', false, 'error', 'Password sementara telah kedaluwarsa. Silakan minta reset password kepada Tata Usaha.');
        END IF;
    END IF;

    -- 5. Bcrypt Password Verification
    IF v_user.password_hash <> crypt(p_password, v_user.password_hash) THEN
        PERFORM auth_internal.record_rate_limit_failure(v_attempt_key, 5, 900);
        RETURN jsonb_build_object('success', false, 'error', 'Kredensial login tidak valid.');
    END IF;

    -- 6. Successful Login: Clear Rate Limiting
    PERFORM auth_internal.reset_rate_limit(v_attempt_key);

    -- 7. Generate Cryptographic Bearer Token & SHA-256 Hash
    v_raw_token := replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
    v_raw_token := rtrim(v_raw_token, '=');
    v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

    -- Insert active session storing ONLY the hash
    INSERT INTO public.user_sessions (
        token_hash,
        user_id,
        role,
        student_id,
        ip_address,
        user_agent,
        expires_at,
        absolute_expires_at
    ) VALUES (
        v_token_hash,
        v_user.id,
        v_user.role,
        v_user.student_id,
        v_client_ip,
        p_user_agent,
        NOW() + INTERVAL '24 hours',
        NOW() + INTERVAL '7 days'
    );

    UPDATE public.users SET last_login = NOW() WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'session_token', v_raw_token,
        'user', jsonb_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'full_name', v_user.full_name,
            'role', v_user.role,
            'student_id', v_user.student_id,
            'must_change_password', v_user.must_change_password
        )
    );
END;
$$;

-- 5.6 Change Password Procedure: auth_change_password
CREATE OR REPLACE FUNCTION public.auth_change_password(
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_raw_token TEXT;
    v_auth JSONB;
    v_user RECORD;
    v_new_hash TEXT;
    v_fresh_token TEXT;
    v_fresh_hash VARCHAR(64);
BEGIN
    v_raw_token := public.get_current_session_token();
    v_auth := public.verify_session_token(v_raw_token);

    IF NOT (v_auth->>'is_valid')::BOOLEAN THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesi tidak valid atau telah kedaluwarsa.');
    END IF;

    IF p_new_password IS NULL OR octet_length(p_new_password) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password baru minimal 8 karakter.');
    END IF;

    IF octet_length(p_new_password) > 72 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password baru melebihi batas maksimum 72 byte.');
    END IF;

    IF p_old_password = p_new_password THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password baru tidak boleh sama dengan password lama.');
    END IF;

    SELECT * INTO v_user
    FROM public.users
    WHERE id = (v_auth->>'user_id');

    IF NOT FOUND OR v_user.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Akun tidak aktif.');
    END IF;

    IF v_user.password_hash <> crypt(p_old_password, v_user.password_hash) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Password lama tidak sesuai.');
    END IF;

    -- Hash new password with bcrypt work factor 12
    v_new_hash := crypt(p_new_password, gen_salt('bf', 12));

    UPDATE public.users
    SET password_hash = v_new_hash,
        must_change_password = FALSE,
        temporary_password_expires_at = NULL,
        last_password_change = NOW(),
        updated_at = NOW()
    WHERE id = v_user.id;

    -- Invalidate all existing sessions
    UPDATE public.user_sessions
    SET is_revoked = TRUE, revocation_reason = 'PASSWORD_CHANGED'
    WHERE user_id = v_user.id;

    -- Issue fresh session token
    v_fresh_token := replace(replace(encode(gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
    v_fresh_token := rtrim(v_fresh_token, '=');
    v_fresh_hash := encode(digest(v_fresh_token, 'sha256'), 'hex');

    INSERT INTO public.user_sessions (
        token_hash, user_id, role, student_id, expires_at, absolute_expires_at
    ) VALUES (
        v_fresh_hash, v_user.id, v_user.role, v_user.student_id,
        NOW() + INTERVAL '24 hours', NOW() + INTERVAL '7 days'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password berhasil diubah. Seluruh sesi lama telah dicabut.',
        'new_session_token', v_fresh_token
    );
END;
$$;

-- 5.7 Logout Procedure: auth_logout
CREATE OR REPLACE FUNCTION public.auth_logout()
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_raw_token TEXT;
    v_token_hash VARCHAR(64);
BEGIN
    v_raw_token := public.get_current_session_token();

    IF v_raw_token IS NOT NULL AND LENGTH(TRIM(v_raw_token)) > 0 THEN
        v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');
        UPDATE public.user_sessions
        SET is_revoked = TRUE, revocation_reason = 'USER_LOGOUT'
        WHERE token_hash = v_token_hash;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Logout berhasil.');
END;
$$;

-- ==============================================================================
-- PART 6: DATA INTEGRITY & ANTI-TAMPER TRIGGERS
-- ==============================================================================

-- 6.1 Protect Users Credentials & Roles against Non-Admin Modification
CREATE OR REPLACE FUNCTION public.protect_users_credentials_and_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        IF NEW.role IS DISTINCT FROM OLD.role OR
           NEW.status IS DISTINCT FROM OLD.status OR
           NEW.password_hash IS DISTINCT FROM OLD.password_hash OR
           NEW.must_change_password IS DISTINCT FROM OLD.must_change_password OR
           NEW.nis IS DISTINCT FROM OLD.nis OR
           NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION 'Pelanggaran Keamanan: Anda tidak diizinkan mengubah role, status, atau kredensial akun.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_users_credentials ON public.users;
CREATE TRIGGER trg_protect_users_credentials
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_users_credentials_and_roles();

-- 6.2 Protect Student Academic & Legal Fields
CREATE OR REPLACE FUNCTION public.protect_student_academic_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        IF NEW.nis IS DISTINCT FROM OLD.nis OR
           NEW.nisn IS DISTINCT FROM OLD.nisn OR
           NEW.full_name IS DISTINCT FROM OLD.full_name OR
           NEW.name IS DISTINCT FROM OLD.name OR
           NEW.nik IS DISTINCT FROM OLD.nik OR
           NEW.birth_place IS DISTINCT FROM OLD.birth_place OR
           NEW.birth_date IS DISTINCT FROM OLD.birth_date OR
           NEW.gender IS DISTINCT FROM OLD.gender OR
           NEW.level IS DISTINCT FROM OLD.level OR
           NEW.program IS DISTINCT FROM OLD.program OR
           NEW.class_id IS DISTINCT FROM OLD.class_id OR
           NEW.status IS DISTINCT FROM OLD.status OR
           NEW.monthly_spp_amount IS DISTINCT FROM OLD.monthly_spp_amount THEN
            RAISE EXCEPTION 'Pelanggaran Integritas: Anda tidak diizinkan mengubah NIS, NISN, Nama, NIK, Tanggal Lahir, Kelas, Status, atau Tarif SPP.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_student_academic_fields ON public.students;
CREATE TRIGGER trg_protect_student_academic_fields
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_student_academic_fields();

-- 6.3 Protect Student Documents Verification Fields
CREATE OR REPLACE FUNCTION public.protect_student_documents_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        IF NEW.status IS DISTINCT FROM OLD.status OR
           NEW.verified_by IS DISTINCT FROM OLD.verified_by OR
           NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
            RAISE EXCEPTION 'Pelanggaran Keamanan: Siswa tidak diizinkan mengubah status verifikasi dokumen.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_student_documents_verification ON public.student_documents;
CREATE TRIGGER trg_protect_student_documents_verification
    BEFORE UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_student_documents_verification();

-- 6.4 Validate Public PPDB Submissions
CREATE OR REPLACE FUNCTION public.validate_ppdb_public_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        -- Force initial registration state
        NEW.status := 'submitted';
        NEW.converted_nis := NULL;
        NEW.nis := NULL;
        NEW.student_id := NULL;
        NEW.decision_notes := NULL;
        NEW.decided_at := NULL;
        NEW.decided_by := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_ppdb_public_insert ON public.ppdb_registrations;
CREATE TRIGGER trg_validate_ppdb_public_insert
    BEFORE INSERT ON public.ppdb_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_ppdb_public_insert();

-- 6.5 Financial Integrity: Prevent Payment on Exempted Invoices
CREATE OR REPLACE FUNCTION public.prevent_payment_on_exempted_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_invoice RECORD;
BEGIN
    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = NEW.invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tagihan dengan ID % tidak ditemukan.', NEW.invoice_id;
    END IF;

    IF v_invoice.status = 'exempted' OR v_invoice.amount <= 0 THEN
        RAISE EXCEPTION 'Pelanggaran Keuangan: Tagihan berstatus exempted (Rp0) tidak boleh menerima pembayaran kas.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_payment_on_exempted_invoice ON public.payments;
CREATE TRIGGER trg_prevent_payment_on_exempted_invoice
    BEFORE INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_payment_on_exempted_invoice();

-- 6.6 Financial Integrity: Prevent Tampering with Exempted Invoices
CREATE OR REPLACE FUNCTION public.prevent_exempted_invoice_status_tamper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
BEGIN
    IF OLD.status = 'exempted' AND NEW.status <> 'exempted' THEN
        RAISE EXCEPTION 'Pelanggaran Keuangan: Status tagihan exempted tidak dapat diubah menjadi %.', NEW.status;
    END IF;

    IF NEW.amount <= 0 AND NEW.status NOT IN ('exempted') THEN
        RAISE EXCEPTION 'Pelanggaran Keuangan: Tagihan dengan nilai Rp0 wajib berstatus exempted.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_exempted_invoice_status_tamper ON public.invoices;
CREATE TRIGGER trg_prevent_exempted_invoice_status_tamper
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_exempted_invoice_status_tamper();

-- ==============================================================================
-- PART 7: CONTROLLED STUDENT PAYMENT SUBMISSION RPC
-- ==============================================================================

-- Controlled RPC replacing raw direct student payment INSERTs
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
    p_invoice_id VARCHAR(50),
    p_method VARCHAR(50),
    p_proof_url TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = auth_internal, public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_auth JSONB;
    v_student_id VARCHAR(50);
    v_invoice RECORD;
    v_payment_id VARCHAR(50);
BEGIN
    v_auth := public.get_authenticated_user();
    IF NOT (v_auth->>'is_valid')::BOOLEAN THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesi login tidak valid.');
    END IF;

    v_student_id := v_auth->>'student_id';

    SELECT * INTO v_invoice
    FROM public.invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tagihan tidak ditemukan.');
    END IF;

    IF v_invoice.student_id <> v_student_id AND NOT public.is_admin_user() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Akses ditolak: Tagihan bukan milik Anda.');
    END IF;

    IF v_invoice.status = 'exempted' OR v_invoice.amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tagihan beasiswa (Rp0) tidak memerlukan pembayaran.');
    END IF;

    IF v_invoice.status = 'paid' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tagihan ini telah lunas.');
    END IF;

    v_payment_id := 'PAY/' || TO_CHAR(NOW(), 'YYYYMMDD') || '/' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);

    INSERT INTO public.payments (
        id, invoice_id, invoice_number, student_id, student_name,
        amount, method, payment_date, proof_image_url,
        status, notes, submitted_at
    ) VALUES (
        v_payment_id,
        v_invoice.id,
        v_invoice.invoice_number,
        v_invoice.student_id,
        v_invoice.student_name,
        v_invoice.amount,
        COALESCE(p_method, 'transfer'),
        CURRENT_DATE,
        p_proof_url,
        'menunggu_verifikasi',
        p_notes,
        NOW()
    );

    UPDATE public.invoices
    SET status = 'menunggu_verifikasi'
    WHERE id = v_invoice.id AND status = 'unpaid';

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Bukti pembayaran berhasil diunggah dan sedang menunggu verifikasi Tata Usaha.',
        'payment_id', v_payment_id
    );
END;
$$;

-- ==============================================================================
-- PART 8: ROW LEVEL SECURITY & EXPLICIT PRIVILEGE GRANTS
-- ==============================================================================

-- Enable RLS on all operational and internal tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppdb_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppdb_status_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_internal_notes ENABLE ROW LEVEL SECURITY;

-- 8.1 Isolate Sensitive Tables (No Direct REST Access)
REVOKE ALL ON public.user_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.login_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ppdb_status_attempts FROM PUBLIC, anon, authenticated;

-- 8.2 activity_logs: Append-Only by System / Admin Read Only
REVOKE ALL ON public.activity_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.activity_logs TO anon, authenticated;

DROP POLICY IF EXISTS activity_logs_admin_read ON public.activity_logs;
CREATE POLICY activity_logs_admin_read ON public.activity_logs
    FOR SELECT TO public USING (public.is_admin_user());

-- 8.3 student_internal_notes: Strictly Admin Only
REVOKE ALL ON public.student_internal_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_internal_notes TO anon, authenticated;

DROP POLICY IF EXISTS internal_notes_admin_only ON public.student_internal_notes;
CREATE POLICY internal_notes_admin_only ON public.student_internal_notes
    FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 8.4 users
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.users TO anon, authenticated;

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
    FOR SELECT TO public
    USING (public.is_admin_user() OR id = (public.get_authenticated_user()->>'user_id'));

DROP POLICY IF EXISTS users_admin_insert ON public.users;
CREATE POLICY users_admin_insert ON public.users
    FOR INSERT TO public WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users
    FOR UPDATE TO public
    USING (public.is_admin_user() OR id = (public.get_authenticated_user()->>'user_id'))
    WITH CHECK (public.is_admin_user() OR id = (public.get_authenticated_user()->>'user_id'));

DROP POLICY IF EXISTS users_admin_delete ON public.users;
CREATE POLICY users_admin_delete ON public.users
    FOR DELETE TO public USING (public.is_admin_user());

-- 8.5 students
REVOKE ALL ON public.students FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;

DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select ON public.students
    FOR SELECT TO public
    USING (public.is_admin_user() OR id = public.get_current_student_id());

DROP POLICY IF EXISTS students_admin_insert ON public.students;
CREATE POLICY students_admin_insert ON public.students
    FOR INSERT TO public WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS students_update ON public.students;
CREATE POLICY students_update ON public.students
    FOR UPDATE TO public
    USING (public.is_admin_user() OR id = public.get_current_student_id())
    WITH CHECK (public.is_admin_user() OR id = public.get_current_student_id());

DROP POLICY IF EXISTS students_admin_delete ON public.students;
CREATE POLICY students_admin_delete ON public.students
    FOR DELETE TO public USING (public.is_admin_user());

-- 8.6 payments (Direct REST INSERT restricted to Admin; Students use submit_payment_proof RPC)
REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
    FOR SELECT TO public
    USING (public.is_admin_user() OR student_id = public.get_current_student_id());

DROP POLICY IF EXISTS payments_admin_insert ON public.payments;
CREATE POLICY payments_admin_insert ON public.payments
    FOR INSERT TO public WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS payments_admin_update ON public.payments;
CREATE POLICY payments_admin_update ON public.payments
    FOR UPDATE TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS payments_admin_delete ON public.payments;
CREATE POLICY payments_admin_delete ON public.payments
    FOR DELETE TO public USING (public.is_admin_user());

-- 8.7 invoices
REVOKE ALL ON public.invoices FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.invoices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;

DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices
    FOR SELECT TO public
    USING (public.is_admin_user() OR student_id = public.get_current_student_id());

DROP POLICY IF EXISTS invoices_admin_all ON public.invoices;
CREATE POLICY invoices_admin_all ON public.invoices
    FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 8.8 student_documents
REVOKE ALL ON public.student_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_documents TO anon, authenticated;

DROP POLICY IF EXISTS student_docs_select ON public.student_documents;
CREATE POLICY student_docs_select ON public.student_documents
    FOR SELECT TO public
    USING (public.is_admin_user() OR student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_insert ON public.student_documents;
CREATE POLICY student_docs_insert ON public.student_documents
    FOR INSERT TO public
    WITH CHECK (public.is_admin_user() OR student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_update ON public.student_documents;
CREATE POLICY student_docs_update ON public.student_documents
    FOR UPDATE TO public
    USING (public.is_admin_user() OR student_id = public.get_current_student_id())
    WITH CHECK (public.is_admin_user() OR student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_delete ON public.student_documents;
CREATE POLICY student_docs_delete ON public.student_documents
    FOR DELETE TO public USING (public.is_admin_user());

-- 8.9 ppdb_registrations
REVOKE ALL ON public.ppdb_registrations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppdb_registrations TO anon, authenticated;

DROP POLICY IF EXISTS ppdb_public_insert ON public.ppdb_registrations;
CREATE POLICY ppdb_public_insert ON public.ppdb_registrations
    FOR INSERT TO public WITH CHECK (TRUE);

DROP POLICY IF EXISTS ppdb_admin_all ON public.ppdb_registrations;
CREATE POLICY ppdb_admin_all ON public.ppdb_registrations
    FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 8.10 educational_fee_plans
REVOKE ALL ON public.educational_fee_plans FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educational_fee_plans TO anon, authenticated;

DROP POLICY IF EXISTS fee_plans_select ON public.educational_fee_plans;
CREATE POLICY fee_plans_select ON public.educational_fee_plans
    FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS fee_plans_admin_all ON public.educational_fee_plans;
CREATE POLICY fee_plans_admin_all ON public.educational_fee_plans
    FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- 8.11 teachers, classes, web_settings
REVOKE ALL ON public.teachers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.classes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.web_settings FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.teachers TO anon, authenticated;
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT SELECT ON public.web_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.teachers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.classes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.web_settings TO anon, authenticated;

DROP POLICY IF EXISTS teachers_public_select ON public.teachers;
CREATE POLICY teachers_public_select ON public.teachers FOR SELECT TO public USING (TRUE);
DROP POLICY IF EXISTS teachers_admin_write ON public.teachers;
CREATE POLICY teachers_admin_write ON public.teachers FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS classes_public_select ON public.classes;
CREATE POLICY classes_public_select ON public.classes FOR SELECT TO public USING (TRUE);
DROP POLICY IF EXISTS classes_admin_write ON public.classes;
CREATE POLICY classes_admin_write ON public.classes FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS web_settings_public_select ON public.web_settings;
CREATE POLICY web_settings_public_select ON public.web_settings FOR SELECT TO public USING (TRUE);
DROP POLICY IF EXISTS web_settings_admin_write ON public.web_settings;
CREATE POLICY web_settings_admin_write ON public.web_settings FOR ALL TO public USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- PART 9: FUNCTION EXECUTION GRANTS (LEAST PRIVILEGE)
-- ==============================================================================
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.auth_login(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_session_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_touch_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_change_password(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_logout() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_session_token() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_authenticated_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_student_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.uuid_generate_v4() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(VARCHAR, VARCHAR, TEXT, TEXT) TO anon, authenticated;

