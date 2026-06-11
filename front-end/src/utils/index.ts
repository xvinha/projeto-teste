export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const formatPoints = (points: number): string => {
  return `${points.toLocaleString('pt-BR')}`
}

export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'available':
      return 'badge-success'
    case 'lent':
      return 'badge-warning'
    case 'active':
      return 'badge-info'
    case 'returned':
      return 'badge-secondary'
    default:
      return 'badge-default'
  }
}

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: 'Disponível',
    lent: 'Emprestado',
    active: 'Ativo',
    returned: 'Devolvido',
    student: 'Aluno',
    teacher: 'Professor',
    donator: 'Doador',
    admin: 'Administrador',
  }
  return labels[status] || status
}
