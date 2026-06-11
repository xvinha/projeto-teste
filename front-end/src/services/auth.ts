import { ref, computed } from 'vue'
import type { User, LoginPayload } from '@/types'
import { apiClient } from './api'

const user = ref<User | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  const login = async (payload: LoginPayload) => {
    isLoading.value = true
    error.value = null

    try {
      const found = await apiClient.post<User>('/login', payload)

      user.value = found
      localStorage.setItem('user', JSON.stringify(found))

      return found
    } catch (err) {
      error.value = 'Email ou senha inválidos'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    error.value = null
  }

  const loadStoredUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        logout()
      }
    }
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    logout,
    loadStoredUser,
  }
}
