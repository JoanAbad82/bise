// generated from image.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// bise kit · the image renderer of the viewer (viewer.js; office-artifacts plan §5): the picture,
// fit to the frame, and a box drawn on it with the pointer as the selection, a `region` anchor
// in % of the image (bise_proto::anchor). The notes layer (select.js) does the rest.
//
// It zooms (his m_22822; image-pinch, designer m_30627, architect m_30628), the math is zoom.js's:
// a trackpad pinch (Chromium's wheel + ctrlKey) zooms the image around the pointer, never the
// window; two fingers or the wheel (shift: sideways) pan it while zoomed, and space+drag for a
// mouse; a plain drag always draws a box, zoomed or not; a double-click toggles fit and 100%;
// esc, ⌘0 or a click on the '240%' chip go back to fit. The .frame (the img and every box, all in
// % of it) is sized k × the image and moved, never scaled: boxes and marks ride the zoom, their
// lines stay 1 px; past 200% its pixels show (designer m_30807). In the desktop's frame (name bise-app) it tells the window {bise: zoom, fit}
// so the window's esc and ⌘0 come back here as {bise: fit} while zoomed (kit/office/frame.js).
//
// Pure helper (exported for office/sdk/test/viewer.test.ts): boxPct.
import { fitted, isFit, isFitKey, panBy, pinchFactor, place, toggled, wheelPan, zoomAt, zoomWords } from "/kit/office/zoom.js";
import { FRAME } from "/kit/office/frame.js";
const MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
/** How long the chip stays after the last zoom step, then it fades (designer m_30627). */
const CHIP_MS = 1500;
/** Two points (px, in an element of `w` × `h`) as a rect in % of it, 0.1 apart, clamped. */
export function boxPct(a, b, w, h) {
    const clamp = (v) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
    const x0 = clamp((Math.min(a.x, b.x) / w) * 100);
    const y0 = clamp((Math.min(a.y, b.y) / h) * 100);
    const x1 = clamp((Math.max(a.x, b.x) / w) * 100);
    const y1 = clamp((Math.max(a.y, b.y) / h) * 100);
    return { x: x0, y: y0, w: Math.round((x1 - x0) * 10) / 10, h: Math.round((y1 - y0) * 10) / 10 };
}
/** A field he types in: space is his there, never a pan. */
const typing = (t) => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ""));
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
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "office-zoom";
    chip.title = "fit · ⌘0";
    chip.hidden = true;
    root.append(frame, chip);
    await new Promise((ok, no) => {
        img.onload = () => ok();
        img.onerror = () => no(Object.assign(new Error("not an image this browser draws"), { code: "not_office" }));
        img.src = url;
    });
    // ---- the zoom: the box's and the image's sizes, where it is drawn
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    let d = { bw: 0, bh: 0, nw, nh };
    let z = { k: 1, x: 0, y: 0 };
    // a zoom put back after a new version (restore), applied once the box has its size
    let pending = null;
    let told = null;
    let chipTimer = 0;
    const inApp = window.name === "bise-app" && window.parent !== window;
    const tell = (fit) => {
        if (!inApp || fit === told)
            return;
        told = fit;
        window.parent.postMessage({ bise: FRAME.zoom, fit }, "*");
    };
    const apply = (next, ease = false) => {
        z = next;
        root.classList.toggle("eased", ease);
        Object.assign(frame.style, { width: `${nw * z.k}px`, height: `${nh * z.k}px`, transform: `translate(${z.x}px, ${z.y}px)` });
        const fit = isFit(d, z);
        root.dataset.fit = String(fit);
        root.dataset.zoom = zoomWords(z);
        // past 200% its pixels show, as in Figma; smooth up to it (designer m_30807)
        root.classList.toggle("pixels", z.k > 2);
        if (fit) {
            chip.hidden = true;
            chip.classList.remove("on");
            clearTimeout(chipTimer);
        }
        tell(fit);
    };
    /** The chip says the zoom while he zooms and CHIP_MS after; never at fit. */
    const showChip = () => {
        if (isFit(d, z))
            return;
        chip.textContent = zoomWords(z);
        chip.hidden = false;
        chip.classList.add("on");
        clearTimeout(chipTimer);
        chipTimer = setTimeout(() => chip.classList.remove("on"), CHIP_MS);
    };
    const toFit = () => apply(fitted(d), true);
    const rel = (e) => {
        const r = root.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    // the box's size: a fitted image refits, a zoomed one keeps its place, held at the edges
    new ResizeObserver(() => {
        if (!root.isConnected)
            return;
        const was = isFit(d, z);
        d = { bw: root.clientWidth, bh: root.clientHeight, nw, nh };
        if (d.bw <= 0 || d.bh <= 0)
            return;
        const back = pending;
        pending = null;
        apply(back ? place(d, back) : was ? fitted(d) : place(d, z));
    }).observe(root);
    // a pinch zooms here, never the window; two fingers or the wheel pan while zoomed
    root.addEventListener("wheel", (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const p = rel(e);
            apply(zoomAt(d, z, z.k * pinchFactor(e.deltaY, e.deltaMode), p.x, p.y));
            showChip();
            return;
        }
        if (isFit(d, z))
            return;
        e.preventDefault();
        const m = wheelPan(e.deltaX, e.deltaY, e.deltaMode, e.shiftKey);
        apply(panBy(d, z, m.dx, m.dy));
    }, { passive: false });
    root.addEventListener("dblclick", (e) => {
        if (e.target === chip)
            return;
        const p = rel(e);
        apply(toggled(d, z, p.x, p.y), true);
        showChip();
    });
    chip.addEventListener("click", toFit);
    // esc and ⌘0 while zoomed: back to fit, used (the desktop's esc forwarder then leaves the
    // artifact open); capture, before the notes layer's keys. Space held: a drag pans.
    let space = false;
    const spaceUp = () => {
        space = false;
        root.classList.remove("panning");
    };
    document.addEventListener("keydown", (e) => {
        if (!root.isConnected)
            return;
        if (e.code === "Space" && !typing(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            space = true;
            root.classList.add("panning");
            return;
        }
        if (isFit(d, z) || e.repeat || !isFitKey(e))
            return;
        e.preventDefault();
        e.stopPropagation();
        toFit();
    }, true);
    document.addEventListener("keyup", (e) => e.code === "Space" && spaceUp());
    window.addEventListener("blur", spaceUp);
    // the window's esc or ⌘0 while zoomed (its focus outside this frame): only from the parent
    window.addEventListener("message", (e) => {
        if (!root.isConnected || window.parent === window || e.source !== window.parent)
            return;
        if (e.data && e.data.bise === FRAME.fit)
            toFit();
    });
    // ---- the box: a plain drag on the image, zoomed or not (designer m_30627)
    let selected = null;
    let start = null;
    let pan = null;
    const box = document.createElement("div");
    box.className = "office-box";
    // the pointer in % of the image, read against the image as drawn at that moment: a press and
    // its release during a zoom's ease (160 ms) fall on the same image point, never a box between
    const at = (e) => {
        const r = img.getBoundingClientRect();
        const pct = (v, size) => (size > 0 ? Math.max(0, Math.min(100, (v / size) * 100)) : 0);
        return { x: pct(e.clientX - r.left, r.width), y: pct(e.clientY - r.top, r.height), w: 100, h: 100 };
    };
    const show = (rect) => {
        Object.assign(box.style, { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` });
        if (!box.isConnected)
            frame.append(box);
    };
    root.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || e.target === chip)
            return;
        if (space) {
            pan = { x: e.clientX, y: e.clientY };
            root.classList.add("grabbing");
            root.setPointerCapture(e.pointerId);
            return;
        }
        if (!frame.contains(e.target))
            return;
        start = at(e);
        root.setPointerCapture(e.pointerId);
        // no preventDefault: it would cancel the mouseup the notes layer offers its button on
        // (pdf-notes found it: a real drag drew the box but showed no button)
    });
    // a box drawn selects nothing on the way
    root.addEventListener("selectstart", (e) => (start || pan) && e.preventDefault());
    root.addEventListener("pointermove", (e) => {
        if (pan) {
            const from = pan;
            pan = { x: e.clientX, y: e.clientY };
            apply(panBy(d, z, e.clientX - from.x, e.clientY - from.y));
            return;
        }
        if (!start)
            return;
        const p = at(e);
        show(boxPct(start, p, p.w, p.h));
    });
    const up = (e) => {
        if (pan) {
            pan = null;
            root.classList.remove("grabbing");
            return;
        }
        if (!start)
            return;
        const p = at(e);
        const rect = boxPct(start, p, p.w, p.h);
        start = null;
        // a click, not a box: the selection goes (a double-click never leaves one)
        if (rect.w < 1 || rect.h < 1) {
            selected = null;
            box.remove();
            return;
        }
        selected = { kind: "region", rect };
        show(rect);
    };
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    return {
        notes: [],
        /** Where he is: the zoom, kept for a new version of the same size. */
        place: () => ({ nw, nh, zoom: isFit(d, z) ? null : { ...z } }),
        restore: (p) => {
            if (p && p.zoom && p.nw === nw && p.nh === nh)
                pending = p.zoom;
        },
        /** The box drawn as an Anchor (`region`), or null. */
        selection: () => selected,
    };
}
