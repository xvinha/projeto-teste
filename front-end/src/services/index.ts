import type { User, Book, Loan, Reservation } from '@/types'
import { apiClient } from './api'

export const userService = {
  async getUser(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`)
  },

  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users')
  },

  async changePassword(
    id: number,
    current_password: string,
    new_password: string,
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.patch(`/users/${id}/password`, { current_password, new_password })
  },
}

export const bookService = {
  async getAllBooks(): Promise<Book[]> {
    return apiClient.get<Book[]>('/books')
  },

  async getBook(id: number): Promise<Book> {
    return apiClient.get<Book>(`/books/${id}`)
  },

  async createBook(data: {
    title: string
    author: string
    release_date: string
    edition?: string
    status: 'available' | 'lent'
    created_at: string
  }): Promise<{ message: string; success: boolean }> {
    return apiClient.post('/books', data)
  },
}

export const loanService = {
  async getAllLoans(): Promise<Loan[]> {
    return apiClient.get<Loan[]>('/loans')
  },

  async getUserLoans(userId: number): Promise<Loan[]> {
    const loans = await apiClient.get<Loan[]>('/loans')
    return loans.filter((l) => l.user_id === userId)
  },

  async borrowBook(userId: number, bookId: number): Promise<Loan> {
    return apiClient.post<Loan>('/loans', { user_id: userId, book_id: bookId })
  },

  async returnBook(loanId: number): Promise<Loan> {
    return apiClient.patch<Loan>(`/loans/${loanId}`, {})
  },
}

export const reservationService = {
  async getUserReservations(userId: number): Promise<Reservation[]> {
    return apiClient.get<Reservation[]>(`/users/${userId}/reservations`)
  },

  async reserveBook(userId: number, bookId: number): Promise<{ message: string; success: boolean }> {
    return apiClient.post('/reservations', { user_id: userId, book_id: bookId })
  },

  async cancelReservation(userId: number, bookId: number): Promise<{ message: string; success: boolean }> {
    return apiClient.delete_with_body('/reservations', { user_id: userId, book_id: bookId })
  },
}
