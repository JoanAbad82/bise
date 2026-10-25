// generated from pdf.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// bise kit · the pdf renderer of the viewer (viewer.js; pdf-notes, architect m_24668): pdf.js
// (office/dist/office-pdf.js and its worker pdf.worker.js, served under the viewer's script
// rule) draws each page on a canvas when it scrolls near, with its text layer over it for the
// browser's own selection. Two selections, both a `region` anchor (bise_proto::anchor) in % of
// the page: a passage (a drag on words: its words' box and the words in `quote`) and a box (a
// drag that starts off the words). The notes layer (select.js) does the rest; it asks `where`
// for a note's place, re-anchored on this version's text by BiseAnchors.pdf.place.
//
// pdf.js on an untrusted file (architect m_24668, pinned by office/sdk/test/viewer.test.ts):
// no eval, no pdf JavaScript, no annotation layer (a link never navigates the frame), nothing
// fetched: the standard fonts, cMaps and wasm decoders are not served; what needed them is said
// in the foot.
//
// Pure helpers (exported for office/sdk/test/viewer.test.ts): OPTIONS, rectPct, footOf.
import { getDocument, GlobalWorkerOptions, TextLayer, Util } from "/kit/office/office-pdf.js";
/** pdf.js's options for an untrusted file (architect m_24668). */
export const OPTIONS = Object.freeze({
    isEvalSupported: false,
    enableScripting: false,
    enableXfa: false,
    useWasm: false,
    useWorkerFetch: false,
    cMapUrl: null,
    standardFontDataUrl: null,
    wasmUrl: null,
    stopAtErrors: false,
});
/** A box (px, in an element at `frame`: {left, top, width, height}) in % of it, 0.1 apart, clamped. */
export function rectPct(box, frame) {
    const c = (v) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
    const x0 = c(((box.left - frame.left) / frame.width) * 100);
    const y0 = c(((box.top - frame.top) / frame.height) * 100);
    const x1 = c(((box.left + box.width - frame.left) / frame.width) * 100);
    const y1 = c(((box.top + box.height - frame.top) / frame.height) * 100);
    return { x: x0, y: y0, w: Math.round((x1 - x0) * 10) / 10, h: Math.round((y1 - y0) * 10) / 10 };
}
/** The foot's lines for what pdf.js asked for and bise does not serve (designer signs). */
export function footOf(missing) {
    const out = [];
    if (missing.has("cMapUrl"))
        out.push("some characters may not show: this pdf needs character maps bise doesn't ship (often Chinese, Japanese or Korean text).");
    if (missing.has("standardFontDataUrl"))
        out.push("some text is drawn in a stand-in font: this pdf names fonts it doesn't carry.");
    if (missing.has("wasmUrl"))
        out.push("some images may not show (JPEG 2000 or JBIG2).");
    return out;
}
const A = globalThis.BiseAnchors;
export async function draw(root, bytes) {
    root.classList.add("office-pdf");
    GlobalWorkerOptions.workerSrc = "/kit/office/pdf.worker.js";
    // what pdf.js asks the page for (fonts, cMaps, decoders): never fetched, only noted
    const missing = new Set();
    class Unserved {
        async fetch({ kind }) {
            missing.add(kind);
            throw new Error(`bise doesn't serve pdf.js's ${kind}`);
        }
    }
    // (null urls: pdf.js reads them as none; its types say string | undefined)
    const doc = await getDocument({ ...OPTIONS, data: bytes.slice(), BinaryDataFactory: Unserved }).promise.catch((e) => {
        throw Object.assign(new Error(e && e.message ? e.message : String(e)), { code: "not_office" });
    });
    // every page's size and text first (the notes re-anchor on it), drawn later as they show
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        // (el: set just below, before anything reads it)
        pages.push({ n, page, vp, content, ...A.pdf.pageText(content.items), el: null, drawn: 0, task: null });
    }
    const texts = pages.map((p) => p.text);
    const list = document.createElement("div");
    list.className = "office-pages";
    for (const p of pages) {
        const el = document.createElement("div");
        el.className = "page";
        el.dataset.page = String(p.n);
        el.style.aspectRatio = `${p.vp.width} / ${p.vp.height}`;
        el.style.maxWidth = `${Math.round(p.vp.width * 1.5)}px`;
        p.el = el;
        list.append(el);
    }
    root.append(list);
    // ---- drawing a page: its canvas at the device's pixels, its text layer at its css size
    async function render(p) {
        const width = p.el.clientWidth;
        if (!width || p.drawn === width)
            return;
        p.drawn = width;
        if (p.task)
            p.task.cancel();
        const scale = width / p.vp.width;
        const vp = p.page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        const text = document.createElement("div");
        text.className = "textLayer";
        p.el.style.setProperty("--total-scale-factor", String(scale));
        // (transform null: none, as pdf.js reads it; its types say undefined)
        p.task = p.page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport: vp, transform: (dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]), annotationMode: 0 });
        try {
            await p.task.promise;
        }
        catch {
            return; // cancelled by a newer draw
        }
        await new TextLayer({ textContentSource: p.content, container: text, viewport: vp }).render().catch(() => { });
        for (const old of p.el.querySelectorAll(":scope > canvas, :scope > .textLayer"))
            old.remove();
        p.el.prepend(canvas, text);
    }
    const near = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && render(pages[Number(e.target.dataset.page) - 1])), { root, rootMargin: "800px 0px" });
    pages.forEach((p) => near.observe(p.el));
    let resized = 0;
    new ResizeObserver(() => {
        clearTimeout(resized);
        resized = setTimeout(() => pages.forEach((p) => p.drawn && render(p)), 150);
    }).observe(root);
    // ---- the selections: a passage (the browser's, on the text layer) or a box
    let box = null; // {page, rect} drawn now
    let start = null;
    const drawn = document.createElement("div");
    drawn.className = "office-box";
    drawn.dataset.ours = "1";
    const pageOf = (node) => {
        const el = node && (node.nodeType === 1 ? node : node.parentElement);
        const pg = el && el.closest && el.closest(".office-pdf .page");
        return pg ? pages[Number(pg.dataset.page) - 1] : null;
    };
    const pointIn = (p, e) => {
        const r = p.el.getBoundingClientRect();
        const x = Math.max(r.left, Math.min(r.right, e.clientX));
        const y = Math.max(r.top, Math.min(r.bottom, e.clientY));
        return { x, y, r };
    };
    list.addEventListener("pointerdown", (e) => {
        const p = pageOf(e.target);
        if (e.button !== 0 || !p)
            return;
        // on words: the browser selects them; off them: a box
        if (e.target.closest(".textLayer span, .textLayer br")) {
            box = null;
            drawn.remove();
            return;
        }
        window.getSelection()?.removeAllRanges();
        start = { p, ...pointIn(p, e) };
        list.setPointerCapture(e.pointerId);
        // no preventDefault here: it would also cancel the mouseup the notes layer offers on
    });
    // a box drawn selects no words on the way
    list.addEventListener("selectstart", (e) => start && e.preventDefault());
    // (start: a drag is on whenever this runs)
    const boxNow = (e) => {
        const q = pointIn(start.p, e);
        const b = { left: Math.min(start.x, q.x), top: Math.min(start.y, q.y), width: Math.abs(q.x - start.x), height: Math.abs(q.y - start.y) };
        return rectPct(b, q.r);
    };
    const show = (n, rect) => {
        Object.assign(drawn.style, { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` });
        if (drawn.parentElement !== pages[n - 1].el)
            pages[n - 1].el.append(drawn);
    };
    list.addEventListener("pointermove", (e) => start && show(start.p.n, boxNow(e)));
    list.addEventListener("pointerup", (e) => {
        if (!start)
            return;
        const rect = boxNow(e);
        const n = start.p.n;
        start = null;
        // a click, not a box: the selection goes
        if (rect.w < 1 || rect.h < 1) {
            box = null;
            drawn.remove();
            return;
        }
        box = { page: n, rect };
        show(n, rect);
    });
    /** The passage selected now, as a `region` with its words, or null. */
    function passage() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount)
            return null;
        const range = sel.getRangeAt(0);
        const p = pageOf(range.startContainer);
        if (!p || !root.contains(range.startContainer))
            return null;
        const words = String(sel.toString()).replace(/\s+/g, " ").trim();
        if (!words)
            return null;
        const frame = p.el.getBoundingClientRect();
        const rs = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0 && r.bottom > frame.top && r.top < frame.bottom);
        if (!rs.length)
            return null;
        const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
        const right = Math.max(...rs.map((r) => r.right)), bottom = Math.max(...rs.map((r) => r.bottom));
        const rect = rectPct({ left, top, width: right - left, height: bottom - top }, frame);
        // select.js's quoteOf cuts at 200 for the message; the anchor keeps what finds it again
        return { kind: "region", page: p.n, rect, quote: words.length > 200 ? words.slice(0, 200) : words };
    }
    // ---- a note's place on this version: its marks (boxes in % of their page, ours) and found
    function itemBox(p, i) {
        // (an item with words: itemsIn gives only those)
        const it = p.content.items[i];
        const tx = Util.transform(p.vp.transform, it.transform);
        const h = Math.hypot(tx[2], tx[3]);
        const w = it.width * p.vp.scale;
        return { left: tx[4], top: tx[5] - h, width: w, height: h };
    }
    function mark(p, rect, cls) {
        const m = document.createElement("div");
        m.className = cls;
        m.dataset.ours = "1";
        Object.assign(m.style, { left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` });
        p.el.append(m);
        return m;
    }
    function where(a) {
        if (!a || a.kind !== "region")
            return null;
        const at = A.pdf.place(a, texts);
        if (!at)
            return { els: [], found: false };
        const p = pages[at.page - 1];
        if (at.rect)
            return { els: [mark(p, at.rect, "office-mark-box")], found: true };
        // the words, item by item, merged by line
        const frame = { left: 0, top: 0, width: p.vp.width, height: p.vp.height };
        const lines = [];
        for (const i of A.pdf.itemsIn(p.ranges, at.start, at.end)) {
            const b = itemBox(p, i);
            const line = lines.find((l) => Math.abs(l.top - b.top) < b.height / 2);
            if (line) {
                const right = Math.max(line.left + line.width, b.left + b.width);
                line.left = Math.min(line.left, b.left);
                line.width = right - line.left;
            }
            else
                lines.push({ ...b });
        }
        if (!lines.length)
            return { els: [], found: true };
        const els = lines.map((l) => mark(p, rectPct(l, frame), "office-mark-box office-mark-words"));
        // one 3 px bar down all its lines (designer m_24905)
        const top = Math.min(...lines.map((l) => l.top)), bottom = Math.max(...lines.map((l) => l.top + l.height));
        const bar = mark(p, rectPct({ left: Math.min(...lines.map((l) => l.left)), top, width: 0, height: bottom - top }, frame), "office-mark-box office-mark-bar");
        return { els: [...els, bar], found: true };
    }
    return {
        notes: footOf(missing),
        place: () => ({ top: root.scrollTop }),
        restore: (pl) => {
            root.scrollTop = pl.top || 0;
        },
        /** What is selected as an Anchor (`region`): the passage, else the box, or null. */
        selection: () => passage() || (box ? { kind: "region", page: box.page, rect: box.rect } : null),
        where,
    };
}
