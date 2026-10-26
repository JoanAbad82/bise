// settings · computer use (bar P.2, the TUI's /computer-use): on or off
// (the built-in `computer` plugin), and while it is on, its setup's steps
// as the TUI's screen shows them (Chrome, its extension, the live test,
// then the helper app's accessibility and screen recording), each with
// the button of its fix, only on his click. The page asks the core to
// check while it is open (`check` now and every 30 s, `leave` when it
// closes; the core stops by itself 2 min after the last check).
// Owner: amb-home.
import { useEffect, useRef } from 'react';
import type { AppCmd, CoreEv } from '@/proto';
import { Act, AppIcon, Button, Chip, Group, Help, Toggle, type GroupItem } from '@/ds';
import { settings } from '@/proto/words.gen';

export type ComputerUse = Extract<CoreEv, { ev: 'computer_use' }>;

/** how often the open page says it is still open */
export const KEEP_MS = 30_000;

/** a step's mark (done is the line icon check, never a ✓ glyph) */
const GLYPH: Record<string, string> = { waits: '?', checking: '…', failed: '▲', not_yet: '·' };

export function Computer({ cu, send }: { cu: ComputerUse | null; send: (cmd: AppCmd) => void }) {
  // the screen hands a new `send` on each render (each core event): the check follows the page's
  // mount, never that identity, or each event would `leave` then `check` from scratch, the core
  // would answer with no steps, and so on forever (stuck on checking, the steps flickering)
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);
  useEffect(() => {
    const say = (act: string) => {
      sendRef.current({ cmd: 'computer_use', act });
    };
    say('check');
    const keep = window.setInterval(() => {
      say('check');
    }, KEEP_MS);
    return () => {
      window.clearInterval(keep);
      say('leave');
    };
  }, []);
  const on = cu?.on ?? false;
  const row = (r: ComputerUse['rows'][number]): GroupItem => ({
    id: r.id,
    // designer (via cu-settings m_42955): the step's mark in a 16 px column on the title's line,
    // the sub lines aligned to the title's text
    label: (
      <span className="settings-cu-t">
        <span className={`settings-cu-st ${r.state}`} aria-label={r.state} data-tip={r.state}>
          {r.state === 'done' ? <AppIcon name="check" size={14} /> : (GLYPH[r.state] ?? '·')}
        </span>
        {r.label}
      </span>
    ),
    sub: (
      <span className="settings-cu-sub">
        {r.detail}
        {r.state !== 'done' &&
          (r.help ?? []).map((h) => (
            <span key={h} className="settings-cu-help">
              {h}
            </span>
          ))}
      </span>
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
            label: settings.cu_label,
            sub: on ? (cu?.ready === true ? settings.cu_ready : settings.cu_set_up) : settings.cu_off,
            control: (
              <Toggle
                on={on}
                label={settings.cu_switch}
                onChange={(v) => {
                  send({ cmd: 'computer_use', act: v ? 'on' : 'off' });
                }}
                testId="settings.cu.switch"
              />
            ),
          },
        ]}
      />
      {on && web.length === 0 && <Help>{settings.cu_checking}</Help>}
      {on && web.length > 0 && <Group title={settings.cu_web} testId="settings.cu.web" items={web.map(row)} />}
      {on && apps.length > 0 && <Group title={settings.cu_apps} testId="settings.cu.apps" items={apps.map(row)} />}
      {cu?.flash != null && <Chip tone="ok">{cu.flash}</Chip>}
      {cu?.said != null && <Help err>{cu.said}</Help>}
      {on && (
        <Act
          tone="err"
          onClick={() => {
            send({ cmd: 'computer_use', act: 'uninstall' });
          }}
          testId="settings.cu.uninstall"
        >
          {settings.cu_uninstall}
        </Act>
      )}
    </>
  );
}
