import { api } from './api'
import type { LlmPredictions } from '@/types/db'

export interface AdminEpicrisisRow {
  id: number
  patientId: string | null
  status: 'pending' | 'in_review' | 'reviewed'
  assigneeId: number | null
  createdAt: string
  assigneeEmail: string | null
  annotatedCount: number
  assignees: { id: number; email: string }[]
}

export interface IrrCriterionResult {
  criterion: string
  total: number
  agreements: number
  agreementPct: number
  kappa: number
}

export interface IrrResult {
  results: IrrCriterionResult[]
  nOverlapped: number
  avgKappa: number | null
}

export interface AdminMatrixRow {
  id: number
  patientId: string | null
  status: 'pending' | 'in_review' | 'reviewed'
  assigneeEmail: string | null
  llmPredictions: LlmPredictions | null
  annotations: Record<string, { isPresent: boolean | null; evidenceText: string | null; difficulty: string | null }>
}

export interface AdminStats {
  total: number
  unassigned: number
  pending: number
  in_review: number
  reviewed: number
}

export interface AdminUser {
  id: number
  email: string
  role: 'admin' | 'annotator'
  createdAt: string
  termsAcceptedAt: string | null
}

export const adminService = {
  getEpicrises: () =>
    api.get<{ epicrises: AdminEpicrisisRow[]; stats: AdminStats }>('/admin?resource=epicrisis'),

  getUsers: () =>
    api.get<{ users: AdminUser[] }>('/admin?resource=users'),

  getAllUsers: () =>
    api.get<{ users: AdminUser[] }>('/admin?resource=allUsers'),

  getMatrix: () =>
    api.get<{ matrix: AdminMatrixRow[] }>('/admin?resource=matrix'),

  assign: (epicrisisId: number, userIds: number[]) =>
    api.patch<{ ok: boolean }>('/admin', { epicrisisId, userIds }),

  getIRR: () =>
    api.get<IrrResult>('/admin?resource=irr'),

  createUser: (email: string, password: string, role: 'admin' | 'annotator') =>
    api.post<{ ok: boolean; user: AdminUser }>('/admin', { action: 'createUser', email, password, role }),

  updateUserRole: (userId: number, role: 'admin' | 'annotator') =>
    api.post<{ ok: boolean }>('/admin', { action: 'updateRole', userId, role }),

  deleteUser: (userId: number) =>
    api.post<{ ok: boolean }>('/admin', { action: 'deleteUser', userId }),

  resetUserPassword: (userId: number, newPassword: string) =>
    api.post<{ ok: boolean }>('/admin', { action: 'resetPassword', userId, newPassword }),
}
