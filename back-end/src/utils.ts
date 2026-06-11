import type { User, Book } from "./types"

export const isUser = (body: any): body is User => {
  return (
    body &&
    typeof body === "object" &&
    typeof body.email === "string" &&
    typeof body.name === "string" &&
    typeof body.password === "string" &&
    ['student', 'teacher', 'donator', 'admin'].includes(body.role) &&
    typeof body.points === "number" &&
    typeof body.created_at === "string" &&
    typeof body.institution === "string"
  )
}

export const isLoanPayload = (body: any): body is { user_id: number; book_id: number } => {
  return (
    body &&
    typeof body === "object" &&
    typeof body.user_id === "number" &&
    typeof body.book_id === "number"
  )
}

export const isBook = (body: any): body is Book => {
  return (
    body &&
    typeof body === "object" &&
    typeof body.title === "string" &&
    typeof body.author === "string" &&
    typeof body.release_date === "string" &&
    ['available', 'lent'].includes(body.status) &&
    typeof body.created_at === "string"
  )
}
