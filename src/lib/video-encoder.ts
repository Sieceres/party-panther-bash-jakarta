// Shared frame → video encoder helpers used by the HTML reel exporter.
// Mirrors the logic in src/components/instagram/AnimationPreview.tsx but
// kept standalone so we don't risk regressing the IG generator export.

export type ExportFormat = "mp4" | "webm" | "gif";

async function encodeMp4WebCodecs(
  frames: HTMLCanvasElement[],
  width: number,
  height: number,
  fps: number,
): Promise<Blob | null> {
  if (typeof (globalThis as any).VideoEncoder === "undefined") return null;
  try {
    const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
    const codec = "avc1.42E028";
    const support = await (globalThis as any).VideoEncoder.isConfigSupported({
      codec, width, height, bitrate: 8_000_000, framerate: fps,
    });
    if (!support?.supported) return null;

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: "avc", width, height, frameRate: fps },
      fastStart: "in-memory",
    });

    const encoder = new (globalThis as any).VideoEncoder({
      output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
      error: (e: Error) => console.error("VideoEncoder error:", e),
    });
    encoder.configure({
      codec, width, height, bitrate: 8_000_000, framerate: fps,
      avc: { format: "avc" },
    });

    const frameDurationUs = Math.round(1_000_000 / fps);
    for (let i = 0; i < frames.length; i++) {
      const VF = (globalThis as any).VideoFrame;
      const vf = new VF(frames[i], {
        timestamp: i * frameDurationUs,
        duration: frameDurationUs,
      });
      encoder.encode(vf, { keyFrame: i % Math.max(1, fps * 2) === 0 });
      vf.close();
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    await encoder.flush();
    encoder.close();
    muxer.finalize();
    return new Blob([target.buffer], { type: "video/mp4" });
  } catch (err) {
    console.error("WebCodecs MP4 encode failed:", err);
    return null;
  }
}

async function encodeWithMediaRecorder(
  frames: HTMLCanvasElement[],
  width: number,
  height: number,
  fps: number,
  preferMp4: boolean,
): Promise<{ blob: Blob; ext: string }> {
  const frameInterval = 1000 / fps;
  const streamCanvas = document.createElement("canvas");
  streamCanvas.width = width;
  streamCanvas.height = height;
  const ctx = streamCanvas.getContext("2d")!;

  let mimeType: string;
  let ext: string;
  if (preferMp4 && MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E028")) {
    mimeType = "video/mp4;codecs=avc1.42E028"; ext = "mp4";
  } else if (preferMp4 && MediaRecorder.isTypeSupported("video/mp4")) {
    mimeType = "video/mp4"; ext = "mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    mimeType = "video/webm;codecs=vp9"; ext = "webm";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
    mimeType = "video/webm;codecs=vp8"; ext = "webm";
  } else {
    mimeType = "video/webm"; ext = "webm";
  }

  const stream = streamCanvas.captureStream(0);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start();
  const track = stream.getVideoTracks()[0] as any;
  for (let i = 0; i < frames.length; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frames[i], 0, 0, width, height);
    if (track?.requestFrame) track.requestFrame();
    await new Promise((r) => setTimeout(r, frameInterval));
  }
  await new Promise((r) => setTimeout(r, 300));
  if (track?.requestFrame) track.requestFrame();
  recorder.stop();
  const blob = await done;
  return { blob, ext };
}

async function encodeGif(
  frames: HTMLCanvasElement[],
  fps: number,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const GIF = (await import("gif.js")).default;
  const MAX_GIF_EDGE = 600;
  const srcW = frames[0].width;
  const srcH = frames[0].height;
  const scale = Math.min(1, MAX_GIF_EDGE / Math.max(srcW, srcH));
  const gifW = Math.max(2, Math.round((srcW * scale) / 2) * 2);
  const gifH = Math.max(2, Math.round((srcH * scale) / 2) * 2);
  const frameInterval = 1000 / fps;

  const gif = new GIF({
    workers: 2,
    quality: 15,
    width: gifW,
    height: gifH,
    dither: false,
    workerScript: "/gif.worker.js",
  });

  for (const frame of frames) {
    let toAdd: HTMLCanvasElement = frame;
    if (frame.width !== gifW || frame.height !== gifH) {
      const scaled = document.createElement("canvas");
      scaled.width = gifW; scaled.height = gifH;
      const sctx = scaled.getContext("2d")!;
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(frame, 0, 0, gifW, gifH);
      toAdd = scaled;
    }
    gif.addFrame(toAdd, { delay: frameInterval, copy: true });
  }

  return new Promise<Blob>((resolve, reject) => {
    gif.on("progress", (p: number) => onProgress?.(p));
    gif.on("finished", (blob: Blob) => resolve(blob));
    try { gif.render(); } catch (e) { reject(e); }
  });
}

export async function encodeFrames(
  frames: HTMLCanvasElement[],
  format: ExportFormat,
  fps: number,
  onProgress?: (msg: string, p?: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  if (frames.length === 0) throw new Error("No frames captured");
  const w = frames[0].width;
  const h = frames[0].height;

  if (format === "gif") {
    onProgress?.("Assembling GIF…");
    const blob = await encodeGif(frames, fps, (p) =>
      onProgress?.(`Assembling GIF… ${Math.round(p * 100)}%`, p),
    );
    return { blob, ext: "gif" };
  }

  if (format === "mp4") {
    onProgress?.("Encoding MP4 (H.264)…");
    const mp4 = await encodeMp4WebCodecs(frames, w, h, fps);
    if (mp4) return { blob: mp4, ext: "mp4" };
    onProgress?.("Falling back to MediaRecorder…");
  }

  onProgress?.(format === "mp4" ? "Encoding MP4…" : "Encoding WebM…");
  return await encodeWithMediaRecorder(frames, w, h, fps, format === "mp4");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}