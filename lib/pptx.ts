import PptxGenJS from "pptxgenjs";
import type { SlideContent } from "./types";

function stripHash(color: string): string {
  return color.replace(/^#/, "");
}

export async function generatePptx(
  slides: SlideContent[],
  brandColor: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const brand = stripHash(brandColor);

  for (const slide of slides) {
    const s = pptx.addSlide();

    if (slide.type === "title") {
      s.background = { color: brand };
      s.addText(slide.title, {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1.8,
        fontSize: 44,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
      });
      if (slide.bulletPoints.length > 0) {
        s.addText(
          slide.bulletPoints.map((text) => ({
            text,
            options: { bullet: true, breakLine: true },
          })),
          {
            x: 1,
            y: 4.2,
            w: 8,
            h: 1.5,
            fontSize: 18,
            color: "FFFFFF",
            align: "center",
          }
        );
      }
    } else if (slide.type === "conclusion") {
      s.background = { color: brand };
      s.addText(slide.title, {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1.8,
        fontSize: 36,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
      });
      if (slide.bulletPoints.length > 0) {
        s.addText(
          slide.bulletPoints.map((text) => ({
            text,
            options: { bullet: true, breakLine: true },
          })),
          {
            x: 1,
            y: 4.2,
            w: 8,
            h: 2,
            fontSize: 16,
            color: "FFFFFF",
          }
        );
      }
    } else {
      s.addText(slide.title, {
        x: 0.5,
        y: 0.4,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: brand,
      });
      if (slide.bulletPoints.length > 0) {
        s.addText(
          slide.bulletPoints.map((text) => ({
            text,
            options: { bullet: true, breakLine: true },
          })),
          {
            x: 0.7,
            y: 1.4,
            w: 8.5,
            h: 4.5,
            fontSize: 18,
            color: "333333",
          }
        );
      }
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
}
