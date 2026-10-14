// bise kit · the image renderer of the viewer (viewer.js; office-artifacts plan §5): the picture,
// fit to the frame, and a box drawn on it with the pointer as the selection, a `region` anchor
// in % of the image (bise_proto::anchor). The notes layer (select.js) does the rest.
//
// Pure helper (exported for kit/office/check.mjs): boxPct.

const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

/** Two points (px, in an element of `w` × `h`) as a rect in % of it, 0.1 apart, clamped. */
export function boxPct(a, b, w, h) {
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
  const x0 = clamp((Math.min(a.x, b.x) / w) * 100);
  const y0 = clamp((Math.min(a.y, b.y) / h) * 100);
  const x1 = clamp((Math.max(a.x, b.x) / w) * 100);
  const y1 = clamp((Math.max(a.y, b.y) / h) * 100);
  return { x: x0, y: y0, w: Math.round((x1 - x0) * 10) / 10, h: Math.round((y1 - y0) * 10) / 10 };
}

export async function draw(root, bytes, info) {
  root.classList.add("office-image");
  const ext = String(info.name || "").split(".").pop().toLowerCase();
  const url = URL.createObjectURL(new Blob([bytes], { type: MIME[ext] || "image/png" }));
  const frame = document.createElement("div");
  frame.className = "frame";
  const img = document.createElement("img");
  img.alt = info.name || "";
  img.draggable = false;
  frame.append(img);
  root.append(frame);
  await new Promise((ok, no) => {
    img.onload = ok;
    img.onerror = () => no(Object.assign(new Error("not an image this browser draws"), { code: "not_office" }));
    img.src = url;
  });

  let selected = null;
  let start = null;
  const box = document.createElement("div");
  box.className = "office-box";
  const at = (e) => {
    const r = img.getBoundingClientRect();
    return { x: Math.max(0, Math.min(r.width, e.clientX - r.left)), y: Math.max(0, Math.min(r.height, e.clientY - r.top)), w: r.width, h: r.height };
  };
  const show = (rect) => {
    Object.assign(box.style, { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` });
    if (!box.isConnected) frame.append(box);
  };
  frame.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    start = at(e);
    frame.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  frame.addEventListener("pointermove", (e) => {
    if (!start) return;
    const p = at(e);
    show(boxPct(start, p, p.w, p.h));
  });
  frame.addEventListener("pointerup", (e) => {
    if (!start) return;
    const p = at(e);
    const rect = boxPct(start, p, p.w, p.h);
    start = null;
    // a click, not a box: the selection goes
    if (rect.w < 1 || rect.h < 1) {
      selected = null;
      box.remove();
      return;
    }
    selected = { kind: "region", rect };
    show(rect);
  });

  return {
    notes: [],
    place: () => ({ top: root.scrollTop }),
    restore: (p) => {
      root.scrollTop = p.top || 0;
    },
    /** The box drawn as an Anchor (`region`), or null. */
    selection: () => selected,
  };
}
