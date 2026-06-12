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

const availableCount = computed(() => books.value.filter((b) => b.status === 'available').length)
const lentCount = computed(() => books.value.filter((b) => b.status === 'lent').length)

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
    <!-- Cabeçalho da página -->
    <div class="page-hero">
      <p class="eyebrow">Acervo</p>
      <h1 class="page-title">Biblioteca</h1>
      <p class="page-description">Explore o acervo completo, filtre por título, autor ou status e encontre seu próximo livro.</p>
    </div>

    <!-- Stats rápidas -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-card-value">{{ books.length }}</span>
        <span class="stat-card-label">Total de livros</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ availableCount }}</span>
        <span class="stat-card-label">Disponíveis</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ lentCount }}</span>
        <span class="stat-card-label">Emprestados</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ filteredBooks.length }}</span>
        <span class="stat-card-label">Resultados</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <input
        v-model="titleFilter"
        type="text"
        placeholder="Buscar por título..."
      />
      <input
        v-model="authorFilter"
        type="text"
        placeholder="Buscar por autor..."
        style="flex: 0.6; min-width: 160px;"
      />
      <select v-model="statusFilter" style="flex: 0; min-width: 150px;">
        <option value="all">Todos os status</option>
        <option value="available">Disponível</option>
        <option value="lent">Emprestado</option>
      </select>
    </div>

    <!-- Erro -->
    <div v-if="error" class="callout" style="margin-bottom: 1rem;">{{ error }}</div>

    <!-- Loading -->
    <div v-if="isLoading" class="callout neutral">Carregando livros...</div>

    <!-- Sem resultados -->
    <div v-else-if="filteredBooks.length === 0" class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p>Nenhum livro encontrado com os filtros selecionados.</p>
    </div>

    <!-- Grid de livros -->
    <div v-else class="book-grid">
      <div v-for="book in filteredBooks" :key="book.id" class="book-card">
        <!-- Cabeçalho do card -->
        <div class="book-card-header">
          <div class="book-card-icon">📖</div>
          <span
            class="badge"
            :class="book.status === 'available' ? 'badge-green' : 'badge-red'"
          >
            {{ getStatusLabel(book.status) }}
          </span>
        </div>

        <!-- Conteúdo -->
        <div>
          <h2>{{ book.title }}</h2>
          <p>{{ book.author }}</p>
          <p v-if="book.edition" style="font-size: 0.8rem; color: var(--gray-400);">
            {{ book.edition }}
          </p>
          <p style="font-size: 0.8rem; color: var(--gray-400); margin-top: 0.25rem;">
            {{ formatDate(book.release_date) }}
          </p>
        </div>

        <!-- Ações -->
        <div class="book-card-footer">
          <template v-if="getActiveLoanForBook(book.id)">
            <p style="font-size: 0.8rem; color: var(--gray-500);">
              Devolução até <strong>{{ formatDate(getActiveLoanForBook(book.id)!.return_date) }}</strong>
            </p>
            <button type="button" class="btn secondary small" @click="handleReturn(getActiveLoanForBook(book.id)!.id)">
              Devolver
            </button>
          </template>
          <template v-else-if="book.status === 'available'">
            <button type="button" class="btn small" @click="handleBorrow(book.id)">
              Pedir Emprestado
            </button>
          </template>
          <template v-else>
            <p style="font-size: 0.8rem; color: var(--gray-400);">Indisponível no momento</p>
            <button
              v-if="hasReservationForBook(book.id)"
              type="button"
              class="btn secondary small"
              @click="handleCancelReservation(book.id)"
            >
              Cancelar reserva
            </button>
            <button
              v-else
              type="button"
              class="btn outline-green small"
              @click="handleReserve(book.id)"
            >
              Reservar
            </button>
          </template>
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.book-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
</style>
