import type { AdminEpicrisisRow } from '@/services/admin.service'

export type AdminProgressFilter = 'all' | 'annotated' | 'completed_any' | 'completed_all'

function compact(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_-]+/g, '')
}

export function matchesEpicrisisIdentifier(row: AdminEpicrisisRow, query: string): boolean {
  const needle = compact(query)
  if (!needle) return true

  const paddedId = String(row.id).padStart(5, '0')
  const candidates = [
    String(row.id),
    paddedId,
    `EPC${paddedId}`,
    row.patientId ?? '',
  ].map(compact)

  return candidates.some(candidate => candidate.includes(needle))
}

export function matchesProgress(row: AdminEpicrisisRow, filter: AdminProgressFilter): boolean {
  if (filter === 'annotated') return row.annotationCount > 0
  if (filter === 'completed_any') return row.completedCount > 0
  if (filter === 'completed_all') {
    return row.assignedCount > 0 && row.completedCount === row.assignedCount
  }
  return true
}
