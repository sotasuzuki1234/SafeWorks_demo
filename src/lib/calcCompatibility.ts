import type { Job, UserConditions } from '../types'

// タグ検出ヘルパー（tags・cautionTags 両方を検索、完全一致）
function hasTag(job: Job, ...tags: string[]): boolean {
  return tags.some((t) => job.tags.includes(t) || job.cautionTags.includes(t))
}

// ① jobScore: 案件自体の質スコア（ベース 50）
// +20 高単価（時給3000円以上）
// +10 継続案件
// +10 フルリモート
// -20 報酬非公開
// -30 演者案件
// -20 動画編集以外
export function calcJobScore(job: Job): number {
  let score = 50
  if (job.hourlyRate >= 3000) score += 20
  if (job.isContinuous) score += 10
  if (hasTag(job, 'フルリモート')) score += 10
  if (hasTag(job, '報酬非公開')) score -= 20
  if (hasTag(job, '演者案件')) score -= 30
  if (hasTag(job, '動画編集ではない', '動画編集以外')) score -= 20
  return Math.max(0, Math.min(100, score))
}

// ② userFit: ユーザー適合スコア（副業2.5層固定、ベース 50）
// 減点: -40 acting, -30 AE等高度スキル, -20 ポートフォリオ/3年実務, -20 専門領域特化
// 加点: +20 編集作業のみ, +10 指示ベースで完結
export function calcUserFit(job: Job, _conditions: UserConditions): number {
  let score = 50

  // 減点
  if (hasTag(job, '演者案件', '顔出し必須')) score -= 40
  if (hasTag(job, 'AE必須', '専門資格必須', '専門スキル必須')) score -= 30
  if (hasTag(job, 'ポートフォリオ必須', '実務3年必須')) score -= 20
  if (hasTag(job, '専門領域特化')) score -= 20

  // 加点
  if (hasTag(job, '動画編集') && !hasTag(job, '演者案件')) score += 20
  if (!hasTag(job, '演者案件') && !hasTag(job, '企画・撮影込み')) score += 10

  return Math.max(0, Math.min(100, score))
}

// ③ workloadFit: 副業として無理なく続けられるか（ベース 40）【評価の最優先軸】
// ベース40 = 副業成立はデフォルト厳しめ評価
// 【稼働時間ペナルティ・最重要】
//   週20時間以上 → -40, 週15時間以上 → -20
// 【副業不向き条件】
//   出社必須 → -30, 平日日中対応必須 → -30, 長時間拘束/準常駐 → -30
//   大量納品/量産 → -20, 低単価（時給2000未満） → -20, 極低単価（1本500円以下） → -30
// 【長期契約ペナルティ】6ヶ月以上 → -20, 3ヶ月以上 → -10
// 【加点】高単価 → +10
// 【副業適合ボーナス（最大+40）】
//   週10時間以内 → +20, 完全自由稼働 → +20
//   納期のみ管理 → +10, 単発/週5時間以下 → +10
//   納期余裕あり → +10, 修正回数少（平均1回以下） → +10
export function calcWorkloadFit(job: Job): number {
  let score = 40  // ① ベース40（副業成立はデフォルト厳しめ）

  // 【最優先】稼働時間ペナルティ
  if (hasTag(job, '週20時間以上')) {
    score -= 40
  } else if (hasTag(job, '週15時間以上')) {
    score -= 20
  }

  // 副業不向き条件
  if (hasTag(job, 'オフィス出社必須', '現地出勤必須')) score -= 30
  if (hasTag(job, '平日日中対応必須')) score -= 30
  if (hasTag(job, '長時間拘束', '準常駐')) score -= 30  // ③ 新規
  if (hasTag(job, '大量納品', '量産型')) score -= 20
  if (job.hourlyRate < 2000) score -= 20
  if (job.reward <= 500) score -= 30

  // 長期契約ペナルティ
  if (hasTag(job, '長期6ヶ月以上')) {
    score -= 20
  } else if (hasTag(job, '長期3ヶ月以上')) {
    score -= 10
  }

  // 高単価ボーナス
  if (job.hourlyRate >= 3000) score += 10

  // ② 副業適合ボーナス（最大+40）
  let bonus = 0
  if (hasTag(job, '週10時間以内')) bonus += 20
  if (hasTag(job, '完全自由稼働')) bonus += 20
  if (hasTag(job, '納期のみ管理')) bonus += 10
  if (hasTag(job, '単発', '週5時間以下')) bonus += 10
  if (hasTag(job, '納期余裕あり')) bonus += 10        // ③ 副業継続性ボーナス
  if (job.revisionAverage <= 1) bonus += 10           // ③ 修正回数少
  score += Math.min(bonus, 40)

  return Math.max(0, Math.min(100, score))
}

// ④ compatibility = (workloadFit×0.5) + (jobScore×0.3) + (userFit×0.2) + 強制制約
// 優先順位: ① 副業成立性(workloadFit 0.5) → ② 案件の質(jobScore 0.3) → ③ ユーザー適合(userFit 0.2)
// ※jobScoreの加点は副業成立前提（workloadFit < 40 の場合、jobScoreの加点部分を半減）
// 強制制約（副業不向きフラグ → 上限50%）:
//   演者案件 → 最大30
//   出社必須 → 最大50
//   週15時間以上 / 週20時間以上 / 平日日中対応必須 / 長時間拘束 / 副業不向き → 最大50
export function calcCompatibility(job: Job, conditions: UserConditions): number {
  const js = calcJobScore(job)
  const uf = calcUserFit(job, conditions)
  const wf = calcWorkloadFit(job)

  // workloadFit < 40（副業として成立しない）場合、jobScoreの加点部分を半減
  const jsBonus = Math.max(0, js - 50)
  const effectiveJs = wf < 40 ? 50 + Math.floor(jsBonus / 2) : js

  // 評価優先順位: ① 副業成立性 → ② 時給・効率 → ③ 継続性 → ④ 案件の質
  let score = Math.round(wf * 0.5 + effectiveJs * 0.3 + uf * 0.2)

  // 強制制約（キャップ）
  if (hasTag(job, '演者案件')) score = Math.min(score, 30)
  if (hasTag(job, 'オフィス出社必須', '現地出勤必須')) score = Math.min(score, 50)

  // 副業不向きフラグ → 上限50%
  // （演者案件・出社必須は上記で処理済みのため除外）
  if (
    hasTag(job, '週15時間以上', '週20時間以上', '平日日中対応必須', '長時間拘束', '副業不向き') &&
    !hasTag(job, '演者案件') &&
    !hasTag(job, 'オフィス出社必須', '現地出勤必須')
  ) {
    score = Math.min(score, 50)
  }

  return score
}

// ⑤ difficulty 再設計
export function calcDifficulty(job: Job): 'beginner' | 'intermediate' | 'advanced' {
  if (hasTag(job, '演者案件')) return 'advanced'
  if (hasTag(job, 'AE必須', '専門資格必須', '専門スキル必須')) return 'advanced'
  if (hasTag(job, 'ポートフォリオ必須', '実務3年必須')) return 'intermediate'
  if (hasTag(job, '現地出勤必須', 'オフィス出社必須')) return 'intermediate'
  return 'beginner'
}

// ⑥ この案件が向いている人
export function getWhoFitsThis(job: Job): string {
  if (hasTag(job, '演者案件')) return 'カメラ前での発信・出演経験がある人'
  if (hasTag(job, 'AE必須')) return 'After Effectsを使いこなせる中〜上級者'
  if (hasTag(job, 'ポートフォリオ必須')) return '実績・ポートフォリオを持つ中級者以上'
  if (hasTag(job, '実務3年必須')) return '動画編集の実務経験が豊富なベテラン'
  if (hasTag(job, 'オフィス出社必須', '現地出勤必須')) return '通勤可能なエリア在住の専業〜準専業ワーカー'
  if (job.hourlyRate >= 3000 && job.isContinuous) return '安定した高単価を求める中〜上級者'
  return '初心者〜中級者・指示ベースで進めたい人'
}

// ⑦ あなたには難しい理由
export function getWhyHardForUser(job: Job, _conditions: UserConditions): string[] {
  const reasons: string[] = []

  if (hasTag(job, '演者案件')) {
    reasons.push('動画編集ではなくカメラ前での出演が求められます')
  }
  if (hasTag(job, 'AE必須')) {
    reasons.push('After Effectsの実務スキルが必須です')
  }
  if (hasTag(job, '専門資格必須', '専門スキル必須')) {
    reasons.push('専門的な資格・スキルが応募の前提条件です')
  }
  if (hasTag(job, 'ポートフォリオ必須')) {
    reasons.push('ポートフォリオ審査があり、実績なしでは通過が困難です')
  }
  if (hasTag(job, '実務3年必須')) {
    reasons.push('3年以上の実務経験が求められています')
  }
  if (hasTag(job, 'オフィス出社必須', '現地出勤必須')) {
    reasons.push('特定地域への出社・現地参加が必須です')
  }
  if (hasTag(job, '週20時間以上')) {
    reasons.push('週20時間以上の稼働が必要で、副業の範囲を大きく超えます')
  } else if (hasTag(job, '週15時間以上')) {
    reasons.push('週15時間以上の稼働が必要で、副業としては重い負荷です')
  }
  if (hasTag(job, '平日日中対応必須')) {
    reasons.push('平日日中の対応が必須で、本業との両立が難しいです')
  }
  if (hasTag(job, '長時間拘束')) {
    reasons.push('準社員・常駐に近い長時間拘束が発生します')
  }
  if (hasTag(job, '長期6ヶ月以上')) {
    reasons.push('6ヶ月以上の長期契約で、副業として身動きが取りにくくなります')
  } else if (hasTag(job, '長期3ヶ月以上')) {
    reasons.push('3ヶ月以上の契約が前提で、柔軟な終了が難しい場合があります')
  }
  if (job.hourlyRate < 2000) {
    reasons.push(`時給${job.hourlyRate.toLocaleString()}円は副業として収益性が低いです`)
  }

  return reasons
}
