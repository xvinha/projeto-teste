import type {
  User,
  Book,
  Loan,
  Reservation,
  Donation,
  DonationRequest,
  NewBook,
  NewBookOrder,
  RankingEntryPoints,
  RankingEntryDonations,
  RankingsByRole,
} from '@/types'
import { apiClient } from './api'

export const userService = {
  async getUser(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`)
  },

  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>('/users')
  },

  async createUser(data: {
    name: string
    email: string
    password: string
    role: 'student' | 'teacher' | 'donator' | 'admin'
    points: number
    campus: string
    created_at: string
  }): Promise<{ message: string; success: boolean }> {
    return apiClient.post('/users', data)
  },

  async changePassword(
    id: number,
    current_password: string,
    new_password: string,
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.patch(`/users/${id}/password`, { current_password, new_password })
  },

  async adminChangePassword(
    adminId: number,
    userId: number,
    new_password: string,
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.patch(`/admin/users/${userId}/password`, { admin_id: adminId, new_password })
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
    destination?: 'library' | 'sale'
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

  async cancelReservation(userId: number, book_id: number): Promise<{ message: string; success: boolean }> {
    return apiClient.delete_with_body('/reservations', { user_id: userId, book_id: book_id })
  },
}

export const statsService = {
  async getStats(): Promise<{ users: number; books: number; loans: number }> {
    return apiClient.get('/stats')
  },
}

export const donationService = {
  async getAllDonations(): Promise<Donation[]> {
    return apiClient.get<Donation[]>('/donations')
  },

  async getUserDonations(userId: number): Promise<Donation[]> {
    return apiClient.get<Donation[]>(`/users/${userId}/donations`)
  },

  async getDonation(id: number): Promise<Donation> {
    return apiClient.get<Donation>(`/donations/${id}`)
  },
}

export const donationRequestService = {
  async createDonationRequest(
    userId: number,
    payload: {
      title: string
      author: string
      release_date: string
      edition?: string
      scheduled_at: string
    },
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.post('/donation-requests', {
      user_id: userId,
      book: {
        title: payload.title,
        author: payload.author,
        release_date: payload.release_date,
        edition: payload.edition,
      },
      scheduled_at: payload.scheduled_at,
    })
  },

  async getUserDonationRequests(userId: number): Promise<DonationRequest[]> {
    return apiClient.get<DonationRequest[]>(`/users/${userId}/donation-requests`)
  },

  async getAllDonationRequests(adminId: number): Promise<DonationRequest[]> {
    return apiClient.get<DonationRequest[]>(`/donation-requests?admin_id=${adminId}`)
  },

  async updateDonationRequest(
    adminId: number,
    requestId: number,
    payload: {
      scheduled_at?: string
      status?: DonationRequest['status']
      destination?: DonationRequest['destination']
      notes?: string
    },
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.patch(`/donation-requests/${requestId}`, { admin_id: adminId, ...payload })
  },

  async approveDonationRequest(
    adminId: number,
    requestId: number,
    assessed_points: number,
    destination: DonationRequest['destination'],
    notes?: string,
  ): Promise<{ message: string; success: boolean; points_awarded: number; book_id: number }> {
    return apiClient.post(`/donation-requests/${requestId}/approve`, {
      admin_id: adminId,
      assessed_points,
      destination,
      notes,
    })
  },

  async rejectDonationRequest(
    adminId: number,
    requestId: number,
    notes?: string,
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.post(`/donation-requests/${requestId}/reject`, { admin_id: adminId, notes })
  },
}

export const rankingService = {
  async getRankings(): Promise<{
    by_points: RankingsByRole<RankingEntryPoints>
    by_donations: RankingsByRole<RankingEntryDonations>
  }> {
    return apiClient.get('/rankings')
  },
}

export const newBookStoreService = {
  async getNewBooks(): Promise<NewBook[]> {
    return apiClient.get<NewBook[]>('/new-books')
  },

  async createCatalogItem(
    adminId: number,
    payload: {
      title: string
      author: string
      release_date: string
      edition?: string
      description?: string
      cover_url?: string
      credits_cost: number
      stock: number
    },
  ): Promise<{ message: string; success: boolean }> {
    return apiClient.post('/new-books', {
      admin_id: adminId,
      ...payload,
    })
  },

  async getUserOrders(userId: number): Promise<NewBookOrder[]> {
    return apiClient.get<NewBookOrder[]>(`/users/${userId}/new-book-orders`)
  },

  async createOrder(
    userId: number,
    newBookId: number,
    scheduledPickupAt: string,
  ): Promise<{ message: string; success: boolean; credits_spent: number; scheduled_pickup_at: string }> {
    return apiClient.post('/new-book-orders', {
      user_id: userId,
      new_book_id: newBookId,
      scheduled_pickup_at: scheduledPickupAt,
    })
  },
}
