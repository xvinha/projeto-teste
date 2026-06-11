import type { Book } from "../types"
import database from "./repo"

const get_books_query = database.query(`SELECT * FROM books`)
const get_book_by_id_query = database.query(`SELECT * FROM books WHERE id = ?`)
const create_book_stmt = database.prepare(`INSERT INTO books (title, author, release_date, edition, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`)

export const get_books = () => get_books_query.all()

export const get_book_by_id = (id: number) => get_book_by_id_query.get(id)

export const create_book = (book: Book) =>
  create_book_stmt.run(book.title, book.author, book.release_date, book.edition ?? null, book.status, book.created_at)

const update_book_status_stmt = database.prepare(`UPDATE books SET status = ? WHERE id = ?`)

export const update_book_status = (id: number, status: 'available' | 'lent') =>
  update_book_status_stmt.run(status, id)
