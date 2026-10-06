// A small RFB (VNC) client for the macOS VM pass: the guest's screen as pixels and the guest's
// keyboard and mouse as real HID input. tart's --vnc-experimental serves Virtualization.framework's
// own VNC server: its keys enter the guest like a USB keyboard's (through the window server, so
// menus' key equivalents and the key window see them), its frames are the guest's framebuffer.
//   const v = await Rfb.connect(port, password);
//   const png = await v.shot();              // the whole screen, a PNG
//   await v.keys('Meta+Q');                  // ⌘Q: Meta = ⌘, Alt = ⌥, Control, Shift
//   await v.type('hello');                   // characters, one key each
//   await v.click(400, 300);                 // a left click at screen pixels
// RFB 3.8, security None or VNC auth (des.ts), Raw encoding (+ DesktopSize), 32-bit BGRX.
import net from 'node:net';
import { PNG } from 'pngjs';
import { vncAuthResponse } from './des';

/** X11 keysyms for the named keys a check presses; a single character is its own code point. */
export const KEYSYMS: Record<string, number> = {
  Enter: 0xff0d, Return: 0xff0d, Tab: 0xff09, Escape: 0xff1b, Backspace: 0xff08, Delete: 0xffff, Space: 0x20,
  ArrowLeft: 0xff51, ArrowUp: 0xff52, ArrowRight: 0xff53, ArrowDown: 0xff54, Home: 0xff50, End: 0xff57, PageUp: 0xff55, PageDown: 0xff56,
  Shift: 0xffe1, Control: 0xffe3, Alt: 0xffe9, Meta: 0xffe7, Super: 0xffeb,
  F1: 0xffbe, F2: 0xffbf, F3: 0xffc0, F4: 0xffc1, F5: 0xffc2, F6: 0xffc3, F7: 0xffc4, F8: 0xffc5, F9: 0xffc6, F10: 0xffc7, F11: 0xffc8, F12: 0xffc9,
};

/** 'Meta+Shift+z' -> [Meta, Shift, z] keysyms (modifiers first). Pure. */
export function parseCombo(combo: string): number[] {
  return combo.split('+').map((k) => {
    const named = KEYSYMS[k];
    if (named !== undefined) return named;
    const cp = k.codePointAt(0);
    if (cp !== undefined && String.fromCodePoint(cp) === k) return cp;
    throw new Error(`unknown key '${k}' in '${combo}'`);
  });
}

class Reader {
  private chunks: Buffer[] = [];
  private have = 0;
  private wait: { n: number; resolve: (b: Buffer) => void } | undefined;
  closed: Error | undefined;

  push(b: Buffer): void {
    this.chunks.push(b);
    this.have += b.length;
    this.pump();
  }

  fail(e: Error): void {
    this.closed = e;
  }

  read(n: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (this.closed && this.have < n) { reject(this.closed); return; }
      this.wait = { n, resolve };
      this.pump();
    });
  }

  private pump(): void {
    if (!this.wait || this.have < this.wait.n) return;
    const all = Buffer.concat(this.chunks);
    const out = all.subarray(0, this.wait.n);
    this.chunks = [all.subarray(this.wait.n)];
    this.have = all.length - this.wait.n;
    const w = this.wait;
    this.wait = undefined;
    w.resolve(Buffer.from(out));
  }
}

export class Rfb {
  width = 0;
  height = 0;
  name = '';
  /** the framebuffer, RGBA */
  private fb = Buffer.alloc(0);
  private updates: (() => void)[] = [];

  private constructor(private readonly sock: net.Socket, private readonly r: Reader) {}

  static async connect(port: number, password = '', host = '127.0.0.1'): Promise<Rfb> {
    const sock = net.createConnection({ host, port });
    const r = new Reader();
    sock.on('data', (b) => { r.push(b); });
    sock.on('error', (e) => { r.fail(e); });
    sock.on('close', () => { r.fail(new Error('vnc: connection closed')); });
    await new Promise<void>((res, rej) => { sock.once('connect', res); sock.once('error', rej); });
    const v = new Rfb(sock, r);
    await v.handshake(password);
    void v.loop();
    return v;
  }

  private async handshake(password: string): Promise<void> {
    const version = (await this.r.read(12)).toString('latin1');
    if (!version.startsWith('RFB ')) throw new Error(`vnc: not an RFB server (${JSON.stringify(version)})`);
    this.sock.write('RFB 003.008\n');
    const n = (await this.r.read(1)).readUInt8(0);
    if (n === 0) {
      const len = (await this.r.read(4)).readUInt32BE(0);
      throw new Error(`vnc: refused: ${(await this.r.read(len)).toString()}`);
    }
    const types = [...(await this.r.read(n))];
    const pick = password && types.includes(2) ? 2 : types.includes(1) ? 1 : types.includes(2) ? 2 : -1;
    if (pick < 0) throw new Error(`vnc: no supported security type in [${types.join(',')}]`);
    this.sock.write(Buffer.from([pick]));
    if (pick === 2) this.sock.write(vncAuthResponse(password, await this.r.read(16)));
    const result = (await this.r.read(4)).readUInt32BE(0);
    if (result !== 0) throw new Error('vnc: authentication failed');
    this.sock.write(Buffer.from([1])); // ClientInit: shared
    const init = await this.r.read(24);
    this.width = init.readUInt16BE(0);
    this.height = init.readUInt16BE(2);
    this.name = (await this.r.read(init.readUInt32BE(20))).toString();
    this.fb = Buffer.alloc(this.width * this.height * 4);
    // SetPixelFormat: 32 bpp, depth 24, little-endian, true colour, 255 max, shifts R16 G8 B0
    const pf = Buffer.alloc(20);
    pf.writeUInt8(0, 0);
    Buffer.from([32, 24, 0, 1, 0, 255, 0, 255, 0, 255, 16, 8, 0, 0, 0, 0]).copy(pf, 4);
    this.sock.write(pf);
    // SetEncodings: Raw, DesktopSize
    const enc = Buffer.alloc(4 + 8);
    enc.writeUInt8(2, 0);
    enc.writeUInt16BE(2, 2);
    enc.writeInt32BE(0, 4);
    enc.writeInt32BE(-223, 8);
    this.sock.write(enc);
  }

  private async loop(): Promise<void> {
    try {
      for (;;) {
        const t = (await this.r.read(1)).readUInt8(0);
        if (t === 0) await this.update();
        else if (t === 1) { const h = await this.r.read(5); await this.r.read(h.readUInt16BE(3) * 6); }
        else if (t === 2) { /* bell */ }
        else if (t === 3) { const h = await this.r.read(7); await this.r.read(h.readUInt32BE(3)); }
        else throw new Error(`vnc: unknown server message ${t}`);
      }
    } catch { /* closed */ }
  }

  private async update(): Promise<void> {
    const n = (await this.r.read(3)).readUInt16BE(1);
    for (let i = 0; i < n; i++) {
      const h = await this.r.read(12);
      const x = h.readUInt16BE(0), y = h.readUInt16BE(2), w = h.readUInt16BE(4), hh = h.readUInt16BE(6), enc = h.readInt32BE(8);
      if (enc === -223) {
        this.width = w; this.height = hh; this.fb = Buffer.alloc(w * hh * 4);
        continue;
      }
      if (enc !== 0) throw new Error(`vnc: unexpected encoding ${enc}`);
      const px = await this.r.read(w * hh * 4);
      for (let row = 0; row < hh; row++) {
        for (let col = 0; col < w; col++) {
          const s = (row * w + col) * 4, d = ((y + row) * this.width + (x + col)) * 4;
          this.fb[d] = px[s + 2] ?? 0; this.fb[d + 1] = px[s + 1] ?? 0; this.fb[d + 2] = px[s] ?? 0; this.fb[d + 3] = 255;
        }
      }
    }
    const u = this.updates;
    this.updates = [];
    u.forEach((f) => { f(); });
  }

  private request(incremental: boolean): void {
    const b = Buffer.alloc(10);
    b.writeUInt8(3, 0);
    b.writeUInt8(incremental ? 1 : 0, 1);
    b.writeUInt16BE(this.width, 6);
    b.writeUInt16BE(this.height, 8);
    this.sock.write(b);
  }

  /** The whole screen now, as PNG bytes. */
  async shot(timeoutMs = 10_000): Promise<Buffer> {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => { reject(new Error('vnc: no frame')); }, timeoutMs);
      this.updates.push(() => { clearTimeout(t); resolve(); });
      this.request(false);
    });
    const png = new PNG({ width: this.width, height: this.height });
    this.fb.copy(png.data);
    return PNG.sync.write(png);
  }

  private key(sym: number, down: boolean): void {
    const b = Buffer.alloc(8);
    b.writeUInt8(4, 0);
    b.writeUInt8(down ? 1 : 0, 1);
    b.writeUInt32BE(sym, 4);
    this.sock.write(b);
  }

  /** Presses a combo ('Meta+Q', 'Escape'): every key down in order, then up in reverse. */
  async keys(combo: string, holdMs = 60): Promise<void> {
    const syms = parseCombo(combo);
    for (const s of syms) { this.key(s, true); await sleep(15); }
    await sleep(holdMs);
    for (const s of [...syms].reverse()) { this.key(s, false); await sleep(15); }
  }

  /** Types characters one key each. */
  async type(text: string, gapMs = 40): Promise<void> {
    for (const ch of text) await this.keys(ch === ' ' ? 'Space' : ch === '\n' ? 'Enter' : ch, 20).then(() => sleep(gapMs));
  }

  private pointer(mask: number, x: number, y: number): void {
    const b = Buffer.alloc(6);
    b.writeUInt8(5, 0);
    b.writeUInt8(mask, 1);
    b.writeUInt16BE(Math.round(x), 2);
    b.writeUInt16BE(Math.round(y), 4);
    this.sock.write(b);
  }

  async move(x: number, y: number): Promise<void> {
    this.pointer(0, x, y);
    await sleep(30);
  }

  /** A click at screen pixels (button 1 = left, 3 = right). */
  async click(x: number, y: number, button: 1 | 3 = 1): Promise<void> {
    this.pointer(0, x, y);
    await sleep(40);
    this.pointer(button === 1 ? 1 : 4, x, y);
    await sleep(60);
    this.pointer(0, x, y);
    await sleep(40);
  }

  close(): void {
    this.sock.destroy();
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
