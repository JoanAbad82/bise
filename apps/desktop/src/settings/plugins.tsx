// settings · plugins (bar P.1, the TUI's /plugins): his agent plugins
// (built-in, user, workspace) with their state, each one turned on or off
// (plugins.json through bend_plugins' one writer; it applies to the
// sessions that start after it, as /reload), and each remote MCP server
// that logs in, with log in (his browser, only on his click) and log out.
// The core answers every act with `plugins` again. Owner: amb-home.
import type { AppCmd, Plugin, PluginLogin } from '@/proto';
import { Button, Chip, Group, Help, Toggle, type GroupItem } from '@/ds';

/** A plugin counts as on when it loads (disabled: off; shadowed, invalid: not his to toggle). */
export function isOn(p: Plugin): boolean {
  return p.state === 'loaded';
}

/** What a server's login state reads as. */
export function loginWords(l: PluginLogin): string {
  switch (l.state) {
    case 'needs':
      return `${l.host} · needs a login`;
    case 'in':
      return l.tools == null ? `${l.host} · logged in` : `${l.host} · logged in · ${String(l.tools)} tool${l.tools === 1 ? '' : 's'}`;
    case 'pending':
      return `${l.host} · log in in your browser…`;
    default:
      return `${l.host} · not logged in`;
  }
}

export function Plugins({ items, project, send }: { items: readonly Plugin[] | null; project?: string; send: (cmd: AppCmd) => void }) {
  const at = project === undefined ? {} : { project };
  if (items === null) return <Help>looking at your plugins…</Help>;
  if (items.length === 0) return <Help>no plugin yet: a plugin adds skills and tools to your agents (docs/plugins.md).</Help>;
  const rows: GroupItem[] = items.map((p) => ({
    id: p.name,
    label: p.name,
    sub: [p.scope, p.state !== 'loaded' && p.state !== 'disabled' ? p.state : null, p.what].filter((x) => x != null && x !== '').join(' · '),
    control:
      p.state === 'loaded' || p.state === 'disabled' ? (
        <Toggle
          on={isOn(p)}
          label={p.name}
          onChange={(on) => {
            send({ cmd: 'plugin_set', ...at, name: p.name, on });
          }}
          testId={`settings.plugin.${p.name}`}
        />
      ) : (
        <Chip tone="err">{p.state}</Chip>
      ),
  }));
  const logins = items.flatMap((p) => p.logins ?? []);
  return (
    <>
      <Group testId="settings.plugins" items={rows} help="a change applies to the agents' next sessions." />
      {logins.length > 0 && (
        <Group
          title="servers that log in"
          testId="settings.plugins.logins"
          items={logins.map((l) => ({
            id: l.name,
            label: l.name,
            sub: loginWords(l),
            control:
              l.state === 'in' ? (
                <Button kind="ghost" onClick={() => { send({ cmd: 'plugin_logout', ...at, name: l.name }); }} testId={`settings.login.${l.name}.out`}>
                  log out
                </Button>
              ) : (
                <Button
                  state={l.state === 'pending' ? 'loading' : undefined}
                  onClick={() => {
                    send({ cmd: 'plugin_login', ...at, name: l.name });
                  }}
                  testId={`settings.login.${l.name}`}
                >
                  log in
                </Button>
              ),
          }))}
        />
      )}
    </>
  );
}
