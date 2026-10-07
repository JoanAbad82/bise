// Which model does what (bar V17, the TUI's /models roles screen, onboarding/roles.rs): one row
// per role (main, agents, voice...) with its model and its reasoning effort, set through the
// core's role_set (it writes config.toml's [roles]; the roles event comes back after each set, so
// the TUI's /models shows the same). A chat model whose provider has no key opens that provider's
// setup first (bar L5, hold.ts). Pure: draws the core's roles and models. Owner: amb-kit.
import type { AppCmd, Model, RoleRow } from '@/proto';
import { Group, Help, Seg, type GroupItem } from '@/ds';
import { modelRow } from './hold';

/** Where a role's model comes from, in his words. */
export function roleSource(r: RoleRow): string {
  if (r.source === 'config') return 'set here';
  if (r.source === 'env') return 'from your environment';
  return r.follows != null && r.follows !== '' ? `follows ${r.follows}` : 'the default';
}

/** The efforts a role can take: its model's (none: the model takes no effort). */
export function effortsOf(r: RoleRow, models: readonly Model[]): readonly string[] {
  return r.kind === 'chat' ? (modelRow(r.model, models)?.efforts ?? []) : [];
}

/** The effort a role runs: its own, else its model's default. */
export function effortOf(r: RoleRow, models: readonly Model[]): string | null {
  return r.effort ?? modelRow(r.model, models)?.default_effort ?? null;
}

/** the select's value for "back to its fallback" (role_set with no model) */
const FALLBACK = '';

export interface RolesProps {
  roles: readonly RoleRow[];
  models: readonly Model[];
  /** a role_set the core refused (its words) */
  error?: string | null;
  /** set a role: the command, and the model's name when it sets a model (L5 checks its provider) */
  set: (cmd: AppCmd, model: string | null) => void;
}

export function Roles({ roles, models, error = null, set }: RolesProps) {
  if (roles.length === 0) return null;
  const items: GroupItem[] = roles.map((r) => {
    const efforts = effortsOf(r, models);
    const effort = effortOf(r, models);
    const chat = r.kind === 'chat';
    const known = models.some((m) => m.id === r.model);
    return {
      id: r.role,
      label: r.name,
      sub: `${r.about} · ${roleSource(r)}`,
      control: (
        <span className="settings-row-acts">
          {chat ? (
            <select
              className="settings-select"
              aria-label={`${r.name}'s model`}
              value={r.source === 'default' ? FALLBACK : r.model}
              onChange={(e) => {
                const v = e.currentTarget.value;
                set({ cmd: 'role_set', role: r.role, model: v === FALLBACK ? null : v }, v === FALLBACK ? null : v);
              }}
              data-testid={`settings.role.${r.role}.model`}
            >
              <option value={FALLBACK}>{r.follows != null && r.follows !== '' ? `as ${r.follows}` : 'the default'}</option>
              {!known && r.source !== 'default' && <option value={r.model}>{r.model}</option>}
              {models
                .filter((m) => m.alias_of == null || m.alias_of === '')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.key_ready === false ? ` · ${m.provider}: set up first` : ''}
                  </option>
                ))}
            </select>
          ) : (
            <span className="v" data-testid={`settings.role.${r.role}.model`}>
              {r.model}
            </span>
          )}
          {efforts.length > 0 && (
            <Seg
              items={efforts}
              on={Math.max(0, efforts.indexOf(effort ?? ''))}
              onPick={(i) => {
                const e = efforts[i];
                if (e !== undefined && e !== effort) set({ cmd: 'role_set', role: r.role, effort: e }, null);
              }}
              testId={`settings.role.${r.role}.effort`}
            />
          )}
        </span>
      ),
    };
  });
  return (
    <>
      <Group title="which model does what" testId="settings.roles" items={items} help="the terminal's /models shows the same" />
      {error !== null && (
        <Help err testId="settings.roles.error">
          {error}
        </Help>
      )}
    </>
  );
}
