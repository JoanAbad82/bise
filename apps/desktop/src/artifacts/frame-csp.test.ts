// The pages server's CSP for a copied file (rust/switchboard/src/pages/site.rs ARTIFACT_CSP) must let
// this window frame it: the renderer is file:// (main/windows.ts loadFile), so a frame-ancestors
// 'self' there leaves the artifact view blank (ambient-lead m_20610, architect m_20628). The harness
// check tests/checks/artifacts/frame-csp.spec.ts frames it with that header; this pins it in pnpm check.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SITE = resolve(__dirname, '../../../../rust/switchboard/src/pages/site.rs');

function artifactCsp(): string {
  const m = /pub const ARTIFACT_CSP: &str = "([^"]*)";/.exec(readFileSync(SITE, 'utf8'));
  if (m?.[1] === undefined) throw new Error('no ARTIFACT_CSP in site.rs');
  return m[1];
}

describe('the artifact CSP and the window', () => {
  it('lets a file:// window frame a copied file, in its sandbox', () => {
    const csp = artifactCsp();
    expect(csp).not.toContain('frame-ancestors');
    expect(csp).toContain('sandbox allow-scripts allow-popups');
    expect(csp).toContain("connect-src 'none'");
  });
});
