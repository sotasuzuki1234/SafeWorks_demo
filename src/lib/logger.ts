import { supabase } from './supabase'

const SESSION_KEY = 'safeworks_session_id'
const CLICK_CONTEXT_KEY = 'safeworks_click_context'

// セッションIDを取得（なければ新規発行）
function getOrCreateSessionId(): { id: string; isNew: boolean } {
  let sid = sessionStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sid)
    return { id: sid, isNew: true }
  }
  return { id: sid, isNew: false }
}

export function getSessionId(): string {
  return getOrCreateSessionId().id
}

// クリック時のコンテキスト（順位・スコア）をセッションストレージに保存
export interface ClickContext {
  job_id: string
  rank: number
  compatibility: number
  workloadFit: number
  jobScore: number
  userFit: number
}

export function saveClickContext(ctx: ClickContext): void {
  sessionStorage.setItem(CLICK_CONTEXT_KEY, JSON.stringify(ctx))
}

export function loadClickContext(jobId: string): ClickContext | null {
  const raw = sessionStorage.getItem(CLICK_CONTEXT_KEY)
  if (!raw) return null
  try {
    const ctx = JSON.parse(raw) as ClickContext
    return ctx.job_id === jobId ? ctx : null
  } catch {
    return null
  }
}

// 内部送信関数（fire-and-forget）
function send(
  eventType: string,
  jobId: string | null,
  payload: Record<string, unknown>
): void {
  const session_id = getSessionId()
  const fullPayload = jobId ? { session_id, job_id: jobId, ...payload } : { session_id, ...payload }
  void supabase
    .from('event_logs')
    .insert({ event_type: eventType, payload: fullPayload })
    .then(({ data, error, status, statusText }) => {
      if (error) console.error('[logger] insert error:', error)
      else console.log('[logger] insert ok:', status, statusText, data)
    })
}

// ---- 公開ログ関数 ----

export function logSessionStart(): void {
  const { isNew } = getOrCreateSessionId()
  if (!isNew) return
  send('session_start', null, {})
}

export function logFiltersSubmitted(payload: {
  minHourlyRate: number
  continuousPreference: boolean
  avoidConditions: string[]
}): void {
  send('filters_submitted', null, payload)
}

export function logJobsListViewed(payload: {
  shownJobIds: string[]
  rankingOrder: string[]
}): void {
  send('jobs_list_viewed', null, payload)
}

export function logJobDetailViewed(
  jobId: string,
  ctx: ClickContext | null,
  scores: { workloadFit: number; jobScore: number; userFit: number }
): void {
  send('job_detail_viewed', jobId, {
    rank_at_click: ctx?.rank ?? null,
    score_at_click: ctx?.compatibility ?? null,
    workloadFit: scores.workloadFit,
    jobScore: scores.jobScore,
    userFit: scores.userFit,
  })
}

export function logApplyClicked(
  jobId: string,
  ctx: ClickContext | null,
  scores: { workloadFit: number; jobScore: number; userFit: number }
): void {
  send('apply_clicked', jobId, {
    rank_at_click: ctx?.rank ?? null,
    score_at_click: ctx?.compatibility ?? null,
    workloadFit: scores.workloadFit,
    jobScore: scores.jobScore,
    userFit: scores.userFit,
  })
}
