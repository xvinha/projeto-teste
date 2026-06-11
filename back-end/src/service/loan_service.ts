import {
  get_loan_by_id,
  get_loans,
  create_loan,
  return_loan,
  get_reservations_by_user,
  get_reservation_by_user_and_book,
  create_reservation,
  cancel_reservation_by_user_and_book,
} from "../repository/loan_repo"
import { get_book_by_id, update_book_status } from "../repository/book_repo"
import { isLoanPayload } from "../utils"
import type { Book } from "../types"

export const list_loans = () => Response.json(get_loans())

export const find_loan = (req: Request) => {
  const id = Number(req.url.split('/').pop())

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const loan = get_loan_by_id(id)

  if (!loan) {
    return new Response(`Loan not found`, { status: 404 })
  }

  return Response.json(loan)
}

export const borrow_book = async (req: Request) => {
  const body = await req.json()

  if (!isLoanPayload(body)) {
    return new Response(`Invalid loan payload — expected { user_id, book_id }`, { status: 400 })
  }

  const book = get_book_by_id(body.book_id) as Book | null

  if (!book) {
    return new Response(`Book not found`, { status: 404 })
  }

  if (book.status !== 'available') {
    return new Response(`Book is not available`, { status: 409 })
  }

  const return_date = new Date()
  return_date.setDate(return_date.getDate() + 14)

  const result = create_loan(body.user_id, body.book_id, return_date.toISOString())

  if (result.changes === 0) {
    return new Response(`Error while creating loan`, { status: 500 })
  }

  update_book_status(body.book_id, 'lent')

  // Remove any reservation this user had for this book
  cancel_reservation_by_user_and_book(body.user_id, body.book_id)

  const loan = get_loan_by_id(Number(result.lastInsertRowid))
  return Response.json(loan, { status: 201 })
}

export const return_book = async (req: Request) => {
  const id = Number(req.url.split('/').pop())

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const loan = get_loan_by_id(id) as (ReturnType<typeof get_loan_by_id> & { returned_at: string | null }) | null

  if (!loan) {
    return new Response(`Loan not found`, { status: 404 })
  }

  if ((loan as any).returned_at) {
    return new Response(`Book already returned`, { status: 409 })
  }

  const returned_at = new Date().toISOString()
  const result = return_loan(id, returned_at)

  if (result.changes === 0) {
    return new Response(`Error while returning book`, { status: 500 })
  }

  update_book_status((loan as any).book_id, 'available')

  return Response.json(get_loan_by_id(id))
}

export const list_user_reservations = (req: Request) => {
  const parts = req.url.split('/')
  const usersIdx = parts.findIndex(p => p === 'users')
  const user_id = Number(parts[usersIdx + 1])

  if (isNaN(user_id)) {
    return new Response(`Invalid user ID`, { status: 400 })
  }

  return Response.json(get_reservations_by_user(user_id))
}

export const reserve_book = async (req: Request) => {
  const body = await req.json()

  if (!isLoanPayload(body)) {
    return new Response(`Invalid payload — expected { user_id, book_id }`, { status: 400 })
  }

  const book = get_book_by_id(body.book_id) as Book | null

  if (!book) {
    return new Response(`Book not found`, { status: 404 })
  }

  if (book.status === 'available') {
    return new Response(`Book is available — borrow it directly`, { status: 409 })
  }

  const existing = get_reservation_by_user_and_book(body.user_id, body.book_id)
  if (existing) {
    return new Response(`Reservation already exists`, { status: 409 })
  }

  const result = create_reservation(body.user_id, body.book_id, new Date().toISOString())

  if (result.changes === 0) {
    return new Response(`Error while creating reservation`, { status: 500 })
  }

  return Response.json({ message: `Reservation created successfully`, success: true }, { status: 201 })
}

export const cancel_reservation = async (req: Request) => {
  const body = await req.json()

  if (!isLoanPayload(body)) {
    return new Response(`Invalid payload — expected { user_id, book_id }`, { status: 400 })
  }

  const result = cancel_reservation_by_user_and_book(body.user_id, body.book_id)

  if (result.changes === 0) {
    return new Response(`Reservation not found`, { status: 404 })
  }

  return Response.json({ message: `Reservation cancelled`, success: true })
}
