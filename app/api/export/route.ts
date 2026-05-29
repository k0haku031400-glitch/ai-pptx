export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generatePptx } from "@/lib/pptx";
import type { SlideContent } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slides: SlideContent[];
      brandColor: string;
    };

    const { slides, brandColor } = body;

    if (!slides?.length || !brandColor) {
      return NextResponse.json(
        { error: "slides and brandColor are required" },
        { status: 400 }
      );
    }

    const buffer = await generatePptx(slides, brandColor);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="presentation.pptx"',
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
