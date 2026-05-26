export type DifficultyLevel = 'easy' | 'medium' | 'hard' | null

export const DIFFICULTY_LEVELS = [
  {
    value: 'easy' as const,
    label: 'Normal',
    description: 'Extracción directa del documento',
    dot: 'bg-green-400',
    ring: 'ring-green-300',
    text: 'text-green-700',
  },
  {
    value: 'medium' as const,
    label: 'Mediana',
    description: 'Requirió atención o interpretación extra',
    dot: 'bg-yellow-400',
    ring: 'ring-yellow-300',
    text: 'text-yellow-700',
  },
  {
    value: 'hard' as const,
    label: 'Difícil',
    description: 'Ambiguo, ausente o muy difícil de determinar',
    dot: 'bg-red-400',
    ring: 'ring-red-300',
    text: 'text-red-700',
  },
] as const
