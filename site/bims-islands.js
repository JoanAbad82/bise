// generated from bims-islands.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// the home bims (page bims-home v7, Gabriel's pick « les îles »; live in 3D since bims-home v11): one
// little clay island per section, loaded by index.html everywhere but bise.dev until his go. Each sits
// beside its section's title, in the margin, never over text, a card or a button, 48 px at least from
// the title's words (its shadow included; designer m_41966): the sides alternate (left, right, ...)
// and fall back to the other one; neither fits at that width: it stays out (no squeeze). A phone: the
// four of ROOMS get a room of their own above their cards, scaled to 140 px.
// With WebGL the islands are live (the hero bundle's islands.js, on its film.js: one renderer for all,
// a transparent canvas per island): each builds like the hero's town as it comes on screen, once per
// visit and one at a time (a second waits for the first), plays its gag, then holds its pose and
// blinks; the pointer over one tilts it and turns its bims' heads, and plays the scene's own move
// (a tap on a phone); off screen nothing is drawn. No WebGL: the sprites (bims/<id>.webp +
// <id>-f.webp + islands.json, from apps/desktop/scripts/bims-sprites.mts), their held pose, no entry
// and no hover. Reduced motion: drawn built, only the heads turn. Only the bims take pointers (a hop).
(() => {
    /** a live island's canvas: its room past the sprite's box (the plane's loop, the notes, the hop) */
    const ROOM = { l: 40, t: 64, r: 40, b: 24 };
    const KEY = 'bims-islands';
    /** the gap from the title's words to the island's box: 48 px, plus its shadow's blur past the box */
    const GAP = 56;
    /** the room kept around text and cards */
    const PAD = 12;
    /** the phone's four: the cards they get a room above */
    const ROOMS = { ways: '#ways .apps', why: '#why .beat', fun: '#fun .funs', end: '#end .apps' };
    const OBSTACLES = 'h2,h3,p,.kicker,.apps,.demo,.stage,.funs,.details,.beat,.pair,.hbox,.btn';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const px = (n) => `${String(Math.round(n))}px`;
    const q = (s) => document.querySelector(s);
    let played = [];
    try {
        played = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    }
    catch { /* once per load */ }
    const box = document.createElement('div');
    box.className = 'bp';
    box.setAttribute('aria-hidden', 'true');
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/bims/islands.css';
    document.head.append(css);
    /** an element's own ink: its text's box for words, its box for a card */
    const inkOf = (e) => {
        if (!e.matches('h2,h3,p,.kicker'))
            return e.getBoundingClientRect();
        const r = document.createRange();
        r.selectNodeContents(e);
        return r.getBoundingClientRect();
    };
    const gags = [];
    const layout = () => {
        box.style.height = px(document.documentElement.scrollHeight);
        const taken = [...document.querySelectorAll(OBSTACLES)].map(inkOf).filter((r) => r.width > 0);
        const clear = (x, y, w, h) => x >= 8 && x + w <= innerWidth - 8 && taken.every((r) => x + w + PAD <= r.left || x >= r.right + PAD || y + h + PAD <= r.top || y >= r.bottom + PAD);
        gags.forEach((g, i) => {
            const { w, h, id } = g.m;
            const title = q(`#${id} h2`);
            if (!title)
                return;
            const t = inkOf(title);
            // left, right, left...: beside the title's words, level with them, else a little higher; a phone keeps to its four rooms
            const phone = innerWidth <= 600;
            const xs = phone ? [] : [t.left - GAP - w, t.right + GAP];
            if (i % 2)
                xs.reverse();
            let at = null;
            for (const x of xs) {
                for (let dy = 0; !at && dy <= 64; dy += 16) {
                    const y = t.top + t.height / 2 - h / 2 - dy;
                    if (clear(x, y, w, h))
                        at = [x, y];
                }
                if (at)
                    break;
            }
            let k = 1;
            const sel = ROOMS[id];
            const cards = sel ? q(sel) : null;
            if (!at && cards && phone) {
                k = 140 / w;
                if (!g.room) {
                    g.room = document.createElement('div');
                    cards.before(g.room);
                }
                g.room.style.height = px(h * k + 10);
                const c = cards.getBoundingClientRect();
                at = [c.right - w * k - 4, c.top - h * k - 4];
            }
            else {
                g.room?.remove();
                g.room = null;
            }
            g.shown = !!at;
            g.el.hidden = !at;
            if (!at)
                return;
            taken.push(new DOMRect(at[0], at[1], w * k, h * k));
            g.el.style.left = px(at[0] + scrollX);
            g.el.style.top = px(at[1] + scrollY);
            g.el.style.transform = k === 1 ? '' : `scale(${String(k)})`;
        });
    };
    const set = (g, i) => {
        const { m } = g;
        g.fr.style.backgroundPosition = `${px(-(i === -1 ? (m.seq.at(-1) ?? 0) : i === -2 ? m.blink : i) * (m.f[2] ?? 0))} 0`;
    };
    const idle = (g) => {
        clearTimeout(g.t);
        if (g.li) {
            g.li.hold();
            return;
        }
        set(g, -1);
        if (reduced || !g.on)
            return;
        g.t = window.setTimeout(() => { set(g, -2); g.t = window.setTimeout(() => idle(g), 150); }, 7000 + Math.random() * 2000);
    };
    // one at a time: the entry playing, the ones waiting for it
    let busy = false;
    const waiting = [];
    const next = () => {
        const g = waiting.shift();
        if (!g)
            return;
        if (!g.on || !g.li) {
            g.done = false;
            next();
            return;
        }
        busy = true;
        g.li.play(() => {
            busy = false;
            played.push(g.m.id);
            try {
                sessionStorage.setItem(KEY, JSON.stringify(played));
            }
            catch { /* fine */ }
            next();
        });
    };
    const seen = (g) => {
        g.done = true;
        // the sprites hold their pose (no entry, no hover); a live island built already or under reduced motion too
        if (!g.li || reduced || played.includes(g.m.id)) {
            idle(g);
            return;
        }
        waiting.push(g);
        if (!busy)
            next();
    };
    const island = (m, lives) => {
        const el = document.createElement('div');
        Object.assign(el.style, { width: px(m.w), height: px(m.h) });
        const pts = m.under.map((v, i) => `${String(i % 2 ? (v / m.h) * 100 : (v / m.w) * 100)}%`);
        const poly = Array.from({ length: 4 }, (_, i) => `${pts[i * 2] ?? ''} ${pts[i * 2 + 1] ?? ''}`).join(',');
        el.innerHTML = `<div class="sh"><b style="clip-path:polygon(${poly})"></b></div>`;
        const [fx = 0, fy = 0, fw = 0, fh = 0] = m.f;
        const fr = document.createElement('div');
        fr.className = 'fr';
        Object.assign(fr.style, { left: px(fx), top: px(fy), width: px(fw), height: px(fh), backgroundSize: `${px(fw * m.n)} ${px(fh)}` });
        const hit = document.createElement('i');
        const [hx = 0, hy = 0, hw = 0, hh = 0] = m.hit;
        Object.assign(hit.style, { left: px(hx), top: px(hy), width: px(hw), height: px(hh) });
        fr.append(hit);
        const g = { m, el, fr, room: null, shown: false, on: false, done: false, t: 0, li: null, over: false };
        if (lives) {
            // live: its canvas, the sprite's box and a room around it; the shadow waits for the slab
            const cv = document.createElement('canvas');
            cv.className = 'cv';
            Object.assign(cv.style, { left: px(-ROOM.l), top: px(-ROOM.t) });
            el.append(cv, fr);
            g.li = lives.add({ id: m.id, canvas: cv, w: m.w, h: m.h, under: m.under, pad: ROOM });
            const sh = el.querySelector('.sh > b');
            g.li.onShadow((k) => { if (sh) {
                sh.style.opacity = String(k);
                sh.style.transform = k >= 1 ? '' : `scale(${String(0.35 + 0.65 * k)})`;
            } });
            // a click on its bim hops it
            hit.addEventListener('pointerdown', () => g.li?.hop());
            return g;
        }
        const base = document.createElement('div');
        base.className = 'is';
        base.style.inset = '0';
        el.append(base, fr);
        set(g, -1);
        // a hover or a tap on the bims hops them
        const hop = () => {
            if (reduced || fr.classList.contains('hopi'))
                return;
            fr.classList.add('hopi');
            fr.addEventListener('animationend', () => fr.classList.remove('hopi'), { once: true });
        };
        hit.addEventListener('pointerenter', hop);
        hit.addEventListener('pointerdown', hop);
        return g;
    };
    /** the pointer over a live island's box: its point in the box (css px, the phone's scale undone), or null */
    const inBox = (g, x, y) => {
        if (!g.shown)
            return null;
        const r = g.el.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom)
            return null;
        const k = r.width / g.m.w;
        return [(x - r.left) / k, (y - r.top) / k];
    };
    const pointer = () => {
        const live = gags.filter((g) => g.li);
        addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch')
                return;
            for (const g of live) {
                const at = inBox(g, e.clientX, e.clientY);
                if (at) {
                    g.over = true;
                    g.li?.point(at[0], at[1]);
                }
                else if (g.over) {
                    g.over = false;
                    g.li?.leave();
                }
            }
        }, { passive: true });
        document.documentElement.addEventListener('pointerleave', () => {
            for (const g of live)
                if (g.over) {
                    g.over = false;
                    g.li?.leave();
                }
        });
        // on a phone a tap is the hover
        addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'touch')
                return;
            for (const g of live) {
                const at = inBox(g, e.clientX, e.clientY);
                if (at)
                    g.li?.tap(at[0], at[1]);
            }
        }, { passive: true });
    };
    const start = (ms, lives) => {
        document.body.append(box);
        for (const m of ms) {
            const g = island(m, lives);
            gags.push(g);
            box.append(g.el);
        }
        if (lives)
            pointer();
        layout();
        const find = (e) => gags.find((x) => x.el === e);
        // each loads as it nears
        const near = new IntersectionObserver((es) => {
            for (const e of es) {
                const g = find(e.target);
                if (!g || !e.isIntersecting)
                    continue;
                near.unobserve(e.target);
                if (g.li)
                    continue;
                g.el.querySelector('.is').style.backgroundImage = `url(/bims/${g.m.id}.webp)`;
                g.fr.style.backgroundImage = `url(/bims/${g.m.id}-f.webp)`;
            }
        }, { rootMargin: '800px 0px' });
        const vis = new IntersectionObserver((es) => {
            for (const e of es) {
                const g = find(e.target);
                if (!g)
                    continue;
                g.on = e.isIntersecting;
                g.li?.setOn(g.on);
                if (g.on && !g.done)
                    seen(g);
                else if (g.on && !waiting.includes(g))
                    idle(g);
                else if (!g.on && g.done && !waiting.includes(g))
                    clearTimeout(g.t);
            }
        }, { threshold: 0.6 });
        for (const g of gags) {
            near.observe(g.el);
            vis.observe(g.el);
        }
        let raf = 0;
        const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
        addEventListener('resize', again);
        addEventListener('transitionend', again);
        new ResizeObserver(again).observe(document.body);
        // the contact sheet's shots: the sprites' step i (-1 held, -2 blink), every island without an id;
        // a live island's moment (islands.ts Still)
        const w = window;
        w.bimsAt = (i, id) => {
            for (const g of gags) {
                if (id && g.m.id !== id)
                    continue;
                clearTimeout(g.t);
                g.done = true;
                set(g, i);
            }
        };
        w.bimsLive = (id, st) => {
            const g = gags.find((x) => x.m.id === id);
            if (!g?.li)
                return;
            g.done = true;
            g.li.still(st);
            g.el.querySelector('.sh > b')?.style.setProperty('opacity', '1');
        };
    };
    /** the live islands: the hero bundle's chunk on its engine; null without WebGL (or without the bundle): the sprites */
    const lives = async () => {
        const url = '/desktop/hero/hero.js';
        try {
            const hero = (await import(url));
            const mod = await hero.loadIslands();
            return mod.mountIslands({ reduced, probe: new URLSearchParams(location.search).has('herotest') });
        }
        catch {
            return null;
        }
    };
    void Promise.all([fetch('/bims/islands.json').then((r) => r.json()), lives()])
        .then(([ms, li]) => { start(ms, li); })
        .catch(() => { });
})();
