// settings · computer use (bar P.2, the TUI's /computer-use): on or off
// (the built-in `computer` plugin), and while it is on, its setup's steps
// as the TUI's screen shows them (Chrome, its extension, the live test,
// then the helper app's accessibility and screen recording), each with
// the button of its fix, only on his click. The page asks the core to
// check while it is open (`check` now and every 30 s, `leave` when it
// closes; the core stops by itself 2 min after the last check).
// Owner: amb-home.
import { useEffect } from 'react';
import type { AppCmd, CoreEv } from '@/proto';
import { Button, Chip, Group, Help, Toggle, type GroupItem } from '@/ds';

export type ComputerUse = Extract<CoreEv, { ev: 'computer_use' }>;

/** how often the open page says it is still open */
export const KEEP_MS = 30_000;

const GLYPH: Record<string, string> = { done: '✓', waits: '?', checking: '…', failed: '▲', not_yet: '·' };

export function Computer({ cu, send }: { cu: ComputerUse | null; send: (cmd: AppCmd) => void }) {
  useEffect(() => {
    send({ cmd: 'computer_use', act: 'check' });
    const keep = window.setInterval(() => {
      send({ cmd: 'computer_use', act: 'check' });
    }, KEEP_MS);
    return () => {
      window.clearInterval(keep);
      send({ cmd: 'computer_use', act: 'leave' });
    };
  }, [send]);
  const on = cu?.on ?? false;
  const row = (r: ComputerUse['rows'][number]): GroupItem => ({
    id: r.id,
    label: (
      <>
        <span className={`settings-cu-st ${r.state}`} aria-label={r.state}>
          {GLYPH[r.state] ?? '·'}
        </span>{' '}
        {r.label}
      </>
    ),
    sub: (
      <>
        {r.detail}
        {r.state !== 'done' &&
          (r.help ?? []).map((h) => (
            <span key={h} className="settings-cu-help">
              {h}
            </span>
          ))}
      </>
    ),
    control:
      r.action != null && r.fix != null ? (
        <Button
          state={r.state === 'checking' ? 'loading' : undefined}
          onClick={() => {
            if (r.fix != null) send({ cmd: 'computer_use', act: 'fix', fix: r.fix });
          }}
          testId={`settings.cu.${r.id}`}
        >
          {r.action}
        </Button>
      ) : undefined,
  });
  const rows = cu?.rows ?? [];
  const web = rows.filter((r) => r.apps !== true);
  const apps = rows.filter((r) => r.apps === true);
  return (
    <>
      <Group
        testId="settings.cu"
        items={[
          {
            id: 'on',
            label: 'agents may drive Chrome and your apps',
            sub: on ? (cu?.ready === true ? 'ready: step by step, and you can take the wheel' : 'set it up below') : 'off: agents never touch your browser or apps',
            control: (
              <Toggle
                on={on}
                label="computer use"
                onChange={(v) => {
                  send({ cmd: 'computer_use', act: v ? 'on' : 'off' });
                }}
                testId="settings.cu.switch"
              />
            ),
          },
        ]}
      />
      {on && web.length === 0 && <Help>checking Chrome and its extension…</Help>}
      {on && web.length > 0 && <Group title="in Chrome" testId="settings.cu.web" items={web.map(row)} />}
      {on && apps.length > 0 && <Group title="for apps" testId="settings.cu.apps" items={apps.map(row)} />}
      {cu?.flash != null && <Chip tone="ok">{cu.flash}</Chip>}
      {cu?.said != null && <Help err>{cu.said}</Help>}
      {on && (
        <Button
          kind="ghost"
          onClick={() => {
            send({ cmd: 'computer_use', act: 'uninstall' });
          }}
          testId="settings.cu.uninstall"
        >
          turn off and remove its files
        </Button>
      )}
    </>
  );
}
