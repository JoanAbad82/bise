// window.bise.saveImage's main side (R41): an image he pastes or drops in the
// window's composer or the spotlight becomes a file in bise's image store, the
// TUI's (rust/images store_dir: $BEND_IMAGE_DIR, else <bise home>/images), so
// the send carries its absolute path and the hub turns it into an image block
// the model sees (docs/images.md). Kind by magic bytes, never by the name; the
// file is named by its bytes' hash, so a second paste of the same image is the
// same file.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** The store's limit on what it takes (rust/images MAX_INPUT_BYTES). */
export const MAX_IMAGE_BYTES = 64 * 1024 * 1024;

/** An image's extension from its first bytes: png, jpg, gif, webp; anything else null. */
export function imageExt(b: Uint8Array): string | null {
  const at = (i: number, ...xs: number[]): boolean => xs.every((x, k) => b[i + k] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'png';
  if (at(0, 0xff, 0xd8, 0xff)) return 'jpg';
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return 'gif';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'webp';
  return null;
}

/** The image store's folder for this environment (bise_home's images_dir). */
export function imageDir(env: Readonly<Record<string, string | undefined>>, home: string = homedir()): string {
  const own = env['BEND_IMAGE_DIR'] ?? '';
  if (own !== '') return own;
  const bise = env['BISE_HOME'] ?? '';
  return join(bise !== '' ? bise : join(home, '.bise'), 'images');
}

/** The file the bytes go to (`<sha256>.<ext>`), or null when they aren't an image the model reads or are too big. */
export function imageFile(dir: string, bytes: Uint8Array): string | null {
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  const ext = imageExt(bytes);
  if (ext === null) return null;
  return join(dir, `${createHash('sha256').update(bytes).digest('hex')}.${ext}`);
}

/** Writes the image (once: the same bytes are the same file) and answers its absolute path; null when refused or unwritable. */
export function saveImage(dir: string, raw: unknown): string | null {
  if (!(raw instanceof Uint8Array)) return null;
  const file = imageFile(dir, raw);
  if (file === null) return null;
  try {
    if (!existsSync(file)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      // write then rename: the hub never reads half a file
      const tmp = `${file}.${String(process.pid)}.tmp`;
      writeFileSync(tmp, raw, { mode: 0o600 });
      renameSync(tmp, file);
    }
    return file;
  } catch (e) {
    process.stderr.write(`saveImage: ${String(e)}\n`);
    return null;
  }
}
