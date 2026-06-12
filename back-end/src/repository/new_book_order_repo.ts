import type { NewBookOrder } from "../types"
import database from "./repo"

const create_new_book_order_stmt = database.prepare(`
  INSERT INTO new_book_orders (
    user_id,
    new_book_id,
    credits_spent,
    scheduled_pickup_at,
    status,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const get_new_book_orders_by_user_query = database.query(`
  SELECT
    o.*,
    b.title AS book_title,
    b.author AS book_author,
    b.cover_url AS book_cover_url
  FROM new_book_orders o
  INNER JOIN new_books b ON b.id = o.new_book_id
  WHERE o.user_id = ?
  ORDER BY o.created_at DESC
`)

export const create_new_book_order = (order: NewBookOrder) =>
  create_new_book_order_stmt.run(
    order.user_id,
    order.new_book_id,
    order.credits_spent,
    order.scheduled_pickup_at,
    order.status,
    order.created_at,
    order.updated_at,
  )

export const get_new_book_orders_by_user = (user_id: number) =>
  get_new_book_orders_by_user_query.all(user_id)
