// The project scope, at the left of the search field (page artifacts-gallery v7 '0 · une
// bibliothèque'): 'all projects ▾', its menu with each project's count (the most first) and the
// typed way at its foot ('type a name in the search: "in:ai-docs"'); a picked one reads 'ai-docs'
// with a × that shows every project again. Read side only: the library stays one. Owner: art-folders.
import { Dropdown, IconButton, sentenceCase, tipAttrs } from '@/ds';
import { library } from '@/proto/words_library.gen';
import type { Item } from './model';

/** The menu's rows: every project with artifacts, the most first, with its count; 'all projects' first. Pure. */
export function scopeRows(all: readonly Item[]): { project: string; name: string; n: number }[] {
  const by = new Map<string, { project: string; name: string; n: number }>();
  for (const it of all) {
    const r = by.get(it.project) ?? { project: it.project, name: it.projectName !== '' ? it.projectName : it.project, n: 0 };
    r.n += 1;
    by.set(it.project, r);
  }
  return [...by.values()].sort((x, y) => y.n - x.n || x.name.localeCompare(y.name));
}

export function ProjectScope({ all, project, projectName, onPick, testId }: { all: readonly Item[]; project: string; projectName: string; onPick: (project: string) => void; testId: string }) {
  const rows = scopeRows(all);
  const example = rows.find((r) => r.project !== '')?.name ?? 'harness';
  return (
    <span className="art-scope" data-on={project !== '' || undefined}>
      <Dropdown label={project === '' ? sentenceCase(library.all_projects) : projectName} testId={testId}
        groups={[{ id: 'projects', rows: [
          { id: 'p:', name: sentenceCase(library.all_projects), trailing: String(all.length), current: project === '', testId: `${testId}.all` },
          ...rows.map((r) => ({ id: `p:${r.project}`, name: r.name, trailing: String(r.n), current: project === r.project, testId: `${testId}.${r.project}` })),
        ] }]}
        keyline={library.scope_hint({ example })}
        onPick={(id) => { onPick(id.slice(2)); }} />
      {project !== '' && (
        <span className="art-scope-x" {...tipAttrs(library.scope_clear({ project: projectName }))}>
          <IconButton label={library.scope_clear({ project: projectName })} size="row" onClick={() => { onPick(''); }} testId={`${testId}.clear`}>×</IconButton>
        </span>
      )}
    </span>
  );
}
