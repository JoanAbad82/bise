import { describe, expect, it } from 'vitest';
import { artifactRef, frameLink, isPagesFrame, pagesArtifact } from './framelink';

const S = 'http://127.0.0.1:47438';

describe('isPagesFrame (an artifact in the window, amb-kit m_11871)', () => {
  it('the local pages server, any port and path', () => {
    expect(isPagesFrame(`${S}/p/desktop-app`)).toBe(true);
    expect(isPagesFrame('http://127.0.0.1:9/p/x#item')).toBe(true);
  });
  it('anything else stays out: https, another host, localhost, credentials, file, junk', () => {
    expect(isPagesFrame('https://127.0.0.1:47438/p/x')).toBe(false);
    expect(isPagesFrame('http://example.com/p/x')).toBe(false);
    expect(isPagesFrame('http://localhost:47438/p/x')).toBe(false);
    expect(isPagesFrame('http://127.0.0.1.evil.com/p/x')).toBe(false);
    expect(isPagesFrame('http://u:p@127.0.0.1:47438/p/x')).toBe(false);
    expect(isPagesFrame('file:///etc/passwd')).toBe(false);
    expect(isPagesFrame('not a url')).toBe(false);
  });
});

describe('artifactRef (the hub parse_ref)', () => {
  it('an id, with a version or not', () => {
    expect(artifactRef('artifact:pricing-page')).toEqual({ id: 'pricing-page' });
    expect(artifactRef('artifact:artifacts@v3')).toEqual({ id: 'artifacts', v: 3 });
    expect(artifactRef('artifact:q3@1')).toEqual({ id: 'q3', v: 1 });
  });
  it('a bad id or version: none', () => {
    expect(artifactRef('artifact:Bad Id')).toBeNull();
    expect(artifactRef('artifact:x@vx')).toBeNull();
    expect(artifactRef('artifact:')).toBeNull();
    expect(artifactRef('https://x.dev/artifact:a')).toBeNull();
  });
});

describe('pagesArtifact', () => {
  it("the pages server's artifact and page routes", () => {
    expect(pagesArtifact(`${S}/a/sign/2/index.html?theme=light`)).toEqual({ id: 'sign', v: 2 });
    expect(pagesArtifact(`${S}/a/deck/view`)).toEqual({ id: 'deck' });
    expect(pagesArtifact(`${S}/p/plan`)).toEqual({ id: 'plan' });
    expect(pagesArtifact(`${S}/p/plan/v/4`)).toEqual({ id: 'plan', v: 4 });
  });
  it('the kit, junk, another host: none', () => {
    expect(pagesArtifact(`${S}/kit/kit.css`)).toBeNull();
    expect(pagesArtifact(`${S}/`)).toBeNull();
    expect(pagesArtifact(`${S}/a/Bad_Id/1/x`)).toBeNull();
    expect(pagesArtifact('https://example.com/p/plan')).toBeNull();
  });
});

describe('frameLink (art-links: the panel never leaves its artifact)', () => {
  const from = `${S}/a/sign/2/index.html?theme=light`;
  const cases: [string, string, string | null, boolean, unknown][] = [
    ['the app sets the panel\'s src', `${S}/a/deck/view?theme=dark`, null, false, { do: 'stay' }],
    ["the artifact's own file", `${S}/a/sign/2/other.html`, from, false, { do: 'stay' }],
    ['its own older version', `${S}/a/sign/1/index.html`, from, false, { do: 'stay' }],
    ['a page to itself, another version', `${S}/p/plan/v/2`, `${S}/p/plan`, false, { do: 'stay' }],
    ['another artifact on the server', `${S}/a/deck/3/index.html`, from, false, { do: 'artifact', id: 'deck', v: 3 }],
    ['another page', `${S}/p/plan`, from, false, { do: 'artifact', id: 'plan' }],
    ['an artifact: link', 'artifact:plan@v2', from, false, { do: 'artifact', id: 'plan', v: 2 }],
    ['an artifact: link in a new window', 'artifact:plan', null, true, { do: 'artifact', id: 'plan' }],
    ['a pages url in a new window', `${S}/p/plan`, null, true, { do: 'artifact', id: 'plan' }],
    ['its own file in a new window: shown in the panel', `${S}/a/sign/2/x.html`, from, true, { do: 'artifact', id: 'sign', v: 2 }],
    ['the kit from a link', `${S}/kit/kit.css`, from, false, { do: 'drop' }],
    ['the web', 'https://example.com/x', from, false, { do: 'out', url: 'https://example.com/x' }],
    ['the web, set by the app', 'https://example.com/x', null, false, { do: 'out', url: 'https://example.com/x' }],
    ['the web in a new window', 'https://example.com/b', null, true, { do: 'out', url: 'https://example.com/b' }],
    ['mail', 'mailto:a@b.c', from, false, { do: 'out', url: 'mailto:a@b.c' }],
    ['a file (openLink drops it)', 'file:///etc/passwd', from, false, { do: 'out', url: 'file:///etc/passwd' }],
  ];
  it.each(cases)('%s', (_name, url, f, win, want) => {
    expect(frameLink(url, f, win)).toEqual(want);
  });
});
