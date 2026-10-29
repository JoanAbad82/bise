import { describe, expect, it } from 'vitest';
import { dropLead, leadAgent, leadMessage } from './lead';

describe("his words opening with @<agent> (at-start)", () => {
  const live = ['main', 'architect', 'perf'];
  it('a leading @name of a live agent, after spaces, then a space or a line, is that agent', () => {
    expect(leadAgent('@architect fais une map', live, 'main')).toBe('architect');
    expect(leadAgent('   @architect fais', live, 'main')).toBe('architect');
    expect(leadAgent('@architect\nfais', live, 'main')).toBe('architect');
    expect(leadAgent('@main look', live, 'perf')).toBe('main');
  });
  it("anything else is words for the thread he's in", () => {
    expect(leadAgent('demande à @architect de faire', live, 'main')).toBeNull();
    expect(leadAgent('@architect', live, 'main')).toBeNull();
    expect(leadAgent('@arch fais', live, 'main')).toBeNull();
    expect(leadAgent('@shop fais', live, 'main')).toBeNull();
    expect(leadAgent('@perf fais', live, 'perf')).toBeNull();
    expect(leadAgent('', live, 'main')).toBeNull();
  });
  it('drops the address and the spaces after it, keeps the rest as typed', () => {
    expect(dropLead('  @architect   fais une map', 'architect')).toBe('fais une map');
    expect(dropLead('fais @architect x', 'architect')).toBe('fais @architect x');
    expect(leadMessage({ text: '@architect fais' }, 'architect')).toEqual({ text: 'fais' });
    expect(leadMessage({ text: '@architect   ' }, 'architect')).toBeNull();
  });
  it('his typed parts lose the address in their first words only', () => {
    const img = { kind: 'image' as const, name: '[Image #1]', source: '/x.png' };
    expect(leadMessage({ text: '@architect look [Image #1]', parts: [{ kind: 'text', text: '@architect look ' }, img] }, 'architect')).toEqual({
      text: 'look [Image #1]',
      parts: [{ kind: 'text', text: 'look ' }, img],
    });
    expect(leadMessage({ text: '@architect [Image #1]', parts: [{ kind: 'text', text: '@architect ' }, img] }, 'architect')).toEqual({
      text: '[Image #1]',
      parts: [img],
    });
  });
});
