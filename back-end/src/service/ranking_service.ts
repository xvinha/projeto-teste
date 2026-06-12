import database from "../repository/repo"

export const get_rankings = () => {
  const getPointsByRole = (role: "student" | "teacher" | "donator") =>
    database
      .query(
        `SELECT id, name, campus, points, role
         FROM users
         WHERE role = ?
         ORDER BY points DESC, name ASC`,
      )
      .all(role)

  const getDonationsByRole = (role: "student" | "teacher" | "donator") =>
    database
      .query(
        `SELECT u.id, u.name, u.campus, u.points, u.role, COUNT(d.id) as donated_books
         FROM users u
         LEFT JOIN donations d ON d.user_id = u.id
         WHERE u.role = ?
         GROUP BY u.id
         ORDER BY donated_books DESC, u.points DESC, u.name ASC`,
      )
      .all(role)

  return Response.json({
    by_points: {
      student: getPointsByRole("student"),
      teacher: getPointsByRole("teacher"),
      donator: getPointsByRole("donator"),
    },
    by_donations: {
      student: getDonationsByRole("student"),
      teacher: getDonationsByRole("teacher"),
      donator: getDonationsByRole("donator"),
    },
  })
}
