import type { Router } from 'vue-router'
import { useAuth } from '@/services/auth'

export function setupRouteGuards(router: Router) {
  router.beforeEach((to, from) => {
    const { isAuthenticated, loadStoredUser } = useAuth()

    loadStoredUser()

    const isLoginPage = to.path === '/login'
    const requiresAuth = to.meta.requiresAuth !== false

    if (requiresAuth && !isAuthenticated.value) {
      return isLoginPage ? true : '/login'
    }

    if (isLoginPage && isAuthenticated.value) {
      return '/dashboard'
    }

    return true
  })
}
