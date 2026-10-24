// settings · plugins (bar P.1, the TUI's /plugins): his agent plugins
// (built-in, user, workspace) with their state, each one turned on or off
// (plugins.json through bend_plugins' one writer; it applies to the
// sessions that start after it, as /reload), and each remote MCP server
// that logs in (an `mcp` part with its login), with log in (his browser,
// only on his click) and log out. The core answers every act with `plugins`
// again. Owner: amb-home.
import type { AppCmd, Plugin, PluginPart } from '@/proto';
import { Act, Button, Chip, Group, Help, Toggle, type GroupItem } from '@/ds';
import { settings } from '@/proto/words.gen';

/** A plugin counts as on when it loads (disabled: off; shadowed, invalid: not his to toggle). */
export function isOn(p: Plugin): boolean {
  return p.state === 'loaded';
}

/** What a server's login state reads as (`what`: its host). */
export function loginWords(l: PluginPart): string {
  const host = l.what ?? l.name;
  switch (l.login) {
    case 'needs':
      return settings.login_needs({ host });
    case 'in':
      return l.tool_count == null ? settings.login_in({ host }) : settings.login_in_tools({ host, n: l.tool_count });
    case 'pending':
      return settings.login_pending({ host });
    default:
      return settings.login_out({ host });
  }
}

export function Plugins({ items, project, send }: { items: readonly Plugin[] | null; project?: string; send: (cmd: AppCmd) => void }) {
  const at = project === undefined ? {} : { project };
  if (items === null) return <Help>{settings.plugins_looking}</Help>;
  if (items.length === 0) return <Help>{settings.plugins_none}</Help>;
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
  const logins = items.flatMap((p) => (p.parts ?? []).filter((x) => x.kind === 'mcp' && x.login != null));
  return (
    <>
      <Group testId="settings.plugins" items={rows} help={settings.plugins_help} />
      {logins.length > 0 && (
        <Group
          title={settings.plugins_logins}
          testId="settings.plugins.logins"
          items={logins.map((l) => ({
            id: l.name,
            label: l.name,
            sub: loginWords(l),
            control:
              l.login === 'in' ? (
                <Act tone="err" onClick={() => { send({ cmd: 'plugin_logout', ...at, name: l.name }); }} testId={`settings.login.${l.name}.out`}>
                  {settings.log_out}
                </Act>
              ) : (
                <Button
                  state={l.login === 'pending' ? 'loading' : undefined}
                  onClick={() => {
                    send({ cmd: 'plugin_login', ...at, name: l.name });
                  }}
                  testId={`settings.login.${l.name}`}
                >
                  {settings.log_in}
                </Button>
              ),
          }))}
        />
      )}
    </>
  );
}
