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
