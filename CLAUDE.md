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
  "externalUrl": "https://...",
  "deadline": "YYYY-MM-DD"
}
```

### フィールド値の選択肢

| フィールド | 値 |
|---|---|
| `difficulty` | `"beginner"` / `"intermediate"` / `"advanced"` |
| `responseSpeed` | `"fast"` / `"normal"` / `"slow"` |
| `isContinuous` | `true` / `false` |
| `hourlyRate` | `reward ÷ estimatedHours` で計算 |
| `deadline` | CrowdWorksの募集期限（`YYYY-MM-DD` 形式）。期限不明の場合は省略 |

---

## 追記ルール

- `jobs-beta.json` は**配列の末尾**に追加する（既存エントリは変更しない）
- `id` は現在の最大番号 + 1（例：job-015 の次は job-016）
- `externalUrl` は実際の応募ページURL（必須）
- `cautionTags` は `tags` の中から「避けたい条件」に該当するものを再掲
- `fitReasonShort` は15〜30文字程度の一言で記載
- `deadline` はCrowdWorksの案件ページに記載の募集期限を `YYYY-MM-DD` で設定する。期限が過ぎると一覧から自動的に除外される

---

## 現在の案件IDと URL 一覧

| id | externalUrl | deadline |
|---|---|---|
| job-001 | https://crowdworks.jp/public/jobs/13080567 | 2026-05-07 |
| job-002 | https://crowdworks.jp/public/jobs/13079849 | 2026-05-07 |
| job-003 | https://crowdworks.jp/public/jobs/13079816 | 2026-05-07 |
| job-004 | https://crowdworks.jp/public/jobs/13078554 | 2026-04-29 |
| job-005 | https://crowdworks.jp/public/jobs/13077977 | 2026-05-02 |
| job-006 | https://crowdworks.jp/public/jobs/12968333 | 2026-04-29 |
| job-007 | https://crowdworks.jp/public/jobs/13012757 | 2026-04-30 |
| job-008 | https://crowdworks.jp/public/jobs/13078868 | 2026-05-06 |
| job-009 | https://crowdworks.jp/public/jobs/13078802 | 2026-05-06 |
| job-010 | https://crowdworks.jp/public/jobs/13078768 | 2026-04-25 |
| job-011 | https://crowdworks.jp/public/jobs/13075795 | 2026-05-05 |
| job-012 | https://crowdworks.jp/public/jobs/13078497 | 2026-05-06 |
| job-013 | https://crowdworks.jp/public/jobs/13040888 | 2026-05-06 |
| job-014 | https://crowdworks.jp/public/jobs/13077468 | 2026-05-06 |
| job-015 | https://crowdworks.jp/public/jobs/13076276 | 2026-05-05 |
| job-016 | https://crowdworks.jp/public/jobs/13076067 | 2026-05-05 |
| job-017 | https://crowdworks.jp/public/jobs/13074060 | 2026-05-05 |
| job-018 | https://crowdworks.jp/public/jobs/13074964 | 2026-05-05 |
| job-019 | https://crowdworks.jp/public/jobs/13074059 | 2026-05-05 |
| job-020 | https://crowdworks.jp/public/jobs/13074880 | 2026-05-05 |
| job-021 | https://crowdworks.jp/public/jobs/12784249 | 2026-05-03 |
| job-022 | https://crowdworks.jp/public/jobs/13071006 | 2026-05-03 |
| job-023 | https://crowdworks.jp/public/jobs/13073451 | 2026-05-04 |
| job-024 | https://crowdworks.jp/public/jobs/13072094 | 2026-05-04 |
| job-025 | https://crowdworks.jp/public/jobs/13073566 | 2026-05-04 |
| job-026 | https://crowdworks.jp/public/jobs/12984794 | 2026-05-10 |
| job-027 | https://crowdworks.jp/public/jobs/13022312 | 2026-05-10 |
| job-028 | https://crowdworks.jp/public/jobs/13085640 | 2026-05-10 |
| job-029 | https://crowdworks.jp/public/jobs/13041392 | 2026-05-10 |
| job-030 | https://crowdworks.jp/public/jobs/13084145 | 2026-05-09 |
| job-031 | https://crowdworks.jp/public/jobs/13084218 | 2026-05-09 |
| job-032 | https://crowdworks.jp/public/jobs/13069383 | 2026-05-09 |
| job-033 | https://crowdworks.jp/public/jobs/13084705 | 2026-05-09 |
| job-034 | https://crowdworks.jp/public/jobs/13083526 | 2026-05-08 |
| job-035 | https://crowdworks.jp/public/jobs/13082088 | 2026-05-08 |
| job-036 | https://crowdworks.jp/public/jobs/13083782 | 2026-05-08 |
| job-037 | https://crowdworks.jp/public/jobs/13083719 | 2026-05-08 |
| job-038 | https://crowdworks.jp/public/jobs/13083013 | 2026-05-08 |
| job-039 | https://crowdworks.jp/public/jobs/13082599 | 2026-05-08 |
| job-040 | https://crowdworks.jp/public/jobs/13083431 | 2026-05-08 |
| job-041 | https://crowdworks.jp/public/jobs/13091876 | 2026-05-13 |
| job-042 | https://crowdworks.jp/public/jobs/13091354 | 2026-05-13 |
| job-043 | https://crowdworks.jp/public/jobs/13091285 | 2026-05-13 |
| job-044 | https://crowdworks.jp/public/jobs/13089040 | 2026-05-12 |
| job-045 | https://crowdworks.jp/public/jobs/13089917 | 2026-05-12 |
| job-046 | https://crowdworks.jp/public/jobs/13089404 | 2026-05-12 |
| job-047 | https://crowdworks.jp/public/jobs/13090516 | 2026-05-12 |
| job-048 | https://crowdworks.jp/public/jobs/13089516 | 2026-05-12 |
| job-049 | https://crowdworks.jp/public/jobs/12827811 | 2026-05-12 |
| job-050 | https://crowdworks.jp/public/jobs/12807453 | 2026-05-12 |
| job-051 | https://crowdworks.jp/public/jobs/13087731 | 2026-05-11 |
| job-052 | https://crowdworks.jp/public/jobs/13088235 | 2026-05-11 |
| job-053 | https://crowdworks.jp/public/jobs/13086563 | 2026-05-11 |
| job-054 | https://crowdworks.jp/public/jobs/13089512 | 2026-05-11 |
| job-055 | https://crowdworks.jp/public/jobs/12850113 | 2026-05-11 |
| job-056 | https://crowdworks.jp/public/jobs/13098891 | 2026-05-16 |
| job-057 | https://crowdworks.jp/public/jobs/13059215 | 2026-05-16 |
| job-058 | https://crowdworks.jp/public/jobs/13097823 | 2026-05-15 |
| job-059 | https://crowdworks.jp/public/jobs/13098100 | 2026-05-15 |
| job-060 | https://crowdworks.jp/public/jobs/13095617 | 2026-05-15 |
| job-061 | https://crowdworks.jp/public/jobs/13096901 | 2026-05-15 |
| job-062 | https://crowdworks.jp/public/jobs/13095615 | 2026-05-15 |
| job-063 | https://crowdworks.jp/public/jobs/13095614 | 2026-05-15 |
| job-064 | https://crowdworks.jp/public/jobs/13094976 | 2026-05-14 |
| job-065 | https://crowdworks.jp/public/jobs/13095065 | 2026-05-14 |
| job-066 | https://crowdworks.jp/public/jobs/13095196 | 2026-05-14 |
| job-067 | https://crowdworks.jp/public/jobs/12966469 | 2026-05-14 |
| job-068 | https://crowdworks.jp/public/jobs/13095481 | 2026-05-14 |
| job-069 | https://crowdworks.jp/public/jobs/12362011 | 2026-05-14 |
| job-070 | https://crowdworks.jp/public/jobs/13094616 | 2026-05-14 |
| job-071 | https://crowdworks.jp/public/jobs/13095462 | 2026-05-14 |
| job-072 | https://crowdworks.jp/public/jobs/13092613 | 2026-05-14 |
| job-073 | https://crowdworks.jp/public/jobs/13022671 | 2026-05-14 |
| job-074 | https://crowdworks.jp/public/jobs/13015932 | 2026-05-14 |

> 案件を追加したら、このテーブルも更新すること。
