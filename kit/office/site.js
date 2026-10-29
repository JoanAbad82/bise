// generated from site.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// bise kit · a site artifact in the viewer (viewer.js; art-notes, architect m_24172): the site
// framed as itself at /a/<id>/<v>/framed/… (still sandboxed by the server's ARTIFACT_CSP: an
// opaque origin, no token, no requests out), with kit/site-select.js in each of its pages. What
// that script posts is the site's as much as his: only from that frame, each field read again
// here (a block anchor, a quote and a rect of capped size) before select.js sees it.
//
// The view adds two things to a renderer's: `box()` (where the selection is, in this window) and
// `marks(list)` / `onFound` (the marks drawn inside the frame, which ones it found).
//
// Pure helper (exported for office/sdk/test/viewer.test.ts): readSelect.
import { foot } from "/kit/office/viewer.js";
import { FRAME } from "/kit/office/frame.js";
const MAX = 300;
/** The most a site keeps (keys and values, in UTF-16 units: under the hub's 5 MB of bytes for
 * ASCII; the hub checks its own bytes again, artifacts_storage::MAX_BYTES). */
const MAX_STORAGE = 5 * 1024 * 1024;
// the frame's script says hello on each page: none after this long, it was kept out
const HELLO_MS = 4000;
const W = { keptOut: "notes can't go on this site: its own rules block bise." };
export function readSelect(d) {
    const a = d && d.anchor;
    if (!a || a.kind !== "block" || typeof a.block !== "string" || !a.block || a.block.length > MAX)
        return null;
    const str = (s) => (typeof s === "string" ? s.slice(0, MAX) : "");
    const quote = str(a.quote);
    const r = d.rect;
    const num = (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e5;
    const rect = r && num(r.x) && num(r.y) && num(r.w) && num(r.h) ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
    return { anchor: { kind: "block", block: a.block, ...(quote ? { quote } : {}) }, quote: str(d.quote) || quote, rect };
}
/** A `site-storage` message's map read again (kit/storage.js posts the site's whole
 * localStorage): its string values only, null when it isn't an object or is over 5 MB. */
export function readStorage(local) {
    if (!local || typeof local !== "object" || Array.isArray(local))
        return null;
    const out = {};
    let size = 0;
    for (const [k, v] of Object.entries(local)) {
        if (typeof v !== "string")
            continue;
        size += k.length + v.length;
        if (size > MAX_STORAGE)
            return null;
        out[k] = v;
    }
    return out;
}
/** The localStorage a message carries when it is a `site-storage` from `frame` (the site's frame
 * this viewer made), read again; null for any other source, kind or shape. */
export function storageOf(source, data, frame) {
    if (source === null || source !== frame || !data || typeof data !== "object")
        return null;
    const d = data;
    return d.bise === FRAME.storage ? readStorage(d.local) : null;
}
/** What sends a site's localStorage to the hub (POST /api/a/<id>/storage, web-storage, architect
 * m_46151): at most one request in flight, the newest map after it, never a stale one last.
 * `send` does the request; returned: what takes each map the frame posted. */
export function storageSender(send) {
    let next = null;
    let busy = false;
    const pump = () => {
        if (busy || !next)
            return;
        const local = next;
        next = null;
        busy = true;
        void send(local).catch(() => { }).finally(() => {
            busy = false;
            pump();
        });
    };
    return (local) => {
        next = local;
        pump();
    };
}
export async function draw(root, _bytes, info) {
    root.classList.add("office-site");
    const frame = document.createElement("iframe");
    frame.className = "site";
    frame.title = info.name || "site";
    frame.src = info.file;
    root.append(frame);
    let picked = null;
    let alive = false;
    let lastMarks = [];
    const view = {
        notes: [],
        place: () => ({}),
        restore: () => { },
        selection: () => (picked ? picked.anchor : null),
        quote: () => (picked ? picked.quote : ""),
        box() {
            if (!picked || !picked.rect)
                return null;
            const f = frame.getBoundingClientRect();
            const r = picked.rect;
            return { left: f.left + r.x, top: f.top + r.y, right: f.left + r.x + r.w, bottom: f.top + r.y + r.h };
        },
        marks(list) {
            lastMarks = list.map((m, i) => ({ i, at: m.at, mark: m.mark }));
            frame.contentWindow && frame.contentWindow.postMessage({ bise: "site-marks", marks: lastMarks }, "*");
        },
        onFound: null,
    };
    const main = document.getElementById("bise-office");
    const token = (document.querySelector('meta[name="bise-token"]') || {}).content || "";
    const keep = storageSender((local) => fetch(`/api/a/${encodeURIComponent(info.id)}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Bise-Token": token },
        body: JSON.stringify({ local }),
        // the panel may close right after his last edit
        keepalive: true,
    }));
    window.addEventListener("message", (e) => {
        if (e.source !== frame.contentWindow || !e.data || typeof e.data !== "object")
            return;
        const d = e.data;
        const local = storageOf(e.source, d, frame.contentWindow);
        if (local) {
            keep(local);
        }
        else if (d.bise === "site-hello") {
            alive = true;
            // a new page of the site: its marks again
            if (lastMarks.length)
                frame.contentWindow.postMessage({ bise: "site-marks", marks: lastMarks }, "*");
        }
        else if (d.bise === "site-select") {
            picked = d.anchor === null ? null : readSelect(d);
            root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        }
        else if (d.bise === "site-scroll") {
            picked = null;
            root.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        }
        else if (d.bise === "site-found" && Array.isArray(d.found)) {
            if (view.onFound)
                view.onFound(new Set(d.found.filter((i) => Number.isInteger(i))));
        }
        else if (d.bise === "site-key" && typeof d.key === "string" && d.key.length <= 16) {
            // his key, as if typed here (select.js's rule decides what it takes)
            document.dispatchEvent(new KeyboardEvent("keydown", { key: d.key, ctrlKey: !!d.ctrlKey, metaKey: !!d.metaKey, altKey: !!d.altKey, isComposing: !!d.isComposing }));
        }
    });
    frame.addEventListener("load", () => {
        alive = false;
        setTimeout(() => {
            if (!alive && main)
                foot(main, [W.keptOut]);
        }, HELLO_MS);
    });
    return view;
}
