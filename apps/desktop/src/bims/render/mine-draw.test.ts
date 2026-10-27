// @vitest-environment happy-dom
// His bim's look where it is drawn (page bim-pick): the office makes main's bim again in a new look
// (only main's, only on a change), the coin's head key changes with it, and makeBim draws his own
// cuts and keeps main's :* under any hair. Fixtures only.
import { describe, expect, it } from 'vitest';
import type { Mesh } from 'three';
import { agent, mainAgent } from '../fixtures';
import { layoutOf } from '../maps';
import { makeOfficeScene } from './office-scene';
import { makeBim } from './bim';
import { mainOutfit, type Look } from './look';
import { STYLE } from './style';
import { outfitSig } from '@/app/side3d/render';

const PIGTAILS: Look = { skin: 5, hair: 'pigtails', color: 4, wear: 'none' };

describe('his bim, drawn', () => {
  it('the office makes main again in his new look, the others untouched, nothing on the same look', () => {
    const crew = [mainAgent(), agent('a1'), agent('a2')];
    const scene = makeOfficeScene(STYLE);
    const office = layoutOf(crew, 'loft');
    scene.setOffice(office, crew);
    const main = crew[0]?.name ?? 'main';
    const before = scene.body(main);
    const other = scene.body('a1');
    expect(before).not.toBeNull();
    scene.setMine(PIGTAILS);
    expect(scene.body(main)).toBeNull();
    scene.setOffice(office, crew);
    const after = scene.body(main);
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
    expect(scene.body('a1')).toBe(other);
    scene.setMine({ ...PIGTAILS });
    expect(scene.body(main)).toBe(after);
    scene.dispose();
  });

  it("the coin's head key follows his look, an agent's never", () => {
    expect(outfitSig('main', true, PIGTAILS)).toBe(JSON.stringify(mainOutfit(PIGTAILS)));
    expect(outfitSig('main', true, PIGTAILS)).not.toBe(outfitSig('main', true, null));
    expect(outfitSig('a1', false, PIGTAILS)).toBe(outfitSig('a1', false, null));
  });

  it("draws his own cuts as hair, and main's :* and chain under them", () => {
    const meshes = (l: Look | null): Mesh[] => {
      const b = makeBim('main', true, STYLE, mainOutfit(l), undefined, false);
      const out: Mesh[] = [];
      b.group.traverse((o) => {
        if ((o as Mesh).isMesh) out.push(o as Mesh);
      });
      return out;
    };
    const today = meshes(null);
    const pig = meshes(PIGTAILS);
    expect(pig.filter((m) => m.userData.hair === true).length).toBeGreaterThan(8);
    // the :* (two dots and three bars) and the chain: the same count of body meshes as today's main
    const body = (ms: Mesh[]): number => ms.filter((m) => m.parent?.name === 'body').length;
    expect(body(pig)).toBe(body(today));
  });
});
