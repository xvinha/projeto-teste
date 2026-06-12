const parseScheduledAt = (scheduled_at: string) => {
  const match = scheduled_at.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
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

export const getScheduleWindowError = (
  scheduled_at: string,
  subject = "Scheduling",
) => {
  const parsed = parseScheduledAt(scheduled_at)
  if (!parsed) {
    return `Invalid scheduled_at`
  }

  if (parsed.getDay() === 0) {
    return `${subject} is available only from Monday to Saturday`
  }

  const minutes = parsed.getHours() * 60 + parsed.getMinutes()
  if (minutes < 8 * 60 || minutes > 20 * 60) {
    return `${subject} must be between 08:00 and 20:00`
  }

  return null
}
