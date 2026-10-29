// answer-in-thread A (his pick, designer m_24425): once the hub took his answer to another
// project's card (or bise's view's), the window goes to that project's main thread at his answer:
// the store says where (answered.ts' jumpOf, its answer_jump slice), this hook moves the window
// with the one jump of the window (openAnswer: a history step, ‹ / ⌘[ / esc back, his answer
// brought into view and flashed once). Mounted once in the shell. Owner: amb-win.
import { useEffect, useRef } from 'react';
import type { Router } from '@/app/router';
import { useAnswerJump } from '@/store';
import { openAnswer } from './answerlink';

export function useAnswerJumps(router: Router): void {
  const jump = useAnswerJump();
  // the jump already there when the shell mounts (a reload) was made before: never again
  const seen = useRef(jump?.seq ?? 0);
  useEffect(() => {
    if (jump === null || jump.seq <= seen.current) return;
    seen.current = jump.seq;
    openAnswer(router, { project: jump.project, agent: jump.agent, card: jump.card });
  }, [jump, router]);
}
