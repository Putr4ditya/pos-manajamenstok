-- 0001_all_code_shared.sql
-- Tabel master bersama untuk Management System dan POS:
-- users, user_sessions, outlets, user_outlets, categories, products

BEGIN;

-- gen_random_uuid() sudah built-in sejak PostgreSQL 13; extension ini hanya untuk versi lebih lama.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Dipakai oleh semua tabel yang memiliki kolom updated_at (termasuk di 0002 dan 0003).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    username      TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('OWNER', 'CASHIER'))
);

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- user_sessions
-- Sesi login. Login memakai users.username ATAU users.email + users.password_hash
-- (simpan username dan email dalam huruf kecil). Satu akun punya satu role, lalu
-- backend membuat satu baris di sini. Token asli hanya dikirim ke client;
-- database hanya menyimpan hash-nya.
-- Sesi aktif: revoked_at IS NULL AND expires_at > NOW(). Logout mengisi revoked_at.
-- ---------------------------------------------------------------------------
CREATE TABLE user_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    token_hash   TEXT NOT NULL,
    user_agent   TEXT,
    ip_address   INET,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,

    -- Sekaligus menjadi index untuk lookup token pada setiap request.
    CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash),
    CONSTRAINT user_sessions_expires_at_check CHECK (expires_at > created_at)
);

CREATE INDEX user_sessions_user_id_idx ON user_sessions (user_id);

-- ---------------------------------------------------------------------------
-- outlets
-- ---------------------------------------------------------------------------
CREATE TABLE outlets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    address    TEXT,
    phone      TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER outlets_set_updated_at
    BEFORE UPDATE ON outlets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- user_outlets
-- ---------------------------------------------------------------------------
CREATE TABLE user_outlets (
    user_id    UUID NOT NULL REFERENCES users(id),
    outlet_id  UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, outlet_id)
);

-- Lookup berdasarkan user_id sudah dilayani oleh primary key (user_id, outlet_id).
CREATE INDEX user_outlets_outlet_id_idx ON user_outlets (outlet_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT categories_type_check
        CHECK (type IN ('COFFEE', 'NON_COFFEE', 'MAKANAN', 'SNACK'))
);

CREATE INDEX categories_type_idx ON categories (type);
CREATE INDEX categories_is_active_idx ON categories (is_active);

CREATE TRIGGER categories_set_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- Produk yang sudah dipakai transaksi tidak dihapus, cukup status = 'INACTIVE'.
-- ---------------------------------------------------------------------------
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    name        TEXT NOT NULL,
    description TEXT,
    price       NUMERIC(14,2) NOT NULL,
    status      TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT products_price_check CHECK (price >= 0),
    CONSTRAINT products_status_check CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_status_idx ON products (status);

CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
