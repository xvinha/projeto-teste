<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { rankingService } from '@/services'
import { useAuth } from '@/services/auth'
import { formatPoints } from '@/utils'
import type { RankingEntryDonations, RankingEntryPoints, RankingsByRole } from '@/types'

const { user } = useAuth()

const isLoading = ref(true)
const error = ref<string | null>(null)

const rankingsByPoints = ref<RankingsByRole<RankingEntryPoints>>({
  student: [],
  teacher: [],
  donator: [],
})

const rankingsByDonations = ref<RankingsByRole<RankingEntryDonations>>({
  student: [],
  teacher: [],
  donator: [],
})

const roleSections = [
  { key: 'student', title: 'Alunos', subtitle: 'Alunos competem apenas com alunos.' },
  { key: 'teacher', title: 'Professores', subtitle: 'Professores competem apenas com professores.' },
  { key: 'donator', title: 'Doadores', subtitle: 'Doadores competem apenas com doadores.' },
] as const

const roleLabel: Record<(typeof roleSections)[number]['key'], string> = {
  student: 'Aluno',
  teacher: 'Professor',
  donator: 'Doador',
}

const loadRankings = async () => {
  try {
    isLoading.value = true
    error.value = null
    const result = await rankingService.getRankings()
    rankingsByPoints.value = result.by_points
    rankingsByDonations.value = result.by_donations
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar ranking'
  } finally {
    isLoading.value = false
  }
}

const getPosition = (list: Array<{ id: number }>, userId: number): number | null => {
  const idx = list.findIndex((item) => item.id === userId)
  return idx >= 0 ? idx + 1 : null
}

const myPointsPosition = computed(() => {
  if (!user.value || user.value.role === 'admin') return null
  return getPosition(rankingsByPoints.value[user.value.role], user.value.id)
})

const myDonationsPosition = computed(() => {
  if (!user.value || user.value.role === 'admin') return null
  return getPosition(rankingsByDonations.value[user.value.role], user.value.id)
})

onMounted(loadRankings)
</script>

<template>
  <AuthenticatedLayout>
    <div class="page-hero">
      <p class="eyebrow">Comunidade</p>
      <h1 class="page-title">Ranking de Usuários</h1>
      <p class="page-description">
        Cada perfil compete separadamente. Aluno compete com aluno, professor com professor e doador com doador.
      </p>
    </div>

    <div class="stats-row" v-if="user && user.role !== 'admin'">
      <div class="stat-card">
        <span class="stat-card-value">{{ myPointsPosition ? `#${myPointsPosition}` : '—' }}</span>
        <span class="stat-card-label">Sua posição em pontos</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ myDonationsPosition ? `#${myDonationsPosition}` : '—' }}</span>
        <span class="stat-card-label">Sua posição em doações</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ user ? roleLabel[user.role as 'student' | 'teacher' | 'donator'] : '—' }}</span>
        <span class="stat-card-label">Seu perfil</span>
      </div>
    </div>

    <div v-if="isLoading" class="callout neutral">Carregando ranking...</div>
    <div v-else-if="error" class="callout">{{ error }}</div>

    <div v-else class="ranking-sections">
      <section v-for="section in roleSections" :key="section.key" class="card ranking-card">
        <div class="card-header">
          <div>
            <div class="card-title">{{ section.title }}</div>
            <div class="card-subtitle">{{ section.subtitle }}</div>
          </div>
        </div>

        <div class="ranking-grid">
          <div class="ranking-panel">
            <div class="ranking-panel-header">
              <div class="panel-title">Ranking por Pontos</div>
              <div class="panel-subtitle">Top 10 do perfil</div>
            </div>
            <div class="table-shell">
              <table class="table-view">
                <thead>
                  <tr>
                    <th style="width: 56px;">#</th>
                    <th>Usuário</th>
                    <th>Campus</th>
                    <th style="width: 120px;">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(entry, idx) in rankingsByPoints[section.key].slice(0, 10)"
                    :key="entry.id"
                    :class="{ 'ranking-me': entry.id === user?.id }"
                  >
                    <td>#{{ idx + 1 }}</td>
                    <td><strong>{{ entry.name }}</strong></td>
                    <td>{{ entry.campus || '—' }}</td>
                    <td style="text-align: right;"><strong>{{ formatPoints(entry.points) }}</strong></td>
                  </tr>
                  <tr v-if="rankingsByPoints[section.key].length === 0">
                    <td colspan="4" class="empty-table">Nenhum usuário neste perfil.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="ranking-panel">
            <div class="ranking-panel-header">
              <div class="panel-title">Ranking por Livros Doados</div>
              <div class="panel-subtitle">Top 10 do perfil</div>
            </div>
            <div class="table-shell">
              <table class="table-view">
                <thead>
                  <tr>
                    <th style="width: 56px;">#</th>
                    <th>Usuário</th>
                    <th style="width: 120px;">Doações</th>
                    <th style="width: 120px;">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(entry, idx) in rankingsByDonations[section.key].slice(0, 10)"
                    :key="entry.id"
                    :class="{ 'ranking-me': entry.id === user?.id }"
                  >
                    <td>#{{ idx + 1 }}</td>
                    <td><strong>{{ entry.name }}</strong></td>
                    <td style="text-align: right;">{{ entry.donated_books }}</td>
                    <td style="text-align: right;"><strong>{{ formatPoints(entry.points) }}</strong></td>
                  </tr>
                  <tr v-if="rankingsByDonations[section.key].length === 0">
                    <td colspan="4" class="empty-table">Nenhum usuário neste perfil.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.ranking-sections {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.ranking-card {
  overflow: hidden;
}

.ranking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.ranking-panel {
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--white);
}

.ranking-panel-header {
  padding: 1rem;
  border-bottom: 1px solid var(--gray-100);
}

.panel-title {
  font-weight: 700;
  color: var(--gray-900);
}

.panel-subtitle {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.ranking-me {
  background: rgba(34, 197, 94, 0.08);
}

.empty-table {
  text-align: center;
  color: var(--gray-500);
}

@media (max-width: 900px) {
  .ranking-grid {
    grid-template-columns: 1fr;
  }
}
</style>

