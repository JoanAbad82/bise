// The published list of test ids (guarantee 4): every literal id in src/**/*.tsx, with its file
// and line, grouped by area. `node tests/harness/lint/testids.mts [--md]`. A template id prints its
// static start followed by '…' (composer.chip.…). Checks pick ids from this list.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'src');
const RE = /(?:data-testid|testId)=(?:"([^"]+)"|\{"([^"]+)"\}|\{'([^']+)'\}|\{`([^`$]*)(\$\{)?[^`]*`\})/g;

function* files(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (p.endsWith('.tsx') && !p.endsWith('.test.tsx')) yield p;
  }
}

/** [{ id, file, line }] for every literal id in the sources. */
export function testIds(src = SRC) {
  const out: { id: string; file: string; line: number }[] = [];
  for (const file of files(src)) {
    readFileSync(file, 'utf8').split('\n').forEach((text, i) => {
      for (const m of text.matchAll(RE)) {
        const id = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '') + (m[5] ? '…' : '');
        if (id) out.push({ id, file: path.relative(path.dirname(src), file), line: i + 1 });
      }
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ids = testIds();
  const md = process.argv.includes('--md');
  if (md) console.log('| id | where |\n|---|---|');
  for (const { id, file, line } of ids) console.log(md ? `| \`${id}\` | ${file}:${line} |` : `${id}\t${file}:${line}`);
}
