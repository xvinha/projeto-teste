<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'
import { apiClient } from '@/services/api'
import { validateEmail } from '@/utils'

const router = useRouter()
const { login, error: authError } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string>>({})
const forgotPasswordOpen = ref(false)
const forgotEmail = ref('')
const forgotErrors = ref<Record<string, string>>({})
const forgotStatus = ref('')

const validateForm = () => {
  errors.value = {}

  if (!email.value.trim()) {
    errors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(email.value)) {
    errors.value.email = 'Email inválido'
  }

  if (!password.value) {
    errors.value.password = 'Senha é obrigatória'
  } else if (password.value.length < 6) {
    errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

const validateForgotPassword = () => {
  forgotErrors.value = {}
  forgotStatus.value = ''

  if (!forgotEmail.value.trim()) {
    forgotErrors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(forgotEmail.value)) {
    forgotErrors.value.email = 'Email inválido'
  }

  return Object.keys(forgotErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    await login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (err) {
    errors.value.submit = authError.value || 'Erro ao fazer login'
  }
}

const openForgotPassword = () => {
  forgotPasswordOpen.value = true
  forgotEmail.value = email.value
  forgotErrors.value = {}
  forgotStatus.value = ''
}

const closeForgotPassword = () => {
  forgotPasswordOpen.value = false
  forgotStatus.value = ''
  forgotErrors.value = {}
}

const handleForgotPassword = async () => {
  if (!validateForgotPassword()) return

  try {
    await apiClient.post('/forgot-password', { email: forgotEmail.value.trim() })
    forgotStatus.value = 'Se o email existir, enviaremos instruções para redefinir sua senha.'
  } catch {
    forgotStatus.value = 'Se o email existir, enviaremos instruções para redefinir sua senha.'
  }
}
</script>

<template>
  <main class="page-content">
    <section class="page-hero">
      <p class="eyebrow">Acesso rápido</p>
      <h1 class="page-title">Entrar na Estante Viva</h1>
      <p class="page-description">Use seu email e senha para gerenciar empréstimos, reservas e o seu perfil de biblioteca.</p>
    </section>

    <section class="form-panel">
      <h2 class="section-title">Login</h2>
      <p class="section-copy">Digite suas credenciais para continuar.</p>

      <div v-if="authError || errors.submit" class="callout" role="alert">
        {{ authError || errors.submit }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            :aria-invalid="errors.email ? 'true' : undefined"
          />
          <span v-if="errors.email" class="status-note">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            :aria-invalid="errors.password ? 'true' : undefined"
          />
          <span v-if="errors.password" class="status-note">{{ errors.password }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn">Entrar</button>
          <button type="button" class="btn secondary" @click="openForgotPassword">Esqueceu a senha?</button>
        </div>

        <div class="form-actions">
          <RouterLink to="/signup" class="btn secondary">Criar conta</RouterLink>
        </div>
      </form>
    </section>

    <div v-if="forgotPasswordOpen" class="modal-backdrop" @click.self="closeForgotPassword">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
          <h2 id="forgot-password-title">Recuperar senha</h2>
          <button class="modal-close" type="button" @click="closeForgotPassword">✕</button>
        </div>

        <p class="section-copy">Digite o email da sua conta para receber instruções de redefinição de senha.</p>

        <div v-if="forgotStatus" class="callout" role="status">{{ forgotStatus }}</div>

        <div class="form-group">
          <label for="forgotEmail">Email</label>
          <input
            id="forgotEmail"
            v-model="forgotEmail"
            type="email"
            placeholder="seu@email.com"
            :aria-invalid="forgotErrors.email ? 'true' : undefined"
          />
          <span v-if="forgotErrors.email" class="status-note">{{ forgotErrors.email }}</span>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn secondary" @click="closeForgotPassword">Cancelar</button>
          <button type="button" class="btn" @click="handleForgotPassword">Enviar link</button>
        </div>
      </div>
    </div>
  </main>
</template>
