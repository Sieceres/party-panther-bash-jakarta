import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-border shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-to-br from-cyan-400 to-blue-500 text-white border-none font-semibold shadow-[0_4px_12px_rgba(0,207,255,0.2)] hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_6px_20px_rgba(0,207,255,0.3)] hover:-translate-y-1 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm sm:text-base",
        sm: "h-9 px-3 text-xs sm:text-sm",
        lg: "h-11 px-8 text-base sm:text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);