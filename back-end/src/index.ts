import { login_user, signin_user, list_users, find_user, change_password } from "./service/user_service"
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

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"]

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
    "/users/:id/reservations": { GET: withCors(list_user_reservations) },
    "/books": { GET: withCors(list_books), POST: withCors(create_new_book) },
    "/books/:id": { GET: withCors(find_book) },
    "/loans": { GET: withCors(list_loans), POST: withCors(borrow_book) },
    "/loans/:id": { GET: withCors(find_loan), PATCH: withCors(return_book) },
    "/reservations": { POST: withCors(reserve_book), DELETE: withCors(cancel_reservation) },
  },
  port: 3000,
})

console.log(`Server running on http://localhost:${server.port}`)
