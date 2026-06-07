/**
 * Formats an ISO date string into a human-readable relative or absolute time.
 * @param isoString - ISO 8601 date string
 * @returns formatted time string
 */
export function formatDate(isoString: string): string {
  // If the ISO string has no timezone suffix, treat it as UTC
  const hasTimezone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(isoString)
  const date = new Date(hasTimezone ? isoString : isoString + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}