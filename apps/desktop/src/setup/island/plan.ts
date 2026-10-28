// The first launch's island (page onboarding v6, Gabriel's pick A: « une île qui se construit avec
// ton setup »): what it shows at each moment of the four steps, from the onboarding's own state.
// Pure: scene.ts draws it, Island.tsx feeds it. Each step adds its piece: hello lands his bim, the
// model step brings the desk (its little window blinks while the check runs, lit once it works, his
// model's first words in a bubble), the projects step raises a little island per ticked repo, his
// first message flies to his bim as a paper plane. Owner: onboarding.
import type { Look } from '@/bims/render/look';
import type { Step } from '../model';

/** at most this many little islands: one per ticked project, the first ones */
export const MAX_PODS = 4;
/** a bubble's words at most (the model's first words cut with …) */
export const BUBBLE_MAX = 48;

export type Glow = 'off' | 'checking' | 'lit';
/** what the bim does: stands (hello waves once on landing), stands by the desk, sits on its edge, reads the plane */
export type Pose = 'stand' | 'desk' | 'sit' | 'read';

export interface IslandPlan {
  /** his bim's look; null: main's own (none picked yet) */
  readonly look: Look | null;
  readonly desk: boolean;
  readonly glow: Glow;
  /** the little islands, by project name, in his order */
  readonly pods: readonly string[];
  readonly pose: Pose;
  /** the words over his bim; null: none */
  readonly bubble: string | null;
  /** the camera takes the little islands in too */
  readonly wide: boolean;
  /** his first message is flying to the bim */
  readonly plane: boolean;
}

export interface PlanIn {
  readonly step: Step;
  readonly look: Look | null;
  /** the model step's check: none sent, signing in, checking, works, failed (pay.ts phase) */
  readonly check: 'none' | 'signing' | 'checking' | 'works' | 'failed';
  /** the model's first words once it works */
  readonly answer: string | null;
  /** a model works (this run, or main had one): the desk stays lit after the model step */
  readonly ready: boolean;
  /** the projects he ticked, chosen first (model.ts tickedNames) */
  readonly ticked: readonly string[];
  /** his first message was sent */
  readonly sent: boolean;
}

/** the model's words, one line, cut at BUBBLE_MAX with … Pure. */
export function bubbleOf(answer: string): string {
  const one = answer.replace(/\s+/g, ' ').trim();
  return one.length <= BUBBLE_MAX ? one : `${one.slice(0, BUBBLE_MAX - 1).trimEnd()}…`;
}

/** The island at this moment of the first launch. Pure. */
export function planOf(i: PlanIn): IslandPlan {
  const at = i.step;
  const desk = at !== 'hello';
  const glow: Glow = at === 'model'
    ? i.check === 'works' ? 'lit' : i.check === 'checking' || i.check === 'signing' ? 'checking' : 'off'
    : desk && i.ready ? 'lit' : 'off';
  const pods = at === 'projects' || at === 'first' ? i.ticked.slice(0, MAX_PODS) : [];
  const pose: Pose = at === 'hello' ? 'stand' : at === 'model' ? 'desk' : i.sent ? 'read' : 'sit';
  const bubble = at === 'model' && i.check === 'works' && i.answer !== null && i.answer.trim() !== '' ? bubbleOf(i.answer) : null;
  return { look: i.look, desk, glow, pods, pose, bubble, wide: pods.length > 0, plane: at === 'first' && i.sent };
}
