// Which model does what (bar V17, the TUI's /models roles screen, onboarding/roles.rs): one row
// per role (main, agents, voice...) with its model and its reasoning effort, set through the
// core's role_set (it writes config.toml's [roles]; the roles event comes back after each set, so
// the TUI's /models shows the same). A chat model whose provider has no key opens that provider's
// setup first (bar L5, hold.ts). Pure: draws the core's roles and models. Owner: amb-kit.
import type { AppCmd, Model, RoleRow } from '@/proto';
import { Group, Help, Seg, Select, type GroupItem } from '@/ds';
import { settings } from '@/proto/words.gen';
import { modelRow } from './hold';

/** Where a role's model comes from, in his words. */
export function roleSource(r: RoleRow): string {
  if (r.source === 'config') return settings.role_set_here;
  if (r.source === 'env') return settings.role_from_env;
  return r.follows != null && r.follows !== '' ? settings.role_follows({ role: r.follows }) : settings.role_default;
}

/** The efforts a role can take: its model's (none: the model takes no effort). */
export function effortsOf(r: RoleRow, models: readonly Model[]): readonly string[] {
  return r.kind === 'chat' ? (modelRow(r.model, models)?.efforts ?? []) : [];
}

/** The effort a role runs: its own, else its model's default. */
export function effortOf(r: RoleRow, models: readonly Model[]): string | null {
  return r.effort ?? modelRow(r.model, models)?.default_effort ?? null;
}

/** the picker's value for "back to its fallback" (role_set with no model); Radix Select takes no
 * empty value, so it is a word no model id can be */
export const FALLBACK = '(fallback)';

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
      // the core's role name is a row title: sentence case on screen (ui-review m_43805), the word stays the core's
      label: <span className="settings-role-n">{r.name}</span>,
      sub: `${r.about} · ${roleSource(r)}`,
      control: (
        <span className="settings-row-acts">
          {chat ? (
            <span className="settings-pick">
              <Select
                label={settings.role_model({ role: r.name })}
                value={r.source === 'default' ? FALLBACK : r.model}
                options={[
                  { value: FALLBACK, label: r.follows != null && r.follows !== '' ? settings.role_as({ role: r.follows }) : settings.role_default },
                  ...(!known && r.source !== 'default' ? [{ value: r.model, label: r.model }] : []),
                  ...models
                    .filter((m) => m.alias_of == null || m.alias_of === '')
                    .map((m) => ({ value: m.id, label: m.label, hint: m.key_ready === false ? settings.role_setup_first({ provider: m.provider }) : undefined })),
                ]}
                onChange={(v) => {
                  set({ cmd: 'role_set', role: r.role, model: v === FALLBACK ? null : v }, v === FALLBACK ? null : v);
                }}
                testId={`settings.role.${r.role}.model`}
              />
            </span>
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
      <Group title={settings.roles_title} testId="settings.roles" items={items} help={settings.roles_help} />
      {error !== null && (
        <Help err testId="settings.roles.error">
          {error}
        </Help>
      )}
    </>
  );
}
