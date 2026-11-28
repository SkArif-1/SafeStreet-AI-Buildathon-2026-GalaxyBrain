
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const dbPath = path.resolve(
  process.env.DATABASE_PATH || "./data/safestreet.sqlite"
);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen'
    CHECK(role IN ('citizen','admin')),
  area TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','verified','resolved','rejected')),
  severity TEXT NOT NULL DEFAULT 'Medium',
  ai_category TEXT,
  ai_confidence REAL,
  ai_summary TEXT,
  ai_provider TEXT,
  duplicate_of TEXT,
  ward TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status
ON reports(status);

CREATE INDEX IF NOT EXISTS idx_reports_created
ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_user
ON reports(user_id);

CREATE TABLE IF NOT EXISTS report_history (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  path_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS route_observations (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL
    CHECK(dimension IN ('lighting','footpath','crossing','accessibility')),
  score REAL NOT NULL CHECK(score >= 0 AND score <= 5),
  source TEXT DEFAULT 'citizen',
  verified INTEGER DEFAULT 0,
  report_id TEXT REFERENCES reports(id),
  observed_at TEXT NOT NULL
);
`);

// Add ticket number to existing database if missing
const reportColumns = db.pragma("table_info(reports)");

if (!reportColumns.some((column) => column.name === "ticket_no")) {
  db.exec("ALTER TABLE reports ADD COLUMN ticket_no INTEGER");
}

// Assign sequential numbers to existing reports
const oldReports = db
  .prepare(`
    SELECT id
    FROM reports
    WHERE ticket_no IS NULL
    ORDER BY created_at ASC, id ASC
  `)
  .all();

let nextTicketNo = db
  .prepare(`
    SELECT COALESCE(MAX(ticket_no), 100) + 1 AS next
    FROM reports
  `)
  .get().next;

const assignTicketNo = db.prepare(`
  UPDATE reports
  SET ticket_no = ?
  WHERE id = ?
`);

for (const report of oldReports) {
  assignTicketNo.run(nextTicketNo++, report.id);
}

// Prevent duplicate ticket numbers
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_ticket_no
  ON reports(ticket_no)
`);

module.exports = db;
