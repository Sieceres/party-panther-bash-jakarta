import { useState } from "react";
import { Bold, Italic, Underline, Highlighter, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "./ColorPicker";

interface TextFormatToolbarProps {
  /** DOM id of the textarea/input this toolbar controls. */
  targetId: string;
  value: string;
  onChange: (next: string) => void;
}

const wrapSelection = (
  targetId: string,
  value: string,
  before: string,
  after: string,
  onChange: (v: string) => void,
) => {
  const el = document.getElementById(targetId) as
    | HTMLTextAreaElement
    | HTMLInputElement
    | null;
  const start = el?.selectionStart ?? value.length;
  const end = el?.selectionEnd ?? value.length;
  const selected = value.slice(start, end) || "text";
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    if (!el) return;
    el.focus();
    const s = start + before.length;
    try {
      (el as HTMLTextAreaElement).setSelectionRange(s, s + selected.length);
    } catch {
      /* noop */
    }
  });
};

/**
 * MS Office-style mini formatting toolbar. Wraps the current selection in
 * lightweight markup that the renderer parses:
 *  - **text**       → highlight in the configured accent color
 *  - __text__       → bold
 *  - //text//       → italic
 *  - [u]text[/u]    → underline
 *  - [c:#hex]text[/c] → arbitrary color
 */
export const TextFormatToolbar = ({ targetId, value, onChange }: TextFormatToolbarProps) => {
  const [colorOpen, setColorOpen] = useState(false);
  const [color, setColor] = useState("#00CFFF");

  const w = (b: string, a: string) => wrapSelection(targetId, value, b, a, onChange);

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-md border bg-muted/40">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title="Bold"
        onClick={() => w("__", "__")}
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title="Italic"
        onClick={() => w("//", "//")}
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title="Underline"
        onClick={() => w("[u]", "[/u]")}
      >
        <Underline className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title="Highlight with accent color"
        onClick={() => w("**", "**")}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </Button>
      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 gap-1"
            title="Custom text color"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-3 h-3 rounded-sm border border-border"
              style={{ background: color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-2">
            <ColorPicker label="Color for selection" value={color} onChange={setColor} />
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={() => {
                w(`[c:${color}]`, "[/c]");
                setColorOpen(false);
              }}
            >
              Apply to selection
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};