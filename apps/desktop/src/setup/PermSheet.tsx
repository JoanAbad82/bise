// fn's permissions sheet (desktop-onboarding v4 §3), drawn in the capsule at his first fn hold with
// one missing (perms.ts says when): 'to hear you from any app', the three rows (macOS's own names,
// designer m_34345) with what each is
// for (a granted one says so), [allow] (macOS's prompts in turn, a refused one its pane), and the
// dim 'not now': his words still go to bise, typed in the spotlight. Owner: amb-home.
import { Act, Button, Chip, Group } from '@/ds';
import { settings } from '@/proto/words.gen';
import { allAllowed, PERMS, type Perms } from './perms';

const WORDS: Record<string, { label: string; sub: string; lost: string }> = {
  mic: { label: settings.onb_perm_mic, sub: settings.onb_mic_sub, lost: settings.onb_mic_lost },
  accessibility: { label: settings.onb_perm_accessibility, sub: settings.onb_accessibility_sub, lost: settings.onb_accessibility_lost },
  screen: { label: settings.onb_perm_screen, sub: settings.onb_screen_sub, lost: settings.onb_screen_lost },
};

export function PermSheet({ perms, onAllow, onNotNow }: { perms: Perms; onAllow: () => void; onNotNow: () => void }) {
  return (
    <div className="b-cap-perms" data-testid="capsule.perms" data-glass>
      <div className="t">{settings.onb_perms_title}</div>
      <div className="s">{settings.onb_perms_sub}</div>
      <Group
        testId="capsule.perms.rows"
        items={PERMS.map((p) => {
          const w = WORDS[p] ?? { label: p, sub: '', lost: '' };
          const g = perms[p];
          return {
            id: p,
            label: w.label,
            sub: g === 'denied' ? w.lost : w.sub,
            ...(g === 'allowed' ? { control: <Chip tone="ok">{settings.onb_allowed}</Chip> } : {}),
          };
        })}
      />
      <div className="acts">
        <Button kind="pri" onClick={onAllow} state={allAllowed(perms) ? 'disabled' : undefined} testId="capsule.perms.allow">
          {settings.perm_allow}
        </Button>
      </div>
      <p className="later">
        <Act onClick={onNotNow} testId="capsule.perms.later">
          {settings.onb_not_now}
        </Act>
        {': '}
        {settings.onb_not_now_says}
      </p>
    </div>
  );
}
