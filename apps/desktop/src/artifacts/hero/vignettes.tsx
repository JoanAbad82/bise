// src/artifacts/hero · the pages' banner vignettes (bims-plugins' renderer, designer-signed m_42905)
// and the one loader every page's PageBanner reads: <PageVignette page="inbox" /> gives the light
// and the dark still (ds banner.css shows the theme's), each with its 1x and 2x (the screen's DPR
// picks: srcSet). Their files: <page>-<light|dark>@<1x|2x>.webp, 360x176 at 1x; the artifacts
// page's own still (440x264, one size). useBannerGutter: the room the right side keeps free, for
// PageBanner's gutter. bims-plugins owns the images; nm-pages-a the code; nm-pages-b imports both.
import { useSideLayout } from '@/app/side3d/place';
import artifacts_light from './artifacts-hero-light.png';
import artifacts_dark from './artifacts-hero-dark.png';
import inbox_light_1 from './inbox-light@1x.webp';
import inbox_light_2 from './inbox-light@2x.webp';
import inbox_dark_1 from './inbox-dark@1x.webp';
import inbox_dark_2 from './inbox-dark@2x.webp';
import scheduled_light_1 from './scheduled-light@1x.webp';
import scheduled_light_2 from './scheduled-light@2x.webp';
import scheduled_dark_1 from './scheduled-dark@1x.webp';
import scheduled_dark_2 from './scheduled-dark@2x.webp';
import processes_light_1 from './processes-light@1x.webp';
import processes_light_2 from './processes-light@2x.webp';
import processes_dark_1 from './processes-dark@1x.webp';
import processes_dark_2 from './processes-dark@2x.webp';
import agents_light_1 from './agents-light@1x.webp';
import agents_light_2 from './agents-light@2x.webp';
import agents_dark_1 from './agents-dark@1x.webp';
import agents_dark_2 from './agents-dark@2x.webp';
import archived_light_1 from './archived-light@1x.webp';
import archived_light_2 from './archived-light@2x.webp';
import archived_dark_1 from './archived-dark@1x.webp';
import archived_dark_2 from './archived-dark@2x.webp';
import changes_light_1 from './changes-light@1x.webp';
import changes_light_2 from './changes-light@2x.webp';
import changes_dark_1 from './changes-dark@1x.webp';
import changes_dark_2 from './changes-dark@2x.webp';
import prs_light_1 from './prs-light@1x.webp';
import prs_light_2 from './prs-light@2x.webp';
import prs_dark_1 from './prs-dark@1x.webp';
import prs_dark_2 from './prs-dark@2x.webp';
import environments_light_1 from './environments-light@1x.webp';
import environments_light_2 from './environments-light@2x.webp';
import environments_dark_1 from './environments-dark@1x.webp';
import environments_dark_2 from './environments-dark@2x.webp';
import crash_light_1 from './crash-light@1x.webp';
import crash_light_2 from './crash-light@2x.webp';
import crash_dark_1 from './crash-dark@1x.webp';
import crash_dark_2 from './crash-dark@2x.webp';

/** the pages with a signed vignette */
export type VignettePage = 'inbox' | 'artifacts' | 'scheduled' | 'processes' | 'agents' | 'archived' | 'changes' | 'prs' | 'environments' | 'crash';

/** one theme's still: its 1x and 2x URLs (the same one when it has a single size) */
type Still = readonly [x1: string, x2: string];

const STILLS: Readonly<Record<VignettePage, { light: Still; dark: Still }>> = {
  inbox: { light: [inbox_light_1, inbox_light_2], dark: [inbox_dark_1, inbox_dark_2] },
  artifacts: { light: [artifacts_light, artifacts_light], dark: [artifacts_dark, artifacts_dark] },
  scheduled: { light: [scheduled_light_1, scheduled_light_2], dark: [scheduled_dark_1, scheduled_dark_2] },
  processes: { light: [processes_light_1, processes_light_2], dark: [processes_dark_1, processes_dark_2] },
  agents: { light: [agents_light_1, agents_light_2], dark: [agents_dark_1, agents_dark_2] },
  archived: { light: [archived_light_1, archived_light_2], dark: [archived_dark_1, archived_dark_2] },
  changes: { light: [changes_light_1, changes_light_2], dark: [changes_dark_1, changes_dark_2] },
  prs: { light: [prs_light_1, prs_light_2], dark: [prs_dark_1, prs_dark_2] },
  environments: { light: [environments_light_1, environments_light_2], dark: [environments_dark_1, environments_dark_2] },
  crash: { light: [crash_light_1, crash_light_2], dark: [crash_dark_1, crash_dark_2] },
};

const srcSet = ([x1, x2]: Still): string => (x1 === x2 ? x1 : `${x1} 1x, ${x2} 2x`);

/** A page's vignette for PageBanner's visual: its light and dark stills (the theme shows one). */
export function PageVignette({ page }: { page: VignettePage }) {
  const s = STILLS[page];
  return (
    <>
      <img className="light" src={s.light[0]} srcSet={srcSet(s.light)} alt="" data-vignette={page} />
      <img className="dark" src={s.dark[0]} srcSet={srcSet(s.dark)} alt="" data-vignette={page} />
    </>
  );
}

/** PageBanner's gutter: the band the right side keeps free at the window's right (0 when it hides). */
export function useBannerGutter(): number {
  const l = useSideLayout();
  return l.side ? l.gutter : 0;
}
