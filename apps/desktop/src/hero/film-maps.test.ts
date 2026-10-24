// The film's maps (film-maps.ts): every office the film casts is on a map its build keeps.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CAST } from './cast';
import { FILM_MAPS } from './film-maps';
import { DEFAULT_MAP } from '@/bims/maps/ids';

describe('the hero film\'s maps', () => {
  it('keeps every cast office\'s map and the loft the others fall back to', () => {
    const kept: readonly string[] = FILM_MAPS;
    for (const c of CAST) expect(kept).toContain(c.map);
    expect(kept).toContain(DEFAULT_MAP);
  });

  it('is never listed whole by the hero (a picker or a loop over the registry would reach a stub)', () => {
    // the build checks every module of film.js the same way (hero.vite.config.ts filmMaps)
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/\b(MAP_IDS|PLANS|LOOKS|readyMaps)\b/);
  });
});
