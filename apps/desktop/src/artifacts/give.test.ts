import { describe, expect, it } from 'vitest';
import type { ProjectRow } from '@/proto';
import { addDropWords, addPlace, addTitle, allImages, carriesFiles, droppedPaths, giveWords } from './give';

const row = (project: string, name: string, home = false): ProjectRow => ({ project, name, home }) as unknown as ProjectRow;
const rows = [row('home-1', 'home', true), row('shop-1', 'storefront'), row('api-2', '')];

describe('give: a file dropped on a thread or a list (designer m_23868, m_23898)', () => {
  it('only a drag that carries files takes the zone', () => {
    expect(carriesFiles(['Files'])).toBe(true);
    expect(carriesFiles(['text/plain', 'Files'])).toBe(true);
    expect(carriesFiles(['text/plain', 'text/uri-list'])).toBe(false);
    expect(carriesFiles(undefined)).toBe(false);
  });

  it("the thread's zone says whom it gives to; the name when known, else how many", () => {
    expect(giveWords(1, 'perf')).toBe('drop to give this file to perf');
    expect(giveWords(3, 'perf')).toBe('drop to give these 3 files to perf');
    expect(giveWords(1, 'perf', 'q3.xlsx')).toBe('drop to give q3.xlsx to perf');
    expect(giveWords(1, 'bise')).toBe('drop to give this file to bise');
  });

  it("all images, the zone says images: 'this image', 'these 2 images'; one other file, files (designer m_45234)", () => {
    expect(giveWords(1, 'perf', undefined, true)).toBe('drop to give this image to perf');
    expect(giveWords(2, 'perf', undefined, true)).toBe('drop to give these 2 images to perf');
    expect(allImages(['image/png', 'image/jpeg'])).toBe(true);
    expect(allImages(['image/png', 'application/pdf'])).toBe(false);
    expect(allImages([''])).toBe(false);
    expect(allImages([])).toBe(false);
  });

  it("the list adds to the picked project's main, or to bise's home with 'all projects'", () => {
    expect(addPlace('shop-1', rows)).toEqual({ project: 'shop-1', agent: 'main', name: 'storefront' });
    expect(addPlace('', rows)).toEqual({ project: 'home-1', agent: 'main', name: 'bise' });
    expect(addPlace('home-1', rows)).toEqual({ project: 'home-1', agent: 'main', name: 'bise' });
    // a project with no name says its id
    expect(addPlace('api-2', rows)?.name).toBe('api-2');
    // before the core said which project is home, or an unknown one: nowhere (the button is off)
    expect(addPlace('', [row('shop-1', 'storefront')])).toBeNull();
    expect(addPlace('gone', rows)).toBeNull();
  });

  it("'+ add' and the list's zone name where the file goes", () => {
    const shop = { project: 'shop-1', agent: 'main', name: 'storefront' };
    expect(addTitle(shop)).toBe('add a file to storefront');
    expect(addTitle({ ...shop, name: 'bise' })).toBe('add a file to bise');
    expect(addDropWords(1, shop)).toBe('drop to add it to storefront');
    expect(addDropWords(2, shop)).toBe('drop to add 2 files to storefront');
  });

  it('a dropped file with no path (made in the page) is left out', () => {
    const f = (name: string) => ({ name }) as File;
    const paths: Record<string, string> = { 'a.xlsx': '/u/me/a.xlsx', 'b.png': '' };
    expect(droppedPaths([f('a.xlsx'), f('b.png')], (x) => paths[x.name] ?? '')).toEqual(['/u/me/a.xlsx']);
  });
});
