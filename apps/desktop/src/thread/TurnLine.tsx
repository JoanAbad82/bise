// A turn's fold line (mockup 1, QA §4): 'worked for 3m 10s ›', 28 high, 13 text-3, a rule under
// it and 12 after, at the start of a turn that did work; the turn at work says 'working for 42s ›'
// (its seconds tick). Its › opens the turn's thinking (a click, ⏎, ⌘E for all); a turn with no
// thinking has nothing to open: no ›, no button. The rules are turns.ts's. Owner: nm-thread.
import { AppIcon, Press } from '@/ds';
import { thread } from '@/proto/words.gen';
import { useSecondsSince } from './live-step';
import { turnTime, type Turn } from './turns';

export function TurnLine({ turn, open, onToggle }: { turn: Turn; open: boolean; onToggle: () => void }) {
  // the turn at work: its age, live (none once it ended)
  const running = useSecondsSince(turn.ms === null && turn.at > 0 ? turn.at : undefined);
  const words = turn.ms === null ? thread.working_for({ dur: turnTime(running) }) : thread.worked_for({ dur: turnTime(turn.ms) });
  const id = `thread.turn.${String(turn.start)}`;
  return (
    <div className="th-row th-turn" data-testid={id} data-live={turn.ms === null || undefined}>
      {turn.hides.length === 0 ? (
        <span className="th-turn-line">{words}</span>
      ) : (
        <Press look="th-turn-line" aria-expanded={open} onClick={onToggle} data-testid={`${id}.fold`}>
          {words}
          <span className="th-turn-chev">
            <AppIcon name="right" size={14} />
          </span>
        </Press>
      )}
    </div>
  );
}
