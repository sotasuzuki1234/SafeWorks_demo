import type { UserConditions } from '../types'

const KEY = 'safeworks_conditions'

export function saveConditions(conditions: UserConditions): void {
  sessionStorage.setItem(KEY, JSON.stringify(conditions))
}

export function loadConditions(): UserConditions | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserConditions
  } catch {
    return null
  }
}
