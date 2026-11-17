// Shrinks a photo: caps the longest side, then saves as WebP (about 30% smaller than JPEG).
// Browsers that can't make WebP (older Safari) fall back to a lighter JPEG.
// `src` can be a <video> element (camera frame) or a File/Blob.
export async function compress(src, { max = 1080, quality = 0.72, square = false } = {}) {
  let el = src, w, h, bmp = null;
  if (src instanceof Blob) { bmp = await createImageBitmap(src); el = bmp; w = bmp.width; h = bmp.height; }
  else { w = src.videoWidth || src.width; h = src.videoHeight || src.height; }
  let sx = 0, sy = 0, sw = w, sh = h;
  if (square) { const m = Math.min(w, h); sx = (w - m) / 2; sy = (h - m) / 2; sw = sh = m; }
  const scale = Math.min(1, max / Math.max(sw, sh));
  const c = document.createElement("canvas");
  c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  c.getContext("2d").drawImage(el, sx, sy, sw, sh, 0, 0, c.width, c.height);
  bmp?.close();
  const enc = (type, q) => new Promise((res) => c.toBlob(res, type, q));
  let blob = await enc("image/webp", quality);
  if (!blob || blob.type !== "image/webp") blob = await enc("image/jpeg", Math.min(quality + 0.05, 0.8));
  return { blob, type: blob.type, ext: blob.type === "image/webp" ? "webp" : "jpg" };
}
