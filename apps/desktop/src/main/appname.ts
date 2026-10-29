// The app's name for its menus (Quit bise, Hide bise, About bise) and its
// userData folder (lead m_12625, ambient-pm's try gate). Electron's own
// default is package.json's name, 'bise-desktop', even in a packed app:
// electron-builder's productName ('bise', or a try build's 'bise try')
// names the bundle and its executable, not package.json. Pure.
import { basename } from 'node:path';

/** 'bise' unpacked; a packed macOS app's own name (its executable's, = productName). */
export function appName(packaged: boolean, platform: string, execPath: string): string {
  if (!packaged || platform !== 'darwin') return 'bise';
  const name = basename(execPath);
  return name === '' ? 'bise' : name;
}
