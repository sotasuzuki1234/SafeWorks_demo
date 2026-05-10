import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job, JobWithScore } from '../types'
import { loadConditions } from '../utils/session'
import { buildJobsWithScore, isVideoEditingJob } from '../utils/compatibility'
import {
  getEligibilityTags,
  calcExhaustionRisk,
  calcClientTrust,
  getJobTier,
  TIER_LABELS,
} from '../utils/jobTags'
import jobsRaw from '../data/jobs-beta.json'
import { logJobsListViewed, saveClickContext } from '../lib/logger'

function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

const today = getTodayJST()
const jobs = (jobsRaw as unknown as Job[]).filter(
  (j) => isVideoEditingJob(j) && (!j.deadline || j.deadline >= today)
)

const NEW_JOBS_THRESHOLD = 40
function jobNumber(id: string): number {
  return parseInt(id.replace('job-', ''), 10)
}
const lastUpdated = (() => {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return `${jst.getUTCFullYear()}/${String(jst.getUTCMonth() + 1).padStart(2, '0')}/${String(jst.getUTCDate()).padStart(2, '0')}`
})()
const newJobsCount = jobs.filter((j) => jobNumber(j.id) > NEW_JOBS_THRESHOLD).length

const replySpeedLabel: Record<string, string> = {
  fast: '返信速い',
  normal: '返信普通',
  slow: '返信遅め',
}

function getRecommendReason(job: JobWithScore, rank: number): string {
  if (rank === 1) return 'この一覧で最も副業適合度が高い案件です'
  if (rank === 2) return '副業適合度2位。単価・継続性を1位と比べて検討を'
  if (rank === 3) return '副業適合度3位。条件を確認してから応募を'
  if (job.workloadFit < 40) return '稼働量が多く副業との両立には注意が必要な案件'
  if (job.userFit < 40) return '実績・スキルのハードルが高め。中〜上級者向け'
  if (job.compatibility >= 65 && job.isContinuous) return '継続性があり安定収入が見込める。条件次第でおすすめ'
  if (job.compatibility >= 65) return '副業として取り組みやすい条件が揃っている'
  if (job.compatibility < 55) return '条件面で注意点あり。内容をよく確認してから判断を'
  return '条件次第で取り組みやすい標準的な案件'
}

function RecommendBadgeColor(job: JobWithScore): string {
  if (job.workloadFit < 40 || job.userFit < 40) return '#c33'
  if (job.compatibility >= 85) return '#1a7'
  if (job.compatibility >= 65) return '#f90'
  return '#c33'
}

// ---- 表示コンポーネント ----

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#2a7' : score >= 65 ? '#f90' : '#c33'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        background: color,
        color: '#fff',
        borderRadius: 20,
        fontSize: 14,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
      }}
    >
      {score}%
    </span>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? '#2a7' : score >= 40 ? '#f90' : '#c33'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: '#999', width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color: '#666', width: 28, textAlign: 'right', flexShrink: 0 }}>{score}</span>
    </div>
  )
}

function EligibilityTag({ label }: { label: string }) {
  const isRequired = label.includes('必須')
  const isOk = label.includes('OK') || label.includes('あり') || label.includes('可')
  const bg = isRequired ? '#fff3f3' : isOk ? '#edfaf4' : '#f0f7ff'
  const border = isRequired ? '#f5c0c0' : isOk ? '#b8ead6' : '#b8d4f0'
  const color = isRequired ? '#c33' : isOk ? '#1a7' : '#1155aa'
  return (
    <span
      style={{
        fontSize: 11,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: '2px 8px',
        color,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function ExhaustionBadge({ risk }: { risk: '低' | '中' | '高' }) {
  const map = {
    低: { color: '#1a7', bg: '#edfaf4', border: '#b8ead6' },
    中: { color: '#888', bg: '#f5f5f5', border: '#ddd' },
    高: { color: '#c33', bg: '#fff3f3', border: '#f5c0c0' },
  }
  const s = map[risk]
  return (
    <span
      style={{
        fontSize: 11,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: '2px 8px',
        color: s.color,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
      }}
    >
      消耗: {risk}
    </span>
  )
}

function ClientTrustBadge({ trust }: { trust: '高' | '中' | '要注意' }) {
  const map = {
    高: { color: '#1a7', bg: '#edfaf4', border: '#b8ead6' },
    中: { color: '#888', bg: '#f5f5f5', border: '#ddd' },
    要注意: { color: '#c93000', bg: '#fff8ee', border: '#ffd080' },
  }
  const s = map[trust]
  return (
    <span
      style={{
        fontSize: 11,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        padding: '2px 8px',
        color: s.color,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
      }}
    >
      CL: {trust}
    </span>
  )
}

function TierDivider({ tier }: { tier: 0 | 1 | 2 }) {
  if (tier === 0) return null
  const info = TIER_LABELS[tier]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}>
      <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 'bold',
          color: info.color,
          background: info.bg,
          border: `1px solid ${info.color}33`,
          borderRadius: 20,
          padding: '2px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        {tier === 1 ? '▼ 条件次第の案件' : '▼ 注意が必要な案件'}
      </span>
      <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
    </div>
  )
}

export default function JobsList() {
  const navigate = useNavigate()
  const [jobList, setJobList] = useState<JobWithScore[]>([])
  const [hasConditions, setHasConditions] = useState(true)

  useEffect(() => {
    const conditions = loadConditions()
    if (!conditions) {
      setHasConditions(false)
      return
    }
    const currentToday = getTodayJST()
    const activeJobs = jobs.filter((j) => !j.deadline || j.deadline >= currentToday)
    const scored = buildJobsWithScore(activeJobs, conditions)
    setJobList(scored)
    logJobsListViewed({
      ranked_jobs: scored.map((j, i) => ({
        job_id: j.id,
        position: i + 1,
        overall_score: j.compatibility,
        eligibility_tags: getEligibilityTags(j),
        exhaustion_risk: calcExhaustionRisk(j),
        client_trust_level: calcClientTrust(j),
      })),
    })
  }, [])

  if (!hasConditions) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <p style={{ marginBottom: 16 }}>条件が設定されていません</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', cursor: 'pointer' }}>
          ホームへ戻る
        </button>
      </div>
    )
  }

  let prevTier = -1

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <button
          onClick={() => navigate('/')}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, margin: 0 }}>案件一覧</h1>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f0f7ff',
          border: '1px solid #cce0ff',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <span style={{ color: '#555' }}>最終更新：{lastUpdated}　募集中 {jobList.length}件</span>
        {newJobsCount > 0 && (
          <span
            style={{
              background: '#1a7',
              color: '#fff',
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            新着 {newJobsCount}件
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {jobList.map((job, index) => {
          const tier = getJobTier(job.compatibility)
          const showDivider = tier !== prevTier && tier > 0
          prevTier = tier

          const eligibilityTags = getEligibilityTags(job)
          const exhaustionRisk = calcExhaustionRisk(job)
          const clientTrust = calcClientTrust(job)

          return (
            <div key={job.id}>
              {showDivider && <TierDivider tier={tier as 0 | 1 | 2} />}
              <div
                onClick={() => {
                  saveClickContext({
                    job_id: job.id,
                    rank: index + 1,
                    compatibility: job.compatibility,
                    workloadFit: job.workloadFit,
                    jobScore: job.jobScore,
                    userFit: job.userFit,
                  })
                  navigate(`/jobs/${job.id}`)
                }}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: '#fff',
                }}
              >
                {/* ① タイトル + 適合率 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2, lineHeight: 1.4 }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>{job.clientName}</div>
                  </div>
                  <ScoreBadge score={job.compatibility} />
                </div>

                {/* ② 応募可否タグ（最優先表示） */}
                {eligibilityTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {eligibilityTags.map((tag) => (
                      <EligibilityTag key={tag} label={tag} />
                    ))}
                  </div>
                )}

                {/* ③ 消耗リスク + クライアント信頼性（コンパクト行） */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <ExhaustionBadge risk={exhaustionRisk} />
                  <ClientTrustBadge trust={clientTrust} />
                </div>

                {/* おすすめ理由 */}
                <div
                  style={{
                    fontSize: 12,
                    color: RecommendBadgeColor(job),
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>★</span>
                  <span>{getRecommendReason(job, index + 1)}</span>
                </div>

                {/* スコア内訳バー */}
                <div
                  style={{
                    background: '#f8f8f8',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginBottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <ScoreBar label="案件の質" score={job.jobScore} />
                  <ScoreBar label="あなた向き" score={job.userFit} />
                  <ScoreBar label="副業継続性" score={job.workloadFit} />
                </div>

                {/* 報酬・時給・継続 */}
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#444', marginBottom: 8 }}>
                  <span>{job.reward.toLocaleString()}円</span>
                  <span style={{ color: '#666' }}>時給 {job.hourlyRate.toLocaleString()}円</span>
                  <span
                    style={{
                      color: job.isContinuous ? '#2a7' : '#888',
                      fontWeight: job.isContinuous ? 'bold' : 'normal',
                    }}
                  >
                    {job.isContinuous ? '継続あり' : '単発'}
                  </span>
                </div>

                {/* 通常タグ */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: job.cautionTags.length > 0 ? 6 : 0,
                  }}
                >
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 12,
                        background: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: 20,
                        padding: '2px 8px',
                        color: '#666',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 注意タグ */}
                {job.cautionTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {job.cautionTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 12,
                          background: '#fff3f3',
                          border: '1px solid #f5c0c0',
                          borderRadius: 20,
                          padding: '2px 8px',
                          color: '#c33',
                        }}
                      >
                        ⚠ {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* クライアント情報サマリ */}
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {replySpeedLabel[job.responseSpeed]} ／ 継続率 {job.continuationRate}% ／ 修正 平均{job.revisionAverage}回
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
