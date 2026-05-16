import type { Job } from '../types'

function hasTag(job: Job, ...tags: string[]): boolean {
  return tags.some((t) => job.tags.includes(t) || job.cautionTags.includes(t))
}

function inAnyText(job: Job, keyword: string): boolean {
  return (
    job.title.includes(keyword) ||
    job.tags.some((t) => t.includes(keyword)) ||
    job.goodPoints.some((p) => p.includes(keyword)) ||
    job.cautionPoints.some((p) => p.includes(keyword)) ||
    (job.workStyleNote || '').includes(keyword) ||
    (job.futureNote || '').includes(keyword)
  )
}

// 応募可否・要件タグ
export function getEligibilityTags(job: Job): string[] {
  const result: string[] = []

  // ツール要件
  if (hasTag(job, 'Premiere Pro') || job.title.includes('プレミアプロ') || job.title.includes('Premiere Pro'))
    result.push('Premiere Pro必須')
  if (hasTag(job, 'AE必須') || hasTag(job, 'After Effects'))
    result.push('After Effects必須')
  if (inAnyText(job, 'Canva'))
    result.push('Canva可')
  if (inAnyText(job, 'DaVinci') || inAnyText(job, 'ダビンチ'))
    result.push('DaVinci必須')
  if (inAnyText(job, 'CapCut') || inAnyText(job, 'キャップカット'))
    result.push('CapCut可')

  // 実績・スキル要件
  if (hasTag(job, 'ポートフォリオ必須') || job.cautionPoints.some((p) => p.includes('ポートフォリオ') && p.includes('必須')))
    result.push('ポートフォリオ必須')
  if (
    job.difficulty === 'beginner' &&
    !hasTag(job, 'ポートフォリオ必須', '実務3年必須', 'AE必須', '演者案件', '顔出し必須')
  )
    result.push('初心者OK')

  // 素材提供
  const goodText = job.goodPoints.join(' ')
  const wsNote = job.workStyleNote || ''
  if (
    (goodText.includes('素材') || wsNote.includes('素材')) &&
    (goodText.includes('撮影不要') ||
      goodText.includes('素材提供') ||
      goodText.includes('クライアント提供') ||
      goodText.includes('クライアント指定') ||
      wsNote.includes('素材提供') ||
      wsNote.includes('素材あり') ||
      wsNote.includes('クライアント提供'))
  )
    result.push('素材あり')

  // 台本提供
  if (inAnyText(job, '台本') && !inAnyText(job, '台本作成'))
    result.push('台本あり')

  // テスト単価
  const cautionText = job.cautionPoints.join(' ')
  if (
    (wsNote.includes('テスト') && wsNote.includes('円')) ||
    (cautionText.includes('トライアル') && cautionText.includes('円'))
  )
    result.push('テスト単価あり')

  // 継続依頼（ポジティブ）
  if (job.isContinuous)
    result.push('継続依頼あり')

  // 作業内容タグ（参考情報）
  if (inAnyText(job, '構成作成'))
    result.push('構成作成あり')
  if (inAnyText(job, '図解'))
    result.push('図解作成あり')
  if (inAnyText(job, 'AI音声') || inAnyText(job, '音声合成'))
    result.push('AI音声作成あり')

  // 消耗注意タグ（警告）
  if (job.estimatedHours >= 8)
    result.push('工数重め注意')
  if (job.revisionAverage >= 3)
    result.push('修正多め注意')
  if (inAnyText(job, '自由編集') || job.cautionTags.includes('自由編集'))
    result.push('自由編集注意')

  return result
}

// 消耗リスク総合判定
export function calcExhaustionRisk(job: Job): '低' | '中' | '高' {
  let score = 0

  // === 高リスク要因 ===
  // 企画・撮影込み（作業範囲が広い）
  if (hasTag(job, '企画・撮影込み') || inAnyText(job, '企画込み') || inAnyText(job, '企画から'))
    score += 2
  // 構成・脚本作成
  if (inAnyText(job, '構成作成') || inAnyText(job, '台本作成'))
    score += 1
  // AI音声・特殊作業
  if (inAnyText(job, 'AI音声') || inAnyText(job, '音声合成') || inAnyText(job, 'ボイス合成'))
    score += 1
  // 長尺・重い編集
  if (inAnyText(job, '長尺') || inAnyText(job, '長編') || job.estimatedHours >= 8)
    score += 1
  // 付随作業（サムネ・図解）
  if (inAnyText(job, 'サムネイル'))
    score += 1
  if (inAnyText(job, '図解'))
    score += 1
  // 修正多め
  if (job.revisionAverage >= 3)
    score += 2
  // 量産型
  if (hasTag(job, '大量納品', '量産型') || inAnyText(job, '量産'))
    score += 1
  // 素材自己調達
  if (inAnyText(job, '素材探し') || inAnyText(job, '素材収集'))
    score += 1

  // === 低リスク要因 ===
  const goodText = job.goodPoints.join(' ')
  const wsNote = job.workStyleNote || ''
  // 素材提供あり
  if (
    (goodText.includes('素材') &&
      (goodText.includes('提供') || goodText.includes('クライアント') || goodText.includes('撮影不要'))) ||
    wsNote.includes('素材提供') ||
    wsNote.includes('クライアント提供')
  )
    score -= 1
  // 台本あり（作成不要）
  if (inAnyText(job, '台本') && !inAnyText(job, '台本作成'))
    score -= 1
  // テンプレあり
  if (inAnyText(job, 'テンプレ'))
    score -= 1
  // 参考動画あり（指示が明確）
  if (inAnyText(job, '参考動画'))
    score -= 1
  // ショート動画・短尺
  if ((hasTag(job, 'ショート動画') || hasTag(job, '縦型動画')) && !inAnyText(job, '長尺'))
    score -= 1
  // 修正少なめ
  if (job.revisionAverage <= 1)
    score -= 1

  if (score >= 2) return '高'
  if (score <= -1) return '低'
  return '中'
}

// クライアント信頼性判定
export function calcClientTrust(job: Job): '高' | '中' | '要注意' {
  let score = 0

  // 継続率（発注継続性の代理指標）
  if (job.continuationRate >= 75) score += 2
  else if (job.continuationRate >= 65) score += 1
  else if (job.continuationRate < 55) score -= 2
  else if (job.continuationRate < 65) score -= 1

  // 返信速度（プロ意識の代理指標）
  if (job.responseSpeed === 'fast') score += 1
  else if (job.responseSpeed === 'slow') score -= 1

  // 修正回数（要件明確性の代理指標）
  if (job.revisionAverage <= 1) score += 1
  else if (job.revisionAverage >= 3) score -= 2

  // 報酬非公開
  if (hasTag(job, '報酬非公開') || job.reward === 0) score -= 2

  // 警告ポイント内の危険キーワード
  const cautionText = job.cautionPoints.join(' ')
  if (cautionText.includes('曖昧') || cautionText.includes('不明確') || cautionText.includes('外部'))
    score -= 1

  if (score >= 3) return '高'
  if (score <= 0) return '要注意'
  return '中'
}

// スコアからティア判定
export function getJobTier(compatibility: number): 0 | 1 | 2 {
  if (compatibility >= 70) return 0  // おすすめ
  if (compatibility >= 50) return 1  // 条件次第
  return 2                           // 注意
}

export const TIER_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'おすすめ', color: '#1a7', bg: '#edfaf4' },
  1: { label: '条件次第', color: '#f90', bg: '#fff8ee' },
  2: { label: '注意が必要', color: '#c33', bg: '#fff3f3' },
}
