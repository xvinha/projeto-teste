<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()

const handleLogout = () => {
  logout()
  router.push('/login')
}

const isActive = (path: string): boolean => {
  return route.path === path
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/dashboard" class="brand">
        Estante Viva<span class="brand-dot">•</span>
      </RouterLink>

      <nav class="nav-links" aria-label="Navegação principal">
        <RouterLink to="/dashboard" class="nav-link" :class="{ active: isActive('/dashboard') }">
          Perfil
        </RouterLink>
        <RouterLink to="/library" class="nav-link" :class="{ active: isActive('/library') }">
          Biblioteca
        </RouterLink>
      </nav>

      <div class="header-actions">
        <span class="signed-user">{{ user?.name ?? 'Usuário' }}</span>
        <button type="button" class="secondary small" @click="handleLogout">Sair</button>
      </div>
    </div>
  </header>
</template>
