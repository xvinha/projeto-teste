<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { newBookStoreService } from '@/services'
import { useAuth } from '@/services/auth'
import type { NewBook, NewBookOrder } from '@/types'
import {
  formatDate,
  formatDateTime,
  formatPoints,
  getDefaultPickupScheduleValue,
  getPickupScheduleError,
} from '@/utils'

const { user, refreshUser } = useAuth()

const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const newBooks = ref<NewBook[]>([])
const orders = ref<NewBookOrder[]>([])

const isModalOpen = ref(false)
const selectedBook = ref<NewBook | null>(null)
const scheduledPickupAt = ref(getDefaultPickupScheduleValue())
const modalError = ref<string | null>(null)

const loadData = async () => {
  if (!user.value) return

  try {
    isLoading.value = true
    error.value = null
    await refreshUser()
    const [catalog, userOrders] = await Promise.all([
      newBookStoreService.getNewBooks(),
      newBookStoreService.getUserOrders(user.value.id),
    ])
    newBooks.value = catalog
    orders.value = userOrders
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar livros novos'
  } finally {
    isLoading.value = false
  }
}

const availableBooks = computed(() => newBooks.value.filter((book) => book.stock > 0))

const canAffordSelectedBook = computed(() => {
  if (!selectedBook.value || !user.value) return false
  return user.value.points >= selectedBook.value.credits_cost
})

const openPurchaseModal = (book: NewBook) => {
  selectedBook.value = book
  scheduledPickupAt.value = getDefaultPickupScheduleValue()
  modalError.value = null
  success.value = null
  isModalOpen.value = true
}

const closePurchaseModal = () => {
  isModalOpen.value = false
  selectedBook.value = null
  scheduledPickupAt.value = getDefaultPickupScheduleValue()
  modalError.value = null
}

const handlePurchase = async () => {
  if (!user.value || !selectedBook.value) return

  const scheduleError = getPickupScheduleError(scheduledPickupAt.value)
  if (scheduleError) {
    modalError.value = scheduleError
    return
  }

  try {
    isSubmitting.value = true
    modalError.value = null
    const result = await newBookStoreService.createOrder(
      user.value.id,
      selectedBook.value.id,
      scheduledPickupAt.value,
    )
    success.value = `${result.message}. Retirada agendada para ${formatDateTime(result.scheduled_pickup_at)}.`
    await loadData()
    closePurchaseModal()
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : 'Erro ao concluir compra'
  } finally {
    isSubmitting.value = false
  }
}

const orderStatusLabel: Record<NewBookOrder['status'], string> = {
  scheduled: 'Agendado',
  completed: 'Retirado',
  cancelled: 'Cancelado',
}

onMounted(loadData)
</script>

<template>
  <AuthenticatedLayout>
    <div class="page-hero">
      <p class="eyebrow">Loja de Créditos</p>
      <h1 class="page-title">Livros Novos</h1>
      <p class="page-description">
        Use seus créditos para escolher um livro novo, confirmar a compra e agendar a retirada.
      </p>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-card-value">{{ formatPoints(user?.points ?? 0) }}</span>
        <span class="stat-card-label">Créditos disponíveis</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ newBooks.length }}</span>
        <span class="stat-card-label">Livros no catálogo</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ availableBooks.length }}</span>
        <span class="stat-card-label">Prontos para compra</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ orders.length }}</span>
        <span class="stat-card-label">Retiradas agendadas</span>
      </div>
    </div>

    <div v-if="success" class="callout" style="margin-bottom: 1rem; border-left-color: var(--green-500); background: rgba(34, 197, 94, 0.1);">
      {{ success }}
    </div>

    <div v-if="error" class="callout" style="margin-bottom: 1rem;">
      {{ error }}
    </div>

    <div v-if="isLoading" class="callout neutral">Carregando catálogo...</div>

    <div v-else-if="newBooks.length === 0" class="empty-state">
      <div class="empty-state-icon">🛍️</div>
      <p>Nenhum livro novo disponível no momento.</p>
    </div>

    <div v-else class="store-grid">
      <article v-for="book in newBooks" :key="book.id" class="store-card">
        <div
          class="store-cover"
          :style="book.cover_url ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.25)), url(${book.cover_url})` } : undefined"
        >
          <span class="badge" :class="book.stock > 0 ? 'badge-green' : 'badge-red'">
            {{ book.stock > 0 ? `${book.stock} em estoque` : 'Esgotado' }}
          </span>
        </div>

        <div class="store-content">
          <div>
            <h2>{{ book.title }}</h2>
            <p class="book-author">{{ book.author }}</p>
            <p v-if="book.edition" class="book-meta">{{ book.edition }}</p>
            <p class="book-meta">Lançamento: {{ formatDate(book.release_date) }}</p>
            <p v-if="book.description" class="book-description">{{ book.description }}</p>
          </div>

          <div class="store-footer">
            <div>
              <strong class="price-tag">{{ book.credits_cost }} créditos</strong>
              <p class="book-meta">Retirada somente de segunda a sábado, das 08:00 às 20:00.</p>
            </div>

            <button
              type="button"
              class="btn"
              :disabled="book.stock <= 0 || (user?.points ?? 0) < book.credits_cost"
              @click="openPurchaseModal(book)"
            >
              {{ (user?.points ?? 0) < book.credits_cost ? 'Créditos insuficientes' : 'Comprar e agendar' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Minhas Retiradas</div>
          <div class="card-subtitle">Acompanhe os livros comprados com créditos e o horário agendado.</div>
        </div>
      </div>

      <div v-if="orders.length === 0" class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>Você ainda não agendou a retirada de nenhum livro novo.</p>
      </div>

      <div v-else class="table-shell">
        <table class="table-view">
          <thead>
            <tr>
              <th>Livro</th>
              <th>Créditos</th>
              <th>Retirada</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>
                <strong>{{ order.book_title }}</strong>
                <div style="font-size: 0.85rem; color: var(--gray-500);">{{ order.book_author }}</div>
              </td>
              <td>{{ order.credits_spent }}</td>
              <td>{{ formatDateTime(order.scheduled_pickup_at) }}</td>
              <td>
                <span
                  class="badge"
                  :class="order.status === 'scheduled' ? 'badge-green' : order.status === 'cancelled' ? 'badge-red' : 'badge-gray'"
                >
                  {{ orderStatusLabel[order.status] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen && selectedBook" class="modal-backdrop" @click.self="closePurchaseModal">
        <div class="modal-panel">
          <div class="modal-header">
            <div>
              <h2>Confirmar compra</h2>
              <p class="modal-subtitle">Escolha o horário para retirar seu livro novo.</p>
            </div>
            <button type="button" class="modal-close" @click="closePurchaseModal">×</button>
          </div>

          <div class="modal-body">
            <div class="callout neutral" style="margin-bottom: 1rem;">
              <strong>{{ selectedBook.title }}</strong> — {{ selectedBook.author }}<br />
              Custo: {{ selectedBook.credits_cost }} créditos
            </div>

            <div
              v-if="modalError"
              class="callout"
              style="margin-bottom: 1rem; border-left-color: var(--red-500); background: rgba(239, 68, 68, 0.1);"
            >
              {{ modalError }}
            </div>

            <div class="form-group">
              <label for="scheduledPickupAt">Agendar retirada</label>
              <input id="scheduledPickupAt" v-model="scheduledPickupAt" type="datetime-local" step="1800" />
              <small class="helper-text">Disponível apenas de segunda a sábado, das 08:00 às 20:00.</small>
            </div>

            <div class="summary-box">
              <div class="summary-row">
                <span>Seus créditos atuais</span>
                <strong>{{ formatPoints(user?.points ?? 0) }}</strong>
              </div>
              <div class="summary-row">
                <span>Custo do livro</span>
                <strong>{{ selectedBook.credits_cost }}</strong>
              </div>
              <div class="summary-row">
                <span>Saldo após compra</span>
                <strong>{{ formatPoints((user?.points ?? 0) - selectedBook.credits_cost) }}</strong>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn secondary" @click="closePurchaseModal" :disabled="isSubmitting">
                Cancelar
              </button>
              <button
                type="button"
                class="btn"
                @click="handlePurchase"
                :disabled="isSubmitting || !canAffordSelectedBook"
              >
                {{ isSubmitting ? 'Finalizando...' : 'Confirmar compra' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AuthenticatedLayout>
</template>

<style scoped>
.store-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.store-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.store-cover {
  min-height: 180px;
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  background:
    linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(22, 163, 74, 0.95));
  background-size: cover;
  background-position: center;
}

.store-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.book-author {
  margin-top: 0.25rem;
  color: var(--gray-700);
  font-weight: 600;
}

.book-meta {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.book-description {
  margin-top: 0.75rem;
  color: var(--gray-600);
  line-height: 1.55;
}

.store-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  margin-top: auto;
}

.price-tag {
  font-size: 1.125rem;
  color: var(--green-700);
}

.modal-subtitle {
  color: var(--gray-500);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.helper-text {
  display: block;
  margin-top: 0.5rem;
  color: var(--gray-500);
  font-size: 0.875rem;
}

.summary-box {
  margin-top: 1rem;
  background: var(--green-50);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--gray-700);
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 1000;
}

.modal-panel {
  width: 100%;
  max-width: 560px;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-400);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 1rem;
}
</style>
