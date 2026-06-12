<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { donationRequestService } from '@/services'
import { getDefaultDonationScheduleValue, getDonationScheduleError } from '@/utils'

const router = useRouter()
const { user } = useAuth()

const isSubmitting = ref(false)
const success = ref<string | null>(null)
const error = ref<string | null>(null)

const scheduledAt = ref(getDefaultDonationScheduleValue())

const bookForm = ref({
  title: '',
  author: '',
  release_date: new Date().toISOString().split('T')[0],
  edition: '',
})

const handleSubmit = async () => {
  if (!user.value) return
  if (!bookForm.value.title || !bookForm.value.author || !bookForm.value.release_date) {
    error.value = 'Preencha todos os campos obrigatórios'
    return
  }

  const scheduleError = getDonationScheduleError(scheduledAt.value)
  if (scheduleError) {
    error.value = scheduleError
    return
  }

  try {
    isSubmitting.value = true
    error.value = null
    const result = await donationRequestService.createDonationRequest(user.value.id, {
      title: bookForm.value.title,
      author: bookForm.value.author,
      release_date: bookForm.value.release_date,
      edition: bookForm.value.edition || undefined,
      scheduled_at: scheduledAt.value,
    })
    success.value = result.message
    bookForm.value = {
      title: '',
      author: '',
      release_date: new Date().toISOString().split('T')[0],
      edition: '',
    }
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao enviar solicitação'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthenticatedLayout>
    <div class="page-hero">
      <p class="eyebrow">Contribua</p>
      <h1 class="page-title">Solicitar Doação</h1>
      <p class="page-description">
        Envie uma solicitação de doação e agende um horário com o bibliotecário para avaliação.
      </p>
    </div>

    <div class="form-container" style="max-width: 600px;">
      <div class="info-box" style="margin-bottom: 2rem;">
        <span style="font-size: 1.5rem; margin-right: 1rem;">🗓️</span>
        <div>
          <strong>Créditos por avaliação.</strong> O administrador registra a avaliação e define quantos créditos seu livro vale.
        </div>
      </div>

      <div v-if="success" class="callout" style="margin-bottom: 1.5rem; border-left-color: var(--green-500); background: rgba(34, 197, 94, 0.1);">
        {{ success }}
      </div>

      <div v-if="error" class="callout" style="margin-bottom: 1.5rem; border-left-color: var(--red-500); background: rgba(239, 68, 68, 0.1);">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="form-content">
        <div class="form-group">
          <label for="scheduled_at">Agendar horário *</label>
          <input
            id="scheduled_at"
            v-model="scheduledAt"
            type="datetime-local"
            step="1800"
            required
          />
          <small class="helper-text">Disponivel apenas de segunda a sabado, das 08:00 as 20:00.</small>
        </div>

        <div class="form-group">
          <label for="title">Título do livro *</label>
          <input
            id="title"
            v-model="bookForm.title"
            type="text"
            placeholder="Ex: O Senhor dos Anéis"
            required
          />
        </div>

        <div class="form-group">
          <label for="author">Autor *</label>
          <input
            id="author"
            v-model="bookForm.author"
            type="text"
            placeholder="Ex: J.R.R. Tolkien"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="release_date">Data de publicação *</label>
            <input
              id="release_date"
              v-model="bookForm.release_date"
              type="date"
              required
            />
          </div>

          <div class="form-group">
            <label for="edition">Edição (opcional)</label>
            <input
              id="edition"
              v-model="bookForm.edition"
              type="text"
              placeholder="Ex: 2ª edição"
            />
          </div>
        </div>

        <div class="form-actions" style="margin-top: 2rem;">
          <button type="button" class="btn secondary" @click="router.push('/dashboard')" :disabled="isSubmitting">
            Cancelar
          </button>
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enviando...' : 'Enviar solicitação' }}
          </button>
        </div>
      </form>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.form-container {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 2rem;
}

.info-box {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--green-50);
  border-radius: var(--radius-md);
  color: var(--green-800);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.helper-text {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
