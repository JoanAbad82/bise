// generated from bims-proto.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
// the home bims' two prototypes (page bims-home v4), loaded by index.html only with ?bims=: islands
// (bims/<id>.webp + <id>-f.webp + islands.json, from apps/desktop/scripts/bims-sprites.mts) or pencil
// (bims/pencil.svg), on #ways and #fun. Once per visit on screen, then the held pose and a blink every
// ~8 s; off screen nothing moves; reduced motion: the held pose. Only the bim takes pointers (a hop).
// No margin beside the title (a phone): the gag gets its own room above the cards, scaled down.
(() => {
    const mode = new URLSearchParams(location.search).get('bims');
    if (mode !== 'islands' && mode !== 'pencil')
        return;
    const FPS = 12;
    const KEY = 'bims-proto';
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
    css.href = '/bims/proto.css';
    document.head.append(css);
    /** islands: beside the section's title, on its left; else (a phone) room above its cards at 140 px */
    const titleLeft = (s) => Math.min(...[...document.querySelectorAll(`${s} .inner > *`)].map((e) => {
        const r = document.createRange();
        r.selectNodeContents(e);
        return r.getBoundingClientRect().left;
    }));
    /** the room a gag takes above its cards where the title leaves no margin (0: none) */
    const room = (g, h, cards) => {
        if (!h) {
            g.room?.remove();
            g.room = null;
            return;
        }
        if (!g.room) {
            g.room = document.createElement('div');
            cards.before(g.room);
        }
        g.room.style.height = px(h);
    };
    const place = (g) => {
        const sec = `#${g.id}`;
        const cards = q(g.id === 'ways' ? '#ways .apps' : '#fun .funs');
        const inner = q(`${sec} .inner`);
        if (!cards || !inner)
            return;
        // null: in its room above the cards
        let at = null;
        let k = 1;
        if (mode === 'islands') {
            const right = titleLeft(sec) - 24;
            const i = inner.getBoundingClientRect();
            // level with the title, never on the cards
            const c = cards.getBoundingClientRect();
            if (right - g.w >= Math.max(8, c.left - 8))
                at = [right - g.w, Math.min((i.top + i.bottom) / 2 - g.h / 2, c.top - g.h - 20)];
            else
                k = 140 / g.w;
        }
        else if (g.id === 'ways') {
            // on the terminal card's top edge, over its blank right margin
            const t = (q('#ways .appc:nth-child(2)') ?? cards).getBoundingClientRect();
            k = innerWidth <= 600 ? 0.8 : 1;
            at = [t.right - ((innerWidth <= 600 ? 30 : 46) + 24) * k, t.top - 52 * k];
        }
        else {
            // in the margin, its ground on the voice demo's bottom
            const s = (q('#fun .fun .shot') ?? cards).getBoundingClientRect();
            if (s.left - 14 - 104 >= 8)
                at = [s.left - 14 - 104, s.bottom - 86];
            else
                k = 0.8;
        }
        room(g, at ? 0 : g.h * k + 10, cards);
        if (!at) {
            const c = cards.getBoundingClientRect();
            at = [c.right - g.w * k - 4, c.top - g.h * k - 4];
        }
        g.el.style.left = px(at[0] + scrollX);
        g.el.style.top = px(at[1] + scrollY);
        g.el.style.transform = k === 1 ? '' : `scale(${String(k)})`;
    };
    const gags = [];
    const layout = () => {
        box.style.height = px(document.documentElement.scrollHeight);
        for (const g of gags)
            place(g);
    };
    const idle = (g) => {
        clearTimeout(g.t);
        g.set(-1);
        if (reduced || !g.on)
            return;
        g.t = window.setTimeout(() => { g.set(-2); g.t = window.setTimeout(() => idle(g), 150); }, 7000 + Math.random() * 2000);
    };
    const seen = (g) => {
        if (reduced || g.done || played.includes(g.id)) {
            g.done = true;
            idle(g);
            return;
        }
        g.done = true;
        g.t = window.setTimeout(() => g.play(() => {
            played.push(g.id);
            try {
                sessionStorage.setItem(KEY, JSON.stringify(played));
            }
            catch { /* fine */ }
            idle(g);
        }), 600);
    };
    /** a hover or a tap on the bim (`on`) hops it (`e`) */
    const hops = (on, e) => {
        const hop = () => {
            if (reduced || e.classList.contains('hopi'))
                return;
            e.classList.add('hopi');
            e.addEventListener('animationend', () => e.classList.remove('hopi'), { once: true });
        };
        on?.addEventListener('pointerenter', hop);
        on?.addEventListener('pointerdown', hop);
    };
    const island = (m) => {
        const el = document.createElement('div');
        Object.assign(el.style, { width: px(m.w), height: px(m.h) });
        const pts = m.under.map((v, i) => `${String(i % 2 ? (v / m.h) * 100 : (v / m.w) * 100)}%`);
        const poly = Array.from({ length: 4 }, (_, i) => `${pts[i * 2] ?? ''} ${pts[i * 2 + 1] ?? ''}`).join(',');
        el.innerHTML = `<div class="sh"><b style="clip-path:polygon(${poly})"></b></div><div class="is" style="inset:0;background-image:url(/bims/${m.id}.webp)"></div>`;
        const [fx = 0, fy = 0, fw = 0, fh = 0] = m.f;
        const fr = document.createElement('div');
        fr.className = 'fr';
        Object.assign(fr.style, { left: px(fx), top: px(fy), width: px(fw), height: px(fh), backgroundImage: `url(/bims/${m.id}-f.webp)`, backgroundSize: `${px(fw * m.n)} ${px(fh)}` });
        const hit = document.createElement('i');
        const [hx = 0, hy = 0, hw = 0, hh = 0] = m.hit;
        Object.assign(hit.style, { left: px(hx), top: px(hy), width: px(hw), height: px(hh) });
        fr.append(hit);
        el.append(fr);
        const idleAt = m.seq.at(-1) ?? 0;
        const g = {
            id: m.id, el, w: m.w, h: m.h, room: null, on: false, done: false, t: 0,
            set(i) { fr.style.backgroundPosition = `${px(-(i === -1 ? idleAt : i === -2 ? m.blink : i) * fw)} 0`; },
            play(end) {
                let i = 0;
                const step = () => {
                    if (i >= m.seq.length) {
                        end();
                        return;
                    }
                    if (g.on)
                        g.set(m.seq[i++] ?? 0);
                    g.t = window.setTimeout(step, 1000 / FPS);
                };
                step();
            },
        };
        g.set(m.seq[0] ?? 0);
        hops(hit, fr);
        return g;
    };
    const pencil = (svg) => {
        const el = document.createElement('div');
        el.append(svg);
        const g = {
            id: svg.id.slice(3), el, w: svg.width.baseVal.value, h: svg.height.baseVal.value, room: null, on: false, done: false, t: 0,
            set(i) { el.classList.toggle('blink', i === -2); },
            play(end) {
                el.classList.add('go');
                svg.addEventListener('animationend', function done(e) {
                    // its last part (.last) ends: it holds its pose
                    if (!e.target.matches('.last'))
                        return;
                    svg.removeEventListener('animationend', done);
                    el.classList.remove('go');
                    end();
                });
            },
        };
        hops(svg.querySelector('.bim'), svg);
        return g;
    };
    const start = (made) => {
        document.body.append(box);
        for (const g of made) {
            gags.push(g);
            box.append(g.el);
        }
        layout();
        const vis = new IntersectionObserver((es) => {
            for (const e of es) {
                const g = gags.find((x) => x.el === e.target);
                if (!g)
                    continue;
                g.on = e.isIntersecting;
                g.el.classList.toggle('off', !g.on);
                if (g.on && !g.done)
                    seen(g);
                else if (g.on)
                    idle(g);
                else if (g.done)
                    clearTimeout(g.t);
            }
        }, { threshold: 0.6 });
        for (const g of gags)
            vis.observe(g.el);
        let raf = 0;
        const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
        addEventListener('resize', again);
        addEventListener('transitionend', again);
        new ResizeObserver(again).observe(document.body);
        // the contact sheet's shots: step i (-1 held, -2 blink)
        window.bimsAt = (i) => { for (const g of gags) {
            clearTimeout(g.t);
            g.done = true;
            g.set(i);
        } };
    };
    if (mode === 'islands') {
        void fetch('/bims/islands.json').then((r) => r.json()).then((ms) => start(ms.map(island))).catch(() => { });
    }
    else {
        void fetch('/bims/pencil.svg').then((r) => r.text()).then((t) => {
            // its defs and style stay in the page; each drawing goes in its gag
            box.innerHTML = t;
            start([...box.querySelectorAll('svg svg')].map((p) => pencil(p)));
        }).catch(() => { });
    }
})();
