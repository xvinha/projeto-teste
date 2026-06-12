<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { userService, bookService, loanService } from '@/services'
import type { User, Book, Loan } from '@/types'

const users = ref<User[]>([])
const books = ref<Book[]>([])
const loans = ref<Loan[]>([])
const isLoading = ref(true)

const loadData = async () => {
  try {
    isLoading.value = true
    const [u, b, l] = await Promise.all([
      userService.getAllUsers(),
      bookService.getAllBooks(),
      loanService.getAllLoans()
    ])
    users.value = u
    books.value = b
    loans.value = l
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

const activeLoansCount = computed(() => loans.value.filter(l => !l.returned_at).length)
const availableBooksCount = computed(() => books.value.filter(b => b.status === 'available').length)
const lateLoansCount = computed(() => {
  const now = new Date()
  return loans.value.filter(l => !l.returned_at && new Date(l.return_date) < now).length
})

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="dashboard-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-description">Visão geral do sistema Estante Viva.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      Carregando estatísticas...
    </div>

    <div v-else>
      <!-- KPIs -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-label">Total de Usuários</span>
            <span class="stat-value">{{ users.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <span class="stat-label">Total de Livros</span>
            <span class="stat-value">{{ books.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🤝</div>
          <div class="stat-info">
            <span class="stat-label">Empréstimos Ativos</span>
            <span class="stat-value">{{ activeLoansCount }}</span>
          </div>
        </div>

        <div class="stat-card" :class="{ 'warning': lateLoansCount > 0 }">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <span class="stat-label">Empréstimos Atrasados</span>
            <span class="stat-value">{{ lateLoansCount }}</span>
          </div>
        </div>
      </div>

      <!-- Outras métricas -->
      <div class="metrics-row">
        <div class="metric-box">
          <h3>Disponibilidade de Acervo</h3>
          <div class="progress-bar-container">
            <div 
              class="progress-bar" 
              :style="{ width: `${(availableBooksCount / books.length) * 100}%` }"
            ></div>
          </div>
          <p class="metric-detail">
            {{ availableBooksCount }} de {{ books.length }} livros estão disponíveis para empréstimo.
          </p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.dashboard-header {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--white);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border: 1px solid var(--gray-100);
}

.stat-card.warning {
  border-left: 4px solid #ef4444;
}

.stat-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  background: var(--green-50);
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
}

.stat-card.warning .stat-icon {
  background: #fef2f2;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-500);
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.metric-box {
  background: var(--white);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-100);
}

.metric-box h3 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: var(--gray-800);
}

.progress-bar-container {
  height: 12px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 100%;
  background: var(--green-600);
  border-radius: var(--radius-full);
  transition: width 0.5s ease-out;
}

.metric-detail {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--gray-500);
}
</style>
