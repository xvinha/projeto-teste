import {
  get_donations,
  get_donations_by_user_id,
  get_donation_by_id,
  create_donation,
} from "../repository/donation_repo"
import { update_user_points } from "../repository/user_repo"
import { create_book } from "../repository/book_repo"
import type { Book } from "../types"

const POINTS_PER_BOOK = 10

export const list_donations = () => Response.json(get_donations())

export const list_user_donations = (req: Request) => {
  const id = Number(req.url.split("/").pop())

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  return Response.json(get_donations_by_user_id(id))
}

export const find_donation = (req: Request) => {
  const id = Number(req.url.split("/").pop())

  if (isNaN(id)) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const donation = get_donation_by_id(id)

  if (!donation) {
    return new Response(`Donation not found`, { status: 404 })
  }

  return Response.json(donation)
}

export const donate_book = async (req: Request) => {
  const body = await req.json()
  const { user_id, book } = body

  if (typeof user_id !== "number" || !book) {
    return new Response(`Invalid payload — expected { user_id: number, book: Book }`, { status: 400 })
  }

  try {
    // First, create the book with donor_id
    const createdBookResult = create_book({
      ...book,
      status: 'available' as const,
      created_at: new Date().toISOString(),
      donor_id: user_id,
    })

    if (createdBookResult.changes === 0) {
      return new Response(`Error while creating book for donation`, { status: 500 })
    }

    // Get the newly created book's ID (last inserted row ID)
    // Bun SQLite uses lastInsertRowid
    const book_id = createdBookResult.lastInsertRowid as number

    // Now create the donation record
    const donationResult = create_donation(user_id, book_id, POINTS_PER_BOOK, new Date().toISOString())

    if (donationResult.changes === 0) {
      return new Response(`Error while creating donation record`, { status: 500 })
    }

    // Finally, update user's points
    update_user_points(user_id, POINTS_PER_BOOK)

    return Response.json(
      {
        message: `Book donated successfully! You earned ${POINTS_PER_BOOK} points.`,
        success: true,
        points_awarded: POINTS_PER_BOOK,
        book_id: book_id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error donating book:', error)
    return new Response(`Error while processing donation`, { status: 500 })
  }
}
