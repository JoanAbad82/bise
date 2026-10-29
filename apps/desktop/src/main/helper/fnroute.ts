// fn fn with bise's window in front (lead m_16973): the window can't see fn, so the helper's
// 'double' goes to that window only (IPC.fnVoice), which turns voice mode on for its agent in view
// the way ctrl+r twice does (amb-web's page; the core's voice_mode, unchanged). Anywhere else, and
// for every other fn act (a hold, a tap, fn space), the event goes to every window as before and
// the capsule talks. Pure.
import type { HelperEv } from '../../proto';

/** Whether this helper event goes to bise's window in front as voice mode instead of the capsule. */
export function fnToWindow(ev: HelperEv, windowFront: boolean): boolean {
  return windowFront && ev.ev === 'fn' && ev.act === 'double';
}
