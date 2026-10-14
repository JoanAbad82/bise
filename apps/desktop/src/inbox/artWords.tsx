// An inbox line's words with its artifacts' names (desktop-agents-bar §5): an agent writes
// `[the mock](artifact:mock@v3)`, the line draws 'the mock' pink inline (ds ArtName), and a click
// opens the artifact's view, the TUI's rule. The split is pure (artSplit); the open is a hook in
// the one part that names an artifact, so a line without one needs no router. Owner: art-chips.
import { ArtName } from '@/ds';
import { useGoArtifact } from '@/artifacts/leave';

/** A piece of a line: words as written, or an artifact's name and its id. */
export type ArtPiece = { words: string } | { name: string; id: string };

const LINK = /\[([^\]\n]+)\]\(artifact:([^)@\s]+)(?:@v?\d+)?\)/gu;

/** A line cut at its `[name](artifact:id[@vN])` links, in order; no link: one piece of words. Pure. */
export function artSplit(text: string): ArtPiece[] {
  const out: ArtPiece[] = [];
  let at = 0;
  for (const m of text.matchAll(LINK)) {
    const i = m.index;
    if (i > at) out.push({ words: text.slice(at, i) });
    out.push({ name: m[1] ?? '', id: m[2] ?? '' });
    at = i + m[0].length;
  }
  if (at < text.length || out.length === 0) out.push({ words: text.slice(at) });
  return out;
}

function Name({ project, id, name, testId }: { project: string; id: string; name: string; testId: string }) {
  const go = useGoArtifact();
  return (
    <ArtName
      onClick={() => {
        go(project, id);
      }}
      testId={testId}
    >
      {name}
    </ArtName>
  );
}

/** A line's words, its artifacts' names pink and clickable; `<testId>.art.<id>` on each name. */
export function ArtWords({ text, project, testId }: { text: string; project: string; testId: string }) {
  const pieces = artSplit(text);
  return (
    <>
      {pieces.map((p, i) => ('words' in p ? p.words : <Name key={i} project={project} id={p.id} name={p.name} testId={`${testId}.art.${p.id}`} />))}
    </>
  );
}
