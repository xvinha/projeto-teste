<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { loanService, reservationService, userService } from '@/services'
import { formatDate, formatPoints, getStatusLabel } from '@/utils'
import type { Loan, Reservation } from '@/types'

const { user } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)
const loans = ref<Loan[]>([])
const activeLoans = ref<Loan[]>([])
const returnedLoans = ref<Loan[]>([])
const reservations = ref<Reservation[]>([])
const showPasswordModal = ref(false)
const passwordForm = ref({ current: '', next: '', confirm: '' })
const passwordErrors = ref<Record<string, string>>({})
const passwordSuccess = ref(false)
const passwordSubmitting = ref(false)

const loadUserData = async () => {
  if (!user.value) return
  try {
    isLoading.value = true
    error.value = null
    const [userLoans, userReservations] = await Promise.all([
      loanService.getUserLoans(user.value.id),
      reservationService.getUserReservations(user.value.id),
    ])
    loans.value = userLoans
    activeLoans.value = userLoans.filter((l) => !l.returned_at)
    returnedLoans.value = userLoans.filter((l) => !!l.returned_at)
    reservations.value = userReservations
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar dados'
  } finally {
    isLoading.value = false
  }
}

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadUserData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao devolver livro'
  }
}

const handleCancelReservation = async (bookId: number) => {
  if (!user.value) return
  try {
    await reservationService.cancelReservation(user.value.id, bookId)
    await loadUserData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao cancelar reserva'
  }
}

const openPasswordModal = () => {
  passwordForm.value = { current: '', next: '', confirm: '' }
  passwordErrors.value = {}
  passwordSuccess.value = false
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
}

const validatePasswordForm = () => {
  passwordErrors.value = {}
  if (!passwordForm.value.current) {
    passwordErrors.value.current = 'Senha atual é obrigatória'
  }
  if (!passwordForm.value.next) {
    passwordErrors.value.next = 'Nova senha é obrigatória'
  } else if (passwordForm.value.next.length < 6) {
    passwordErrors.value.next = 'Nova senha deve ter pelo menos 6 caracteres'
  }
  if (!passwordForm.value.confirm) {
    passwordErrors.value.confirm = 'Confirmação de senha é obrigatória'
  } else if (passwordForm.value.next !== passwordForm.value.confirm) {
    passwordErrors.value.confirm = 'As senhas não coincidem'
  }
  return Object.keys(passwordErrors.value).length === 0
}

const handleChangePassword = async () => {
  if (!user.value || !validatePasswordForm()) return
  try {
    passwordSubmitting.value = true
    await userService.changePassword(user.value.id, passwordForm.value.current, passwordForm.value.next)
    passwordSuccess.value = true
    passwordForm.value = { current: '', next: '', confirm: '' }
    setTimeout(() => {
      closePasswordModal()
    }, 1800)
  } catch (err) {
    passwordErrors.value.submit =
      err instanceof Error && err.message.includes('incorrect')
        ? 'Senha atual incorreta'
        : 'Erro ao alterar senha'
  } finally {
    passwordSubmitting.value = false
  }
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const roleLabel: Record<string, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  donator: 'Doador',
  admin: 'Administrador',
}

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <AuthenticatedLayout>
    <!-- Hero do perfil -->
    <div class="profile-hero">
      <div class="profile-avatar">
        {{ user ? getInitials(user.name) : 'U' }}
      </div>
      <div class="profile-hero-info">
        <h2>{{ user?.name ?? 'Usuário' }}</h2>
        <p>{{ user?.email }} &bull; {{ roleLabel[user?.role ?? ''] ?? user?.role }}</p>
        <p>{{ user?.institution }}</p>
      </div>
      <div class="profile-hero-actions">
        <button type="button" class="btn" style="background: rgba(255,255,255,.2); border: 1.5px solid rgba(255,255,255,.4); color: #fff;" @click="openPasswordModal">
          Alterar senha
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-card-value">{{ formatPoints(user?.points ?? 0) }}</span>
        <span class="stat-card-label">Pontos</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ activeLoans.length }}</span>
        <span class="stat-card-label">Empréstimos ativos</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ reservations.length }}</span>
        <span class="stat-card-label">Reservas</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ returnedLoans.length }}</span>
        <span class="stat-card-label">Devolvidos</span>
      </div>
    </div>

    <!-- Info do usuário -->
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Informações da conta</div>
          <div class="card-subtitle">Dados do seu perfil na plataforma</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Instituição</span>
          <span class="info-value">{{ user?.institution ?? '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Perfil</span>
          <span class="info-value">{{ roleLabel[user?.role ?? ''] ?? user?.role }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Membro desde</span>
          <span class="info-value">{{ formatDate(user?.created_at ?? '') }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user?.email }}</span>
        </div>
      </div>
    </div>

    <!-- Empréstimos Ativos -->
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Empréstimos Ativos</div>
          <div class="card-subtitle">Livros que você está com no momento</div>
        </div>
        <span class="badge badge-green">{{ activeLoans.length }}</span>
      </div>
      <div v-if="isLoading" class="callout neutral">Carregando dados...</div>
      <div v-else-if="error" class="callout">{{ error }}</div>
      <div v-else-if="activeLoans.length === 0" class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p>Nenhum empréstimo ativo no momento.</p>
      </div>
      <div v-else class="section-grid">
        <div v-for="loan in activeLoans" :key="loan.id" class="profile-card">
          <span class="profile-card-title">Título</span>
          <strong>{{ loan.book_title }}</strong>
          <p>{{ loan.book_author }}</p>
          <p style="font-size: 0.8rem; color: var(--gray-500);">
            Devolução até <strong style="color: var(--gray-700);">{{ formatDate(loan.return_date) }}</strong>
          </p>
          <button type="button" class="btn secondary small" @click="handleReturn(loan.id)">
            Devolver
          </button>
        </div>
      </div>
    </div>

    <!-- Reservas -->
    <div v-if="reservations.length > 0" class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Reservas</div>
          <div class="card-subtitle">Livros reservados aguardando disponibilidade</div>
        </div>
        <span class="badge badge-gray">{{ reservations.length }}</span>
      </div>
      <div class="section-grid">
        <div v-for="reservation in reservations" :key="reservation.id" class="profile-card">
          <span class="profile-card-title">Título</span>
          <strong>{{ reservation.book_title }}</strong>
          <p>{{ reservation.book_author }}</p>
          <p style="font-size: 0.8rem; color: var(--gray-500);">
            Reservado em {{ formatDate(reservation.created_at) }}
          </p>
          <button type="button" class="btn secondary small" @click="handleCancelReservation(reservation.book_id)">
            Cancelar reserva
          </button>
        </div>
      </div>
    </div>

    <!-- Histórico -->
    <div v-if="returnedLoans.length > 0" class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Histórico de Empréstimos</div>
          <div class="card-subtitle">Livros já devolvidos</div>
        </div>
        <span class="badge badge-gray">{{ returnedLoans.length }}</span>
      </div>
      <div class="table-shell">
        <table class="table-view">
          <thead>
            <tr>
              <th>Livro</th>
              <th>Autor</th>
              <th>Devolvido em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in returnedLoans" :key="loan.id">
              <td>{{ loan.book_title }}</td>
              <td>{{ loan.book_author }}</td>
              <td>{{ formatDate(loan.returned_at!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Alterar senha -->
    <Teleport to="body">
      <div v-if="showPasswordModal" class="modal-backdrop" @click.self="closePasswordModal">
        <div class="modal-panel">
          <div class="modal-header">
            <span class="modal-title">Alterar senha</span>
            <button type="button" class="modal-close" @click="closePasswordModal">×</button>
          </div>
          <div v-if="passwordSuccess" class="callout info">
            Senha alterada com sucesso!
          </div>
          <form v-else @submit.prevent="handleChangePassword">
            <div v-if="passwordErrors.submit" class="callout">{{ passwordErrors.submit }}</div>
            <div class="form-group">
              <label for="current-password">Senha atual</label>
              <input id="current-password" v-model="passwordForm.current" type="password" placeholder="••••••••" />
              <span v-if="passwordErrors.current" class="status-note">{{ passwordErrors.current }}</span>
            </div>
            <div class="form-group">
              <label for="new-password">Nova senha</label>
              <input id="new-password" v-model="passwordForm.next" type="password" placeholder="••••••••" />
              <span v-if="passwordErrors.next" class="status-note">{{ passwordErrors.next }}</span>
            </div>
            <div class="form-group">
              <label for="confirm-new-password">Confirmar nova senha</label>
              <input id="confirm-new-password" v-model="passwordForm.confirm" type="password" placeholder="••••••••" />
              <span v-if="passwordErrors.confirm" class="status-note">{{ passwordErrors.confirm }}</span>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn">{{ passwordSubmitting ? 'Salvando...' : 'Salvar senha' }}</button>
              <button type="button" class="btn secondary" @click="closePasswordModal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AuthenticatedLayout>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-400);
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-800);
}
</style>
