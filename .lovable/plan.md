

## Batch Import Promos/Events from Image or Document

### The Idea

The uploaded image shows a weekly promo schedule grid — multiple venues, each with promos across days of the week. Rather than creating promos one by one, we build a **batch import flow**: upload an image/document, AI extracts ALL promos into a reviewable table, user confirms and bulk-inserts them.

### Architecture

```text
Upload image/doc → Edge Function (Gemini vision) → Extract array of promos → Review table UI → Bulk insert to Supabase
```

### Changes

#### 1. New Edge Function: `supabase/functions/extract-from-image/index.ts`

- Accepts base64 image + `type` param (`event` or `promo`)
- Sends to Lovable AI Gateway using `google/gemini-3-flash-preview` with vision
- Uses **tool calling** to extract structured output — an **array** of items, not just one
- For promos: extracts `title`, `description`, `venue_name`, `venue_address`, `promo_type`, `day_of_week[]`, `area`, `drink_type[]`, `valid_until`
- For events: extracts `title`, `description`, `date`, `time`, `venue_name`, `venue_address`, `organizer_name`
- Returns `{ items: [...] }` array
- Handles 429/402 errors

#### 2. New Page: `src/pages/BatchImport.tsx`

A dedicated page (route: `/import`) with:
- **Step 1 — Upload**: Drag-and-drop or file picker for images/documents. Type selector (events or promos)
- **Step 2 — Review**: Editable table/card list showing all extracted items. Users can edit fields inline, remove unwanted items, or add missing ones
- **Step 3 — Confirm**: Bulk insert all confirmed items to Supabase. Show success count and any errors

#### 3. New Component: `src/components/BatchImportReview.tsx`

- Renders extracted items as editable cards or a table
- Each row has: title, venue, description, day_of_week, promo_type, area — all editable
- Checkbox per row to include/exclude
- "Select All" / "Deselect All" controls
- Validation indicators (missing required fields highlighted)

#### 4. Update `src/App.tsx`

- Add route `/import` pointing to `BatchImport` page

#### 5. Update `supabase/config.toml`

- Add `extract-from-image` function with `verify_jwt = false`

#### 6. Navigation

- Add "Import" link/button in the Header or as a CTA on events/promos sections

### Key Design Decisions

- **Batch-first**: The AI prompt explicitly asks for ALL items found in the document, not just one
- **Review before insert**: Nothing goes to the database without user confirmation
- **Editable**: Every extracted field is editable before submission so users can fix AI mistakes
- **Auth required**: Bulk insert requires authenticated user (sets `created_by`)

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/extract-from-image/index.ts` | Create |
| `src/pages/BatchImport.tsx` | Create |
| `src/components/BatchImportReview.tsx` | Create |
| `src/App.tsx` | Modify (add route) |
| `supabase/config.toml` | Modify (add function) |
| `src/components/Header.tsx` | Modify (add Import nav link) |

