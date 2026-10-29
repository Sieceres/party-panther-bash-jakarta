import { describe, expect, it } from "vitest";
import { changeRegistrationFieldType, contactOptionsForType, defaultRegistrationFields, initialRegistrationFields, newField } from "./registration";

describe("registration contact configuration", () => {
  it("adds Name, Email and WhatsApp contact defaults to an existing event without a form", () => {
    const fields = initialRegistrationFields({ registration_enabled: false, registration_fields: [] });
    expect(fields.map(({ label, contact, type, required }) => ({ label, contact, type, required }))).toEqual([
      { label: "Name", contact: "name", type: "short_text", required: true },
      { label: "Email", contact: "email", type: "email", required: true },
      { label: "WhatsApp", contact: "whatsapp", type: "phone", required: false },
    ]);
  });

  it("preserves a saved form with intentionally removed contacts", () => {
    const saved = [newField("single_choice")];
    expect(initialRegistrationFields({ registration_enabled: true, registration_fields: saved })).toEqual(saved);
  });

  it("preserves an enabled form whose questions were all deleted", () => {
    expect(initialRegistrationFields({ registration_enabled: true, registration_fields: [] })).toEqual([]);
  });

  it("preserves configured questions when registration is disabled", () => {
    const saved = [newField("date")];
    expect(initialRegistrationFields({ registration_enabled: false, registration_fields: saved })).toEqual(saved);
  });

  it("retains the name contact when switching to paragraph text", () => {
    expect(changeRegistrationFieldType(defaultRegistrationFields()[0], "long_text").contact).toBe("name");
  });

  it("clears contact and prefill when switching to multiple choice", () => {
    const changed = changeRegistrationFieldType(defaultRegistrationFields()[1], "multi_choice");
    expect(changed.contact).toBeUndefined();
    expect(changed.prefill).toBeNull();
    expect(contactOptionsForType(changed.type)).toEqual([]);
  });

  it("allows explicitly restoring compatible name, email and WhatsApp contacts", () => {
    expect(contactOptionsForType("short_text")).toEqual(["name"]);
    expect(contactOptionsForType("email")).toEqual(["email"]);
    expect(contactOptionsForType("phone")).toEqual(["whatsapp"]);
  });
});