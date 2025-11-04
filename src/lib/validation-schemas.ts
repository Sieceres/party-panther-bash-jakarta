import { z } from "zod";

// Event validation schema
export const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  venue_name: z.string()
    .trim()
    .min(1, "Venue name is required")
    .max(100, "Venue name must be less than 100 characters"),
  venue_address: z.string()
    .trim()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  organizer_name: z.string()
    .trim()
    .max(100, "Organizer name must be less than 100 characters")
    .optional(),
  organizer_whatsapp: z.string()
    .trim()
    .regex(/^[+]?[0-9\s()-]*$/, "Invalid phone number format")
    .max(20, "WhatsApp number must be less than 20 characters")
    .optional(),
  date: z.date({
    required_error: "Event date is required",
  }),
  time: z.string()
    .min(1, "Event time is required"),
});

// Promo validation schema
export const promoSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  discount_text: z.string()
    .trim()
    .min(1, "Discount text is required")
    .max(200, "Discount text must be less than 200 characters"),
  venue_name: z.string()
    .trim()
    .min(1, "Venue name is required")
    .max(100, "Venue name must be less than 100 characters"),
  venue_address: z.string()
    .trim()
    .max(200, "Address must be less than 200 characters")
    .optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  comment: z.string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters"),
});

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string()
    .trim()
    .max(500, "Review must be less than 500 characters")
    .optional(),
});

// Profile validation schema
export const profileSchema = z.object({
  display_name: z.string()
    .trim()
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  bio: z.string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  whatsapp: z.string()
    .trim()
    .regex(/^[+]?[0-9\s()-]*$/, "Invalid phone number format")
    .max(20, "WhatsApp number must be less than 20 characters")
    .optional(),
  instagram: z.string()
    .trim()
    .max(50, "Instagram handle must be less than 50 characters")
    .optional(),
  age: z.number()
    .int()
    .min(18, "Must be at least 18 years old")
    .max(120, "Invalid age")
    .optional(),
});

// Helper function to sanitize text input
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 1000); // Enforce max length
};

// Helper function to sanitize and validate WhatsApp number
export const sanitizeWhatsApp = (whatsapp: string): string => {
  return whatsapp
    .trim()
    .replace(/[^+0-9\s()-]/g, '') // Only allow valid phone chars
    .substring(0, 20);
};
