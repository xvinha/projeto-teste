import { ref, computed } from 'vue'
import type { User, LoginPayload } from '@/types'
import { apiClient } from './api'
import { userService } from './index'

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
        const parsed = JSON.parse(storedUser) as User & { institution?: string }
        user.value = {
          ...parsed,
          campus: parsed.campus ?? parsed.institution ?? '',
        }
      } catch {
        logout()
      }
    }
  }

  const refreshUser = async () => {
    if (!user.value) return
    try {
      const refreshedUser = await userService.getUser(user.value.id)
      user.value = refreshedUser
      localStorage.setItem('user', JSON.stringify(refreshedUser))
    } catch (err) {
      console.error('Failed to refresh user:', err)
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
    refreshUser,
  }
}
