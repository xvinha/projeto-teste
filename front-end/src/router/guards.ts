import type { Router } from 'vue-router'
import { useAuth } from '@/services/auth'

export function setupRouteGuards(router: Router) {
  router.beforeEach((to, from) => {
    const { isAuthenticated, user, loadStoredUser } = useAuth()

    loadStoredUser()

    const isLoginPage = to.path === '/login'
    const requiresAuth = to.meta.requiresAuth !== false
    const requiresAdmin = to.meta.requiresAdmin === true

    if (requiresAuth && !isAuthenticated.value) {
      return isLoginPage ? true : '/login'
    }

    if (requiresAdmin && user.value?.role !== 'admin') {
      return '/dashboard'
    }

    if (isLoginPage && isAuthenticated.value) {
      return '/dashboard'
    }

    return true
  })
}
