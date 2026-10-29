// The test-id lint checks itself: good names pass, bad names and unnamed controls are reported.
import { ESLint } from 'eslint';
import { expect, test } from '@playwright/test';
import testid, { badId } from '../lint/testid.mts';

test('badId: <area>.<thing>[.<id>] in lowercase kebab parts, a known area', () => {
  expect(badId('composer.editor')).toBeNull();
  expect(badId('thread.msg.42')).toBeNull();
  expect(badId('inbox.card.c-search')).toBeNull();
  expect(badId('composer.chip.', { prefix: true })).toBeNull();
  expect(badId('composer')).toBeNull();
  expect(badId('settings.pref.quiet.batch_min')).toBeNull();
  expect(badId('editor')).toMatch(/unknown area/);
  expect(badId('route:bise')).toMatch(/not <area>/);
  expect(badId('Composer.Editor')).toMatch(/not <area>/);
  expect(badId('composer_editor.x')).toMatch(/not <area>/);
  expect(badId('nowhere.editor')).toMatch(/unknown area/);
});

test('the rules on JSX: named, unnamed, spread', async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      files: ['**/*.tsx'],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { 'bise-testid': testid },
      rules: { 'bise-testid/name': 'error', 'bise-testid/present': 'error' },
    }],
  });
  const code = [
    'import { LexicalComposer } from "@lexical/react/LexicalComposer"; const a = <button data-testid="composer.send">send</button>;',
    'const b = <button>no id</button>;',
    'const c = <div onClick={f}>x</div>;',
    'const d = <Button onClick={f}>x</Button>;',
    'const e = <Button onClick={f} testId={`inbox.card.${id}`}>x</Button>;',
    'const g = <div role="button" {...p}>x</div>;',
    'const h = <div data-testid="BadName">x</div>;',
    'const i = <span>plain</span>;',
    'const j = <LexicalComposer onChange={f}>x</LexicalComposer>;',
  ].join('\n');
  const [res] = await eslint.lintText(code, { filePath: 'x.jsx.tsx' });
  const lines = (res?.messages ?? []).map((m) => `${m.line}:${m.ruleId ?? ''}`);
  expect(lines.sort()).toEqual(['2:bise-testid/present', '3:bise-testid/present', '4:bise-testid/present', '7:bise-testid/name'].sort());
});
