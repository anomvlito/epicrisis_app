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
    api.get<{ annotations: ServerAnnotation[] }>(`/annotations?epicrisisId=${epicrisisId}`),

  submit: (payload: SubmitPayload) =>
    api.post<{ ok: boolean; status: string }>('/annotations', payload),
}
