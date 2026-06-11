export interface User {
  id?: number,
  name: string,
  email: string,
  password: string,
  role: 'student' | 'teacher' | 'donator' | 'admin',
  points: number,
  institution: string,
  created_at: string,
}

export interface Book {
  id?: number,
  title: string,
  author: string,
  release_date: string,
  edition?: string,
  status: 'available' | 'lent',
  created_at: string,
}

export interface Loan {
  id?: number,
  user_id: number,
  book_id: number,
  return_date: string,
  returned_at: string | null,
}
