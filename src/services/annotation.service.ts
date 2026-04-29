import { api } from './api'

export interface CriterionPayload {
  criterionName: string
  isPresent: boolean | null
  evidenceText: string | null
  comments: string | null
}

export interface SubmitPayload {
  epicrisisId: number
  criteria: CriterionPayload[]
  isFinal: boolean
}

export interface ServerAnnotation {
  criterionName: string
  isPresent: boolean | null
  evidenceText: string | null
  comments: string | null
}

export const annotationService = {
  getForEpicrisis: (epicrisisId: number) =>
    api.get<{ annotations: any[] }>(`/annotations?epicrisisId=${epicrisisId}`),

  submit: (epicrisisId: number, criteria: any[], isFinal: boolean) =>
    api.post<{ ok: boolean; status: string }>('/annotations', { epicrisisId, criteria, isFinal }),

  lock: (epicrisisId: number) =>
    api.post<{ ok: boolean }>('/lock', { epicrisisId, action: 'lock' }),

  unlock: (epicrisisId: number) =>
    api.post<{ ok: boolean }>('/lock', { epicrisisId, action: 'unlock' }),
}
