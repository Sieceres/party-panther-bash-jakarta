

## Plan: Enhanced Section Boxes with Glow Effect

### What the reference image shows

The uploaded image has section boxes with:
- **Subtle glow/neon border** (cyan/blue glow around the edges)
- **Semi-transparent dark fill** (not fully transparent — dark frosted glass effect)
- **Rounded corners** with soft edges
- **Consistent spacing** between boxes

### Changes

**1. Add glow effect to section boxes** (`PostPreview.tsx`)
- Apply `boxShadow` with the box color as a neon glow: `0 0 Npx Mpx rgba(color, intensity)`
- Use `inset` shadow too for inner glow subtlety

**2. Change box style from border-only to frosted glass** (`PostPreview.tsx`)
- Add semi-transparent dark background: `rgba(0,0,0,0.3)` blended with the box color at low opacity
- Re-add `backdropFilter: "blur(4px)"` for depth
- Keep the border but make it more subtle (1px instead of 2px)

**3. Add new editor controls** (`PostEditor.tsx`, `instagram-post.ts`)
- **Box glow toggle** (`sectionBoxGlow: boolean`)
- **Glow intensity slider** (`sectionBoxGlowIntensity: number`, 1-30)
- **Box style selector**: "border-only" | "frosted" | "solid" (`sectionBoxStyle`)
- **Border width slider** (`sectionBoxBorderWidth: number`, 0-5)

**4. Update type definitions** (`instagram-post.ts`)
- Add `sectionBoxGlow`, `sectionBoxGlowIntensity`, `sectionBoxStyle`, `sectionBoxBorderWidth`

### Files to edit
- `src/types/instagram-post.ts` — new fields
- `src/components/instagram/PostEditor.tsx` — new controls in Styling tab
- `src/components/instagram/PostPreview.tsx` — render glow + frosted glass style

