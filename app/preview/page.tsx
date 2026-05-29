"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SlideContent, SlideInput } from "@/lib/types";

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onChange(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className={`w-full resize-none rounded border border-blue-400 bg-white px-2 py-1 text-base text-gray-900 focus:outline-none ${className}`}
          rows={3}
        />
      );
    }
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onChange(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            onChange(draft);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`w-full rounded border border-blue-400 bg-white px-2 py-1 text-base text-gray-900 focus:outline-none ${className}`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setEditing(true);
      }}
      className={`cursor-text rounded px-1 text-gray-900 hover:bg-blue-50 ${className}`}
      title="クリックして編集"
    >
      {value || (
        <span className="text-gray-500">（クリックして入力）</span>
      )}
    </span>
  );
}

const TYPE_LABELS: Record<string, string> = {
  title: "タイトル",
  content: "内容",
  conclusion: "まとめ",
};

export default function PreviewPage() {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [slideInputs, setSlideInputs] = useState<SlideInput[]>([]);
  const [brandColor, setBrandColor] = useState("#0066CC");
  const [presentationTitle, setPresentationTitle] = useState("プレゼンテーション");
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const rawResult = sessionStorage.getItem("pptx_result");
    const rawInputs = sessionStorage.getItem("pptx_inputs");

    if (rawResult) {
      try {
        const result = JSON.parse(rawResult) as {
          slides: SlideContent[];
          brandColor: string;
          title?: string;
        };
        setSlides(result.slides ?? []);
        if (result.brandColor) setBrandColor(result.brandColor);
        if (result.title?.trim()) setPresentationTitle(result.title.trim());
      } catch {
        setSlides([]);
      }
    }

    if (rawInputs) {
      try {
        setSlideInputs(JSON.parse(rawInputs) as SlideInput[]);
      } catch {
        setSlideInputs([]);
      }
    }

    const storedTitle = sessionStorage.getItem("pptx_title");
    if (storedTitle?.trim()) {
      setPresentationTitle(storedTitle.trim());
    }

    setReady(true);
  }, []);

  const purposeBySlideId = new Map(
    slideInputs.map((input) => [input.id, input.purpose])
  );

  const persistResult = (nextSlides: SlideContent[], color = brandColor) => {
    sessionStorage.setItem(
      "pptx_result",
      JSON.stringify({
        slides: nextSlides,
        brandColor: color,
        title: presentationTitle,
      })
    );
  };

  const updateSlide = (index: number, patch: Partial<SlideContent>) => {
    setSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      persistResult(next);
      return next;
    });
  };

  const updateBullet = (slideIndex: number, bulletIndex: number, value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      const bullets = [...next[slideIndex].bulletPoints];
      bullets[bulletIndex] = value;
      next[slideIndex] = { ...next[slideIndex], bulletPoints: bullets };
      persistResult(next);
      return next;
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, title: presentationTitle }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "presentation.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("ダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center text-base text-gray-600">
        読み込み中…
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-base text-gray-800">スライドデータがありません。</p>
        <Link href="/" className="text-base font-medium text-blue-700 hover:underline">
          ← 最初からやり直す
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">スライドプレビュー</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "ダウンロード中…" : "Markdownをダウンロード"}
            </button>
          </div>
        </div>

        <Link
          href="/"
          className="mb-6 inline-block text-base text-gray-600 hover:text-blue-700"
        >
          ← 最初からやり直す
        </Link>

        <div className="space-y-6">
          {slides.map((slide, i) => (
            <article
              key={slide.id ?? i}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {TYPE_LABELS[slide.type] ?? slide.type}
                </span>
                <span className="text-sm font-mono text-gray-600">
                  {i + 1} / {slides.length}
                </span>
              </div>

              {purposeBySlideId.get(slide.id) && (
                <p className="mb-3 text-sm leading-relaxed text-gray-600">
                  <span className="font-medium text-gray-700">目的:</span>{" "}
                  {purposeBySlideId.get(slide.id)}
                </p>
              )}

              <EditableText
                value={slide.title}
                onChange={(title) => updateSlide(i, { title })}
                className="mb-4 block text-2xl font-bold text-gray-900"
              />

              {slide.bulletPoints.length > 0 && (
                <ul className="space-y-3 text-gray-900">
                  {slide.bulletPoints.map((bp, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-1 shrink-0 text-lg font-bold text-gray-500">
                        •
                      </span>
                      <EditableText
                        value={bp}
                        onChange={(v) => updateBullet(i, j, v)}
                        className="flex-1 text-base leading-relaxed"
                        multiline
                      />
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
