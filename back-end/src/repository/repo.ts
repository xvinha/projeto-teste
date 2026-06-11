import { Database } from "bun:sqlite"
import { join } from "path"

const database = new Database(join(import.meta.dir, "../../../estante_viva.sqlite3"), { strict: true })

// Migrate users table: old schema used `id INT` which doesn't alias rowid in SQLite,
// causing AUTOINCREMENT to never fire and id to remain NULL on insert.
const usersColumns = database.query("PRAGMA table_info(users)").all() as { name: string; type: string }[]
const usersIdCol = usersColumns.find((col) => col.name === "id")
if (usersIdCol && usersIdCol.type.toUpperCase() !== "INTEGER") {
  database.run("DROP TABLE IF EXISTS users")
}

database.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'donator', 'admin')),
  points INTEGER NOT NULL DEFAULT 0,
  institution TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
)`)

database.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'lent')),
  created_at TEXT NOT NULL
)`)

// Migrate loans table: the old schema had borrow_date (NOT NULL) which the API doesn't use
const loansColumns = database.query("PRAGMA table_info(loans)").all() as { name: string }[]
if (loansColumns.some((col) => col.name === "borrow_date")) {
  database.run("DROP TABLE loans")
}

database.run(`CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  return_date TEXT NOT NULL,
  returned_at TEXT
)`)

database.run(`CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  created_at TEXT NOT NULL
)`)

export default database
