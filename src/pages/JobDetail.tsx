import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Job, JobWithScore } from '../types'
import { calcJobScore, calcUserFit, calcWorkloadFit, calcCompatibility, calcDifficulty, getWhoFitsThis, getWhyHardForUser } from '../utils/compatibility'
import { getEligibilityTags, calcExhaustionRisk, calcClientTrust } from '../utils/jobTags'
import { loadConditions } from '../utils/session'
import jobsRaw from '../data/jobs-beta.json'
import type { ClickContext } from '../lib/logger'
import { loadClickContext, logJobDetailViewed, logApplyClicked } from '../lib/logger'

function getRecommendReason(job: JobWithScore): string {
  const { workloadFit, jobScore, userFit, isContinuous, hourlyRate } = job
  if (workloadFit < 40) return '稼働量が多く副業との両立には注意が必要な案件'
  if (userFit < 40) return '実績・スキルのハードルが高め。中〜上級者向け'
  if (workloadFit >= 70 && jobScore >= 70 && isContinuous)
    return '副業として無理なく継続でき、安定収入が見込める'
  if (workloadFit >= 70 && jobScore >= 70)
    return '副業として取り組みやすく、案件の質も高い'
  if (workloadFit >= 70 && isContinuous)
    return '無理なく継続しやすい副業向きの案件'
  if (jobScore >= 70 && hourlyRate >= 2000)
    return '高単価だが稼働管理が鍵。スキルがあれば高収益'
  if (userFit < 55 && jobScore >= 60)
    return '案件の質は高いが実績要件あり。スキル確認を推奨'
  if (isContinuous && jobScore >= 50)
    return '継続発注が見込め、コツコツ稼ぎたい人に向いている'
  if (hourlyRate < 500)
    return '単価は低め。実績づくりや練習として活用するのがおすすめ'
  return '条件次第で取り組みやすい標準的な案件'
}

function getDecisionPoints(job: JobWithScore, rank?: number): string[] {
  const points: string[] = []
  const { workloadFit, jobScore, userFit, compatibility, isContinuous, hourlyRate } = job
  if (rank === 1)
    points.push('表示されている案件の中で最も副業に適した案件です')
  else if (rank && rank <= 3)
    points.push(`表示されている案件の中で副業適合度${rank}位の案件です`)
  if (workloadFit >= 70)
    points.push('副業として無理なく取り組みやすい案件です')
  if (compatibility >= 65 && isContinuous)
    points.push('継続性があり、安定収入につながる可能性があります')
  if (userFit < 40)
    points.push('スキル・実績要件が高く、応募前に内容を慎重に確認してください')
  else if (userFit < 55 && jobScore >= 60)
    points.push('単価は高めですが、実績・スキル要件も高いため慎重に判断してください')
  if (hourlyRate < 500)
    points.push('低単価のため、収益目的より練習・実績作り向きです')
  if (workloadFit < 40)
    points.push('稼働時間が多いため、本業や学業との両立には注意が必要です')
  if (points.length === 0)
    points.push('条件が合うか確認してから検討してみてください')
  return points
}

function getDecisionMessage(overall_score: number): string {
  if (overall_score >= 85) return 'この中で最も条件が良く、優先的に応募すべき案件です'
  if (overall_score >= 65) return '条件は良いですが、他案件と比較して判断するのがおすすめです'
  if (overall_score >= 40) return '条件面で注意が必要なため、慎重に判断してください'
  return 'この案件はおすすめ条件を満たしていないため、慎重に検討してください'
}

// JST基準で今日の日付を取得
function getTodayJST(): string {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

const jobs = jobsRaw as unknown as Job[]

const replySpeedLabel: Record<string, string> = {
  fast: '速い（24時間以内）',
  normal: '普通（2〜3日）',
  slow: '遅め（1週間以上）',
}

const difficultyLabel: Record<string, string> = {
  beginner: '初心者向け',
  intermediate: '中級者向け',
  advanced: '上級者向け',
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<JobWithScore | null>(null)
  const [clickCtx, setClickCtx] = useState<ClickContext | null>(null)

  useEffect(() => {
    const found = jobs.find((j) => j.id === id)
    if (!found) return
    const conditions = loadConditions()
    if (!conditions) return

    const jobScore = calcJobScore(found)
    const userFit = calcUserFit(found, conditions)
    const workloadFit = calcWorkloadFit(found)
    const overall_score = calcCompatibility(found, conditions)

    const jobWithScores: JobWithScore = {
      ...found,
      jobScore,
      userFit,
      workloadFit,
      compatibility: overall_score,
      difficulty: calcDifficulty(found),
      whoFitsThis: getWhoFitsThis(found),
      whyHardReasons: getWhyHardForUser(found, conditions),
    }
    setJob(jobWithScores)

    const ctx = loadClickContext(found.id)
    setClickCtx(ctx)
    logJobDetailViewed(found.id, ctx, {
      workloadFit,
      jobScore,
      userFit,
      overall_score,
      recommendation_reason: getRecommendReason(jobWithScores),
      decision_message: getDecisionMessage(overall_score),
      eligibility_tags: getEligibilityTags(found),
      exhaustion_risk: calcExhaustionRisk(found),
      client_trust_level: calcClientTrust(found),
    })
  }, [id])

  if (!job) {
    return (
      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <p>案件が見つかりません</p>
        <button onClick={() => navigate('/jobs')} style={{ marginTop: 16, cursor: 'pointer' }}>
          一覧へ戻る
        </button>
      </div>
    )
  }

  const scoreColor = job.compatibility >= 85 ? '#2a7' : job.compatibility >= 65 ? '#f90' : '#c33'
  const isExpired = !!job.deadline && job.deadline < getTodayJST()

  // 期限切れ案件は専用画面を表示
  if (isExpired) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <button
            onClick={() => navigate('/jobs')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 18, margin: 0, flex: 1, lineHeight: 1.4, color: '#999' }}>
            {job.title}
          </h1>
        </div>
        <div
          style={{
            background: '#fff3f3',
            border: '1px solid #f5c0c0',
            borderRadius: 10,
            padding: '20px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#c33', marginBottom: 8 }}>
            この案件は募集が終了しています
          </div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
            応募期限：{job.deadline}
          </div>
          <button
            onClick={() => navigate('/jobs')}
            style={{
              padding: '12px 28px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            募集中の案件を見る →
          </button>
        </div>
      </div>
    )
  }

  const eligibilityTags = getEligibilityTags(job)
  const exhaustionRisk = calcExhaustionRisk(job)
  const clientTrust = calcClientTrust(job)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      {/* 期限切れバナーは上のifで処理済みのため不要 */}
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <button
          onClick={() => navigate('/jobs')}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, margin: 0, flex: 1, lineHeight: 1.4 }}>{job.title}</h1>
      </div>

      {/* 適合率 + スコア内訳 */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px 20px',
          background: '#f9f9f9',
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>あなたへの適合率</div>
        <div style={{ fontSize: 48, fontWeight: 'bold', color: scoreColor }}>{job.compatibility}%</div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 4, fontStyle: 'italic' }}>{job.fitReasonShort}</div>
        {clickCtx?.rank && clickCtx.rank <= 5 && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
            表示中の案件で <strong style={{ color: scoreColor }}>{clickCtx.rank}位</strong> の推奨度
          </div>
        )}

        {/* スコア内訳 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #eee',
          }}
        >
          <ScoreItem label="案件の質" score={job.jobScore} />
          <ScoreItem label="あなた向き" score={job.userFit} />
          <ScoreItem label="副業継続性" score={job.workloadFit} />
        </div>
      </div>

      {/* 応募前チェック（3軸） */}
      <div
        style={{
          background: '#fafafa',
          border: '1px solid #eee',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 12 }}>
          応募前チェック
        </div>

        {/* ① 応募要件タグ */}
        {eligibilityTags.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>応募要件</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {eligibilityTags.map((tag) => {
                const isRequired = tag.includes('必須')
                const isOk = tag.includes('OK') || tag.includes('あり') || tag.includes('可')
                const bg = isRequired ? '#fff3f3' : isOk ? '#edfaf4' : '#f0f7ff'
                const border = isRequired ? '#f5c0c0' : isOk ? '#b8ead6' : '#b8d4f0'
                const color = isRequired ? '#c33' : isOk ? '#1a7' : '#1155aa'
                return (
                  <span
                    key={tag}
                    style={{
                      fontSize: 13,
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 20,
                      padding: '4px 10px',
                      color,
                      fontWeight: 'bold',
                    }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ② 消耗リスク + ③ クライアント信頼性 */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 消耗リスク */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>消耗リスク</div>
            {(() => {
              const map = {
                低: { color: '#1a7', bg: '#edfaf4', border: '#b8ead6', label: '低　負荷が軽い' },
                中: { color: '#888', bg: '#f5f5f5', border: '#ddd', label: '中　標準的な作業量' },
                高: { color: '#c33', bg: '#fff3f3', border: '#f5c0c0', label: '高　消耗しやすい' },
              }
              const s = map[exhaustionRisk]
              return (
                <div
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: s.color,
                    fontWeight: 'bold',
                  }}
                >
                  {s.label}
                </div>
              )
            })()}
          </div>

          {/* クライアント信頼性 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>クライアント</div>
            {(() => {
              const map = {
                高: { color: '#1a7', bg: '#edfaf4', border: '#b8ead6', label: '高　信頼性あり' },
                中: { color: '#888', bg: '#f5f5f5', border: '#ddd', label: '中　情報が限定的' },
                要注意: { color: '#c93000', bg: '#fff8ee', border: '#ffd080', label: '要注意　確認を' },
              }
              const s = map[clientTrust]
              return (
                <div
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: s.color,
                    fontWeight: 'bold',
                  }}
                >
                  {s.label}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 注意タグ（あれば表示） */}
      {job.cautionTags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>注意ポイント</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {job.cautionTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 13,
                  background: '#fff3f3',
                  border: '1px solid #f5c0c0',
                  borderRadius: 20,
                  padding: '4px 10px',
                  color: '#c33',
                }}
              >
                ⚠ {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* この案件が向いている人 */}
      <Section title="この案件が向いている人">
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
          {job.whoFitsThis}
        </div>
      </Section>

      {/* あなたには難しい理由（理由がある場合のみ表示） */}
      {job.whyHardReasons.length > 0 && (
        <Section title="あなたには難しい理由">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {job.whyHardReasons.map((reason, i) => (
              <li key={i} style={{ marginBottom: 6, color: '#c33', fontSize: 14, lineHeight: 1.5 }}>
                {reason}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 基本情報 */}
      <Section title="基本情報">
        <InfoRow label="報酬" value={`${job.reward.toLocaleString()}円`} />
        <InfoRow label="工数" value={`${job.estimatedHours}時間`} />
        <InfoRow label="時給換算" value={`${job.hourlyRate.toLocaleString()}円/h`} />
        <InfoRow label="継続性" value={job.isContinuous ? '継続案件' : '単発'} />
        <InfoRow label="難易度" value={difficultyLabel[job.difficulty]} />
      </Section>

      {/* クライアント情報 */}
      <Section title="クライアント情報">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 0',
            borderBottom: '1px solid #eee',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 14, color: '#888' }}>信頼性</span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: clientTrust === '高' ? '#1a7' : clientTrust === '中' ? '#888' : '#c93000',
              background: clientTrust === '高' ? '#edfaf4' : clientTrust === '中' ? '#f5f5f5' : '#fff8ee',
              border: `1px solid ${clientTrust === '高' ? '#b8ead6' : clientTrust === '中' ? '#ddd' : '#ffd080'}`,
              borderRadius: 20,
              padding: '2px 10px',
            }}
          >
            {clientTrust === '高' ? '高（信頼性あり）' : clientTrust === '中' ? '中（情報が限定的）' : '要注意（確認を）'}
          </span>
        </div>
        <InfoRow label="クライアント名" value={job.clientName} />
        <InfoRow label="返信速度" value={replySpeedLabel[job.responseSpeed]} />
        <InfoRow label="継続率" value={`${job.continuationRate}%`} />
        <InfoRow label="平均修正回数" value={`${job.revisionAverage}回`} />
      </Section>

      {/* 向いてる理由 */}
      <Section title="向いてる理由">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {job.goodPoints.map((p, i) => (
            <li key={i} style={{ marginBottom: 4, color: '#2a7', fontSize: 14 }}>{p}</li>
          ))}
        </ul>
      </Section>

      {/* 注意点 */}
      <Section title="注意点">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {job.cautionPoints.map((c, i) => (
            <li key={i} style={{ marginBottom: 4, color: '#c33', fontSize: 14 }}>{c}</li>
          ))}
        </ul>
      </Section>

      {/* この案件の働き方 */}
      {job.workStyleNote && (
        <Section title="この案件の働き方">
          <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
            {job.workStyleNote}
          </div>
        </Section>
      )}

      {/* この案件を続けた場合の未来 */}
      {job.futureNote && (
        <Section title="続けた場合の未来">
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            {job.futureNote}
          </div>
        </Section>
      )}

      {/* 応募判断のポイント */}
      <Section title="応募判断のポイント">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {getDecisionPoints(job, clickCtx?.rank ?? undefined).map((point, i) => (
            <li key={i} style={{ marginBottom: 6, color: '#555', fontSize: 14, lineHeight: 1.5 }}>
              {point}
            </li>
          ))}
        </ul>
      </Section>

      {/* 応募導線 */}
      <div style={{ marginTop: 28, marginBottom: 32 }}>
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#555',
            background: '#f5f5f5',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
            marginTop: 0,
          }}
        >
          {getDecisionMessage(job.compatibility)}
        </p>
        <a
          href={job.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            const ctx = loadClickContext(job.id)
            logApplyClicked(job.id, ctx, {
              workloadFit: job.workloadFit,
              jobScore: job.jobScore,
              userFit: job.userFit,
              overall_score: job.compatibility,
              recommendation_reason: getRecommendReason(job),
              decision_message: getDecisionMessage(job.compatibility),
              eligibility_tags: getEligibilityTags(job),
              exhaustion_risk: calcExhaustionRisk(job),
              client_trust_level: calcClientTrust(job),
            })
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          応募ページを開く →
        </a>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 8 }}>
          募集終了の可能性があります
        </p>
      </div>
    </div>
  )
}

function ScoreItem({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? '#2a7' : score >= 40 ? '#f90' : '#c33'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 'bold', color }}>{score}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#444' }}>{title}</h2>
      <div
        style={{
          background: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: 8,
          padding: '12px 16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #eee',
        fontSize: 14,
      }}
    >
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 'bold', color: '#333' }}>{value}</span>
    </div>
  )
}
