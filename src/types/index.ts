export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserConditions {
  experienceLevel: ExperienceLevel
  minHourlyRate: number
  wantsContinuous: boolean
  avoidConditions: string[]
}

export interface Job {
  id: string
  title: string
  clientName: string
  reward: number           // 報酬（円）
  estimatedHours: number   // 工数（時間）
  hourlyRate: number       // 時給換算（円）
  isContinuous: boolean    // 継続案件か
  difficulty: ExperienceLevel
  responseSpeed: 'fast' | 'normal' | 'slow'  // 返信速度
  continuationRate: number  // 継続率（%）
  revisionAverage: number   // 平均修正回数
  tags: string[]            // 内容タグ
  cautionTags: string[]     // 注意タグ（避けたい条件と照合）
  fitReasonShort: string    // 適合率の一言理由
  goodPoints: string[]      // 向いてる理由
  cautionPoints: string[]   // 注意点
  workStyleNote: string     // この案件の働き方
  futureNote: string        // この案件を続けた場合の未来
  externalUrl: string       // 応募元ページURL（必須）
  deadline?: string         // 応募期限（YYYY-MM-DD、省略時は期限なし）
}

export interface JobWithScore extends Job {
  compatibility: number    // 総合適合率（0〜100）= (jobScore + userFit + workloadFit) / 3
  jobScore: number         // 案件単体の良さ（0〜100）
  userFit: number          // ユーザーとの適合（0〜100）
  workloadFit: number      // 副業として続けられるか（0〜100）
  whoFitsThis: string      // この案件が向いている人
  whyHardReasons: string[] // あなたには難しい理由
}
