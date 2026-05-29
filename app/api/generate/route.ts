import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { PresentationConfig, SlideContent } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function slideCountGuide(duration: number): string {
  if (duration <= 5) return "5〜7枚（タイトル・まとめ含む）";
  if (duration <= 10) return "8〜12枚（タイトル・まとめ含む）";
  return "15〜20枚（タイトル・まとめ含む）";
}

function parseSlidesFromText(text: string): SlideContent[] {
  let jsonText = text.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonText) as unknown;

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

export async function POST(request: Request) {
  try {
    const config = (await request.json()) as PresentationConfig;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: `あなたはプレゼン資料の構成の専門家です。設定に基づいて最適なスライド構成をJSON配列で生成してください。

各スライドは以下の SlideContent 型に従ってください:
- id: string（一意のID、例: "slide-1"）
- type: "title" | "content" | "conclusion"
- title: string
- bulletPoints: string[]（最大5件）
- notes?: string（任意）

構成ルール:
- タイトルスライド1枚（type: "title"）
- 内容スライド（type: "content"）— 所要時間に応じた枚数
- まとめスライド1枚（type: "conclusion"）
- 日本語で生成する
- JSONのみ出力し、説明文は不要

所要時間に応じたスライド総数の目安:
- 5分 → 5〜7枚
- 10分 → 8〜12枚
- 30分 → 15〜20枚`,
      messages: [
        {
          role: "user",
          content: `以下の設定でスライド構成を生成してください。スライド総数の目安: ${slideCountGuide(config.duration)}

${JSON.stringify(config, null, 2)}`,
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
    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate slides" },
      { status: 500 }
    );
  }
}
