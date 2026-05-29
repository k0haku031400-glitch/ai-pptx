---
# Project Rules

## Stack
- Next.js 14 App Router (TypeScript)
- Tailwind CSS
- Anthropic SDK (`@anthropic-ai/sdk`)
- pptxgenjs（PowerPoint生成）

## File structure
app/
  api/
    generate/route.ts     # スライド構成をJSON生成
    export/route.ts       # JSONからpptxを生成してダウンロード
  page.tsx                # 入力ウィザード
  preview/page.tsx        # スライドプレビュー＆編集
  layout.tsx
lib/
  pptx.ts                 # pptxgenjs ラッパー
  types.ts                # 共通型定義
.env.local                # ANTHROPIC_API_KEY

## Rules
- API キーはサーバーサイドのみ。クライアントに渡さない
- pptxgenjs はサーバーサイド (route.ts) のみで使う
- コンポーネントは page.tsx に直接書く。別ファイルにしない（小規模のため）
- 型定義は lib/types.ts に集約する
---
