export interface User {
  id?: number,
  name: string,
  email: string,
  password: string,
  role: 'student' | 'teacher' | 'donator' | 'admin',
  points: number,
  campus: string,
  created_at: string,
}

export interface Book {
  id?: number,
  title: string,
  author: string,
  release_date: string,
  edition?: string,
  status: 'available' | 'lent',
  destination?: "library" | "sale",
  donor_id?: number,
  created_at: string,
}

export interface Loan {
  id?: number,
  user_id: number,
  book_id: number,
  return_date: string,
  returned_at: string | null,
}

export interface Donation {
  id?: number,
  user_id: number,
  book_id: number,
  points_awarded: number,
  created_at: string,
}

export interface DonationRequest {
  id?: number,
  user_id: number,
  title: string,
  author: string,
  release_date: string,
  edition?: string,
  scheduled_at: string,
  status: 'pending' | 'scheduled' | 'rejected' | 'completed',
  destination: "library" | "sale",
  assessed_points: number | null,
  assessed_by_admin_id: number | null,
  assessed_at: string | null,
  book_id: number | null,
  notes: string | null,
  created_at: string,
  updated_at: string,
}

export interface NewBook {
  id?: number,
  title: string,
  author: string,
  release_date: string,
  edition?: string,
  description?: string,
  cover_url?: string,
  credits_cost: number,
  stock: number,
  active: number,
  created_at: string,
}

export interface NewBookOrder {
  id?: number,
  user_id: number,
  new_book_id: number,
  credits_spent: number,
  scheduled_pickup_at: string,
  status: "scheduled" | "completed" | "cancelled",
  created_at: string,
  updated_at: string,
}
