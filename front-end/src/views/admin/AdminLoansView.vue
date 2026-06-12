<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { loanService, userService, bookService } from '@/services'
import { formatDate } from '@/utils'
import type { Loan, User, Book } from '@/types'

const loans = ref<Loan[]>([])
const users = ref<User[]>([])
const books = ref<Book[]>([])
const isLoading = ref(true)
const statusFilter = ref('active')

const loadData = async () => {
  try {
    isLoading.value = true
    const [l, u, b] = await Promise.all([
      loanService.getAllLoans(),
      userService.getAllUsers(),
      bookService.getAllBooks()
    ])
    loans.value = l
    users.value = u
    books.value = b
  } catch (error) {
    console.error('Erro ao carregar empréstimos:', error)
  } finally {
    isLoading.value = false
  }
}

const getUserName = (userId: number) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.name : `Usuário #${userId}`
}

const getBookTitle = (bookId: number) => {
  const book = books.value.find(b => b.id === bookId)
  return book ? book.title : `Livro #${bookId}`
}

const filteredLoans = computed(() => {
  return loans.value.filter(l => {
    if (statusFilter.value === 'active') return !l.returned_at
    if (statusFilter.value === 'returned') return !!l.returned_at
    return true
  })
})

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadData()
  } catch (error) {
    alert('Erro ao devolver livro')
  }
}

const isLate = (returnDate: string) => {
  return new Date(returnDate) < new Date()
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Empréstimos</h1>
        <p class="page-description">Acompanhe e gerencie todos os empréstimos realizados.</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <select v-model="statusFilter" class="status-select">
        <option value="active">Apenas Ativos</option>
        <option value="returned">Apenas Devolvidos</option>
        <option value="all">Todos os Registros</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      Carregando empréstimos...
    </div>

    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Usuário</th>
            <th>Data de Devolução</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in filteredLoans" :key="loan.id">
            <td>
              <div class="book-info">
                <span class="book-title">{{ getBookTitle(loan.book_id) }}</span>
              </div>
            </td>
            <td>{{ getUserName(loan.user_id) }}</td>
            <td>
              <div :class="{ 'text-red': !loan.returned_at && isLate(loan.return_date) }">
                {{ formatDate(loan.return_date) }}
                <span v-if="!loan.returned_at && isLate(loan.return_date)" class="late-tag">Atrasado</span>
              </div>
            </td>
            <td>
              <span v-if="loan.returned_at" class="badge badge-gray">
                Devolvido em {{ formatDate(loan.returned_at) }}
              </span>
              <span v-else class="badge badge-green">
                Em posse
              </span>
            </td>
            <td>
              <button 
                v-if="!loan.returned_at" 
                @click="handleReturn(loan.id!)" 
                class="btn secondary small"
              >
                Registrar Devolução
              </button>
              <span v-else>-</span>
            </td>
          </tr>
          <tr v-if="filteredLoans.length === 0">
            <td colspan="5" class="empty-table">Nenhum empréstimo encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.filters-bar {
  margin-bottom: 1.5rem;
}

.status-select {
  width: 200px;
}

.table-container {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background: var(--gray-50);
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--gray-500);
  border-bottom: 1px solid var(--gray-200);
}

.admin-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.book-title {
  font-weight: 600;
  color: var(--gray-900);
}

.badge-gray {
  background: var(--gray-100);
  color: var(--gray-600);
}

.text-red {
  color: #ef4444;
  font-weight: 600;
}

.late-tag {
  font-size: 0.7rem;
  background: #fef2f2;
  color: #ef4444;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  text-transform: uppercase;
}

.empty-table {
  text-align: center;
  padding: 3rem !important;
  color: var(--gray-500);
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--gray-500);
}
</style>
