"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PresentationSettings,
  SlideContent,
  SlideInput,
} from "@/lib/types";

const MAX_SLIDES = 15;

const INITIAL_SLIDE_HINTS = [
  {
    purpose: "例: プレゼンのタイトルとテーマを伝える",
    content: "例: 新サービス提案書、発表者名、日付など",
  },
  {
    purpose: "例: 自社の課題感を共感してもらう",
    content:
      "例: 人手不足、コスト増、競合との差別化が難しい状況を具体的に伝える",
  },
  {
    purpose: "例: 次のアクションを促す",
    content: "例: 導入ステップ、問い合わせ先、期待される成果のまとめ",
  },
] as const;

function newSlide(): SlideInput {
  return {
    id: crypto.randomUUID(),
    purpose: "",
    content: "",
  };
}

function createInitialSlides(): SlideInput[] {
  return [0, 1, 2].map(() => newSlide());
}

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = useState<PresentationSettings>({
    title: "",
    brandColor: "#0066CC",
    slides: createInitialSlides(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSlide = (id: string, patch: Partial<SlideInput>) => {
    setSettings((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    }));
  };

  const addSlide = () => {
    if (settings.slides.length >= MAX_SLIDES) return;
    setSettings((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide()],
    }));
  };

  const removeSlide = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      slides: prev.slides.filter((s) => s.id !== id),
    }));
  };

  const canGenerate =
    settings.title.trim().length > 0 && settings.slides.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "スライドの生成に失敗しました"
        );
      }
      const data = (await res.json()) as {
        slides: SlideContent[];
        brandColor: string;
      };

      sessionStorage.setItem(
        "pptx_result",
        JSON.stringify({ slides: data.slides, brandColor: data.brandColor })
      );
      sessionStorage.setItem("pptx_inputs", JSON.stringify(settings.slides));
      router.push("/preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          PowerPoint AI 生成
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          スライドごとに目的と内容を入力し、AIがタイトルと箇条書きを生成します
        </p>

        <header className="mb-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label
              htmlFor="presentation-title"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              プレゼン全体タイトル
            </label>
            <input
              id="presentation-title"
              type="text"
              value={settings.title}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="例: 新サービス提案書"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="brand-color"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ブランドカラー
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={settings.brandColor}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    brandColor: e.target.value,
                  }))
                }
                className="h-10 w-14 cursor-pointer rounded border border-gray-300"
              />
              <span className="font-mono text-sm text-gray-600">
                {settings.brandColor}
              </span>
            </div>
          </div>
        </header>

        <section className="mb-6 space-y-4">
          {settings.slides.map((slide, index) => {
            const hints = INITIAL_SLIDE_HINTS[index];
            return (
              <article
                key={slide.id}
                className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => removeSlide(slide.id)}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={`スライド${index + 1}を削除`}
                >
                  ×
                </button>

                <div className="mb-4 flex items-center gap-2 pr-8">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    スライド {index + 1}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      目的
                    </label>
                    <textarea
                      value={slide.purpose}
                      onChange={(e) =>
                        updateSlide(slide.id, { purpose: e.target.value })
                      }
                      placeholder={
                        hints?.purpose ??
                        "例: このスライドで伝えたいことを一言で"
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      説明したい内容
                    </label>
                    <textarea
                      value={slide.content}
                      onChange={(e) =>
                        updateSlide(slide.id, { content: e.target.value })
                      }
                      placeholder={
                        hints?.content ??
                        "例: 伝えたい事実・データ・ストーリーをメモ書きで"
                      }
                      rows={4}
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {settings.slides.length < MAX_SLIDES && (
          <button
            type="button"
            onClick={addSlide}
            className="mb-8 w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            ＋ スライドを追加
          </button>
        )}

        <footer className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "生成中..." : "AIでスライドを生成する"}
          </button>
        </footer>
      </div>
    </div>
  );
}
