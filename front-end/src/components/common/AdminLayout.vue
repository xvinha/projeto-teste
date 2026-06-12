<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'
import Logo from '@/components/common/Logo.vue'

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <RouterLink to="/admin" class="brand">
          <div class="brand-logo">
            <Logo />
          </div>
          <span>Estante <span class="brand-dot">Viva</span></span>
        </RouterLink>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/admin" class="nav-item" exact-active-class="active">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/admin/users" class="nav-item" active-class="active">
          <span class="nav-icon">👥</span>
          <span>Usuários</span>
        </RouterLink>
        <RouterLink to="/admin/books" class="nav-item" active-class="active">
          <span class="nav-icon">📚</span>
          <span>Livros</span>
        </RouterLink>
        <RouterLink to="/admin/loans" class="nav-item" active-class="active">
          <span class="nav-icon">🤝</span>
          <span>Empréstimos</span>
        </RouterLink>
        <RouterLink to="/admin/donations" class="nav-item" active-class="active">
          <span class="nav-icon">🗓️</span>
          <span>Doações</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" v-if="user">
          <p class="user-name">{{ user.name }}</p>
          <p class="user-role">Administrador</p>
        </div>
        <button @click="handleLogout" class="btn secondary small w-full">
          Sair
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div class="header-breadcrumb">
          Painel Administrativo
        </div>
        <RouterLink to="/library" class="btn secondary small">
          Ir para Loja
        </RouterLink>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--gray-50);
}

.admin-sidebar {
  width: 260px;
  background: var(--white);
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--gray-600);
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition);
}

.nav-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.nav-item.active {
  background: var(--green-50);
  color: var(--green-600);
}

.nav-icon {
  font-size: 1.25rem;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--gray-100);
}

.user-info {
  margin-bottom: 1rem;
}

.user-name {
  font-weight: 600;
  color: var(--gray-900);
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 64px;
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-breadcrumb {
  font-weight: 600;
  color: var(--gray-800);
}

.admin-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.w-full {
  width: 100%;
}
</style>
