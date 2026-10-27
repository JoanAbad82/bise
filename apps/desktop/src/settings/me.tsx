// His own bim's look (page bim-pick, his pick A; designer signed v5 and round 2): settings › general's
// "Your bim" group (his bim near, then four rows: skin, hair, hair colour, what it wears on its head,
// a hat greyed where the hair can't take it) and the onboarding's 12 ready-made looks (setup
// Onboarding's hello). Each picture is main's head drawn by the coin's renderer (app/side3d ThingPic)
// in that look; the picked one and its swatch get an ink ring, never the accent. What he picks goes
// to his prefs' `bim` (bims/render/look.ts prefOf) through the caller. Owner: bim-pick.
import type { CSSProperties } from 'react';
import { Help, Press, tipAttrs } from '@/ds';
import { ThingPic } from '@/app/side3d/Bubbles';
import { COLORS, HAIRS, READY, SKINS, WEARS, type Hair, type Look, type Wear, sameLook, wearsFor, withHair } from '@/bims/render/look';
import { settings } from '@/proto/words.gen';

const HAIR_WORD: Record<Hair, string> = {
  short: settings.hair_short,
  afro: settings.hair_afro,
  topbun: settings.hair_topbun,
  long: settings.hair_long,
  ponytail: settings.hair_ponytail,
  braids: settings.hair_braids,
  bob: settings.hair_bob,
  buns: settings.hair_buns,
  curls: settings.hair_curls,
  pigtails: settings.hair_pigtails,
  mohawk: settings.hair_mohawk,
  spiky: settings.hair_spiky,
};
const COLOR_WORD = [settings.color_black, settings.color_dark, settings.color_brown, settings.color_auburn, settings.color_blond, settings.color_lilac] as const;
const WEAR_WORD: Record<Wear, string> = { none: settings.wear_none, cap: settings.wear_cap, beanie: settings.wear_beanie, headphones: settings.wear_headphones };

/** main's head in a look, as the coin draws it (its head and shoulders) */
function LookPic({ look, px }: { look: Look; px: number }) {
  return <ThingPic thing={{ head: 'main', main: true, look }} px={px} tile="thread" className="me-pic" />;
}

/** the hair row's swatch: the coin's picture at 48, cropped to the head in its 32 box (ui-review m_46729 1, designer m_46749) */
const CUT_PX = 48;

/** a round swatch of one colour (a skin, a hair colour) */
function Dot({ color, on, tip, onClick, testId }: { color: string; on: boolean; tip: string; onClick: () => void; testId: string }) {
  return (
    <Press look={on ? 'me-dot on' : 'me-dot'} style={{ '--me-dot': color } as CSSProperties} aria-label={tip} aria-pressed={on} onClick={onClick} data-testid={testId} {...tipAttrs(tip)} />
  );
}

/** One row: its name, then its choices. */
function Row({ label, children, testId, grid = false }: { label: string; children: React.ReactNode; testId: string; grid?: boolean }) {
  return (
    <div className="me-row" role="group" aria-label={label} data-testid={testId}>
      <span className="me-row-n">{label}</span>
      <span className={grid ? 'me-row-c six' : 'me-row-c'}>{children}</span>
    </div>
  );
}

/** Settings › general's "Your bim": his bim near and the four rows; `set` keeps a new look. */
export function MeGroup({ look, set }: { look: Look; set: (l: Look) => void }) {
  const wears = wearsFor(look.hair);
  return (
    <div className="me" data-testid="settings.me">
      <div className="b-gt">{settings.me_label}</div>
      <div className="me-box">
        <span className="me-big" data-testid="settings.me.pic">
          <LookPic look={look} px={88} />
        </span>
        <div className="me-rows">
          <Row label={settings.me_skin} testId="settings.me.skin">
            {SKINS.map((c, i) => (
              <Dot key={c} color={c} on={look.skin === i} tip={settings.me_skin_n({ n: i + 1 })} onClick={() => { set({ ...look, skin: i }); }} testId={`settings.me.skin.${String(i)}`} />
            ))}
          </Row>
          <Row label={settings.me_hair} testId="settings.me.hair" grid>
            {HAIRS.map((h) => (
              <Press key={h} look={look.hair === h ? 'me-cut on' : 'me-cut'} aria-label={HAIR_WORD[h]} aria-pressed={look.hair === h} onClick={() => { set(withHair(look, h)); }} data-testid={`settings.me.hair.${h}`} {...tipAttrs(HAIR_WORD[h])}>
                <LookPic look={withHair(look, h)} px={CUT_PX} />
              </Press>
            ))}
          </Row>
          <Row label={settings.me_color} testId="settings.me.color">
            {COLORS.map((c, i) => (
              <Dot key={c} color={c} on={look.color === i} tip={COLOR_WORD[i] ?? ''} onClick={() => { set({ ...look, color: i }); }} testId={`settings.me.color.${String(i)}`} />
            ))}
          </Row>
          <Row label={settings.me_wear} testId="settings.me.wear">
            {WEARS.map((w) => {
              const can = wears.includes(w);
              return (
                <Press
                  key={w}
                  look={look.wear === w ? 'me-chip on' : 'me-chip'}
                  disabled={!can}
                  aria-pressed={look.wear === w}
                  onClick={() => { set({ ...look, wear: w }); }}
                  data-testid={`settings.me.wear.${w}`}
                  {...tipAttrs(can ? undefined : settings.me_wear_no)}
                >
                  {WEAR_WORD[w]}
                </Press>
              );
            })}
          </Row>
        </div>
      </div>
      <Help>{settings.me_sub}</Help>
    </div>
  );
}

/** The onboarding's 12 ready-made looks, one click each; `on` the picked one (null: none yet). */
export function ReadyLooks({ on, pick }: { on: Look | null; pick: (l: Look) => void }) {
  return (
    <div className="me-ready" role="group" aria-label={settings.onb_me} data-testid="setup.me">
      {READY.map((l, i) => {
        const tip = settings.onb_me_look({ n: i + 1 });
        const picked = sameLook(on, l);
        return (
          <Press key={tip} look={picked ? 'me-tile on' : 'me-tile'} aria-label={tip} aria-pressed={picked} onClick={() => { pick(l); }} data-testid={`setup.me.${String(i)}`} {...tipAttrs(tip)}>
            <LookPic look={l} px={56} />
          </Press>
        );
      })}
    </div>
  );
}
