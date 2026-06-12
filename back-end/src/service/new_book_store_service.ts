import {
  create_new_book_catalog_item,
  decrement_new_book_stock,
  get_new_book_by_id,
  get_new_books,
  increment_new_book_stock,
} from "../repository/new_book_repo"
import { create_new_book_order, get_new_book_orders_by_user } from "../repository/new_book_order_repo"
import { get_user_by_id, update_user_points } from "../repository/user_repo"
import { getScheduleWindowError } from "./schedule_utils"

const requireAdmin = (admin_id: number) => {
  const admin = get_user_by_id(admin_id) as { role?: string } | null
  return !!admin && admin.role === "admin"
}

export const list_new_books_handler = () => Response.json(get_new_books())

export const create_new_book_catalog_handler = async (req: Request) => {
  const body = await req.json()
  const admin_id = body.admin_id

  if (typeof admin_id !== "number") {
    return new Response(`Missing admin_id`, { status: 400 })
  }

  if (!requireAdmin(admin_id)) {
    return new Response(`Forbidden`, { status: 403 })
  }

  if (
    typeof body.title !== "string" ||
    typeof body.author !== "string" ||
    typeof body.release_date !== "string" ||
    typeof body.credits_cost !== "number" ||
    !Number.isFinite(body.credits_cost) ||
    body.credits_cost < 0 ||
    typeof body.stock !== "number" ||
    !Number.isFinite(body.stock) ||
    body.stock < 0
  ) {
    return new Response(`Invalid new book payload`, { status: 400 })
  }

  const result = create_new_book_catalog_item({
    title: body.title,
    author: body.author,
    release_date: body.release_date,
    edition: typeof body.edition === "string" ? body.edition : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    cover_url: typeof body.cover_url === "string" ? body.cover_url : undefined,
    credits_cost: body.credits_cost,
    stock: body.stock,
    active: 1,
    created_at: new Date().toISOString(),
  })

  if (result.changes === 0) {
    return new Response(`Error while creating new book`, { status: 500 })
  }

  return Response.json({ message: `New book created successfully`, success: true }, { status: 201 })
}

export const list_user_new_book_orders_handler = (req: Request) => {
  const parts = req.url.split("/")
  const usersIdx = parts.findIndex((p) => p === "users")
  const user_id = Number(parts[usersIdx + 1])

  if (!Number.isFinite(user_id)) {
    return new Response(`Invalid user ID`, { status: 400 })
  }

  return Response.json(get_new_book_orders_by_user(user_id))
}

export const create_new_book_order_handler = async (req: Request) => {
  const body = await req.json()
  const user_id = body.user_id
  const new_book_id = body.new_book_id
  const scheduled_pickup_at = body.scheduled_pickup_at

  if (
    typeof user_id !== "number" ||
    typeof new_book_id !== "number" ||
    typeof scheduled_pickup_at !== "string"
  ) {
    return new Response(
      `Invalid payload — expected { user_id: number, new_book_id: number, scheduled_pickup_at: string }`,
      { status: 400 },
    )
  }

  const user = get_user_by_id(user_id) as { points?: number } | null
  if (!user) {
    return new Response(`User not found`, { status: 404 })
  }

  const book = get_new_book_by_id(new_book_id) as
    | { id: number; title: string; credits_cost: number; stock: number; active: number }
    | null
  if (!book || book.active !== 1) {
    return new Response(`New book not found`, { status: 404 })
  }

  if (book.stock <= 0) {
    return new Response(`Livro esgotado no momento`, { status: 409 })
  }

  const scheduleError = getScheduleWindowError(scheduled_pickup_at, "Pickup scheduling")
  if (scheduleError) {
    return new Response(scheduleError, { status: 400 })
  }

  const userPoints = typeof user.points === "number" ? user.points : 0
  if (userPoints < book.credits_cost) {
    return new Response(`Creditos insuficientes para comprar este livro`, { status: 403 })
  }

  const stockResult = decrement_new_book_stock(new_book_id)
  if (stockResult.changes === 0) {
    return new Response(`Livro esgotado no momento`, { status: 409 })
  }

  update_user_points(user_id, -book.credits_cost)

  const now = new Date().toISOString()
  const result = create_new_book_order({
    user_id,
    new_book_id,
    credits_spent: book.credits_cost,
    scheduled_pickup_at,
    status: "scheduled",
    created_at: now,
    updated_at: now,
  })

  if (result.changes === 0) {
    increment_new_book_stock(new_book_id)
    update_user_points(user_id, book.credits_cost)
    return new Response(`Error while creating new book order`, { status: 500 })
  }

  return Response.json(
    {
      message: `Compra realizada com sucesso`,
      success: true,
      credits_spent: book.credits_cost,
      scheduled_pickup_at,
    },
    { status: 201 },
  )
}
