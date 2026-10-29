import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RegistrationFormBuilder } from "../form-components/RegistrationFormBuilder";
import { initialRegistrationFields, newField, type RegField } from "@/lib/registration";

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) =>
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));

afterEach(cleanup);

describe("registration setup interactions", () => {
  it("enables defaults for an existing unconfigured event without restoring deleted questions on re-enable", () => {
    let configured: RegField[] = [];
    const Setup = () => {
      const [enabled, setEnabled] = useState(false);
      const [fields, setFields] = useState(() => initialRegistrationFields({ registration_enabled: false, registration_fields: [] }));
      configured = fields;
      return <RegistrationFormBuilder enabled={enabled} onEnabledChange={setEnabled} fields={fields} onFieldsChange={setFields} capacity={null} onCapacityChange={() => {}} />;
    };
    render(<Setup />);
    fireEvent.click(screen.getByRole("switch", { name: "Enable registration form" }));
    expect(configured.map((f) => f.contact)).toEqual(["name", "email", "whatsapp"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete question" })[0]);
    expect(configured.map((f) => f.contact)).toEqual(["email", "whatsapp"]);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("switch", { name: "Enable registration form" }));
    fireEvent.click(screen.getByRole("switch", { name: "Enable registration form" }));
    expect(configured.map((f) => f.contact)).toEqual(["email", "whatsapp"]);
  });

  it("lets the organizer explicitly mark an added email question as respondent email", () => {
    let configured: RegField[] = [];
    const Setup = () => {
      const [fields, setFields] = useState<RegField[]>([{ ...newField("email"), label: "Contact email" }]);
      configured = fields;
      return <RegistrationFormBuilder enabled fields={fields} onFieldsChange={setFields} onEnabledChange={() => {}} capacity={null} onCapacityChange={() => {}} />;
    };
    render(<Setup />);
    fireEvent.click(screen.getByRole("button", { name: "Edit registration form" }));
    const contactSelect = screen.getByRole("option", { name: "Respondent email" }).closest("select");
    if (!contactSelect) throw new Error("Missing contact selector");
    fireEvent.change(contactSelect, { target: { value: "email" } });
    expect(configured[0].contact).toBe("email");
    expect(configured[0].label).toBe("Contact email");
  });
});