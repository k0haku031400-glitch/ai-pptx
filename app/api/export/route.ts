import { NextResponse } from "next/server";
import type { SlideContent } from "@/lib/types";

function slidesToMarkdown(slides: SlideContent[], title: string): string {
  const parts: string[] = [`# ${title}`, "", "---", ""];

  for (const slide of slides) {
    parts.push(`## ${slide.title}`, "");

    for (const point of slide.bulletPoints) {
      parts.push(`- ${point}`);
    }

    if (slide.notes?.trim()) {
      parts.push("", `> ${slide.notes.trim()}`);
    }

    parts.push("", "---", "");
  }

  return parts.join("\n").trimEnd();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slides: SlideContent[];
      title: string;
    };

    const { slides, title } = body;

    if (!slides?.length || !title?.trim()) {
      return NextResponse.json(
        { error: "slides and title are required" },
        { status: 400 }
      );
    }

    const markdown = slidesToMarkdown(slides, title.trim());

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="presentation.md"',
      },
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Failed to export presentation" },
      { status: 500 }
    );
  }
}
