// The tray menu's projects block (designer m_27872, m_29577): bise's line first (its 14 px ':*'),
// then one line per project with the sidebar's project mark (the same '?' / breath / '·'), its
// name (sans 13, cut with '…'), and at its end what waits first, then the work: '? 1   ∿ 3' (never
// cut; nothing when it's quiet), then '›' (its submenu). A live line has a second line (40 px):
// what waits on him first, else what its newest-active agent is at (projsum.ts), sans 12 text-3,
// cut after a whole word. A quiet project's name is text-2, one line, no '›': a place he can
// open, not a greyed row. The words are the hover tip (a native title: the capsule has no tip
// layer). Which lines show is projects.ts's; the keyboard's row and the submenu, TrayMenu's.
import type { JSX } from "react";
import { BiseMark, MenuItem, Row } from "@/ds";
import { ProjectMark } from "@/app/Marks";
import { FitWords } from "@/app/FitWords";
import { panel } from "@/proto/words_panel.gen";
import type { SpotData } from "@/spotlight";
import { isLive, projectLines, type ProjectLine } from "./projects";
import type { Summary } from "./projsum";

/** A project line's test id (its row's), the key the menu's keyboard and pointer select it by. */
export const lineKey = (id: string): string => `capsule.menu.project.${id === "" ? "bise" : id}`;
export const PROJECTS_MORE = "capsule.menu.projects.more";

function End({ l, sub }: { l: ProjectLine; sub: boolean }): JSX.Element | null {
  if (!isLive(l)) return null;
  return (
    <span className="b-cap-pj-end">
      {l.waits > 0 && <span className="w">? {l.waits}</span>}
      {l.working > 0 && <span className="k">∿ {l.working}</span>}
      {sub && <span className="go">›</span>}
    </span>
  );
}

/** The second line: '? search · which size…' (the '?' accent) or 'perf · merging the cache fix  +2'. */
function SumLine({ s, testId }: { s: Summary; testId: string }): JSX.Element {
  const words = s.kind === "note" ? s.text : `${s.who} · ${s.text}`;
  return (
    <span className="b-cap-pj-sum" data-testid={testId}>
      {s.kind === "wait" && <span className="w">?</span>}
      <FitWords text={words} className="t" whole />
      {s.kind === "work" && s.more > 0 && <span className="more">+{s.more}</span>}
    </span>
  );
}

export interface MenuProjectsProps {
  readonly spot: SpotData;
  readonly onOpenWindow: (route?: string) => void;
  /** the keyboard's (and the pointer's) row: a test id */
  readonly sel: string | null;
  /** the line whose submenu is open ('' for bise's), null: none */
  readonly sub: string | null;
}

export function MenuProjects({ spot, onOpenWindow, sel, sub }: MenuProjectsProps): JSX.Element | null {
  const { lines, more } = projectLines(spot);
  if (lines.length === 0) return null;
  return (
    <div className="b-cap-rows b-cap-pjs" data-testid="capsule.menu.projects">
      <div className="b-cap-menu-head">{panel.projects}</div>
      {lines.map((l) => {
        const testId = lineKey(l.id);
        const live = isLive(l);
        return (
          <div key={l.id} title={l.tip} className={`${live ? "live" : "quiet"}${l.summary !== null ? " two" : ""}${sub === l.id ? " open" : ""}`} data-testid={`${testId}.line`}>
            <Row
              lead={
                l.id === "" ? (
                  <span className="b-cap-pj-mark"><BiseMark waits={l.waits > 0} working={l.working > 0} size={14} /></span>
                ) : (
                  <ProjectMark p={{ project: l.id, waits: l.waits, working: l.working, missing: l.missing }} />
                )
              }
              name={
                l.summary === null ? (
                  l.name
                ) : (
                  <>
                    <span className="pj">{l.name}</span>
                    <SumLine s={l.summary} testId={`${testId}.sum`} />
                  </>
                )
              }
              end={<End l={l} sub={live && l.project !== ""} />}
              on={sel === testId || sub === l.id}
              onClick={() => {
                onOpenWindow(l.route);
              }}
              testId={testId}
            />
          </div>
        );
      })}
      {more > 0 && (
        <MenuItem
          on={sel === PROJECTS_MORE}
          onClick={() => {
            onOpenWindow();
          }}
          testId={PROJECTS_MORE}
        >
          {panel.tray_more({ n: more })}
        </MenuItem>
      )}
    </div>
  );
}
