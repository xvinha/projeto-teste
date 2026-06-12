<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { userService } from '@/services'
import { useAuth } from '@/services/auth'
import { formatDate } from '@/utils'
import type { User } from '@/types'

const { user: currentUser } = useAuth()
const users = ref<User[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const roleFilter = ref('all')
const isAddingUser = ref(false)
const isPasswordModalOpen = ref(false)
const selectedUser = ref<User | null>(null)
const passwordForm = ref({ password: '', confirm: '' })
const campusOptions = ['Veiga Barra', 'Veiga Tijuca', 'Veiga Botafogo', 'Veiga Cabo Frio'] as const

const newUser = ref({
  name: '',
  email: '',
  password: '',
  role: 'student' as 'student' | 'teacher' | 'donator' | 'admin',
  points: 0,
  campus: '' as (typeof campusOptions)[number] | ''
})

const loadUsers = async () => {
  try {
    isLoading.value = true
    users.value = await userService.getAllUsers()
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    isLoading.value = false
  }
}

const openPasswordModal = (user: User) => {
  selectedUser.value = user
  passwordForm.value = { password: '', confirm: '' }
  isPasswordModalOpen.value = true
}

const closePasswordModal = () => {
  isPasswordModalOpen.value = false
  selectedUser.value = null
  passwordForm.value = { password: '', confirm: '' }
}

const handleChangeUserPassword = async () => {
  if (!currentUser.value || !selectedUser.value) return

  if (passwordForm.value.password.length < 6) {
    alert('A nova senha deve ter pelo menos 6 caracteres')
    return
  }

  if (passwordForm.value.password !== passwordForm.value.confirm) {
    alert('As senhas nao coincidem')
    return
  }

  try {
    await userService.adminChangePassword(currentUser.value.id, selectedUser.value.id, passwordForm.value.password)
    closePasswordModal()
    alert('Senha atualizada com sucesso')
  } catch (error) {
    alert('Erro ao atualizar senha')
  }
}

const handleAddUser = async () => {
  try {
    await userService.createUser({
      ...newUser.value,
      created_at: new Date().toISOString()
    })
    isAddingUser.value = false
    newUser.value = {
      name: '',
      email: '',
      password: '',
      role: 'student',
      points: 0,
      campus: ''
    }
    await loadUsers()
  } catch (error) {
    alert('Erro ao criar usuário')
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchFilter.value.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchFilter.value.toLowerCase())
    const matchesRole = roleFilter.value === 'all' || u.role === roleFilter.value
    return matchesSearch && matchesRole
  })
})

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'admin': 'Administrador',
    'student': 'Estudante',
    'teacher': 'Professor',
    'donator': 'Doador'
  }
  return labels[role] || role
}

onMounted(loadUsers)
</script>

<template>
  <AdminLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuários</h1>
        <p class="page-description">Gerencie os usuários cadastrados no sistema.</p>
      </div>
      <button @click="isAddingUser = true" class="btn">
        <span>+</span> Novo Usuário
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <input 
        v-model="searchFilter" 
        type="text" 
        placeholder="Buscar por nome ou email..." 
        class="search-input"
      />
      <select v-model="roleFilter" class="role-select">
        <option value="all">Todos os cargos</option>
        <option value="admin">Administrador</option>
        <option value="student">Estudante</option>
        <option value="teacher">Professor</option>
        <option value="donator">Doador</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      Carregando usuários...
    </div>

    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Pontos</th>
            <th>Campus</th>
            <th>Cadastro</th>
            <th style="width: 160px;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div class="user-cell">
                <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                <span>{{ user.name }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge" :class="user.role === 'admin' ? 'badge-green' : 'badge-gray'">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>{{ user.points }}</td>
            <td>{{ user.campus }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button type="button" class="btn secondary small" @click="openPasswordModal(user)">
                Alterar senha
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-table">Nenhum usuário encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Adicionar Usuário -->
    <div v-if="isAddingUser" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Adicionar Novo Usuário</h2>
          <button @click="isAddingUser = false" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleAddUser" class="modal-form">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="newUser.name" type="text" required placeholder="Nome completo" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="newUser.email" type="email" required placeholder="email@exemplo.com" />
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input v-model="newUser.password" type="password" required placeholder="Senha (mínimo 6 caracteres)" minlength="6" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Cargo</label>
              <select v-model="newUser.role" required>
                <option value="student">Estudante</option>
                <option value="teacher">Professor</option>
                <option value="donator">Doador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div class="form-group">
              <label>Pontos Iniciais</label>
              <input v-model.number="newUser.points" type="number" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label>Campus</label>
            <select v-model="newUser.campus" required>
              <option value="" disabled>Selecione um campus</option>
              <option v-for="campus in campusOptions" :key="campus" :value="campus">
                {{ campus }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="isAddingUser = false" class="btn secondary">Cancelar</button>
            <button type="submit" class="btn">Salvar Usuário</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isPasswordModalOpen && selectedUser" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Alterar Senha</h2>
          <button @click="closePasswordModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleChangeUserPassword" class="modal-form">
          <div class="callout neutral" style="margin-bottom: 1rem;">
            Definindo nova senha para <strong>{{ selectedUser.name }}</strong>.
          </div>
          <div class="form-group">
            <label>Nova senha</label>
            <input
              v-model="passwordForm.password"
              type="password"
              required
              minlength="6"
              placeholder="Minimo de 6 caracteres"
            />
          </div>
          <div class="form-group">
            <label>Confirmar nova senha</label>
            <input
              v-model="passwordForm.confirm"
              type="password"
              required
              minlength="6"
              placeholder="Repita a nova senha"
            />
          </div>
          <div class="modal-actions">
            <button type="button" @click="closePasswordModal" class="btn secondary">Cancelar</button>
            <button type="submit" class="btn">Salvar nova senha</button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
}

.role-select {
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--green-100);
  color: var(--green-600);
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.badge-gray {
  background: var(--gray-100);
  color: var(--gray-600);
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 500px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>
