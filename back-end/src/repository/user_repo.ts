import type { User } from "../types";
import database from "./repo";

const get_users_query = database.query(
  `SELECT id, name, email, role, points, campus, created_at FROM users`,
);
const get_user_by_id_query = database.query(
  `SELECT id, name, email, role, points, campus, created_at FROM users WHERE id = ?`,
);
const get_user_by_credentials_query = database.query(
  `SELECT id, name, email, role, points, campus, created_at FROM users WHERE email = ? AND password = ?`,
);
const create_user_stmt = database.prepare(
  `INSERT INTO users (name, email, password, role, points, campus, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
const update_password_stmt = database.prepare(
  `UPDATE users SET password = ? WHERE id = ? AND password = ?`,
);
const admin_update_password_stmt = database.prepare(
  `UPDATE users SET password = ? WHERE id = ?`,
);

export const get_users = () => get_users_query.all();

export const get_user_by_id = (id: number) => get_user_by_id_query.get(id);

export const get_user_by_credentials = (email: string, password: string) =>
  get_user_by_credentials_query.get(email, password);

export const create_user = (user: User) =>
  create_user_stmt.run(
    user.name,
    user.email,
    user.password,
    user.role,
    user.points,
    user.campus,
    user.created_at,
  );

export const update_password = (id: number, current_password: string, new_password: string) =>
  update_password_stmt.run(new_password, id, current_password);

export const update_password_by_admin = (id: number, new_password: string) =>
  admin_update_password_stmt.run(new_password, id);

const update_user_points_stmt = database.prepare(
  `UPDATE users SET points = points + ? WHERE id = ?`
);

export const update_user_points = (id: number, points: number) =>
  update_user_points_stmt.run(points, id);
