
Goal: replace the current “record the dialog DOM” strategy with a render-first export pipeline. The current approach is brittle, and the uploaded results confirm it: the GIF is effectively a blurry still, and the video outputs are empty/invalid. The root problem is that `AnimationPreview.tsx` builds a second, simplified preview and then tries to screen-capture it frame by frame with `dom-to-image-more` / `MediaRecorder`. That introduces timing issues, portal/dialog issues, and visual mismatches with the real post renderer.

What I would build

1. Make one shared Instagram post scene renderer
- Extract the visual post markup/styling logic from `PostPreview.tsx` into a reusable presentational component, e.g. `InstagramPostCanvas` or similar.
- This shared renderer should support:
  - background gradients and custom images
  - logo and brand name
  - headline
  - section boxes
  - dividers
  - multiline text
  - current typography/colors/shadows/strokes
- `PostPreview.tsx` and `AnimationPreview.tsx` would both use this same renderer so the static preview, animated preview, and export source all match.

2. Stop capturing the live dialog DOM directly
- Instead of recording `previewRef` inside the Radix dialog, render an off-screen export scene at full resolution (1080x1080 / 1080x1350 / 1080x1920 depending on format).
- Keep this export scene mounted in normal DOM, off-screen but visible to the renderer, so `html2canvas` can capture it consistently.
- This avoids the current portal/z-index/dialog capture problems entirely.

3. Move animation logic from CSS-only playback into timeline-driven state
- Right now animation is mostly CSS delays on a simplified DOM.
- I’d introduce a small animation timeline model:
  - headline enters first
  - each section enters as one group: subheadline + body + divider/box
  - configurable pause between groups
  - speed multiplier affects all durations
- The animated renderer would receive a `timeMs` or `progress` prop and decide which elements are visible / partially animated at that frame.
- This makes playback deterministic and exportable frame-by-frame.

4. Use frame-by-frame rendering for all export formats
- Generate frames from the off-screen full-size renderer at a fixed fps.
- For each frame:
  - update the timeline time
  - wait one animation frame
  - capture with `html2canvas`
- Then encode:
  - GIF: add all captured canvases to `gif.js`
  - WebM: draw captured canvases onto a stream canvas and record that canvas
  - MP4: only offer if the browser truly supports `MediaRecorder` MP4; otherwise label it clearly as unavailable or fall back explicitly
- This is much more reliable than trying to “screen record” CSS animation in real time.

5. Tighten format support instead of pretending every browser can do MP4
- The current MP4 option is risky because browser `MediaRecorder` support for true MP4 is inconsistent.
- Safer plan:
  - GIF stays supported
  - WebM stays supported
  - MP4 only appears when `MediaRecorder.isTypeSupported("video/mp4")` is genuinely true
  - otherwise hide or disable MP4 with a short explanation
- This prevents fake “MP4” files that are actually unusable.

6. Improve export quality
- Export scene should render at actual target dimensions, not the small on-screen preview size.
- GIF should use a sensible frame rate and quality tradeoff so it is animated, not a single blurry frame.
- Add loading of fonts/images before frame capture starts.
- Reuse the same “export-safe” tweaks already used in `PostPreview.tsx` for brand text and hidden drag labels.

Files to update
- `src/components/instagram/PostPreview.tsx`
  - extract reusable scene renderer and export-safe prep helpers
- `src/components/instagram/AnimationPreview.tsx`
  - replace the custom simplified preview with the shared renderer
  - replace direct live-dialog recording with off-screen frame generation
  - keep the playback controls, but drive them from timeline state
- potentially add a new file such as:
  - `src/components/instagram/InstagramPostCanvas.tsx`
  - or `src/components/instagram/instagram-render-utils.ts`
- `package.json`
  - likely no new dependency needed if we standardize on `html2canvas` + `gif.js`
  - if `dom-to-image-more` becomes unused, remove it later

Why this is the right direction
- The current implementation duplicates rendering logic, so animation/export never truly matches the real preview.
- Recording a dialog preview is inherently fragile.
- A single shared renderer plus deterministic timeline is the stable architecture for both preview and export.

Expected user-facing result
- Animation preview looks like the actual post
- divider and box styling renders properly in animation
- multiline text behaves consistently
- GIF becomes a real animation, not a still
- WebM becomes playable
- MP4 is only shown when the browser can actually produce a valid MP4

Technical notes
- The biggest architectural fix is to treat export as “render frames from state” rather than “record the UI”.
- `PostPreview.tsx` already contains the more complete and correct visual renderer; that should become the source of truth.
- `AnimationPreview.tsx` currently hardcodes a square preview and simplified layout, which is a major cause of mismatch and failure.
- If needed, we can preserve CSS keyframes for interactive preview, but export should still use a deterministic time-based render path.

Implementation order
1. Extract shared post scene from `PostPreview`
2. Rebuild `AnimationPreview` on top of that scene
3. Add off-screen export scene at full size
4. Implement frame generation loop
5. Rewire GIF/WebM export to use generated frames
6. Gate MP4 behind true support
7. Test with the problematic template you mentioned

Risk to watch
- `html2canvas` frame generation can be slower than real-time, so export may take a few seconds. That is acceptable if the files are valid.
- If browser MP4 support remains weak, the safest product decision may be “GIF + WebM only” unless true MP4 support is detected.
