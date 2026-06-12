import database from "./repo"

const get_requests_query = database.query(`SELECT * FROM donation_requests ORDER BY created_at DESC`)
const get_request_by_id_query = database.query(`SELECT * FROM donation_requests WHERE id = ?`)
const get_requests_by_user_id_query = database.query(
  `SELECT * FROM donation_requests WHERE user_id = ? ORDER BY created_at DESC`,
)

const create_request_stmt = database.prepare(
  `INSERT INTO donation_requests (
    user_id,
    title,
    author,
    release_date,
    edition,
    scheduled_at,
    status,
    destination,
    assessed_points,
    assessed_by_admin_id,
    assessed_at,
    book_id,
    notes,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)

const update_request_stmt = database.prepare(
  `UPDATE donation_requests SET
    scheduled_at = ?,
    status = ?,
    destination = ?,
    assessed_points = ?,
    assessed_by_admin_id = ?,
    assessed_at = ?,
    book_id = ?,
    notes = ?,
    updated_at = ?
  WHERE id = ?`,
)

export const get_donation_requests = () => get_requests_query.all()
export const get_donation_request_by_id = (id: number) => get_request_by_id_query.get(id)
export const get_donation_requests_by_user_id = (user_id: number) =>
  get_requests_by_user_id_query.all(user_id)

export const create_donation_request = (data: {
  user_id: number
  title: string
  author: string
  release_date: string
  edition: string | null
  scheduled_at: string
  status: 'pending' | 'scheduled' | 'rejected' | 'completed'
  destination: "library" | "sale"
  assessed_points: number | null
  assessed_by_admin_id: number | null
  assessed_at: string | null
  book_id: number | null
  notes: string | null
  created_at: string
  updated_at: string
}) =>
  create_request_stmt.run(
    data.user_id,
    data.title,
    data.author,
    data.release_date,
    data.edition,
    data.scheduled_at,
    data.status,
    data.destination,
    data.assessed_points,
    data.assessed_by_admin_id,
    data.assessed_at,
    data.book_id,
    data.notes,
    data.created_at,
    data.updated_at,
  )

export const update_donation_request = (id: number, data: {
  scheduled_at: string
  status: 'pending' | 'scheduled' | 'rejected' | 'completed'
  destination: "library" | "sale"
  assessed_points: number | null
  assessed_by_admin_id: number | null
  assessed_at: string | null
  book_id: number | null
  notes: string | null
  updated_at: string
}) =>
  update_request_stmt.run(
    data.scheduled_at,
    data.status,
    data.destination,
    data.assessed_points,
    data.assessed_by_admin_id,
    data.assessed_at,
    data.book_id,
    data.notes,
    data.updated_at,
    id,
  )
