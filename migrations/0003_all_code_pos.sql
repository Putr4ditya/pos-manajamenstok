-- 0003_all_code_pos.sql
-- Tabel milik POS:
-- transactions, transaction_items, payments, sales_snapshots, sales_snapshot_items
--
-- POS memakai tabel shared (users, outlets, categories, products) tanpa duplikasi.
-- Invoice/receipt tidak memiliki tabel sendiri: dibentuk backend dari data transaksi.
--
-- Membutuhkan 0001_all_code_shared.sql dan 0002_all_code_management.sql.

BEGIN;

-- ---------------------------------------------------------------------------
-- transactions
-- Hanya status = 'COMPLETED' yang dianggap penjualan valid.
-- Perhitungan diskon/pajak dilakukan backend:
--   tax_base   = subtotal - discount_amount
--   tax_amount = tax_base * tax_rate / 100
--   total      = tax_base + tax_amount
-- ---------------------------------------------------------------------------
CREATE TABLE transactions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT NOT NULL,
    outlet_id          UUID NOT NULL REFERENCES outlets(id),
    cashier_id         UUID NOT NULL REFERENCES users(id),

    status             TEXT NOT NULL DEFAULT 'DRAFT',

    subtotal           NUMERIC(14,2) NOT NULL DEFAULT 0,

    discount_type      VARCHAR(20),
    discount_value     NUMERIC(14,2),
    discount_amount    NUMERIC(14,2),

    -- Tarif saat transaksi dibuat, dalam persen (11.00 = 11%).
    tax_rate           NUMERIC(5,2) NOT NULL,
    tax_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,

    total              NUMERIC(14,2) NOT NULL DEFAULT 0,

    note               TEXT,

    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT transactions_outlet_number_key UNIQUE (outlet_id, transaction_number),
    CONSTRAINT transactions_status_check
        CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT transactions_subtotal_check CHECK (subtotal >= 0),
    CONSTRAINT transactions_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT transactions_tax_amount_check CHECK (tax_amount >= 0),
    CONSTRAINT transactions_total_check CHECK (total >= 0),
    CONSTRAINT transactions_discount_type_check
        CHECK (discount_type IS NULL OR discount_type IN ('PERCENTAGE', 'FIXED')),
    -- Tanpa diskon: ketiga kolom NULL. Dengan diskon: ketiganya terisi.
    CONSTRAINT transactions_discount_consistency_check CHECK (
        (discount_type IS NULL AND discount_value IS NULL AND discount_amount IS NULL)
        OR
        (discount_type IS NOT NULL AND discount_value IS NOT NULL AND discount_amount IS NOT NULL)
    ),
    CONSTRAINT transactions_discount_value_check CHECK (
        discount_type IS NULL
        OR (discount_type = 'PERCENTAGE' AND discount_value >= 0 AND discount_value <= 100)
        OR (discount_type = 'FIXED' AND discount_value >= 0)
    ),
    CONSTRAINT transactions_discount_amount_check
        CHECK (discount_amount IS NULL OR discount_amount >= 0)
);

CREATE INDEX transactions_outlet_created_at_idx ON transactions (outlet_id, created_at);
CREATE INDEX transactions_cashier_created_at_idx ON transactions (cashier_id, created_at);
CREATE INDEX transactions_status_created_at_idx ON transactions (status, created_at);

CREATE TRIGGER transactions_set_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- transaction_items
-- unit_price disimpan agar harga historis tetap benar walau products.price berubah.
-- ---------------------------------------------------------------------------
CREATE TABLE transaction_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    product_id     UUID NOT NULL REFERENCES products(id),
    quantity       INTEGER NOT NULL,
    unit_price     NUMERIC(14,2) NOT NULL,
    discount       NUMERIC(14,2) NOT NULL DEFAULT 0,
    subtotal       NUMERIC(14,2) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT transaction_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT transaction_items_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT transaction_items_discount_check CHECK (discount >= 0),
    CONSTRAINT transaction_items_subtotal_check CHECK (subtotal >= 0)
);

CREATE INDEX transaction_items_transaction_id_idx ON transaction_items (transaction_id);
CREATE INDEX transaction_items_product_id_idx ON transaction_items (product_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id   UUID NOT NULL REFERENCES transactions(id),
    payment_method   TEXT NOT NULL,
    amount           NUMERIC(14,2) NOT NULL,
    paid_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_number TEXT,
    status           TEXT NOT NULL,

    CONSTRAINT payments_payment_method_check
        CHECK (payment_method IN ('CASH', 'QRIS', 'DEBIT', 'CREDIT', 'OTHER')),
    CONSTRAINT payments_amount_check CHECK (amount >= 0),
    CONSTRAINT payments_status_check
        CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'))
);

CREATE INDEX payments_transaction_id_idx ON payments (transaction_id);
CREATE INDEX payments_method_status_idx ON payments (payment_method, status);

-- ---------------------------------------------------------------------------
-- sales_snapshots
-- Agregasi harian dari transaksi COMPLETED (bukan backup). Dapat dibuat ulang
-- kapan saja; transactions tetap menjadi source of truth.
-- ---------------------------------------------------------------------------
CREATE TABLE sales_snapshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id         UUID NOT NULL REFERENCES outlets(id),
    snapshot_date     DATE NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    gross_sales       NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_sales         NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sekaligus menjadi index (outlet_id, snapshot_date) untuk dashboard.
    CONSTRAINT sales_snapshots_outlet_date_key UNIQUE (outlet_id, snapshot_date),
    CONSTRAINT sales_snapshots_transaction_count_check CHECK (transaction_count >= 0)
);

-- ---------------------------------------------------------------------------
-- sales_snapshot_items
-- category_id didenormalisasi agar filter kategori tidak perlu JOIN ke products.
-- Ranking (top 3 terlaris / kurang terjual) adalah SQL aggregation atas tabel ini.
-- ---------------------------------------------------------------------------
CREATE TABLE sales_snapshot_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id     UUID NOT NULL REFERENCES sales_snapshots(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    category_id     UUID NOT NULL REFERENCES categories(id),
    quantity_sold   INTEGER NOT NULL DEFAULT 0,
    gross_sales     NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_sales       NUMERIC(14,2) NOT NULL DEFAULT 0,

    -- Sekaligus menjadi index untuk snapshot_id.
    CONSTRAINT sales_snapshot_items_snapshot_product_key UNIQUE (snapshot_id, product_id),
    CONSTRAINT sales_snapshot_items_quantity_sold_check CHECK (quantity_sold >= 0)
);

CREATE INDEX sales_snapshot_items_product_id_idx ON sales_snapshot_items (product_id);
CREATE INDEX sales_snapshot_items_category_id_idx ON sales_snapshot_items (category_id);

COMMIT;
