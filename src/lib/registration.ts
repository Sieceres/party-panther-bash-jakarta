export type RegFieldType = "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multi_choice" | "number" | "date";

export interface RegField {
  id: string;
  label: string;
  type: RegFieldType;
  required: boolean;
  options?: string[];
  /** Which profile value to prefill with, if any */
  prefill?: "instagram" | "whatsapp" | "gender" | "age" | null;
}

export const FIELD_TYPE_LABELS: Record<RegFieldType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  email: "Email",
  phone: "Phone",
  single_choice: "Multiple choice (pick one)",
  multi_choice: "Checkboxes (pick several)",
  number: "Number",
  date: "Date",
};

export const newField = (type: RegFieldType = "short_text"): RegField => ({
  id: Math.random().toString(36).slice(2, 10),
  label: "",
  type,
  required: false,
  options: type === "single_choice" || type === "multi_choice" ? ["Option 1"] : undefined,
});

export const isChoice = (t: RegFieldType) => t === "single_choice" || t === "multi_choice";

export const formatAnswer = (v: unknown) =>
  Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v);
