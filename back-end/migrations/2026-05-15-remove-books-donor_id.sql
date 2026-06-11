-- Rebuild `books` without `donor_id`
BEGIN TRANSACTION;

CREATE TABLE books_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  release_date TEXT NOT NULL,
  edition TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'lent')),
  created_at TEXT NOT NULL
);

INSERT INTO books_new (id, title, author, release_date, edition, status, created_at)
SELECT id, title, author, release_date, edition, status, created_at
FROM books;

DROP TABLE books;
ALTER TABLE books_new RENAME TO books;

COMMIT;
