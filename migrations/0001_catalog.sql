CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  version INTEGER NOT NULL CHECK (version > 0),
  data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE INDEX IF NOT EXISTS products_active ON products(active);
CREATE TABLE IF NOT EXISTS catalog_meta (id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL);
INSERT OR IGNORE INTO catalog_meta VALUES (1, 1);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  product_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_product_time ON audit_log(product_id, created_at);
CREATE TABLE IF NOT EXISTS write_guards (token TEXT PRIMARY KEY, valid INTEGER NOT NULL CHECK(valid = 1));
