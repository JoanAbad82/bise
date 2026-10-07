import { describe, expect, it } from 'vitest';
import { HOME_ARG, SURFACE_ARG } from '../shared/api';
import { argValue } from './args';

describe('argValue (window.bise.home, lead m_11044)', () => {
  it("reads main's --bise-home and --bise-surface, null when absent", () => {
    const argv = ['/x/Electron Helper', '--type=renderer', `${SURFACE_ARG}window`, `${HOME_ARG}/Users/ga brielle`];
    expect(argValue(argv, HOME_ARG)).toBe('/Users/ga brielle');
    expect(argValue(argv, SURFACE_ARG)).toBe('window');
    expect(argValue(['--type=renderer'], HOME_ARG)).toBeNull();
  });
});
