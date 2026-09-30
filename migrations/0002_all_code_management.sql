-- 0002_all_code_management.sql
-- Tabel milik Management System:
-- raw_materials, stock_movements, stock_closings, stock_closing_items,
-- product_outlets, menu_change_requests
--
-- Tidak ada recipe/BOM: POS tidak pernah mengurangi bahan mentah secara otomatis.
-- Prediksi AI (threshold forecasting) adalah data turunan dan tidak disimpan di sini.
--
-- Membutuhkan 0001_all_code_shared.sql.

BEGIN;

-- ---------------------------------------------------------------------------
-- raw_materials
-- unit memakai satuan operasional toko (botol, karung, box, pcs, ...).
-- ---------------------------------------------------------------------------
CREATE TABLE raw_materials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    unit          TEXT NOT NULL,
    description   TEXT,
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT raw_materials_minimum_stock_check CHECK (minimum_stock >= 0)
);

-- Owner boleh mendaftarkan bahan baru dengan mengetik namanya secara manual.
-- Nama yang sama (tanpa membedakan huruf besar/kecil) tidak boleh terdaftar dua kali.
CREATE UNIQUE INDEX raw_materials_name_key ON raw_materials (LOWER(name));

CREATE TRIGGER raw_materials_set_updated_at
    BEFORE UPDATE ON raw_materials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- stock_movements
-- Data historis: append-only, tanpa updated_at.
--   IN          stok masuk (quantity > 0)
--   OUT         stok keluar yang dicatat Cashier (quantity > 0); purpose = tujuan pemakaian
--   ADJUSTMENT  koreksi manual oleh Owner; quantity bertanda:
--               positif = stok bertambah, negatif = stok berkurang
-- ---------------------------------------------------------------------------
CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id       UUID NOT NULL REFERENCES outlets(id),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    type            TEXT NOT NULL,
    quantity        NUMERIC(14,3) NOT NULL,
    purpose         TEXT,
    note            TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT stock_movements_type_check CHECK (type IN ('IN', 'ADJUSTMENT', 'OUT')),
    CONSTRAINT stock_movements_quantity_check CHECK (
        (type = 'ADJUSTMENT' AND quantity <> 0)
        OR (type <> 'ADJUSTMENT' AND quantity > 0)
    )
);

CREATE INDEX stock_movements_outlet_material_idx
    ON stock_movements (outlet_id, raw_material_id);
CREATE INDEX stock_movements_outlet_created_at_idx
    ON stock_movements (outlet_id, created_at);

-- ---------------------------------------------------------------------------
-- stock_closings
-- Satu closing per outlet per hari.
-- ---------------------------------------------------------------------------
CREATE TABLE stock_closings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id      UUID NOT NULL REFERENCES outlets(id),
    closing_date   DATE NOT NULL,
    stock_status   TEXT NOT NULL DEFAULT 'DRAFT',
    sales_status   TEXT NOT NULL DEFAULT 'PENDING',
    overall_status TEXT NOT NULL DEFAULT 'DRAFT',
    created_by     UUID NOT NULL REFERENCES users(id),
    validated_by   UUID REFERENCES users(id),
    validated_at   TIMESTAMPTZ,
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sekaligus menjadi index (outlet_id, closing_date) untuk histori dan AI forecasting.
    CONSTRAINT stock_closings_outlet_date_key UNIQUE (outlet_id, closing_date),
    CONSTRAINT stock_closings_stock_status_check
        CHECK (stock_status IN ('DRAFT', 'PENDING_VALIDATION', 'VALID', 'NEEDS_REVIEW')),
    CONSTRAINT stock_closings_sales_status_check
        CHECK (sales_status IN ('PENDING', 'VALID')),
    CONSTRAINT stock_closings_overall_status_check
        CHECK (overall_status IN ('DRAFT', 'PENDING_VALIDATION', 'COMPLETED', 'NEEDS_REVIEW'))
);

CREATE TRIGGER stock_closings_set_updated_at
    BEFORE UPDATE ON stock_closings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- stock_closing_items
-- used_stock adalah sumber utama histori penggunaan untuk AI forecasting.
-- closing_stock dan difference dihitung oleh backend:
--   expected = opening_stock + incoming_stock - used_stock
-- ---------------------------------------------------------------------------
CREATE TABLE stock_closing_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_id      UUID NOT NULL REFERENCES stock_closings(id),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id),
    opening_stock   NUMERIC(14,3) NOT NULL,
    incoming_stock  NUMERIC(14,3) NOT NULL DEFAULT 0,
    used_stock      NUMERIC(14,3) NOT NULL DEFAULT 0,
    closing_stock   NUMERIC(14,3) NOT NULL,
    difference      NUMERIC(14,3) NOT NULL DEFAULT 0,
    note            TEXT,

    -- Satu baris per bahan per closing; sekaligus menjadi index untuk closing_id.
    CONSTRAINT stock_closing_items_closing_material_key UNIQUE (closing_id, raw_material_id),
    CONSTRAINT stock_closing_items_opening_stock_check CHECK (opening_stock >= 0),
    CONSTRAINT stock_closing_items_incoming_stock_check CHECK (incoming_stock >= 0),
    CONSTRAINT stock_closing_items_used_stock_check CHECK (used_stock >= 0),
    CONSTRAINT stock_closing_items_closing_stock_check CHECK (closing_stock >= 0)
);

CREATE INDEX stock_closing_items_raw_material_id_idx
    ON stock_closing_items (raw_material_id);

-- ---------------------------------------------------------------------------
-- product_outlets
-- Ketersediaan produk per outlet. Produk tidak dihapus ketika tidak tersedia.
-- ---------------------------------------------------------------------------
CREATE TABLE product_outlets (
    product_id   UUID NOT NULL REFERENCES products(id),
    outlet_id    UUID NOT NULL REFERENCES outlets(id),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (product_id, outlet_id)
);

-- Lookup berdasarkan product_id sudah dilayani oleh primary key (product_id, outlet_id).
CREATE INDEX product_outlets_outlet_available_idx
    ON product_outlets (outlet_id, is_available);

CREATE TRIGGER product_outlets_set_updated_at
    BEFORE UPDATE ON product_outlets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_change_requests
-- Cashier mengajukan, Owner approve; backend lalu mengubah product_outlets.is_available.
-- ---------------------------------------------------------------------------
CREATE TABLE menu_change_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id    UUID NOT NULL REFERENCES outlets(id),
    product_id   UUID NOT NULL REFERENCES products(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    reason       TEXT,
    status       TEXT NOT NULL DEFAULT 'PENDING',
    approved_by  UUID REFERENCES users(id),
    approved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT menu_change_requests_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX menu_change_requests_outlet_status_idx
    ON menu_change_requests (outlet_id, status);
CREATE INDEX menu_change_requests_product_id_idx
    ON menu_change_requests (product_id);

CREATE TRIGGER menu_change_requests_set_updated_at
    BEFORE UPDATE ON menu_change_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
