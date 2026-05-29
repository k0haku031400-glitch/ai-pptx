"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  PresentationAudience,
  PresentationConfig,
  PresentationPurpose,
} from "@/lib/types";

const PURPOSE_OPTIONS: {
  value: PresentationPurpose;
  label: string;
}[] = [
  { value: "sales", label: "営業提案" },
  { value: "explanation", label: "商品説明" },
  { value: "proposal", label: "企画提案" },
  { value: "training", label: "研修資料" },
];

const AUDIENCE_OPTIONS: {
  value: PresentationAudience;
  label: string;
}[] = [
  { value: "executives", label: "経営陣" },
  { value: "clients", label: "顧客" },
  { value: "employees", label: "一般社員" },
  { value: "general", label: "その他" },
];

const DURATION_OPTIONS = [5, 10, 30] as const;

const STEPS = ["目的・聴衆", "メッセージ", "デザイン", "確認・生成"];

function SelectButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
        selected
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
      }`}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<PresentationPurpose>("sales");
  const [audience, setAudience] = useState<PresentationAudience>("clients");
  const [duration, setDuration] = useState<number>(10);
  const [keyMessages, setKeyMessages] = useState<string[]>([""]);
  const [brandColor, setBrandColor] = useState("#0066CC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = () => {
    if (keyMessages.length < 5) {
      setKeyMessages([...keyMessages, ""]);
    }
  };

  const updateMessage = (index: number, value: string) => {
    const next = [...keyMessages];
    next[index] = value;
    setKeyMessages(next);
  };

  const removeMessage = (index: number) => {
    if (keyMessages.length > 1) {
      setKeyMessages(keyMessages.filter((_, i) => i !== index));
    }
  };

  const config: PresentationConfig = {
    purpose,
    audience,
    duration,
    keyMessages: keyMessages.filter((m) => m.trim()),
    brandColor,
  };

  const purposeLabel =
    PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label ?? "";
  const audienceLabel =
    AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? "";

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "スライドの生成に失敗しました"
        );
      }
      const data = (await res.json()) as { slides: unknown };
      sessionStorage.setItem("pptx-ai-slides", JSON.stringify(data.slides));
      sessionStorage.setItem("pptx-ai-brandColor", brandColor);
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
          ウィザードに沿って入力し、AIがスライド構成を生成します
        </p>

        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i <= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  i === step ? "font-semibold text-blue-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden h-0.5 flex-1 sm:block ${
                    i < step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">目的</p>
                <div className="grid grid-cols-2 gap-2">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <SelectButton
                      key={opt.value}
                      selected={purpose === opt.value}
                      onClick={() => setPurpose(opt.value)}
                    >
                      {opt.label}
                    </SelectButton>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">聴衆</p>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectButton
                      key={opt.value}
                      selected={audience === opt.value}
                      onClick={() => setAudience(opt.value)}
                    >
                      {opt.label}
                    </SelectButton>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">
                  所要時間
                </p>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <SelectButton
                      key={d}
                      selected={duration === d}
                      onClick={() => setDuration(d)}
                    >
                      {d}分
                    </SelectButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                キーメッセージ（最大5件）
              </p>
              {keyMessages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={msg}
                    onChange={(e) => updateMessage(i, e.target.value)}
                    placeholder={`キーメッセージ ${i + 1}`}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {keyMessages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMessage(i)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
              {keyMessages.length < 5 && (
                <button
                  type="button"
                  onClick={addMessage}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  ＋追加
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                ブランドカラー
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-12 w-20 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div
                  className="h-12 w-12 rounded-lg border border-gray-200"
                  style={{ backgroundColor: brandColor }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">入力内容の確認</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-gray-500">目的</dt>
                  <dd className="font-medium">{purposeLabel}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-gray-500">聴衆</dt>
                  <dd className="font-medium">{audienceLabel}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-gray-500">所要時間</dt>
                  <dd className="font-medium">{duration}分</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-gray-500">ブランド色</dt>
                  <dd className="flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-4 w-4 rounded"
                      style={{ backgroundColor: brandColor }}
                    />
                    {brandColor}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-gray-500">キーメッセージ</dt>
                  <dd>
                    {config.keyMessages.length > 0 ? (
                      <ul className="list-inside list-disc space-y-1">
                        {config.keyMessages.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">（未入力）</span>
                    )}
                  </dd>
                </div>
              </dl>

              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full animate-pulse rounded-full bg-blue-600" />
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    AIがスライド構成を生成しています…
                  </p>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "生成中…" : "スライドを生成する"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            戻る
          </button>
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
