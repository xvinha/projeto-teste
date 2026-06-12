import { createRouter, createWebHistory } from 'vue-router'
import { setupRouteGuards } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignUpView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/donate',
      name: 'donate',
      component: () => import('@/views/DonateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/new-books',
      name: 'new-books',
      component: () => import('@/views/NewBooksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rankings',
      name: 'rankings',
      component: () => import('@/views/RankingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/views/admin/AdminUsersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/books',
      name: 'admin-books',
      component: () => import('@/views/admin/AdminBooksView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/loans',
      name: 'admin-loans',
      component: () => import('@/views/admin/AdminLoansView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/donations',
      name: 'admin-donations',
      component: () => import('@/views/admin/AdminDonationsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

setupRouteGuards(router)

export default router
