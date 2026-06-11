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

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <AuthenticatedLayout>
    <section class="page-hero">
      <p class="eyebrow">Perfil</p>
      <h1 class="page-title">Sua conta Estante Viva</h1>
      <p class="page-description">Confira seus dados pessoais, empréstimos ativos, reservas e histórico.</p>
    </section>

    <div class="card">
      <div class="book-card-row" style="margin-bottom:1rem; align-items:center;">
        <div>
          <h2 class="section-title">Informações Pessoais</h2>
          <p class="section-copy">Mantenha seu perfil atualizado e acompanhe a atividade da biblioteca.</p>
        </div>
        <button type="button" class="btn secondary small" @click="openPasswordModal">Alterar senha</button>
      </div>

      <div v-if="error" class="callout">{{ error }}</div>

      <div class="section-grid">
        <div class="profile-card">
          <span class="profile-card-title">Nome</span>
          <strong>{{ user?.name }}</strong>
        </div>
        <div class="profile-card">
          <span class="profile-card-title">Email</span>
          <strong>{{ user?.email }}</strong>
        </div>
        <div class="profile-card">
          <span class="profile-card-title">Instituição</span>
          <strong>{{ user?.institution }}</strong>
        </div>
        <div class="profile-card">
          <span class="profile-card-title">Função</span>
          <strong>{{ getStatusLabel(user?.role) }}</strong>
        </div>
        <div class="profile-card">
          <span class="profile-card-title">Pontos</span>
          <strong>{{ formatPoints(user?.points ?? 0) }}</strong>
        </div>
        <div class="profile-card">
          <span class="profile-card-title">Membro desde</span>
          <strong>{{ formatDate(user?.created_at ?? '') }}</strong>
        </div>
      </div>
    </div>

    <div class="section-grid" style="margin-top:1.75rem;">
      <div class="profile-card">
        <span class="profile-card-title">Empréstimos ativos</span>
        <strong>{{ activeLoans.length }}</strong>
      </div>
      <div class="profile-card">
        <span class="profile-card-title">Reservas</span>
        <strong>{{ reservations.length }}</strong>
      </div>
      <div class="profile-card">
        <span class="profile-card-title">Histórico</span>
        <strong>{{ returnedLoans.length }}</strong>
      </div>
    </div>

    <div class="card" style="margin-top:1.75rem;">
      <div class="section-title" style="margin-bottom:1rem;">Empréstimos Ativos</div>
      <div v-if="isLoading" class="callout">Carregando dados...</div>
      <div v-else-if="activeLoans.length === 0" class="callout">Nenhum empréstimo ativo no momento.</div>
      <div v-else class="section-grid">
        <div v-for="loan in activeLoans" :key="loan.id" class="profile-card">
          <span class="profile-card-title">{{ loan.book_title }}</span>
          <strong>{{ loan.book_author }}</strong>
          <p>Devolução até {{ formatDate(loan.return_date) }}</p>
          <button type="button" class="btn secondary small" @click="handleReturn(loan.id)">Devolver</button>
        </div>
      </div>
    </div>

    <div v-if="reservations.length > 0" class="card" style="margin-top:1.75rem;">
      <div class="section-title" style="margin-bottom:1rem;">Reservas</div>
      <div class="section-grid">
        <div v-for="reservation in reservations" :key="reservation.id" class="profile-card">
          <span class="profile-card-title">{{ reservation.book_title }}</span>
          <strong>{{ reservation.book_author }}</strong>
          <p>Reservado em {{ formatDate(reservation.created_at) }}</p>
          <button type="button" class="btn secondary small" @click="handleCancelReservation(reservation.book_id)">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="returnedLoans.length > 0" class="card" style="margin-top:1.75rem;">
      <div class="section-title" style="margin-bottom:1rem;">Histórico de Empréstimos</div>
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

    <Teleport to="body">
      <div v-if="showPasswordModal" class="modal-backdrop" @click.self="closePasswordModal">
        <div class="modal-panel">
          <div class="modal-header">
            <span class="modal-title">Alterar senha</span>
            <button type="button" class="modal-close" @click="closePasswordModal">×</button>
          </div>

          <div v-if="passwordSuccess" class="callout">Senha alterada com sucesso!</div>

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
              <button type="submit" class="btn">{{ passwordSubmitting ? 'Salvando...' : 'Salvar' }}</button>
              <button type="button" class="btn secondary" @click="closePasswordModal">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AuthenticatedLayout>
</template>
