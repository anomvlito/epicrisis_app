import { describe, expect, it } from 'vitest'
import { matchesEpicrisisIdentifier, matchesProgress } from './adminEpicrisisFilter'
import type { AdminEpicrisisRow } from '@/services/admin.service'

const row: AdminEpicrisisRow = {
  id: 605,
  patientId: 'E364F032C1F6309E',
  status: 'in_review',
  assigneeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  assigneeEmail: null,
  assignees: [],
  annotationCount: 12,
  assignedCount: 2,
  completedCount: 1,
}

describe('admin epicrisis filters', () => {
  it.each(['EPC-00605', 'epc00605', '605', 'E364F032C1F6309E', 'e364f032']) (
    'encuentra la epicrisis por %s',
    query => expect(matchesEpicrisisIdentifier(row, query)).toBe(true),
  )

  it('rechaza identificadores que no corresponden', () => {
    expect(matchesEpicrisisIdentifier(row, 'EPC-00123')).toBe(false)
  })

  it('filtra por avance de anotadores', () => {
    expect(matchesProgress(row, 'annotated')).toBe(true)
    expect(matchesProgress(row, 'completed_any')).toBe(true)
    expect(matchesProgress(row, 'completed_all')).toBe(false)
    expect(matchesProgress({ ...row, completedCount: 2 }, 'completed_all')).toBe(true)
  })
})
