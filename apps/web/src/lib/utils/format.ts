const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function getDateStamp(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  return (getDateStamp(a) - getDateStamp(b)) / msPerDay
}

export function formatRelativeDate(isoDate: string | null): string {
  if (isoDate === null) return ''

  const datePart = isoDate.slice(0, 10)
  const match = ISO_DATE_RE.exec(datePart)
  if (!match) return ''

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return ''

  const target = new Date(year, month, day)
  if (Number.isNaN(target.getTime())) return ''
  if (
    target.getFullYear() !== year
    || target.getMonth() !== month
    || target.getDate() !== day
  ) {
    return ''
  }

  const today = new Date()
  const diff = diffDays(target, today)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'

  if (diff >= 2 && diff <= 6) {
    return DAY_NAMES[target.getDay()]
  }

  if (diff >= 7 && diff <= 13) {
    return `Next ${DAY_NAMES[target.getDay()]}`
  }

  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const formatted = formatter.format(target)

  if (target.getFullYear() !== today.getFullYear()) {
    return `${formatted} ${target.getFullYear()}`
  }

  return formatted
}
