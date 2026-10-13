// The window's ONE status line under the title bar (designer's desktop-notices page (1), main
// m_20156): what bise does by itself, one thing at a time, the worst first (status.ts). Each
// candidate keeps its own words, actions and test ids (app.core, app.update, app.hubupdate:
// CoreLine.tsx and UpdateLine.tsx, amb-win's); this file only picks one. Owner: amb-home.
import { useCoreLine } from './CoreLine';
import { useReloadLine } from './ReloadLine';
import { useHubUpdateLine, useUpdateLine } from './UpdateLine';
import { worst } from './status';

export function StatusLine() {
  // every hook runs on every render, whichever wins (hooks' order)
  const core = useCoreLine();
  const reload = useReloadLine();
  const update = useUpdateLine();
  const hubUpdate = useHubUpdateLine();
  // the order breaks a tie: the core's, then the version switch, then /update's build, then the app update
  return worst([core, reload, hubUpdate, update])?.node ?? null;
}
