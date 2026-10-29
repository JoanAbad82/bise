// A branch's diff by its name (bar C15/W20/V6, '/diff sb/x'): its route and whose branch it is.
import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from '@/app/route';
import { agentOfBranch } from './BranchScreen';

describe('the branch route', () => {
  it("keeps the branch's slashes both ways", () => {
    expect(parseRoute('branch/acme-1/sb/x')).toEqual({ screen: 'branch', project: 'acme-1', branch: 'sb/x' });
    expect(parseRoute('branch/acme-1/main')).toEqual({ screen: 'branch', project: 'acme-1', branch: 'main' });
    expect(formatRoute({ screen: 'branch', project: 'acme-1', branch: 'sb/x' })).toBe('branch/acme-1/sb/x');
  });
  it('a branch is needed', () => {
    expect(parseRoute('branch/acme-1').screen).toBe('notfound');
    expect(parseRoute('branch').screen).toBe('notfound');
  });
});

describe("a branch's agent", () => {
  it("is the one whose worktree is on it; none for his own branches", () => {
    const items = [
      { path: '/w/a', branch: 'sb/perf', agent: 'perf' },
      { path: '/w', branch: 'main', agent: null },
    ];
    expect(agentOfBranch(items, 'sb/perf')).toBe('perf');
    expect(agentOfBranch(items, 'main')).toBeUndefined();
    expect(agentOfBranch(items, 'sb/gone')).toBeUndefined();
  });
});
