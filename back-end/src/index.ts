import {
  login_user,
  signin_user,
  list_users,
  find_user,
  change_password,
  admin_change_user_password,
} from "./service/user_service"
import { list_books, find_book, create_new_book } from "./service/book_service"
import {
  list_loans,
  find_loan,
  borrow_book,
  return_book,
  reserve_book,
  cancel_reservation,
  list_user_reservations,
} from "./service/loan_service"
import { get_stats } from "./service/stats_service"
import { list_donations, list_user_donations, find_donation } from "./service/donation_service"
import {
  approve_donation_request_handler,
  create_donation_request_handler,
  find_donation_request_handler,
  list_donation_requests_handler,
  list_user_donation_requests_handler,
  reject_donation_request_handler,
  update_donation_request_handler,
} from "./service/donation_request_service"
import { get_rankings } from "./service/ranking_service"
import {
  create_new_book_catalog_handler,
  create_new_book_order_handler,
  list_new_books_handler,
  list_user_new_book_orders_handler,
} from "./service/new_book_store_service"

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"]
const CONFIGURED_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const FLY_APP_ORIGIN = process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : null
const ALLOWED_ORIGINS = [...new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...CONFIGURED_ALLOWED_ORIGINS,
  ...(FLY_APP_ORIGIN ? [FLY_APP_ORIGIN] : []),
])]
const HOST = process.env.HOST ?? "0.0.0.0"
const PORT = Number(process.env.PORT ?? 3000)

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
})

type Handler = (req: Request) => Response | Promise<Response>

const withCors = (handler: Handler): Handler =>
  async (req: Request) => {
    const origin = req.headers.get("Origin")
    const res = await handler(req)
    return new Response(res.body, {
      status: res.status,
      headers: { ...Object.fromEntries(res.headers), ...corsHeaders(origin) },
    })
  }

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  fetch(req) {
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("Origin")
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
  },
  routes: {
    "/login": { POST: withCors(login_user) },
    "/users": { GET: withCors(list_users), POST: withCors(signin_user) },
    "/users/:id": { GET: withCors(find_user) },
    "/users/:id/password": { PATCH: withCors(change_password) },
    "/admin/users/:id/password": { PATCH: withCors(admin_change_user_password) },
    "/users/:id/reservations": { GET: withCors(list_user_reservations) },
    "/books": { GET: withCors(list_books), POST: withCors(create_new_book) },
    "/books/:id": { GET: withCors(find_book) },
    "/loans": { GET: withCors(list_loans), POST: withCors(borrow_book) },
    "/loans/:id": { GET: withCors(find_loan), PATCH: withCors(return_book) },
    "/reservations": { POST: withCors(reserve_book), DELETE: withCors(cancel_reservation) },
    "/stats": { GET: withCors(get_stats) },
    "/rankings": { GET: withCors(get_rankings) },
    "/new-books": { GET: withCors(list_new_books_handler), POST: withCors(create_new_book_catalog_handler) },
    "/new-book-orders": { POST: withCors(create_new_book_order_handler) },
    "/donations": { GET: withCors(list_donations) },
    "/donations/:id": { GET: withCors(find_donation) },
    "/users/:id/donations": { GET: withCors(list_user_donations) },
    "/users/:id/new-book-orders": { GET: withCors(list_user_new_book_orders_handler) },
    "/donation-requests": {
      GET: withCors(list_donation_requests_handler),
      POST: withCors(create_donation_request_handler),
    },
    "/donation-requests/:id": {
      GET: withCors(find_donation_request_handler),
      PATCH: withCors(update_donation_request_handler),
    },
    "/donation-requests/:id/approve": { POST: withCors(approve_donation_request_handler) },
    "/donation-requests/:id/reject": { POST: withCors(reject_donation_request_handler) },
    "/users/:id/donation-requests": { GET: withCors(list_user_donation_requests_handler) },
  },
})

console.log(`Server running on http://${HOST}:${server.port}`)
