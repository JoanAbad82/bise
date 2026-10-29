// The pause line over the composer (designer's agent-waiting-states, his pick A): only a pause,
// never an alarm (an alarm leaves the agent free; the right bar says it). 'continues when' in
// text-2, whole; then the event in text-3, the only part that cuts, after a whole word with '…'
// (under 3 words left it drops); ' and 1 more' when it continues on several; ' · ' and how long,
// whole ('running for 3 min'). Another agent's reply: 'continues when search answers · 1 min', the
// name opens it. The title lists every pause. Digits mono. Never the accent: nothing of it waits on
// him. The words are wake.ts's (words.rs's twin). Owner: amb-win.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Agent } from '@/proto';
import { common } from '@/proto/words.gen';
import { useNowFor } from '@/app/clock';
import { useRouter } from '@/app/router';
import { shownName } from '@/agents/model';
import { textWidth } from '@/ds';
import { digitRuns, fitNote, pauseInSeconds, pauseLine } from './wake';

/** Words with their digits mono. */
function Runs({ text }: { text: string }) {
  return (
    <>
      {digitRuns(text).map((r, i) =>
        r.digits ? (
          <span key={i} className="th-wait-num">
            {r.text}
          </span>
        ) : (
          r.text
        ),
      )}
    </>
  );
}

export function PauseLine({ a, project }: { a: Agent | undefined; project: string }) {
  // under a minute it reads in seconds: the second clock (else '0 s' for up to a minute)
  const now = useNowFor((t) => a !== undefined && pauseInSeconds(a, t));
  const router = useRouter();
  const line = a === undefined || a.archived ? null : pauseLine(a, now);
  const box = useRef<HTMLDivElement>(null);
  // the note's room and font, read from the DOM after layout (never during render)
  const [room, setRoom] = useState<{ avail: number; font: string }>({ avail: Infinity, font: '' });
  // the room the note has: the line's width less its whole parts (state, ' and 1 more', ' · ', how long)
  useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    const measure = () => {
      const whole = Array.from(el.querySelectorAll<HTMLElement>('[data-whole]'), (x) => x.getBoundingClientRect().width);
      const font = getComputedStyle(el.querySelector('.th-wait-note') ?? el).font;
      const avail = el.clientWidth - whole.reduce((s, w) => s + w, 0) - 1;
      setRoom((r) => (r.avail === avail && r.font === font ? r : { avail, font }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [line?.state, line?.more, line?.dur, line?.who]);
  if (line === null) return null;
  // a reply names its agent, a button that opens it ('search answers': never cut)
  const note = line.who !== '' || room.avail === Infinity || room.font === '' ? line.note : fitNote(line.note, room.avail, textWidth(room.font));
  return (
    <div ref={box} className="th-live th-waiting" data-testid="thread.waiting" aria-live="polite" title={line.title}>
      <span className="th-wait-state" data-whole="">
        {`${line.state} `}
      </span>
      <span className="th-wait-note" data-testid="thread.waiting.note">
        {line.who !== '' ? (
          <>
            {/* its name on the line's baseline, plain ink, a link (designer m_43892: no chip) */}
            <a
              href={`#${line.who}`}
              className="th-wait-who"
              data-testid="thread.waiting.who"
              title={common.open_agent({ agent: shownName(line.who) })}
              onClick={(e) => {
                e.preventDefault();
                router.go({ screen: 'thread', project, agent: line.who });
              }}
            >
              {shownName(line.who)}
            </a>
            {' answers'}
          </>
        ) : (
          (note ?? '')
        )}
      </span>
      {line.more !== '' && (
        <span className="th-wait-more" data-whole="">
          {line.more}
        </span>
      )}
      <span className="th-wait-sep" data-whole="">
        {' · '}
        <Runs text={line.dur} />
      </span>
    </div>
  );
}
