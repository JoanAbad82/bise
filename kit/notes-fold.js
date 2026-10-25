// generated from notes-fold.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// bise kit · the notes box folds (notes.js's side list, `notes · 3 ▾`).
// Its head folds it to a pill `notes · 3 ▸` at the box's top-right corner; the pill, or `l`,
// opens it again (designer m_23997). Folded once read: on a reload the box comes folded unless
// something is new for you since you last saw it open (an agent's answer, a ✓ done); your own
// typing never opens it, though the composer shows the box while you type. Your fold or open is
// kept per page (localStorage) until something new comes.
//
// Two halves, like notes.js: `BiseNotesFold.core` is pure (node checks run it), `attach()` is the
// DOM; notes.js calls attach() once with its list and update() at the end of each render. Loaded
// before notes.js. Where the box sits (the page's side column on a wide window, the top padding on
// a narrow one) is notes.css. Its types (FoldNote, FoldState, BiseNotesFold) are in globals.d.ts.
(function (root) {
    "use strict";
    // ---- the words (designer m_23997)
    const FW = {
        pill: (n) => `notes · ${n}`,
        key: "l fold",
        say: { fold: "fold your notes", open: "open your notes" },
    };
    // what is new for you in a page's notes: the agent's outcomes, never your drafts or sends
    const outcomes = (notes) => (notes || [])
        .filter((n) => n.status === "done" || n.status === "answered")
        .map((n) => `${n.id}:${n.status}:${n.status === "answered" ? n.answer || "" : ""}`)
        .sort();
    const isNew = (seen, keys) => keys.some((k) => !seen.includes(k));
    // state: { started, folded, explicit (your last fold or open, null: none), seen (the outcomes
    // you saw with the box open) }. `saved` is what the page kept: { folded, seen } or null.
    function start(saved) {
        const s = saved && typeof saved === "object" ? saved : {};
        return {
            started: false,
            folded: false,
            explicit: typeof s.folded === "boolean" ? s.folded : null,
            seen: Array.isArray(s.seen) ? s.seen.map(String) : [],
        };
    }
    // after a render: `count` notes in the box, `composing` the composer is open
    function step(st, notes, composing) {
        const keys = outcomes(notes), count = (notes || []).length;
        let { started, folded, explicit, seen } = st;
        if (!started && count > 0) {
            // the first time the box has notes: folded once read, open when something is new or the
            // notes are the ones you are typing now
            started = true;
            folded = isNew(seen, keys) || composing ? false : explicit != null ? explicit : true;
            if (isNew(seen, keys))
                explicit = null;
        }
        else if (started && isNew(seen, keys)) {
            folded = false;
            explicit = null;
        }
        // seen only by a box that shows (the empty render before the server answers sees nothing)
        if (started && !folded)
            seen = keys;
        return { started, folded, explicit, seen };
    }
    const toggle = (st) => ({ ...st, started: true, folded: !st.folded, explicit: !st.folded });
    // the box shows folded: there are notes, and you are not typing one
    const shown = (st, count, composing) => st.folded && count > 0 && !composing;
    const saved = (st) => ({ folded: st.explicit, seen: st.seen });
    const core = { FW, outcomes, start, step, toggle, shown, saved };
    // ---- the DOM
    function attach(doc, { list, head, page }) {
        // the page's own window (a page in a browser has one; a missing one throws in the trys below)
        const win = doc.defaultView;
        const key = `bise:notes-fold:${page || ""}`;
        const read = () => { try {
            return JSON.parse(win.localStorage.getItem(key) || "null");
        }
        catch {
            return null;
        } };
        const keep = (st) => { try {
            win.localStorage.setItem(key, JSON.stringify(saved(st)));
        }
        catch { /* no storage: the fold lasts the visit */ } };
        let st = start(read()), last = { notes: [], composing: false };
        const pill = doc.createElement("button");
        pill.type = "button";
        pill.className = "bn-pill";
        pill.title = "l";
        pill.setAttribute("aria-expanded", "false");
        const pillText = doc.createElement("span");
        const pillGlyph = doc.createElement("span");
        pillGlyph.className = "bn-fold-glyph";
        pillGlyph.textContent = "▸";
        pillGlyph.setAttribute("aria-hidden", "true");
        pill.append(pillText, pillGlyph);
        list.prepend(pill);
        // the head is the fold control, like the right bar's section heads: a click anywhere on it
        head.setAttribute("role", "button");
        head.tabIndex = 0;
        head.title = "l";
        head.setAttribute("aria-label", FW.say.fold);
        const keyRow = list.querySelector(".bn-keyrow");
        if (keyRow) {
            const k = doc.createElement("span");
            k.className = "bn-key";
            k.textContent = FW.key;
            keyRow.append(k);
        }
        function paint() {
            const count = last.notes.length;
            const folded = shown(st, count, last.composing);
            list.classList.toggle("bn-folded", folded);
            pillText.textContent = `${FW.pill(count)} `;
            pill.setAttribute("aria-label", `${FW.pill(count)} · ${FW.say.open}`);
            head.setAttribute("aria-expanded", String(!folded));
        }
        function flip() {
            if (!last.notes.length)
                return;
            const had = list.contains(doc.activeElement);
            st = toggle(st);
            if (!st.folded)
                st = { ...st, seen: outcomes(last.notes) };
            keep(st);
            paint();
            if (had || doc.activeElement === doc.body)
                (st.folded ? pill : head).focus({ preventScroll: true });
        }
        pill.addEventListener("click", flip);
        head.addEventListener("click", flip);
        head.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flip();
        } });
        doc.addEventListener("keydown", (e) => {
            if (e.key !== "l" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented)
                return;
            const t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "")))
                return;
            if (!list.classList.contains("bn-on"))
                return;
            e.preventDefault();
            flip();
        });
        return {
            update(notes, composing) {
                last = { notes: notes || [], composing: !!composing };
                const next = step(st, last.notes, last.composing);
                const changed = JSON.stringify(saved(next)) !== JSON.stringify(saved(st));
                st = next;
                if (changed && st.started)
                    keep(st);
                paint();
            },
            get state() { return st; },
        };
    }
    root.BiseNotesFold = { core, attach };
})(typeof window !== "undefined" ? window : globalThis);
