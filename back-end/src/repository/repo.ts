import { Database } from "bun:sqlite"
import { join } from "path"

const database = new Database(join(import.meta.dir, "../../Estante_Vive.sqlite"), { strict: true })

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
  campus TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
)`)

const currentUsersColumns = database.query("PRAGMA table_info(users)").all() as { name: string }[]
const hasInstitutionCol = currentUsersColumns.some((col) => col.name === "institution")
const hasCampusCol = currentUsersColumns.some((col) => col.name === "campus")
if (hasInstitutionCol && !hasCampusCol) {
  database.run(`ALTER TABLE users RENAME COLUMN institution TO campus`)
}

database.run(`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'lent')),
  destination TEXT NOT NULL DEFAULT 'library' CHECK(destination IN ('library', 'sale')),
  donor_id INTEGER REFERENCES users(id),
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

database.run(`CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`)

database.run(`CREATE TABLE IF NOT EXISTS donation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition TEXT,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'scheduled', 'rejected', 'completed')),
  destination TEXT NOT NULL DEFAULT 'library' CHECK(destination IN ('library', 'sale')),
  assessed_points INTEGER,
  assessed_by_admin_id INTEGER REFERENCES users(id),
  assessed_at TEXT,
  book_id INTEGER REFERENCES books(id),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`)

database.run(`CREATE TABLE IF NOT EXISTS new_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition TEXT,
  description TEXT,
  cover_url TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  created_at TEXT NOT NULL
)`)

database.run(`CREATE TABLE IF NOT EXISTS new_book_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  new_book_id INTEGER NOT NULL REFERENCES new_books(id),
  credits_spent INTEGER NOT NULL,
  scheduled_pickup_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`)

// Migrate books table if it doesn't have donor_id column
const booksColumns = database.query("PRAGMA table_info(books)").all() as { name: string; type: string }[]
const hasDonorId = booksColumns.find((col) => col.name === "donor_id")
if (!hasDonorId) {
  // We need to add the column
  database.run(`ALTER TABLE books ADD COLUMN donor_id INTEGER REFERENCES users(id)`)
}
const hasBookDestination = booksColumns.find((col) => col.name === "destination")
if (!hasBookDestination) {
  database.run(`ALTER TABLE books ADD COLUMN destination TEXT NOT NULL DEFAULT 'library'`)
}

const donationRequestColumns = database.query("PRAGMA table_info(donation_requests)").all() as { name: string }[]
const hasDonationDestination = donationRequestColumns.find((col) => col.name === "destination")
if (!hasDonationDestination) {
  database.run(`ALTER TABLE donation_requests ADD COLUMN destination TEXT NOT NULL DEFAULT 'library'`)
}

// Seed: Create default admin user if doesn't exist
const adminExists = database.query("SELECT 1 FROM users WHERE email = ?").get("admin@estanteviva.com")
if (!adminExists) {
  database.run(
    `INSERT INTO users (name, email, password, role, points, campus, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["Administrador", "admin@estanteviva.com", "admin123", "admin", 0, "Veiga Tijuca", new Date().toISOString()]
  )
}

const newBooksCount = database.query("SELECT COUNT(*) as count FROM new_books").get() as { count: number }
if (newBooksCount.count === 0) {
  const now = new Date().toISOString()
  const seedNewBook = database.prepare(
    `INSERT INTO new_books (title, author, release_date, edition, description, cover_url, credits_cost, stock, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  const seedCatalog = [
    [
      "A Biblioteca da Meia-Noite",
      "Matt Haig",
      "2020-08-13",
      "1a edicao",
      "Uma ficcao contemporanea sobre escolhas, arrependimentos e novas possibilidades.",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
      35,
      4,
      1,
      now,
    ],
    [
      "Atomic Habits",
      "James Clear",
      "2018-10-16",
      "1st edition",
      "Um guia pratico sobre construcao de habitos e melhoria continua.",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80",
      45,
      3,
      1,
      now,
    ],
    [
      "Dom Casmurro",
      "Machado de Assis",
      "1899-01-01",
      "Edicao comentada",
      "Classico brasileiro em edicao especial para leitura e estudo.",
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80",
      25,
      5,
      1,
      now,
    ],
    [
      "Clean Code",
      "Robert C. Martin",
      "2008-08-01",
      "1st edition",
      "Boas praticas de desenvolvimento com foco em codigo limpo e manutencao.",
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80",
      50,
      2,
      1,
      now,
    ],
  ] as const

  for (const book of seedCatalog) {
    seedNewBook.run(...book)
  }
}

export default database
