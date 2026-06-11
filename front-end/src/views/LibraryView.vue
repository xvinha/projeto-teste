<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { bookService, loanService, reservationService } from '@/services'
import { formatDate, getStatusLabel } from '@/utils'
import type { Book, Loan, Reservation } from '@/types'

const { user } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)

const books = ref<Book[]>([])
const activeLoans = ref<Loan[]>([])
const reservations = ref<Reservation[]>([])
const titleFilter = ref('')
const authorFilter = ref('')
const statusFilter = ref<string>('all')

const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    ;[books.value, activeLoans.value, reservations.value] = await Promise.all([
      bookService.getAllBooks(),
      user.value ? loanService.getUserLoans(user.value.id) : Promise.resolve([]),
      user.value ? reservationService.getUserReservations(user.value.id) : Promise.resolve([]),
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar livros'
  } finally {
    isLoading.value = false
  }
}

const filteredBooks = computed(() => {
  return books.value.filter((book) => {
    const matchesTitle =
      titleFilter.value === '' ||
      book.title.toLowerCase().includes(titleFilter.value.toLowerCase())
    const matchesAuthor =
      authorFilter.value === '' ||
      book.author.toLowerCase().includes(authorFilter.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || book.status === statusFilter.value
    return matchesTitle && matchesAuthor && matchesStatus
  })
})

const getActiveLoanForBook = (bookId: number): Loan | undefined => {
  return activeLoans.value.find((l) => l.book_id === bookId && !l.returned_at)
}

const hasReservationForBook = (bookId: number): boolean => {
  return reservations.value.some((r) => r.book_id === bookId)
}

const handleBorrow = async (bookId: number) => {
  if (!user.value) return
  try {
    await loanService.borrowBook(user.value.id, bookId)
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao pegar livro emprestado'
  }
}

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao devolver livro'
  }
}

const handleReserve = async (bookId: number) => {
  if (!user.value) return
  try {
    await reservationService.reserveBook(user.value.id, bookId)
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao reservar livro'
  }
}

const handleCancelReservation = async (bookId: number) => {
  if (!user.value) return
  try {
    await reservationService.cancelReservation(user.value.id, bookId)
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao cancelar reserva'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <AuthenticatedLayout>
    <section class="page-hero">
      <p class="eyebrow">Biblioteca</p>
      <h1 class="page-title">Explore o acervo disponível</h1>
      <p class="page-description">Filtre rapidamente por título, autor ou status e encontre o próximo livro para ler.</p>
    </section>

    <div class="card">
      <div v-if="error" class="callout">{{ error }}</div>

      <div class="filters-panel">
        <div class="filters-row">
          <label for="title">
            Título
            <input
              id="title"
              v-model="titleFilter"
              type="text"
              placeholder="Filtrar por título..."
            />
          </label>
          <label for="author">
            Autor
            <input
              id="author"
              v-model="authorFilter"
              type="text"
              placeholder="Filtrar por autor..."
            />
          </label>
          <label for="status">
            Status
            <select id="status" v-model="statusFilter">
              <option value="all">Todos</option>
              <option value="available">Disponível</option>
              <option value="lent">Emprestado</option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div class="section-grid" style="margin-top:1.5rem;">
      <div class="profile-card">
        <span class="profile-card-title">Total de livros</span>
        <strong>{{ filteredBooks.length }}</strong>
      </div>
      <div class="profile-card">
        <span class="profile-card-title">Status</span>
        <strong>{{ statusFilter === 'all' ? 'Todos' : statusFilter === 'available' ? 'Disponível' : 'Emprestado' }}</strong>
      </div>
    </div>

    <div class="book-grid" style="margin-top:1.75rem;">
      <div v-if="isLoading" class="callout">Carregando livros...</div>
      <div v-else-if="filteredBooks.length === 0" class="callout">Nenhum livro encontrado com os filtros selecionados.</div>

      <div v-else>
        <div v-for="book in filteredBooks" :key="book.id" class="book-card">
          <div>
            <div class="book-card-row">
              <h2>{{ book.title }}</h2>
              <span class="badge">{{ getStatusLabel(book.status) }}</span>
            </div>
            <p>{{ book.author }}</p>
            <p v-if="book.edition">Edição: {{ book.edition }}</p>
            <p>{{ formatDate(book.release_date) }}</p>
          </div>

          <div class="book-card-footer">
            <template v-if="getActiveLoanForBook(book.id)">
              <span class="status-note">Devolução até: {{ formatDate(getActiveLoanForBook(book.id)!.return_date) }}</span>
              <button type="button" class="btn secondary" @click="handleReturn(getActiveLoanForBook(book.id)!.id)">Devolver</button>
            </template>
            <template v-else-if="book.status === 'available'">
              <button type="button" class="btn" @click="handleBorrow(book.id)">Pedir Emprestado</button>
            </template>
            <template v-else>
              <span class="status-note">Indisponível no momento</span>
              <button
                v-if="hasReservationForBook(book.id)"
                type="button"
                class="btn secondary"
                @click="handleCancelReservation(book.id)"
              >
                Cancelar reserva
              </button>
              <button
                v-else
                type="button"
                class="btn secondary"
                @click="handleReserve(book.id)"
              >
                Reservar
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>
