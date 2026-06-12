<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/services/auth'
import Logo from '@/components/common/Logo.vue'

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
        <div class="brand-logo">
          <Logo />
        </div>
        Estante Viva
      </RouterLink>

      <nav class="nav-links" aria-label="Navegação principal">
        <RouterLink to="/dashboard" class="nav-link" :class="{ active: isActive('/dashboard') }">
          Meu Perfil
        </RouterLink>
        <RouterLink to="/rankings" class="nav-link" :class="{ active: isActive('/rankings') }">
          Ranking
        </RouterLink>
        <RouterLink to="/library" class="nav-link" :class="{ active: isActive('/library') }">
          Biblioteca
        </RouterLink>
        <RouterLink to="/new-books" class="nav-link" :class="{ active: isActive('/new-books') }">
          Livros Novos
        </RouterLink>
        <RouterLink to="/donate" class="nav-link" :class="{ active: isActive('/donate') }">
          Doar Livro
        </RouterLink>
        <RouterLink v-if="user?.role === 'admin'" to="/admin" class="nav-link" :class="{ active: route.path.startsWith('/admin') }">
          Painel Admin
        </RouterLink>
      </nav>

      <div class="header-actions">
        <div class="user-points">
          <span class="points-icon">⭐</span>
          <span class="points-value">{{ user?.points ?? 0 }} pontos</span>
        </div>
        <span class="signed-user">{{ user?.name ?? 'Usuário' }}</span>
        <button type="button" class="btn secondary small" @click="handleLogout">Sair</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.user-points {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 2rem;
}

.points-icon {
  font-size: 1.25rem;
}

.points-value {
  font-weight: 600;
  color: var(--green-700);
}
</style>
