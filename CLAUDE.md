# SafeWorks β版 — Claude Code 運用ガイド

## 案件データファイル

`src/data/jobs-beta.json` が唯一の案件データソースです。
JobsList・JobDetail はこのファイルを読みます。

---

## 案件を1件追加するとき（URL投入運用）

### ステップ

1. 追加したい案件のURLを伝える
2. Claude Code が URL を確認し、**重複チェック**を行う
3. 下記テンプレートを埋めて `jobs-beta.json` の末尾に追記する

### 重複チェック（Claude Code が実施）

```
# id の最大番号を確認
grep '"id"' src/data/jobs-beta.json

# externalUrl の重複確認
grep '"externalUrl"' src/data/jobs-beta.json
```

- `id` は `job-NNN` 形式（3桁ゼロ埋め）で連番
- 同じ `externalUrl` が既にあれば追加しない

---

## 1件分のJSONテンプレート

```json
{
  "id": "job-NNN",
  "title": "案件タイトル",
  "clientName": "クライアント名 or プラットフォーム掲載名",
  "reward": 0,
  "estimatedHours": 0,
  "hourlyRate": 0,
  "isContinuous": false,
  "difficulty": "beginner",
  "responseSpeed": "normal",
  "continuationRate": 0,
  "revisionAverage": 0,
  "tags": [],
  "cautionTags": [],
  "fitReasonShort": "一言コメント",
  "goodPoints": [],
  "cautionPoints": [],
  "externalUrl": "https://..."
}
```

### フィールド値の選択肢

| フィールド | 値 |
|---|---|
| `difficulty` | `"beginner"` / `"intermediate"` / `"advanced"` |
| `responseSpeed` | `"fast"` / `"normal"` / `"slow"` |
| `isContinuous` | `true` / `false` |
| `hourlyRate` | `reward ÷ estimatedHours` で計算 |

---

## 追記ルール

- `jobs-beta.json` は**配列の末尾**に追加する（既存エントリは変更しない）
- `id` は現在の最大番号 + 1（例：job-015 の次は job-016）
- `externalUrl` は実際の応募ページURL（必須）
- `cautionTags` は `tags` の中から「避けたい条件」に該当するものを再掲
- `fitReasonShort` は15〜30文字程度の一言で記載

---

## 現在の案件IDと URL 一覧

| id | externalUrl |
|---|---|
| job-006 | https://crowdworks.jp/public/jobs/13050383 |
| job-007 | https://crowdworks.jp/public/jobs/13050365 |
| job-008 | https://crowdworks.jp/public/jobs/13049850 |
| job-009 | https://crowdworks.jp/public/jobs/13029964 |
| job-010 | https://crowdworks.jp/public/jobs/13050341 |
| job-011 | https://crowdworks.jp/public/jobs/13051680 |
| job-012 | https://crowdworks.jp/public/jobs/13050290 |
| job-013 | https://crowdworks.jp/public/jobs/13050352 |
| job-014 | https://crowdworks.jp/public/jobs/13051889 |
| job-015 | https://crowdworks.jp/public/jobs/13049914 |
| job-016 | https://crowdworks.jp/public/jobs/13051233 |
| job-017 | https://crowdworks.jp/public/jobs/13056864 |
| job-018 | https://crowdworks.jp/public/jobs/13056407 |
| job-019 | https://crowdworks.jp/public/jobs/13059306 |
| job-020 | https://crowdworks.jp/public/jobs/13035319 |
| job-021 | https://crowdworks.jp/public/jobs/13054496 |
| job-022 | https://crowdworks.jp/public/jobs/13059332 |
| job-023 | https://crowdworks.jp/public/jobs/13051098 |
| job-024 | https://crowdworks.jp/public/jobs/13031709 |
| job-025 | https://crowdworks.jp/public/jobs/13058333 |
| job-026 | https://crowdworks.jp/public/jobs/13056140 |
| job-027 | https://crowdworks.jp/public/jobs/13028263 |
| job-028 | https://crowdworks.jp/public/jobs/13059201 |
| job-029 | https://crowdworks.jp/public/jobs/13033096 |
| job-030 | https://crowdworks.jp/public/jobs/13040089 |

> 案件を追加したら、このテーブルも更新すること。
