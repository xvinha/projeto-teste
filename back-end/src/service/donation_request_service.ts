import {
  create_donation_request,
  get_donation_request_by_id,
  get_donation_requests,
  get_donation_requests_by_user_id,
  update_donation_request,
} from "../repository/donation_request_repo"
import { get_user_by_id, update_user_points } from "../repository/user_repo"
import { create_book } from "../repository/book_repo"
import { create_donation } from "../repository/donation_repo"
import { create_new_book_catalog_item } from "../repository/new_book_repo"
import type { Book } from "../types"
import { getScheduleWindowError } from "./schedule_utils"

const requireAdmin = (admin_id: number) => {
  const admin = get_user_by_id(admin_id) as { role?: string } | null
  return !!admin && admin.role === "admin"
}

const parseIdFromUrl = (req: Request) => {
  const id = Number(req.url.split("/").pop())
  return Number.isFinite(id) ? id : null
}

const getDestinationValue = (value: unknown, fallback: "library" | "sale" = "library") =>
  value === "sale" ? "sale" : fallback

export const create_donation_request_handler = async (req: Request) => {
  const body = await req.json()
  const { user_id, book, scheduled_at } = body

  if (
    typeof user_id !== "number" ||
    !book ||
    typeof book.title !== "string" ||
    typeof book.author !== "string" ||
    typeof book.release_date !== "string" ||
    typeof scheduled_at !== "string"
  ) {
    return new Response(
      `Invalid payload — expected { user_id: number, book: { title, author, release_date, edition? }, scheduled_at: string }`,
      { status: 400 },
    )
  }

  const user = get_user_by_id(user_id)
  if (!user) {
    return new Response(`User not found`, { status: 404 })
  }

  const scheduleError = getScheduleWindowError(scheduled_at, "Donation scheduling")
  if (scheduleError) {
    return new Response(scheduleError, { status: 400 })
  }

  const now = new Date().toISOString()
  const result = create_donation_request({
    user_id,
    title: book.title,
    author: book.author,
    release_date: book.release_date,
    edition: typeof book.edition === "string" ? book.edition : null,
    scheduled_at,
    status: "pending",
    destination: "library",
    assessed_points: null,
    assessed_by_admin_id: null,
    assessed_at: null,
    book_id: null,
    notes: null,
    created_at: now,
    updated_at: now,
  })

  if (result.changes === 0) {
    return new Response(`Error while creating donation request`, { status: 500 })
  }

  return Response.json({ message: `Donation request created`, success: true }, { status: 201 })
}

export const list_donation_requests_handler = (req: Request) => {
  const url = new URL(req.url)
  const admin_id = Number(url.searchParams.get("admin_id") ?? "")
  if (!Number.isFinite(admin_id)) {
    return new Response(`Missing admin_id`, { status: 400 })
  }
  if (!requireAdmin(admin_id)) {
    return new Response(`Forbidden`, { status: 403 })
  }
  return Response.json(get_donation_requests())
}

export const list_user_donation_requests_handler = (req: Request) => {
  const parts = req.url.split("/")
  const usersIdx = parts.findIndex((p) => p === "users")
  const user_id = Number(parts[usersIdx + 1])
  if (!Number.isFinite(user_id)) {
    return new Response(`Invalid user ID`, { status: 400 })
  }
  return Response.json(get_donation_requests_by_user_id(user_id))
}

export const find_donation_request_handler = (req: Request) => {
  const id = parseIdFromUrl(req)
  if (!id) {
    return new Response(`Invalid ID`, { status: 400 })
  }
  const request = get_donation_request_by_id(id)
  if (!request) {
    return new Response(`Donation request not found`, { status: 404 })
  }
  return Response.json(request)
}

export const update_donation_request_handler = async (req: Request) => {
  const id = parseIdFromUrl(req)
  if (!id) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const body = await req.json()
  const admin_id = body.admin_id

  if (typeof admin_id !== "number") {
    return new Response(`Missing admin_id`, { status: 400 })
  }

  if (!requireAdmin(admin_id)) {
    return new Response(`Forbidden`, { status: 403 })
  }

  const existing = get_donation_request_by_id(id) as any
  if (!existing) {
    return new Response(`Donation request not found`, { status: 404 })
  }

  const scheduled_at = typeof body.scheduled_at === "string" ? body.scheduled_at : existing.scheduled_at
  const notes = typeof body.notes === "string" ? body.notes : existing.notes
  const status =
    body.status === "pending" || body.status === "scheduled" || body.status === "rejected" || body.status === "completed"
      ? body.status
      : existing.status
  const destination = getDestinationValue(body.destination, getDestinationValue(existing.destination))

  const scheduleError = getScheduleWindowError(scheduled_at, "Donation scheduling")
  if (scheduleError) {
    return new Response(scheduleError, { status: 400 })
  }

  const updated_at = new Date().toISOString()

  const result = update_donation_request(id, {
    scheduled_at,
    status,
    destination,
    assessed_points: existing.assessed_points ?? null,
    assessed_by_admin_id: existing.assessed_by_admin_id ?? null,
    assessed_at: existing.assessed_at ?? null,
    book_id: existing.book_id ?? null,
    notes: notes ?? null,
    updated_at,
  })

  if (result.changes === 0) {
    return new Response(`Error while updating donation request`, { status: 500 })
  }

  return Response.json({ message: `Donation request updated`, success: true })
}

export const approve_donation_request_handler = async (req: Request) => {
  const parts = req.url.split("/")
  const id = Number(parts[parts.indexOf("donation-requests") + 1])
  if (!Number.isFinite(id)) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const body = await req.json()
  const admin_id = body.admin_id
  const assessed_points = body.assessed_points
  const notes = typeof body.notes === "string" ? body.notes : null

  if (typeof admin_id !== "number") {
    return new Response(`Missing admin_id`, { status: 400 })
  }

  if (!requireAdmin(admin_id)) {
    return new Response(`Forbidden`, { status: 403 })
  }

  if (typeof assessed_points !== "number" || assessed_points < 0) {
    return new Response(`Invalid assessed_points`, { status: 400 })
  }

  const existing = get_donation_request_by_id(id) as any
  if (!existing) {
    return new Response(`Donation request not found`, { status: 404 })
  }

  if (existing.status === "rejected" || existing.status === "completed") {
    return new Response(`Donation request already finalized`, { status: 409 })
  }

  const finalDestination = getDestinationValue(body.destination, getDestinationValue(existing.destination))
  if (finalDestination === "sale" && assessed_points <= 0) {
    return new Response(`Livros para venda precisam ter custo em creditos maior que zero`, { status: 400 })
  }

  const createdBookResult = create_book({
    title: existing.title,
    author: existing.author,
    release_date: existing.release_date,
    edition: existing.edition ?? null,
    status: "available",
    destination: finalDestination,
    donor_id: existing.user_id,
    created_at: new Date().toISOString(),
  } as Book & { donor_id?: number })

  if (createdBookResult.changes === 0) {
    return new Response(`Error while creating donated book`, { status: 500 })
  }

  const book_id = createdBookResult.lastInsertRowid as number
  const now = new Date().toISOString()

  if (finalDestination === "sale") {
    const saleCatalogResult = create_new_book_catalog_item({
      title: existing.title,
      author: existing.author,
      release_date: existing.release_date,
      edition: existing.edition ?? undefined,
      description: notes ?? undefined,
      credits_cost: assessed_points,
      stock: 1,
      active: 1,
      created_at: now,
    })

    if (saleCatalogResult.changes === 0) {
      return new Response(`Error while creating sale catalog item`, { status: 500 })
    }
  }

  const donationResult = create_donation(existing.user_id, book_id, assessed_points, now)
  if (donationResult.changes === 0) {
    return new Response(`Error while creating donation record`, { status: 500 })
  }

  update_user_points(existing.user_id, assessed_points)

  const updateResult = update_donation_request(id, {
    scheduled_at: existing.scheduled_at,
    status: "completed",
    destination: finalDestination,
    assessed_points,
    assessed_by_admin_id: admin_id,
    assessed_at: now,
    book_id,
    notes,
    updated_at: now,
  })

  if (updateResult.changes === 0) {
    return new Response(`Error while finalizing donation request`, { status: 500 })
  }

  return Response.json(
    {
      message: `Donation request approved`,
      success: true,
      points_awarded: assessed_points,
      book_id,
    },
    { status: 200 },
  )
}

export const reject_donation_request_handler = async (req: Request) => {
  const id = parseIdFromUrl(req)
  if (!id) {
    return new Response(`Invalid ID`, { status: 400 })
  }

  const body = await req.json()
  const admin_id = body.admin_id
  const notes = typeof body.notes === "string" ? body.notes : null

  if (typeof admin_id !== "number") {
    return new Response(`Missing admin_id`, { status: 400 })
  }

  if (!requireAdmin(admin_id)) {
    return new Response(`Forbidden`, { status: 403 })
  }

  const existing = get_donation_request_by_id(id) as any
  if (!existing) {
    return new Response(`Donation request not found`, { status: 404 })
  }

  if (existing.status === "completed") {
    return new Response(`Donation request already completed`, { status: 409 })
  }

  const now = new Date().toISOString()
  const result = update_donation_request(id, {
    scheduled_at: existing.scheduled_at,
    status: "rejected",
    destination: getDestinationValue(existing.destination),
    assessed_points: existing.assessed_points ?? null,
    assessed_by_admin_id: admin_id,
    assessed_at: now,
    book_id: existing.book_id ?? null,
    notes,
    updated_at: now,
  })

  if (result.changes === 0) {
    return new Response(`Error while rejecting donation request`, { status: 500 })
  }

  return Response.json({ message: `Donation request rejected`, success: true })
}
