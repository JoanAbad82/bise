// the home's bims (page bims-home, Gabriel's pick A): one bim per section, on its edge, plays its gag
// once per visit when it comes on screen, one at a time, then holds its last pose and blinks every
// ~8 s while it shows. Its sheets (bims/*.webp, bims/sheets.json) are rendered from the app's bims
// by apps/desktop/scripts/bims-sprites.mts; a sheet loads when its bim is a screen away. Reduced
// motion: the last pose, nothing moves. A bim takes hover and taps only on itself (a hop);
// everything else passes clicks through. Phones (≤ 600 px): the 4 phone gags, at 72 px.
(() => {
  interface Box { x: number; y: number; w: number; h: number }
  interface Meta { id: string; w: number; h: number; ax: number; ay: number; n: number; seq: number[]; phone: boolean; hit: Box; travel?: number[] }
  type Pt = [number, number] | null;
  /** where a bim's anchor goes on the page (viewport px), from its element's box (its last line's for `why`); null: no room */
  interface Place { el: string; at: (r: DOMRect, m: Meta, k: number, e: Element) => Pt; to?: (r: DOMRect, m: Meta, k: number) => Pt }
  interface Bim { m: Meta; el: HTMLElement; s: HTMLElement; k: number; place: Place; state: 'far' | 'near' | 'wait' | 'play' | 'idle'; on: boolean; blink: number }

  const FPS = 12;
  const KEY = 'bims-gags';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 600px)');
  const margin = (r: DOMRect, m: Meta, k: number): boolean => r.left - m.ax * k >= 8;
  /** the highlight's last line, and whether the line above leaves room over its end for a bim lying there */
  const lastLine = (e: Element): DOMRect => { const rs = e.getClientRects(); return rs[rs.length - 1] ?? e.getBoundingClientRect(); };
  const roomOver = (e: Element, r: DOMRect, w: number): boolean => {
    const rg = document.createRange();
    rg.selectNodeContents(e.parentElement ?? e);
    rg.setEndBefore(e);
    let right = -Infinity;
    for (const x of [...rg.getClientRects(), ...[...e.getClientRects()].slice(0, -1)]) if (x.bottom <= r.top + 4 && x.bottom > r.top - r.height) right = Math.max(right, x.right);
    return right < r.right - w;
  };
  const WIDE: Record<string, Place> = {
    // over the mock's sidebar: its empty top, never on the head's text
    'ways-sit': { el: '#ways .appc:nth-child(1)', at: (r) => [r.left + Math.max(30, r.width * 0.095), r.top] },
    'ways-climb': { el: '#ways .appc:nth-child(2)', at: (r) => [r.right - 3, r.top] },
    // asleep on the highlight's top; with the line above in the way, beside its period on the line
    why: { el: '#why .hl', at: (_, m, k, e) => { const r = lastLine(e); return roomOver(e, r, m.ax * k) ? [r.right - 6, r.top + r.height * 0.21] : [r.right + 14 + m.ax * k, r.top + r.height * 0.93]; } },
    lead: { el: '#next', at: (r) => [r.right + 2, r.bottom] },
    banner: { el: '#banner', at: (r) => (r.width ? [r.right, r.top + 1] : null) },
    // the window's top edge, its empty middle (between its title and 'page · v2')
    arts: { el: '.arts .shot', at: (r) => [r.left + r.width * 0.58, r.top] },
    fun: { el: '#fun .fun .shot', at: (r, m, k) => (margin(r, m, k) ? [r.left - 14, r.bottom] : [r.right - 12, r.top]) },
    hard: { el: '.details', at: (r, m, k) => [r.left + m.ax * k, r.bottom + 44], to: (r, m, k) => [r.right - (m.w - m.ax) * k, r.bottom + 44] },
    faq: { el: '#faq p:last-child b', at: (r) => [r.right + 6, r.bottom - 3] },
    end: { el: '#end .appc .btn', at: (r) => [r.right + 6, r.bottom] },
  };

  let played: string[] = [];
  try { played = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[]; } catch { /* a private window: once per load */ }
  const bims: Bim[] = [];
  const queue: Bim[] = [];
  let busy = false;
  let box: HTMLElement | null = null;

  const frame = (b: Bim, i: number, idle: boolean): void => {
    const n = idle ? 2 : b.m.n;
    b.s.style.backgroundImage = `url(/bims/${b.m.id}${idle ? '-idle' : ''}.webp)`;
    b.s.style.backgroundSize = `${String(n * b.m.w * b.k)}px ${String(b.m.h * b.k)}px`;
    b.s.style.backgroundPosition = `${String(-i * b.m.w * b.k)}px 0`;
  };
  const along = (b: Bim, u: number): void => {
    const e = document.querySelector(b.place.el);
    const r = e?.getBoundingClientRect();
    const a = e && r && b.place.at(r, b.m, b.k, e);
    const z = r && b.place.to?.(r, b.m, b.k);
    b.el.style.transform = a && z ? `translateX(${String((z[0] - a[0]) * u)}px)` : '';
  };
  const place = (b: Bim): void => {
    const e = document.querySelector(b.place.el);
    const p = e ? b.place.at(e.getBoundingClientRect(), b.m, b.k, e) : null;
    b.el.hidden = !p;
    if (!p) return;
    b.el.style.left = `${String(p[0] + scrollX - b.m.ax * b.k)}px`;
    b.el.style.top = `${String(p[1] + scrollY - b.m.ay * b.k)}px`;
  };
  const layout = (): void => {
    if (box) box.style.height = `${String(document.documentElement.scrollHeight)}px`;
    for (const b of bims) place(b);
  };

  const blinkLater = (b: Bim): void => {
    clearTimeout(b.blink);
    if (reduced || !b.on || b.state !== 'idle') return;
    b.blink = window.setTimeout(() => {
      frame(b, 1, true);
      b.blink = window.setTimeout(() => { frame(b, 0, true); blinkLater(b); }, 150);
    }, 7000 + Math.random() * 2000);
  };
  const idle = (b: Bim): void => {
    b.state = 'idle';
    frame(b, 0, true);
    if (b.m.travel) along(b, 1);
    blinkLater(b);
  };
  const next = (): void => {
    const b = queue.shift();
    if (!b) { busy = false; return; }
    busy = true;
    b.state = 'play';
    place(b);
    let i = 0;
    const step = (): void => {
      if (i >= b.m.seq.length) {
        played.push(b.m.id);
        try { sessionStorage.setItem(KEY, JSON.stringify(played)); } catch { /* fine */ }
        idle(b);
        next();
        return;
      }
      frame(b, b.m.seq[i] ?? 0, false);
      if (b.m.travel) along(b, b.m.travel[i] ?? 1);
      i++;
      setTimeout(step, 1000 / FPS);
    };
    // the section's own entrance first (.blow, ~0.6 s)
    setTimeout(step, 600);
  };
  const near = (b: Bim): void => {
    if (b.state !== 'far') return;
    b.state = 'near';
    // what it will show: its idle sheet, and its gag's when it still has one to play
    new Image().src = `/bims/${b.m.id}-idle.webp`;
    if (!reduced && !played.includes(b.m.id)) new Image().src = `/bims/${b.m.id}.webp`;
  };
  const seen = (b: Bim): void => {
    if (b.state === 'near' && (reduced || played.includes(b.m.id))) idle(b);
    else if (b.state === 'near') {
      b.state = 'wait';
      frame(b, b.m.seq[0] ?? 0, false);
      if (b.m.travel) along(b, 0);
      queue.push(b);
      if (!busy) next();
    } else blinkLater(b);
  };
  const hop = (b: Bim): void => {
    if (reduced || b.s.classList.contains('hop')) return;
    b.s.classList.add('hop');
    b.s.addEventListener('animationend', () => b.s.classList.remove('hop'), { once: true });
  };

  const start = (metas: Meta[]): void => {
    for (const b of bims) clearTimeout(b.blink);
    box?.remove();
    bims.length = 0;
    queue.length = 0;
    busy = false;
    const k = phone.matches ? 0.75 : 1;
    box = document.createElement('div');
    box.className = 'bims';
    box.setAttribute('aria-hidden', 'true');
    document.body.append(box);
    const io = new IntersectionObserver((es) => { for (const e of es) { const b = bims.find((x) => x.el === e.target); if (b && e.isIntersecting) near(b); } }, { rootMargin: '100% 0px' });
    const vis = new IntersectionObserver((es) => {
      for (const e of es) {
        const b = bims.find((x) => x.el === e.target);
        if (!b) continue;
        b.on = e.isIntersecting;
        if (b.on) seen(b);
        else clearTimeout(b.blink);
      }
    }, { threshold: 0.9 });
    for (const m of metas) {
      const p = WIDE[m.id];
      if (!p || (k < 1 && !m.phone)) continue;
      const el = document.createElement('div');
      el.className = 'bim';
      el.style.width = `${String(m.w * k)}px`;
      el.style.height = `${String(m.h * k)}px`;
      const s = document.createElement('div');
      const hit = document.createElement('i');
      Object.assign(hit.style, { left: `${String(m.hit.x * k)}px`, top: `${String(m.hit.y * k)}px`, width: `${String(m.hit.w * k)}px`, height: `${String(m.hit.h * k)}px` });
      s.append(hit);
      el.append(s);
      box.append(el);
      const b: Bim = { m, el, s, k, place: p, state: 'far', on: false, blink: 0 };
      hit.addEventListener('pointerenter', () => hop(b));
      hit.addEventListener('pointerdown', () => hop(b));
      bims.push(b);
    }
    layout();
    for (const b of bims) { io.observe(b.el); vis.observe(b.el); }
    phone.addEventListener('change', () => start(metas), { once: true });
  };

  const css = document.createElement('style');
  css.textContent = '.bims{position:absolute;top:0;left:0;width:100%;overflow:clip;pointer-events:none;z-index:4}'
    + '.bim{position:absolute}.bim>div{position:absolute;inset:0;background-repeat:no-repeat}'
    + '.bim i{position:absolute;pointer-events:auto}'
    + '.bim .hop{animation:bim-hop .45s cubic-bezier(.3,0,.3,1)}'
    + '@keyframes bim-hop{0%{transform:none}20%{transform:translateY(2px) scale(1.06,.92)}55%{transform:translateY(-12px) scale(.96,1.05)}80%{transform:translateY(1px) scale(1.04,.96)}100%{transform:none}}';
  document.head.append(css);
  void fetch('/bims/sheets.json').then((r) => r.json() as Promise<Meta[]>).then((metas) => {
    start(metas);
    let raf = 0;
    const again = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); };
    addEventListener('resize', again);
    new ResizeObserver(again).observe(document.body);
    // for the contact sheet's shots: every bim at step i of its gag (or its idle pose past the end)
    (window as unknown as { bimsAt: (i: number) => void }).bimsAt = (i) => {
      for (const b of bims) {
        b.state = 'idle';
        place(b);
        if (i < b.m.seq.length) { frame(b, b.m.seq[i] ?? 0, false); if (b.m.travel) along(b, b.m.travel[i] ?? 1); } else idle(b);
      }
    };
  }).catch(() => { /* no bims: the page is whole without them */ });
})();
