<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '@/services/api'
import { validateEmail } from '@/utils'

const router = useRouter()

const email = ref('')
const name = ref('')
const password = ref('')
const passwordConfirm = ref('')
const institution = ref('')
const role = ref<'student' | 'teacher' | 'donator'>('student')
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const validateForm = () => {
  errors.value = {}
  submitError.value = null

  if (!email.value.trim()) {
    errors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(email.value)) {
    errors.value.email = 'Email inválido'
  }

  if (!name.value.trim()) {
    errors.value.name = 'O nome é obrigatório'
  }

  if (!institution.value.trim()) {
    errors.value.institution = 'Instituição é obrigatória'
  }

  if (!password.value) {
    errors.value.password = 'Senha é obrigatória'
  } else if (password.value.length < 6) {
    errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
  }

  if (!passwordConfirm.value) {
    errors.value.passwordConfirm = 'Confirmação de senha é obrigatória'
  } else if (password.value !== passwordConfirm.value) {
    errors.value.passwordConfirm = 'As senhas não coincidem'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (isSubmitting.value) return

  try {
    isSubmitting.value = true

    await apiClient.post('/users', {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      institution: institution.value.trim(),
      role: role.value,
      points: 0,
      created_at: new Date().toISOString(),
    })

    router.push('/login')
  } catch {
    submitError.value = 'Erro ao criar conta. Verifique se o email já está em uso.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="page-content">
    <section class="page-hero">
      <p class="eyebrow">Comece agora</p>
      <h1 class="page-title">Crie sua conta na Estante Viva</h1>
      <p class="page-description">Registre-se para emprestar livros, acompanhar reservas e gerenciar seu perfil da biblioteca.</p>
    </section>

    <section class="form-panel">
      <h2 class="section-title">Cadastro</h2>
      <p class="section-copy">Preencha os dados abaixo para criar sua conta.</p>

      <div v-if="submitError" class="callout" role="alert">
        {{ submitError }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="seu@email.com" />
          <span v-if="errors.email" class="status-note">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="name">Nome</label>
          <input id="name" v-model="name" type="text" placeholder="Seu nome completo" />
          <span v-if="errors.name" class="status-note">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="institution">Instituição</label>
          <input id="institution" v-model="institution" type="text" placeholder="Nome da instituição" />
          <span v-if="errors.institution" class="status-note">{{ errors.institution }}</span>
        </div>

        <div class="form-group">
          <label for="role">Perfil</label>
          <select id="role" v-model="role">
            <option value="student">Aluno</option>
            <option value="teacher">Professor</option>
            <option value="donator">Doador</option>
          </select>
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••" />
          <span v-if="errors.password" class="status-note">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="passwordConfirm">Confirmar senha</label>
          <input id="passwordConfirm" v-model="passwordConfirm" type="password" placeholder="••••••••" />
          <span v-if="errors.passwordConfirm" class="status-note">{{ errors.passwordConfirm }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn">{{ isSubmitting ? 'Criando...' : 'Criar conta' }}</button>
          <RouterLink to="/login" class="btn secondary">Já tenho conta</RouterLink>
        </div>
      </form>
    </section>
  </main>
</template>
