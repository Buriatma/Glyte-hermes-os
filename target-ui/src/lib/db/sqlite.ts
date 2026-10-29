import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// Singleton Database instance
let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // Determine path: ~/.hermes/glyte_cache.db or local .cache
  const hermesDir = path.join(os.homedir(), ".hermes");
  let dbPath: string;

  try {
    if (!fs.existsSync(hermesDir)) {
      fs.mkdirSync(hermesDir, { recursive: true });
    }
    dbPath = path.join(hermesDir, "glyte_cache.db");
  } catch {
    const localCache = path.join(process.cwd(), ".cache");
    if (!fs.existsSync(localCache)) {
      fs.mkdirSync(localCache, { recursive: true });
    }
    dbPath = path.join(localCache, "glyte_cache.db");
  }

  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for high concurrency & speed
  try {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  } catch {
    // In-memory or fallback
  }

  // 1. Initialize Skills Table & FTS5
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      name TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      type TEXT,
      author TEXT,
      tier TEXT,
      repo TEXT,
      provenance TEXT,
      enabled INTEGER DEFAULT 1,
      filePath TEXT,
      updated_at INTEGER
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
      name,
      title,
      description,
      category,
      content='skills',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS index synchronized
    CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
      INSERT INTO skills_fts(rowid, name, title, description, category) 
      VALUES (new.rowid, new.name, new.title, new.description, new.category);
    END;

    CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
      INSERT INTO skills_fts(skills_fts, rowid, name, title, description, category) 
      VALUES('delete', old.rowid, old.name, old.title, old.description, old.category);
    END;

    CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
      INSERT INTO skills_fts(skills_fts, rowid, name, title, description, category) 
      VALUES('delete', old.rowid, old.name, old.title, old.description, old.category);
      INSERT INTO skills_fts(rowid, name, title, description, category) 
      VALUES (new.rowid, new.name, new.title, new.description, new.category);
    END;
  `);

  // 2. Initialize Sessions & Messages Cache with FTS5
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions_cache (
      id TEXT PRIMARY KEY,
      title TEXT,
      model TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      is_pinned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages_cache (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      thought TEXT,
      tools TEXT,
      created_at INTEGER,
      FOREIGN KEY (session_id) REFERENCES sessions_cache(id) ON DELETE CASCADE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      thought,
      tools,
      content='messages_cache',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages_cache BEGIN
      INSERT INTO messages_fts(rowid, content, thought, tools) 
      VALUES (new.rowid, new.content, new.thought, new.tools);
    END;

    CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages_cache BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, content, thought, tools) 
      VALUES('delete', old.rowid, old.content, old.thought, old.tools);
    END;

    CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages_cache BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, content, thought, tools) 
      VALUES('delete', old.rowid, old.content, old.thought, old.tools);
      INSERT INTO messages_fts(rowid, content, thought, tools) 
      VALUES (new.rowid, new.content, new.thought, new.tools);
    END;

    CREATE TABLE IF NOT EXISTS key_value (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    );
  `);

  dbInstance = db;
  return dbInstance;
}

/**
 * Perform high-speed FTS5 full-text search across skills
 */
export function searchSkillsFTS(query: string, type?: string, category?: string, limit = 100) {
  const db = getDatabase();

  // If query is empty, return standard filtered list
  if (!query || !query.trim()) {
    let sql = "SELECT * FROM skills WHERE 1=1";
    const params: (string | number)[] = [];

    if (type && type !== "all") {
      sql += " AND type = ?";
      params.push(type);
    }
    if (category && category !== "all") {
      sql += " AND lower(category) = lower(?)";
      params.push(category);
    }

    sql += " ORDER BY enabled DESC, name ASC LIMIT ?";
    params.push(limit);

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  // Clean query for FTS5 prefix search
  const cleanQ = query.replace(/[^\w\s-]/g, "").trim();
  const ftsQuery = cleanQ
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}*`)
    .join(" ");

  if (!ftsQuery) {
    return [];
  }

  let sql = `
    SELECT s.*, rank
    FROM skills_fts f
    JOIN skills s ON f.rowid = s.rowid
    WHERE skills_fts MATCH ?
  `;
  const params: (string | number)[] = [ftsQuery];

  if (type && type !== "all") {
    sql += " AND s.type = ?";
    params.push(type);
  }
  if (category && category !== "all") {
    sql += " AND lower(s.category) = lower(?)";
    params.push(category);
  }

  sql += " ORDER BY rank LIMIT ?";
  params.push(limit);

  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch {
    // Fallback to LIKE if FTS expression is invalid
    const likeParam = `%${cleanQ}%`;
    const fallbackStmt = db.prepare(`
      SELECT * FROM skills
      WHERE (name LIKE ? OR title LIKE ? OR description LIKE ? OR category LIKE ?)
      ORDER BY enabled DESC, name ASC LIMIT ?
    `);
    return fallbackStmt.all(likeParam, likeParam, likeParam, likeParam, limit);
  }
}

/**
 * Cache or sync skill items into SQLite
 */
export function syncSkillsToSQLite(skills: any[]) {
  const db = getDatabase();
  const now = Date.now();

  const insertStmt = db.prepare(`
    INSERT INTO skills (name, title, description, category, type, author, tier, repo, provenance, enabled, filePath, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      type = excluded.type,
      author = excluded.author,
      tier = excluded.tier,
      repo = excluded.repo,
      provenance = excluded.provenance,
      enabled = excluded.enabled,
      filePath = excluded.filePath,
      updated_at = excluded.updated_at
  `);

  for (const s of skills) {
    insertStmt.run(
      s.name,
      s.title || s.name,
      s.description || "",
      s.category || "general",
      s.type || "skill",
      s.author || "",
      s.tier || "",
      s.repo || "",
      s.provenance || "official",
      s.enabled ? 1 : 0,
      s.filePath || "",
      now
    );
  }
}

/**
 * Fast search across chat messages
 */
export function searchMessagesFTS(query: string, limit = 20) {
  const db = getDatabase();
  const cleanQ = query.replace(/[^\w\s-]/g, "").trim();
  const ftsQuery = cleanQ
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word}*`)
    .join(" ");

  if (!ftsQuery) return [];

  const stmt = db.prepare(`
    SELECT m.*, s.title as session_title, snippet(messages_fts, 0, '<b>', '</b>', '...', 15) as snippet
    FROM messages_fts f
    JOIN messages_cache m ON f.rowid = m.rowid
    LEFT JOIN sessions_cache s ON m.session_id = s.id
    WHERE messages_fts MATCH ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `);

  try {
    return stmt.all(ftsQuery, limit);
  } catch {
    return [];
  }
}

/**
 * Key-Value store helper
 */
export function getKeyValue(key: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare("SELECT value FROM key_value WHERE key = ?");
  const res = stmt.get(key) as { value: string } | undefined;
  return res ? res.value : null;
}

export function setKeyValue(key: string, value: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO key_value (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);
  stmt.run(key, value, Date.now());
}
