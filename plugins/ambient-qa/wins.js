// The windows of one pid and the online screens, read from the window server (no permission:
// bounds only, never titles or pixels), for qa.py real's proof and watchdog. Run:
//   osascript -l JavaScript wins.js <pid>
ObjC.import('CoreGraphics');
function run(argv) {
  const pid = parseInt(argv[0]);
  const list = ObjC.deepUnwrap(ObjC.castRefToObject($.CGWindowListCopyWindowInfo($.kCGWindowListOptionAll, 0))) || [];
  const wins = list.filter(w => w.kCGWindowOwnerPID === pid).map(w => ({
    n: w.kCGWindowNumber, layer: w.kCGWindowLayer, onscreen: !!w.kCGWindowIsOnscreen, alpha: w.kCGWindowAlpha,
    x: w.kCGWindowBounds.X, y: w.kCGWindowBounds.Y, w: w.kCGWindowBounds.Width, h: w.kCGWindowBounds.Height}));
  const ids = Ref(), cnt = Ref();
  $.CGGetOnlineDisplayList(16, ids, cnt);
  const screens = [];
  for (let i = 0; i < cnt[0]; i++) {
    const r = $.CGDisplayBounds(ids[i]);
    screens.push({id: ids[i], x: r.origin.x, y: r.origin.y, w: r.size.width, h: r.size.height});
  }
  return JSON.stringify({wins, screens});
}
