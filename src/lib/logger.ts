import { supabase } from './supabase'

const SESSION_KEY = 'safeworks_session_id'
const TESTER_ID_KEY = 'safeworks_tester_id'
const CLICK_CONTEXT_KEY = 'safeworks_click_context'

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

// URLパラメータ ?tester_id=xxx を読み取り、sessionStorage に永続化
export function getTesterid(): string | null {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('tester_id')
  if (fromUrl) {
    sessionStorage.setItem(TESTER_ID_KEY, fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem(TESTER_ID_KEY)
}

export interface ClickContext {
  job_id: string
  rank: number
  compatibility: number
  workloadFit: number
  jobScore: number
  userFit: number
}

export interface RankedJob {
  job_id: string
  position: number
  overall_score: number
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
  const tester_id = getTesterid()
  const base: Record<string, unknown> = { session_id }
  if (tester_id) base.tester_id = tester_id
  if (jobId) base.job_id = jobId
  const fullPayload = { ...base, ...payload }
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
  experience_level: string
  min_hourly: number
  wants_continuity: boolean
  avoid_conditions: string[]
}): void {
  send('filters_submitted', null, payload)
}

export function logJobsListViewed(payload: { ranked_jobs: RankedJob[] }): void {
  send('jobs_list_viewed', null, payload)
}

export function logJobDetailViewed(
  jobId: string,
  ctx: ClickContext | null,
  scores: { workloadFit: number; jobScore: number; userFit: number; overall_score: number }
): void {
  send('job_detail_viewed', jobId, {
    position: ctx?.rank ?? null,
    overall_score: scores.overall_score,
    workloadFit: scores.workloadFit,
    jobScore: scores.jobScore,
    userFit: scores.userFit,
  })
}

export function logApplyClicked(
  jobId: string,
  ctx: ClickContext | null,
  scores: { workloadFit: number; jobScore: number; userFit: number; overall_score: number }
): void {
  send('apply_clicked', jobId, {
    position: ctx?.rank ?? null,
    overall_score: scores.overall_score,
    workloadFit: scores.workloadFit,
    jobScore: scores.jobScore,
    userFit: scores.userFit,
  })
}
