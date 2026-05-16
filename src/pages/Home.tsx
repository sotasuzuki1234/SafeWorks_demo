import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExperienceLevel, UserConditions } from '../types'
import { saveConditions } from '../utils/session'
import { logSessionStart, logFiltersSubmitted } from '../lib/logger'

// cautionTags と同じ文字列を使うことでマッチング精度を上げる
const AVOID_OPTIONS = ['長尺', 'テロップ多', '修正多', '返信遅め', 'SE多め', '企業案件']

export default function Home() {
  const navigate = useNavigate()
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner')

  useEffect(() => {
    logSessionStart()
  }, [])
  const [minHourlyRate, setMinHourlyRate] = useState(2000)
  const [wantsContinuous, setWantsContinuous] = useState(true)
  const [avoidConditions, setAvoidConditions] = useState<string[]>([])

  function toggleAvoid(label: string) {
    setAvoidConditions((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    )
  }

  function handleSubmit() {
    const conditions: UserConditions = {
      experienceLevel,
      minHourlyRate,
      wantsContinuous,
      avoidConditions,
    }
    saveConditions(conditions)
    logFiltersSubmitted({
      experience_level: experienceLevel,
      min_hourly: minHourlyRate,
      wants_continuity: wantsContinuous,
      avoid_conditions: avoidConditions,
    })
    navigate('/jobs')
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>SafeWorks β</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>消耗しにくい副業案件を選ぶための判断ツール</p>

      <section style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          経験レベル
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((level) => {
            const labels: Record<ExperienceLevel, string> = {
              beginner: '初心者',
              intermediate: '中級者',
              advanced: '上級者',
            }
            return (
              <button
                key={level}
                onClick={() => setExperienceLevel(level)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  border: experienceLevel === level ? '2px solid #333' : '1px solid #ccc',
                  borderRadius: 6,
                  background: experienceLevel === level ? '#333' : '#fff',
                  color: experienceLevel === level ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontWeight: experienceLevel === level ? 'bold' : 'normal',
                }}
              >
                {labels[level]}
              </button>
            )
          })}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          最低許容時給：<span style={{ color: '#333' }}>{minHourlyRate.toLocaleString()}円</span>
        </label>
        <input
          type="range"
          min={500}
          max={8000}
          step={500}
          value={minHourlyRate}
          onChange={(e) => setMinHourlyRate(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
          <span>500円</span>
          <span>8,000円</span>
        </div>
        {minHourlyRate <= 1000 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff3f3', border: '1px solid #f5c0c0', borderRadius: 6, fontSize: 12, color: '#c33' }}>
            ⚠ 時給1,000円以下は副業として収益性が低い水準です。目安は2,000円以上です。
          </div>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          継続案件を希望する
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => setWantsContinuous(val)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: wantsContinuous === val ? '2px solid #333' : '1px solid #ccc',
                borderRadius: 6,
                background: wantsContinuous === val ? '#333' : '#fff',
                color: wantsContinuous === val ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: wantsContinuous === val ? 'bold' : 'normal',
              }}
            >
              {val ? 'はい' : 'どちらでも'}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
          避けたい条件（複数選択可）
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AVOID_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleAvoid(opt)}
              style={{
                padding: '6px 12px',
                border: avoidConditions.includes(opt) ? '2px solid #e55' : '1px solid #ccc',
                borderRadius: 20,
                background: avoidConditions.includes(opt) ? '#fee' : '#fff',
                color: avoidConditions.includes(opt) ? '#c33' : '#555',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '14px 0',
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        案件を見る →
      </button>
    </div>
  )
}
