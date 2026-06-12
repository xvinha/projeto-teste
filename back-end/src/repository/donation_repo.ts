import database from "./repo"

const get_donations_query = database.query(`SELECT * FROM donations`)
const get_donations_by_user_id_query = database.query(`SELECT * FROM donations WHERE user_id = ?`)
const get_donation_by_id_query = database.query(`SELECT * FROM donations WHERE id = ?`)
const create_donation_stmt = database.prepare(`INSERT INTO donations (user_id, book_id, points_awarded, created_at) VALUES (?, ?, ?, ?)`)

export const get_donations = () => get_donations_query.all()
export const get_donations_by_user_id = (id: number) => get_donations_by_user_id_query.all(id)
export const get_donation_by_id = (id: number) => get_donation_by_id_query.get(id)
export const create_donation = (
  user_id: number,
  book_id: number,
  points_awarded: number,
  created_at: string
) => create_donation_stmt.run(user_id, book_id, points_awarded, created_at)
