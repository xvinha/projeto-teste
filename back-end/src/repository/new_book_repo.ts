import type { NewBook } from "../types"
import database from "./repo"

const get_new_books_query = database.query(`
  SELECT *
  FROM new_books
  WHERE active = 1
  ORDER BY created_at DESC, title ASC
`)

const get_new_book_by_id_query = database.query(`
  SELECT *
  FROM new_books
  WHERE id = ?
`)

const decrement_new_book_stock_stmt = database.prepare(`
  UPDATE new_books
  SET stock = stock - 1
  WHERE id = ? AND active = 1 AND stock > 0
`)

const increment_new_book_stock_stmt = database.prepare(`
  UPDATE new_books
  SET stock = stock + 1
  WHERE id = ?
`)

export const get_new_books = () => get_new_books_query.all()

export const get_new_book_by_id = (id: number) => get_new_book_by_id_query.get(id)

export const decrement_new_book_stock = (id: number) => decrement_new_book_stock_stmt.run(id)

export const increment_new_book_stock = (id: number) => increment_new_book_stock_stmt.run(id)

export const create_new_book_catalog_item = (book: NewBook) =>
  database
    .prepare(
      `INSERT INTO new_books (title, author, release_date, edition, description, cover_url, credits_cost, stock, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      book.title,
      book.author,
      book.release_date,
      book.edition ?? null,
      book.description ?? null,
      book.cover_url ?? null,
      book.credits_cost,
      book.stock,
      book.active,
      book.created_at,
    )
