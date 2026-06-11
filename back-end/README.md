# Estante Vive — Back-end

REST API for the Estante Vive shared library system, built with **Bun** and **SQLite**.

## Stack

- [Bun](https://bun.com) — runtime, HTTP server, and SQLite driver
- TypeScript
- `bun:sqlite` — embedded database (no external DB required)

## Getting started

```bash
bun install
bun dev        # starts the server on http://localhost:3000
```

## Project structure

```
src/
├── index.ts              # Entry point — route definitions
├── types.ts              # Shared TypeScript interfaces
├── utils.ts              # Runtime type guards (isUser, isBook)
├── repository/
│   ├── repo.ts           # Database connection and schema creation
│   ├── user_repo.ts      # User queries and statements
│   └── library_repo.ts   # Book queries and statements
└── service/
    ├── user_service.ts   # Request handlers for /users routes
    ├── book_service.ts   # Request handlers for /books routes
    └── library_service.ts
```

### Layers

| Layer | Responsibility |
|---|---|
| `service/` | Parses requests, validates input, builds responses |
| `repository/` | Executes prepared SQL statements against the database |
| `types.ts` | Single source of truth for data shapes |
| `utils.ts` | Guards that validate raw request bodies before insertion |

## API endpoints

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List all users (password excluded) |
| `POST` | `/users` | Create a new user |
| `GET` | `/users/:id` | Get a single user by ID (password excluded) |

**POST /users — request body**

```json
{
  "name": "Maria Silva",
  "email": "maria@escola.edu.br",
  "password": "secret123",
  "role": "student",
  "points": 0,
  "institution": "Escola Estadual Central",
  "created_at": "2026-05-14T10:00:00.000Z"
}
```

Valid roles: `student` · `teacher` · `donator` · `admin`

### Books

| Method | Path | Description |
|---|---|---|
| `GET` | `/books` | List all books |
| `POST` | `/books` | Create a new book |
| `GET` | `/books/:id` | Get a single book by ID |

**POST /books — request body**

```json
{
  "title": "O Senhor dos Anéis",
  "author": "J.R.R. Tolkien",
  "release_date": "1954-07-29",
  "edition": "2ª edição",
  "status": "available",
  "created_at": "2026-05-14T10:00:00.000Z"
}
```

`edition` is optional. Valid status values: `available` · `lent`

## Database

The database file `Estante_Vive.sqlite` is created automatically on first run. Tables are also created automatically if they do not exist.

**Schema**

```sql
-- users table is created externally; books and loans are created in repo.ts
CREATE TABLE books (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition     TEXT,
  status      TEXT NOT NULL DEFAULT 'available'
              CHECK(status IN ('available', 'lent')),
  created_at  TEXT NOT NULL
);

CREATE TABLE loans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  book_id     INTEGER NOT NULL REFERENCES books(id),
  return_date TEXT NOT NULL,
  returned_at TEXT
);
```

### Loans

| Method | Path | Description |
|---|---|---|
| `GET` | `/loans` | List all loans (includes `book_title` and `book_author`) |
| `POST` | `/loans` | Borrow a book |
| `GET` | `/loans/:id` | Get a single loan by ID |
| `PATCH` | `/loans/:id` | Return a book |

**POST /loans — request body**

```json
{
  "user_id": 1,
  "book_id": 3
}
```

The `return_date` is automatically set to 14 days from the request date. Returns 409 if the book is not available.

**PATCH /loans/:id** — no body required. Sets `returned_at` to the current timestamp and marks the book as `available`. Returns 409 if already returned.

## Notes

- There is no authentication middleware. Login is handled client-side by filtering the `/users` list.
- All passwords are stored in plain text — this is a prototype, not a production system.
