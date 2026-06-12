<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { donationRequestService, userService } from '@/services'
import { useAuth } from '@/services/auth'
import { formatDate, getDonationScheduleError } from '@/utils'
import type { DonationRequest, User } from '@/types'

const { user } = useAuth()

const requests = ref<DonationRequest[]>([])
const users = ref<User[]>([])
const isLoading = ref(true)
const statusFilter = ref<'all' | DonationRequest['status']>('all')
const searchFilter = ref('')

const isModalOpen = ref(false)
const selected = ref<DonationRequest | null>(null)
const scheduledAt = ref('')
const assessedPoints = ref<number>(0)
const notes = ref('')
const destination = ref<DonationRequest['destination']>('library')
const modalError = ref<string | null>(null)

const loadData = async () => {
  if (!user.value) return
  try {
    isLoading.value = true
    const [r, u] = await Promise.all([
      donationRequestService.getAllDonationRequests(user.value.id),
      userService.getAllUsers(),
    ])
    requests.value = r
    users.value = u
  } catch (err) {
    console.error('Erro ao carregar solicitações de doação:', err)
  } finally {
    isLoading.value = false
  }
}

const getUserName = (userId: number) => {
  const u = users.value.find((x) => x.id === userId)
  return u ? u.name : `Usuário #${userId}`
}

const statusLabel: Record<DonationRequest['status'], string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  rejected: 'Rejeitado',
  completed: 'Concluído',
}

const filteredRequests = computed(() => {
  const search = searchFilter.value.trim().toLowerCase()
  return requests.value.filter((r) => {
    const matchesStatus = statusFilter.value === 'all' || r.status === statusFilter.value
    if (!search) return matchesStatus
    const userName = getUserName(r.user_id).toLowerCase()
    const matchesSearch =
      r.title.toLowerCase().includes(search) ||
      r.author.toLowerCase().includes(search) ||
      userName.includes(search)
    return matchesStatus && matchesSearch
  })
})

const openModal = (request: DonationRequest) => {
  selected.value = request
  isModalOpen.value = true
  scheduledAt.value = (request.scheduled_at || '').slice(0, 16)
  assessedPoints.value = request.assessed_points ?? 0
  notes.value = request.notes ?? ''
  destination.value = request.destination ?? 'library'
  modalError.value = null
}

const closeModal = () => {
  isModalOpen.value = false
  selected.value = null
  scheduledAt.value = ''
  assessedPoints.value = 0
  notes.value = ''
  destination.value = 'library'
  modalError.value = null
}

const handleSave = async () => {
  if (!user.value || !selected.value) return

  const scheduleError = getDonationScheduleError(scheduledAt.value)
  if (scheduleError) {
    modalError.value = scheduleError
    return
  }

  try {
    modalError.value = null
    await donationRequestService.updateDonationRequest(user.value.id, selected.value.id, {
      scheduled_at: scheduledAt.value || undefined,
      status: selected.value.status === 'pending' ? 'scheduled' : selected.value.status,
      destination: destination.value,
      notes: notes.value || undefined,
    })
    await loadData()
    closeModal()
  } catch (err) {
    modalError.value = err instanceof Error ? err.message : 'Erro ao salvar alteracoes'
  }
}

const handleApprove = async () => {
  if (!user.value || !selected.value) return
  try {
    await donationRequestService.approveDonationRequest(
      user.value.id,
      selected.value.id,
      Number(assessedPoints.value),
      destination.value,
      notes.value || undefined,
    )
    await loadData()
    closeModal()
  } catch (err) {
    alert('Erro ao aprovar solicitação')
  }
}

const handleReject = async () => {
  if (!user.value || !selected.value) return
  try {
    await donationRequestService.rejectDonationRequest(user.value.id, selected.value.id, notes.value || undefined)
    await loadData()
    closeModal()
  } catch (err) {
    alert('Erro ao rejeitar solicitação')
  }
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Doações</h1>
        <p class="page-description">Gerencie solicitações, agendamentos e avaliação de créditos.</p>
      </div>
    </div>

    <div class="filters-bar">
      <input v-model="searchFilter" type="text" placeholder="Buscar por livro ou usuário..." />
      <select v-model="statusFilter" class="status-select">
        <option value="all">Todos</option>
        <option value="pending">Pendentes</option>
        <option value="scheduled">Agendados</option>
        <option value="completed">Concluídos</option>
        <option value="rejected">Rejeitados</option>
      </select>
    </div>

    <div v-if="isLoading" class="callout neutral">Carregando solicitações...</div>

    <div v-else class="table-shell">
      <table class="table-view">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Usuário</th>
            <th>Agendado</th>
            <th>Status</th>
            <th>Destino</th>
            <th>Créditos</th>
            <th style="width: 120px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRequests" :key="r.id">
            <td>
              <strong>{{ r.title }}</strong>
              <div style="font-size: 0.85rem; color: var(--gray-500);">{{ r.author }}</div>
            </td>
            <td>{{ getUserName(r.user_id) }}</td>
            <td>{{ formatDate(r.scheduled_at) }}</td>
            <td>
              <span
                class="badge"
                :class="r.status === 'completed' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-gray'"
              >
                {{ statusLabel[r.status] }}
              </span>
            </td>
            <td>
              <span class="badge" :class="r.destination === 'sale' ? 'badge-green' : 'badge-gray'">
                {{ r.destination === 'sale' ? 'Venda' : 'Biblioteca' }}
              </span>
            </td>
            <td>
              <span v-if="r.status === 'completed' && r.assessed_points !== null" style="color: var(--green-600); font-weight: 600;">
                +{{ r.assessed_points }}
              </span>
              <span v-else>—</span>
            </td>
            <td>
              <button type="button" class="btn secondary small" @click="openModal(r)">Gerir</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredRequests.length === 0" class="empty-state" style="padding: 2rem;">
        <div class="empty-state-icon">📭</div>
        <p>Nenhuma solicitação encontrada com os filtros atuais.</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen && selected" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Gerir Solicitação</h2>
            <button type="button" class="close-btn" @click="closeModal">×</button>
          </div>

          <div class="modal-form">
            <div class="callout neutral" style="margin-bottom: 1rem;">
              <strong>{{ selected.title }}</strong> — {{ selected.author }}<br />
              Usuário: {{ getUserName(selected.user_id) }}
            </div>

            <div
              v-if="modalError"
              class="callout"
              style="margin-bottom: 1rem; border-left-color: var(--red-500); background: rgba(239, 68, 68, 0.1);"
            >
              {{ modalError }}
            </div>

            <div class="form-group">
              <label for="scheduledAt">Agendamento</label>
              <input id="scheduledAt" v-model="scheduledAt" type="datetime-local" step="1800" />
              <small class="helper-text">Aceite apenas de segunda a sabado, das 08:00 as 20:00.</small>
            </div>

            <div class="form-group">
              <label for="assessedPoints">Créditos (definidos pelo bibliotecário)</label>
              <input id="assessedPoints" v-model.number="assessedPoints" type="number" min="0" />
            </div>

            <div class="form-group">
              <label for="destination">Destino do livro aprovado</label>
              <select id="destination" v-model="destination">
                <option value="library">Biblioteca / empréstimo</option>
                <option value="sale">Venda</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes">Observações</label>
              <input id="notes" v-model="notes" type="text" placeholder="Opcional" />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn secondary" @click="handleSave">Salvar</button>
              <button
                type="button"
                class="btn outline-green"
                @click="handleReject"
                :disabled="selected.status === 'completed'"
              >
                Rejeitar
              </button>
              <button
                type="button"
                class="btn"
                @click="handleApprove"
                :disabled="selected.status === 'completed' || selected.status === 'rejected'"
              >
                Aprovar e Creditar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 540px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: var(--gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.helper-text {
  display: block;
  margin-top: 0.5rem;
  color: var(--gray-500);
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
}

.form-group select {
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>
