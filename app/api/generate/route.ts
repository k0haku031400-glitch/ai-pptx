import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { PresentationSettings, SlideContent } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `あなたはプレゼンテーション資料の専門家です。
ユーザーが各スライドに入力した『目的』と『説明したい内容』をもとに、
プロフェッショナルなスライドのタイトルと箇条書きを日本語で生成してください。

出力はJSON配列のみ。説明・コードフェンス不要。
各要素の形式:
{
  "id": "元のSlideInputのid",
  "type": "title" | "content" | "conclusion",
  "title": "スライドタイトル",
  "bulletPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "notes": "発表者ノート（任意）"
}

ルール:
- タイトルは簡潔に15文字以内
- bulletPointsは3〜5個
- bulletPointsは必ず4〜5個生成すること
- 各ポイントは体言止めではなく、具体的な数字や固有名詞を含めること
- 最初のスライドはtype: title、最後はtype: conclusion
- ユーザーの意図を尊重し、内容を膨らませて具体的に書く
- スライドの順番はユーザーの入力順を必ず守ること。並び替えしない。`;

function parseSlidesFromText(text: string): SlideContent[] {
  const raw = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as SlideContent[];
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    "slides" in parsed &&
    Array.isArray((parsed as { slides: unknown }).slides)
  ) {
    return (parsed as { slides: SlideContent[] }).slides;
  }

  throw new Error("Invalid slides JSON structure");
}

function buildUserMessage(settings: PresentationSettings): string {
  const slideLines = settings.slides
    .map(
      (s, i) =>
        `${i + 1}. 目的: ${s.purpose || "（未入力）"}\n   説明したい内容: ${s.content || "（未入力）"}`
    )
    .join("\n");

  return `プレゼンタイトル: ${settings.title}
スライド一覧:
${slideLines}`;
}

export async function POST(request: Request) {
  try {
    const settings = (await request.json()) as PresentationSettings;

    if (!settings.title?.trim() || !settings.slides?.length) {
      return NextResponse.json(
        { error: "title and slides are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(settings),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    const slides = parseSlidesFromText(textBlock.text);
    return NextResponse.json({
      slides,
      brandColor: settings.brandColor,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate slides" },
      { status: 500 }
    );
  }
}
