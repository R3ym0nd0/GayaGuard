CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    complete_address TEXT NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (
        request_type IN ('clearance', 'indigency', 'letter', 'complaint', 'other')
    ),
    date_needed DATE NOT NULL,
    purpose TEXT NOT NULL,
    additional_notes TEXT,
    supporting_file_name TEXT,
    screening_score INTEGER NOT NULL DEFAULT 0,
    screening_summary TEXT,
    screening_status VARCHAR(30) NOT NULL DEFAULT 'pending_screening' CHECK (
        screening_status IN ('pending_screening', 'low_concern', 'needs_review', 'high_concern')
    ),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (
        payment_status IN ('unpaid', 'pending_verification', 'paid')
    ),
    payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_reference VARCHAR(120),
    paid_at TIMESTAMPTZ,
    release_proof_file_name TEXT,
    final_status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (
        final_status IN (
            'pending',
            'approved',
            'rejected',
            'completed',
            'submitted',
            'under_review',
            'preparing_document',
            'ready_for_pickup'
        )
    ),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS screening_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS screening_summary TEXT;

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid';

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120);

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS release_proof_file_name TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_request_type ON requests(request_type);
CREATE INDEX IF NOT EXISTS idx_requests_screening_status ON requests(screening_status);
CREATE INDEX IF NOT EXISTS idx_requests_final_status ON requests(final_status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
