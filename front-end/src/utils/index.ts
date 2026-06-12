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

const parseScheduleInput = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute] = match
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day) ||
    parsed.getHours() !== Number(hour) ||
    parsed.getMinutes() !== Number(minute)
  ) {
    return null
  }

  return parsed
}

export const getDonationScheduleError = (value: string): string | null => {
  const parsed = parseScheduleInput(value)

  if (!parsed) {
    return 'Informe uma data e horario validos.'
  }

  if (parsed.getDay() === 0) {
    return 'O agendamento de doacao deve ser de segunda a sabado.'
  }

  const minutes = parsed.getHours() * 60 + parsed.getMinutes()
  if (minutes < 8 * 60 || minutes > 20 * 60) {
    return 'O agendamento de doacao deve ser entre 08:00 e 20:00.'
  }

  return null
}

export const getPickupScheduleError = (value: string): string | null => {
  return getDonationScheduleError(value)
}

const toDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export const getDefaultDonationScheduleValue = (baseDate = new Date()) => {
  const candidate = new Date(baseDate)
  candidate.setSeconds(0, 0)

  if (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setHours(8, 0, 0, 0)
  } else if (candidate.getHours() < 8) {
    candidate.setHours(8, 0, 0, 0)
  } else if (candidate.getHours() > 20 || (candidate.getHours() === 20 && candidate.getMinutes() > 0)) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setHours(8, 0, 0, 0)
  }

  while (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setHours(8, 0, 0, 0)
  }

  return toDateTimeLocalValue(candidate)
}

export const getDefaultPickupScheduleValue = (baseDate = new Date()) => {
  return getDefaultDonationScheduleValue(baseDate)
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
