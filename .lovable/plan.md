

## Plan: Fix Animation Z-Index + Dual Video Export Options

### 1. Fix dialog z-index (`AnimationPreview.tsx`)
- Override `DialogContent` className to `z-[1200]`
- Override `DialogOverlay` to match, so the animation preview renders above the header (`z-[1100]`)

### 2. Add video export with format choice (`AnimationPreview.tsx`)
Add a "Record Video" button that:
1. Shows a format picker (WebM or GIF) before recording
2. Plays the animation and records the preview area
3. Downloads the result when done

**WebM option** — uses `MediaRecorder` + `captureStream()` on a canvas. Lightweight, fast, no dependencies. Good for stories.

**GIF option** — uses `html2canvas` (already available) to capture frames at intervals, then assembles with `gif.js` (new dependency). Universally shareable but larger file size.

UI flow:
- "Record Video" button next to Play/Reset
- Clicking it opens a small dropdown: "Download as WebM" / "Download as GIF"
- Shows a recording indicator (red dot + "Recording...") while active
- Auto-downloads when the animation completes

### Files to edit
- `src/components/instagram/AnimationPreview.tsx` — z-index fix, recording logic, format picker UI
- `package.json` — add `gif.js` dependency for GIF export

