import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { PostContent } from "@/types/instagram-post";

interface CarouselNavigationProps {
  slides: PostContent[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
}

export const CarouselNavigation = ({
  slides,
  currentSlide,
  onSlideChange,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
}: CarouselNavigationProps) => {
  const canDelete = slides.length > 1;
  const maxSlides = 10;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Carousel ({slides.length} slide{slides.length !== 1 ? "s" : ""})
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {slides.map((slide, index) => (
          <button
            key={index}
            className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
              index === currentSlide
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground"
            }`}
            onClick={() => onSlideChange(index)}
          >
            {/* Mini preview */}
            <div
              className="w-full h-full rounded overflow-hidden"
              style={{
                background:
                  slide.background?.style === "custom-image" && slide.background?.image
                    ? `url(${slide.background.image})`
                    : slide.background?.style === "hero-style"
                    ? "linear-gradient(135deg, #0d1b3e, #1a1a2e)"
                    : slide.background?.style === "neon-accent"
                    ? "linear-gradient(180deg, #0a0a0f, #1a1a2e)"
                    : "linear-gradient(180deg, #1a1a2e, #0d1b3e)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="w-full h-full flex items-center justify-center bg-black/30">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
            </div>
          </button>
        ))}

        {/* Add slide button */}
        {slides.length < maxSlides && (
          <button
            className="flex-shrink-0 w-16 h-16 rounded border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary hover:bg-muted/50 transition-all"
            onClick={onAddSlide}
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Slide actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onDuplicateSlide(currentSlide)}
          disabled={slides.length >= maxSlides}
        >
          <Copy className="w-4 h-4 mr-1" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDeleteSlide(currentSlide)}
          disabled={!canDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
