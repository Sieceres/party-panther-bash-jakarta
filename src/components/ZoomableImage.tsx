import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
}

/** Image that opens in a full-size popup when clicked. */
export const ZoomableImage = ({ src, alt = "", className, wrapperClassName }: ZoomableImageProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open image"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn("block w-full cursor-zoom-in", wrapperClassName)}
      >
        <img src={src} alt={alt} className={className} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-2 bg-background/95">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[85vh] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
