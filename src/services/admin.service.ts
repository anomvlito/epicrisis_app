import { api } from './api'
import type { LlmPredictions } from '@/types/db'

export type EpicrisisStatus = 'pending' | 'in_review' | 'reviewed' | 'needs_expert_review'

export interface AdminEpicrisisRow {
  id: number
  patientId: string | null
  status: EpicrisisStatus
  assigneeId: number | null
  createdAt: string
  assigneeEmail: string | null
  assignees: { id: number; email: string; annotatedCount: number; activeTimeMs: number; completedAt: string | null }[]
  annotationCount: number
  assignedCount: number
  completedCount: number
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

export interface MatrixAnnotatorEntry {
  userId: number
  email: string | null
  isPresent: boolean | null
  isUnknown: boolean
  evidenceText: string | null
  difficulty: string | null
  comments: string | null
  evidenceMetadata: Record<string, any> | null
}

export interface AdminMatrixRow {
  id: number
  patientId: string | null
  status: EpicrisisStatus
  assigneeEmail: string | null
  llmPredictions: LlmPredictions | null
  // Cada criterio tiene un array de respuestas (una por anotador)
  annotations: Record<string, MatrixAnnotatorEntry[]>
}

export interface AdminStats {
  total: number
  unassigned: number
  pending: number
  in_review: number
  reviewed: number
  needs_expert_review: number
}

export interface AdminUser {
  id: number
  email: string
  role: 'admin' | 'annotator'
  createdAt: string
  termsAcceptedAt: string | null
}

export interface ExperimentDashboard {
  experiment: { id: number; code: string; name: string; status: string; createdAt: string }
  cases: Array<{
    caseNumber: string
    id: number
    patientId: string | null
    status: EpicrisisStatus
    assignees: Array<{ id: number; email: string; completedAt: string | null; activeTimeMs: number }>
  }>
  annotators: Array<{ id: number; email: string; assigned: number; completed: number }>
  stats: { cases: number; reviews: number; completed: number; inProgress: number }
}

export const adminService = {
  getEpicrises: () =>
    api.get<{ epicrises: AdminEpicrisisRow[]; stats: AdminStats }>('/admin?resource=epicrisis'),

  getExperiment: () =>
    api.get<ExperimentDashboard>('/admin?resource=experiment&code=concordancia-50-v1'),

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

  closeExpertReview: (epicrisisId: number) =>
    api.post<{ ok: boolean; status: EpicrisisStatus }>('/admin', { action: 'closeExpertReview', epicrisisId }),
}
