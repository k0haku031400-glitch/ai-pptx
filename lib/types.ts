export type PresentationPurpose =
  | "sales"
  | "explanation"
  | "proposal"
  | "training";

export type PresentationAudience =
  | "executives"
  | "clients"
  | "employees"
  | "general";

export interface PresentationConfig {
  purpose: PresentationPurpose;
  audience: PresentationAudience;
  duration: number;
  keyMessages: string[];
  brandColor: string;
}

export type SlideType = "title" | "content" | "conclusion";

export interface SlideContent {
  id: string;
  type: SlideType;
  title: string;
  bulletPoints: string[];
  notes?: string;
}

/** ユーザーが1枚ずつ入力するスライドの「素材」 */
export interface SlideInput {
  id: string;
  purpose: string;
  content: string;
}

/** アプリ全体の設定 */
export interface PresentationSettings {
  title: string;
  brandColor: string;
  slides: SlideInput[];
}
