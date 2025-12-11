import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😎", "🤗", "🤔", "🤐", "😏"],
  "Party": ["🎉", "🎊", "🎈", "🎁", "🎂", "🎄", "🎃", "🎆", "🎇", "✨", "🪩", "🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🥁", "🎺", "🎷"],
  "Food & Drink": ["🍕", "🍔", "🍟", "🌭", "🍿", "🧁", "🎂", "🍰", "🍩", "🍪", "🍫", "🍬", "🍭", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹", "🧃"],
  "Activities": ["⚽", "🏀", "🎾", "🏐", "🎱", "🎳", "🏓", "🎯", "🎮", "🕹️", "🎲", "🧩", "🎰", "🎨", "🎭", "🎪", "🎢", "🎡", "🎠", "🛝"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💯", "💢", "💥", "💫", "💦", "🔥", "⭐", "🌟", "💫", "✅", "❌", "⚡"],
  "Gestures": ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "🤟", "🤘", "👌", "🤏", "👋", "🤚", "✋", "🖖", "💪", "🦾", "🙏", "☝️", "👆"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

export const EmojiPicker = ({ onSelect, trigger }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Party");

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  const filteredEmojis = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(() => true) // Simple filter, would need emoji names for real search
    : EMOJI_CATEGORIES[activeCategory];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Smile className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="space-y-2">
          <Input
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          
          {!search && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs whitespace-nowrap"
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {filteredEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
