export type RegFieldType = "short_text" | "long_text" | "email" | "phone" | "single_choice" | "multi_choice" | "number" | "date";

export interface RegField {
  id: string;
  label: string;
  type: RegFieldType;
  required: boolean;
  options?: string[];
  contact?: "name" | "email" | "whatsapp";
  /** Which profile value to prefill with, if any */
  prefill?: "display_name" | "email" | "instagram" | "whatsapp" | "gender" | "age" | null;
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

export const REGISTRATION_PRIVACY_TEXT = "The information below is only shared with the organizer, not Party Panther.";

export const defaultRegistrationFields = (): RegField[] => [
  { ...newField(), label: "Name", required: true, contact: "name", prefill: "display_name" },
  { ...newField("email"), label: "Email", required: true, contact: "email", prefill: "email" },
  { ...newField("phone"), label: "WhatsApp", contact: "whatsapp", prefill: "whatsapp" },
];

/** Seed only new forms; an enabled form may intentionally have no contacts or questions. */
export const initialRegistrationFields = (event?: {
  registration_enabled?: boolean;
  registration_fields?: unknown;
}): RegField[] => {
  const saved = Array.isArray(event?.registration_fields) ? event.registration_fields as RegField[] : [];
  if (saved.length || event?.registration_enabled) return saved;
  return defaultRegistrationFields();
};

export const contactOptionsForType = (type: RegFieldType): NonNullable<RegField["contact"]>[] => {
  if (type === "short_text" || type === "long_text") return ["name"];
  if (type === "email") return ["email"];
  if (type === "phone") return ["whatsapp"];
  return [];
};

export const changeRegistrationFieldType = (field: RegField, type: RegFieldType): RegField => ({
  ...field,
  type,
  contact: field.contact && contactOptionsForType(type).includes(field.contact) ? field.contact : undefined,
  prefill: isChoice(type) ? null : field.prefill,
  options: isChoice(type) ? field.options?.length ? field.options : ["Option 1"] : undefined,
});

export const formatAnswer = (v: unknown) =>
  Array.isArray(v) ? v.join(", ") : v === null || v === undefined ? "" : String(v);
