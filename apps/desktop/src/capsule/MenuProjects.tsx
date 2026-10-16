// The tray menu's projects block (designer m_27872): bise's line first (its 14 px ':*'), then one
// line per project with the sidebar's project mark (the same '?' / breath / '·'), its name (sans
// 13, cut with '…'), and at its end what waits first, then the work: '? 1   ∿ 3' (never cut;
// nothing when it's quiet). A quiet project's name is text-2: a place he can open, not a greyed
// row. The words are the hover tip (a native title: the capsule has no tip layer). Which lines
// show is projects.ts's.
import type { JSX } from "react";
import { BiseMark, MenuItem, Row } from "@/ds";
import { ProjectMark } from "@/app/Marks";
import { panel } from "@/proto/words_panel.gen";
import type { SpotData } from "@/spotlight";
import { isLive, projectLines, type ProjectLine } from "./projects";

function End({ l }: { l: ProjectLine }): JSX.Element | null {
  if (!isLive(l)) return null;
  return (
    <span className="b-cap-pj-end">
      {l.waits > 0 && <span className="w">? {l.waits}</span>}
      {l.working > 0 && <span className="k">∿ {l.working}</span>}
    </span>
  );
}

export function MenuProjects({ spot, onOpenWindow }: { spot: SpotData; onOpenWindow: (route?: string) => void }): JSX.Element | null {
  const { lines, more } = projectLines(spot);
  if (lines.length === 0) return null;
  return (
    <div className="b-cap-rows b-cap-pjs" data-testid="capsule.menu.projects">
      <div className="b-cap-menu-head">{panel.projects}</div>
      {lines.map((l) => {
        const testId = `capsule.menu.project.${l.id === "" ? "bise" : l.id}`;
        return (
          <div key={l.id} title={l.tip} className={isLive(l) ? "live" : "quiet"} data-testid={`${testId}.line`}>
            <Row
              lead={
                l.id === "" ? (
                  <span className="b-cap-pj-mark"><BiseMark waits={l.waits > 0} working={l.working > 0} size={14} /></span>
                ) : (
                  <ProjectMark p={{ project: l.id, waits: l.waits, working: l.working, missing: l.missing }} />
                )
              }
              name={l.name}
              end={<End l={l} />}
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
          onClick={() => {
            onOpenWindow();
          }}
          testId="capsule.menu.projects.more"
        >
          {panel.tray_more({ n: more })}
        </MenuItem>
      )}
    </div>
  );
}
