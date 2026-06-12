<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'
import { statsService } from '@/services'
import { validateEmail } from '@/utils'
import Logo from '@/components/common/Logo.vue'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const stats = ref({ books: 0, users: 0, loans: 0 })

const loadStats = async () => {
  try {
    stats.value = await statsService.getStats()
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err)
  }
}

onMounted(loadStats)

const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotSent = ref(false)

const validateForm = () => {
  errors.value = {}
  submitError.value = null
  if (!email.value.trim()) {
    errors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(email.value)) {
    errors.value.email = 'Email inválido'
  }
  if (!password.value) {
    errors.value.password = 'Senha é obrigatória'
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true
    await login({ email: email.value.trim(), password: password.value })
    router.push('/dashboard')
  } catch {
    submitError.value = 'Email ou senha inválidos. Verifique seus dados.'
  } finally {
    isSubmitting.value = false
  }
}

const openForgotPassword = () => { showForgotPassword.value = true }
const closeForgotPassword = () => {
  showForgotPassword.value = false
  forgotEmail.value = ''
  forgotSent.value = false
}
const handleForgotPassword = () => { forgotSent.value = true }
</script>

<template>
  <div class="auth-page">
    <!-- Lado esquerdo: banner verde -->
    <aside class="auth-side">
      <div class="auth-side-logo">
        <div class="auth-side-logo-img">
          <Logo />
        </div>
        <span class="auth-side-logo-text">Estante Viva</span>
      </div>
      <h2 class="auth-side-headline">
        Sua biblioteca<br>na palma da mão
      </h2>
      <p class="auth-side-sub">
        Acesse o acervo, faça empréstimos, acompanhe reservas e gerencie seu histórico de leituras com facilidade.
      </p>
      <div class="auth-side-stats">
        <div>
          <span class="auth-stat-value">{{ stats.books }}</span>
          <span class="auth-stat-label">Livros</span>
        </div>
        <div>
          <span class="auth-stat-value">{{ stats.users }}</span>
          <span class="auth-stat-label">Usuários</span>
        </div>
        <div>
          <span class="auth-stat-value">{{ stats.loans }}</span>
          <span class="auth-stat-label">Empréstimos</span>
        </div>
      </div>
    </aside>

    <!-- Lado direito: formulário -->
    <div class="auth-form-side">
      <div class="auth-form-card">
        <div class="auth-form-header">
          <h1>Bem-vindo de volta</h1>
          <p>Não tem conta? <RouterLink to="/signup">Cadastre-se grátis</RouterLink></p>
        </div>

        <div v-if="submitError" class="callout" role="alert">
          {{ submitError }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
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
              autocomplete="current-password"
            />
            <span v-if="errors.password" class="status-note">{{ errors.password }}</span>
          </div>

          <div style="text-align: right; margin-bottom: 1.25rem;">
            <button type="button" class="forgot-link" @click="openForgotPassword">
              Esqueceu a senha?
            </button>
          </div>

          <button type="submit" class="btn" style="width: 100%;">
            {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="auth-form-footer">
          Novo por aqui? <RouterLink to="/signup">Criar conta</RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal: Esqueci a senha -->
  <Teleport to="body">
    <div v-if="showForgotPassword" class="modal-backdrop" @click.self="closeForgotPassword">
      <div class="modal-panel">
        <div class="modal-header">
          <span class="modal-title">Recuperar senha</span>
          <button type="button" class="modal-close" @click="closeForgotPassword">×</button>
        </div>
        <div v-if="forgotSent" class="callout info">
          Se o email estiver cadastrado, você receberá as instruções em breve.
        </div>
        <template v-else>
          <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 1.25rem;">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>
          <div class="form-group">
            <label for="forgot-email">Email</label>
            <input id="forgot-email" v-model="forgotEmail" type="email" placeholder="seu@email.com" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn secondary" @click="closeForgotPassword">Cancelar</button>
            <button type="button" class="btn" @click="handleForgotPassword">Enviar link</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.forgot-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--green-600);
  cursor: pointer;
  font-weight: 600;
  box-shadow: none;
}
.forgot-link:hover {
  color: var(--green-500);
  background: none;
  box-shadow: none;
  transform: none;
}
</style>
