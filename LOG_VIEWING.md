# ログ確認手順

## どこで見るか

Supabase の Table Editor で確認します。

1. https://supabase.com/dashboard にアクセス
2. 対象プロジェクトを開く
3. 左メニュー「Table Editor」→「event_logs」テーブルを選択

---

## event_type の種類

| event_type | タイミング |
|---|---|
| `session_start` | ユーザーがアプリを初めて開いた時 |
| `filters_submitted` | 条件入力フォームを送信した時 |
| `jobs_list_viewed` | 案件一覧が表示された時 |
| `job_detail_viewed` | 案件詳細を開いた時 |
| `apply_clicked` | 「応募ページを開く」ボタンを押した時 |

---

## 絞り込み方（Table Editor の Filter 機能）

### session_id で絞る
- 「Filter」ボタン → `session_id` = `（任意のセッションID）`
- ひとりのユーザーの一連の行動をたどれます

### event_type で絞る
- 「Filter」ボタン → `event_type` = `apply_clicked`
- 応募クリックだけ一覧で見られます

### 日付で絞る
- `created_at` >= `2025-01-01`

---

## payload_json の中身

各イベントの詳細データは `payload_json` カラムに JSON で入っています。

### filters_submitted の例
```json
{
  "minHourlyRate": 2000,
  "continuousPreference": true,
  "avoidConditions": ["長尺", "修正多"]
}
```

### job_detail_viewed / apply_clicked の例
```json
{
  "rank_at_click": 3,
  "score_at_click": 74,
  "workloadFit": 80,
  "jobScore": 65,
  "userFit": 70
}
```

### jobs_list_viewed の例
```json
{
  "shownJobIds": ["job-012", "job-018", "job-025", ...],
  "rankingOrder": ["job-012", "job-018", "job-025", ...]
}
```

---

## Supabase で作るテーブル定義

Table Editor から SQL Editor を開き、以下を実行してください。

```sql
-- テーブル作成
create table event_logs (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  event_type text not null,
  job_id text,
  payload_json jsonb,
  created_at timestamptz default now()
);

-- RLS 有効化（外部からの読み取りを禁止）
alter table event_logs enable row level security;

-- 書き込みのみ許可（誰でも INSERT できる）
create policy "allow insert" on event_logs
  for insert with check (true);

-- SELECT は許可しない（ポリシーなし = deny）
-- あなたは Supabase ダッシュボードから service_role で読めます
```

---

## セキュリティについて

- フロントエンドは anon キーを使って INSERT のみ実行します
- RLS により一般ユーザーは event_logs を SELECT できません
- あなたが Supabase ダッシュボードで見る場合は service_role が使われるため、RLS をバイパスして全件見られます

---

## 初期セットアップ手順

1. Supabase でプロジェクト作成（または既存プロジェクト使用）
2. 上記 SQL を SQL Editor で実行
3. `.env.local` の値を実際のプロジェクト情報で更新
   - `VITE_SUPABASE_URL`: Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY`: Project Settings → API → anon public キー
4. アプリを再起動（`npm run dev`）
