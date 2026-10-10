// native/vm-pass · what only a real, shown app with real keys can prove (README.md, "The macOS VM
// pass"), on the packaged bise.app in a macOS guest (amb-tools' Vm: tart, 4 GB, 2 cores, headless,
// stopped after). Opt-in: BISE_HARNESS_VM=1 QA_KIT=<guest kit> (README.md says how to make it).
// Inside the guest: its throwaway user (admin), the app's own bise replaced by the scripted core
// (the fixture world: no hub, no provider, no account), the real bise-mac-helper.
// Input: VNC keys and clicks (the virtual keyboard and mouse: real HID through the window server),
// and fn from biseqa (a CGEvent at the HID tap with maskSecondaryFn: VNC has no fn key).
// Read: VNC frames (saved as the run's frames), Vision's text in them (biseqa ocr), the guest's
// window server (biseqa windows / front), launchctl procinfo (TCC's responsible process), the
// scripted core's command log.
// Each row is soft: one run gives the whole tally (tally.json beside the frames).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { expect, test } from '@playwright/test';
import { Vm } from '../../../harness/vm/vm';

test.skip(process.env['BISE_HARNESS_VM'] !== '1', 'the VM pass is opt-in: BISE_HARNESS_VM=1 QA_KIT=<guest kit>');

const KIT = process.env['QA_KIT'] ?? '';
/** the packaged app as a zip (a shared folder loses the app's framework symlinks): QA_APP_ZIP_DIR/bise.zip */
const APP_DIR = process.env['QA_APP_ZIP_DIR'] ?? '';
const FIXTURES = path.resolve(__dirname, '../../../../../../rust/proto/fixtures');
const Q = '/Users/admin/bise-qa';
const SHARED = '/Volumes/My Shared Files';
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

type Win = { layer: number; name: string; onscreen: boolean; x: number; y: number; w: number; h: number };
type Text = { text: string; x: number; y: number; w: number; h: number };
type Row = { row: string; pass: boolean; saw: string; frame?: string };

test('native/vm-pass: real keys, real fn, focus, full screen, TCC, glass, tray on the packaged app', async () => {
  test.setTimeout(900_000);
  expect(KIT, 'QA_KIT: the guest kit folder').not.toBe('');
  // frames and the tally outlive the run (Playwright empties outputDir at the next run): QA_FRAMES_DIR
  const out = process.env['QA_FRAMES_DIR'] ?? test.info().outputDir;
  mkdirSync(out, { recursive: true });
  const tally: Row[] = [];
  const vm = await Vm.up({ dirs: { qa: KIT, app: APP_DIR } });
  let n = 0;
  let scale = 1;

  const sh = async (cmd: string, aqua = false): Promise<string> => (await vm.exec(['/bin/sh', '-c', cmd], { aqua })).stdout;
  const qa = async (...a: string[]): Promise<string> => (await vm.exec([`${Q}/biseqa`, ...a], { aqua: true })).stdout;
  const front = async (): Promise<string> => (JSON.parse((await qa('front')).trim() || '{}') as { bundle?: string }).bundle ?? '';
  const wins = async (): Promise<Win[]> => JSON.parse((await qa('windows', 'bise')).trim() || '[]') as Win[];
  /** a frame from the guest's screen, saved, and the text Vision reads in it (pixels) */
  const frame = async (name: string): Promise<{ file: string; text: Text[] }> => {
    const file = path.join(out, `${String(++n).padStart(2, '0')}-${name}.png`);
    writeFileSync(file, await vm.vnc.shot());
    const lines = execFileSync(path.join(KIT, 'biseqa'), ['ocr', file]).toString().split('\n').filter(Boolean);
    return { file: path.basename(file), text: lines.map((l) => JSON.parse(l) as Text) };
  };
  const has = (t: Text[], re: RegExp): boolean => t.some((x) => re.test(x.text));
  const row = (r: Row): void => {
    tally.push(r);
    expect.soft(r.pass, `${r.row}: ${r.saw}`).toBe(true);
  };
  const coreCmds = async (): Promise<string[]> =>
    (await sh(`cat ${Q}/core-cmds.jsonl 2>/dev/null`)).split('\n').filter(Boolean).map((l) => (JSON.parse(l) as { cmd?: string }).cmd ?? '');
  const capsule = (ws: Win[]): Win | undefined => ws.find((w) => w.layer > 0 && w.layer !== 25 && w.h > 40);

  try {
    // the app and the kit in, the grants a person would give in setup (System Settings' rows,
    // written to TCC.db: SIP is off in this image), then bise opened by LaunchServices as he would
    const setup = await sh(
      [
        `rm -rf ${Q} /Applications/bise.app`,
        `ditto "${SHARED}/qa" ${Q}`,
        `sudo ditto -x -k "${SHARED}/app/bise.zip" /Applications`,
        `printf 'note\\n' > ${Q}/note.txt`,
        ...['kTCCServiceAccessibility', 'kTCCServiceListenEvent', 'kTCCServiceScreenCapture', 'kTCCServicePostEvent'].flatMap((svc) => [
          `sudo sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" "insert or replace into access (service,client,client_type,auth_value,auth_reason,auth_version,indirect_object_identifier,flags,last_modified) values ('${svc}','dev.bise.desktop',0,2,4,1,'UNUSED',0,strftime('%s','now'))"`,
          `sudo sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" "insert or replace into access (service,client,client_type,auth_value,auth_reason,auth_version,indirect_object_identifier,flags,last_modified) values ('${svc}','${Q}/biseqa',1,2,4,1,'UNUSED',0,strftime('%s','now'))"`,
        ]),
        'sudo killall tccd 2>/dev/null; true',
        'echo ok',
      ].join(' && '),
    );
    expect(setup.trim().endsWith('ok'), `setup in the guest: ${setup}`).toBe(true);
    const scr = JSON.parse((await qa('screen')).trim()) as { w: number; h: number };
    scale = PNG.sync.read(await vm.vnc.shot()).width / scr.w;

    await sh(`open -a /Applications/bise.app --stdout ${Q}/main.out --stderr ${Q}/main.err`, true);
    await sleep(9000);
    const launch = await frame('launch');
    const helperPid = (await sh('pgrep -x bise-mac-helper')).trim().split('\n')[0] ?? '';
    const proc = helperPid === '' ? '' : await sh(`sudo launchctl procinfo ${helperPid} 2>/dev/null | grep -i responsible`);
    row({ row: 'TCC: macOS charges the helper to bise.app', pass: /bise\.app/.test(proc), saw: proc.trim() || `no helper (pid '${helperPid}')`, frame: launch.file });
    row({ row: 'the helper is trusted through the app (its fn tap runs)', pass: !/tap failed|not trusted|no tap/i.test(await sh(`cat ${Q}/main.err`)), saw: (await sh(`grep -i -E 'helper|tap|trust' ${Q}/main.err | tail -5`)).trim() });

    // the menu bar's pearl (tray): macOS 26 draws status items in Control Center's windows, so it is
    // found by its pixels (the pearl's pink, in the menu bar's right half), then clicked
    const shot0 = PNG.sync.read(readFileSync(path.join(out, launch.file)));
    let sx = 0, sy = 0, k = 0;
    for (let y = 2; y < Math.round(26 * scale); y++) {
      for (let x = Math.round(shot0.width / 2); x < shot0.width; x++) {
        const i = (y * shot0.width + x) * 4;
        const r = shot0.data[i] ?? 0, g = shot0.data[i + 1] ?? 0, b = shot0.data[i + 2] ?? 0;
        // the pearl's pink over the menu bar (measured on a 2x frame: about 245,180,200): red well over
        // green and blue over green; the menu bar's blue, white text and grey icons never match
        if (r > 200 && r - g > 45 && b - g > 10) { sx += x; sy += y; k++; }
      }
    }
    if (k > 4) {
      await vm.vnc.click(sx / k, sy / k);
      await sleep(1200);
      const f = await frame('tray-click');
      const drop = capsule(await wins());
      row({ row: 'tray: a click on the pearl opens the dropdown under it', pass: drop !== undefined && has(f.text, /open bise|inbox|settings|quit/i), saw: `pearl at ${String(Math.round(sx / k))},${String(Math.round(sy / k))} px; dropdown ${JSON.stringify(drop)}; text ${f.text.map((t) => t.text).join(' | ').slice(0, 200)}`, frame: f.file });
      await vm.vnc.keys('Escape');
      await sleep(500);
    } else {
      row({ row: 'tray: a click on the pearl opens the dropdown under it', pass: false, saw: 'no pearl drawn in the menu bar', frame: launch.file });
    }

    // the keys, for real, in the window
    await sh('open -a /Applications/bise.app', true);
    await sleep(1500);
    for (const [key, re, what] of [
      ['Meta+,', /general|appearance|settings/i, '⌘, opens settings'],
      ['Meta+i', /inbox|waiting for you|nothing waits/i, '⌘I opens the inbox'],
    ] as const) {
      await vm.vnc.keys(key);
      await sleep(1500);
      const f = await frame(key === 'Meta+,' ? 'Meta-comma' : key.replace('+', '-'));
      row({ row: `keys: ${what}`, pass: has(f.text, re), saw: f.text.map((t) => t.text).join(' | ').slice(0, 240), frame: f.file });
    }
    await vm.vnc.keys('Escape');
    await vm.vnc.click(120 * scale, 140 * scale); // the sidebar's bise row: a thread, where ⌘F finds
    await sleep(800);
    await vm.vnc.keys('Meta+f');
    await sleep(1200);
    const find = await frame('Meta-f');
    row({ row: 'keys: ⌘F opens find in the thread', pass: has(find.text, /find in this thread/i), saw: find.text.map((t) => t.text).join(' | ').slice(0, 240), frame: find.file });

    // his app in front: TextEdit; bise must never take it
    await sh(`open -a TextEdit ${Q}/note.txt`, true);
    await sleep(3000);
    const te = await front();
    row({ row: 'setup: TextEdit is in front', pass: te === 'com.apple.TextEdit', saw: te });

    const before = (await coreCmds()).length;
    const holding = qa('fn', 'hold', '2500');
    await sleep(900);
    const talk = await frame('fn-held');
    const talkWin = capsule(await wins());
    const frontDuring = await front();
    await holding;
    await sleep(500);
    const afterHold = (await coreCmds()).slice(before);
    row({ row: 'fn held: the talk shows, TextEdit stays active', pass: talkWin !== undefined && frontDuring === 'com.apple.TextEdit', saw: `capsule ${JSON.stringify(talkWin)}, front ${frontDuring}`, frame: talk.file });
    row({ row: 'fn held: the core gets talk_start, then talk_end', pass: afterHold.includes('talk_start') && afterHold.includes('talk_end'), saw: afterHold.join(',') });

    const b2 = (await coreCmds()).length;
    await qa('fn', 'twice');
    await sleep(1500);
    const hf = await frame('fn-twice');
    const hfWin = capsule(await wins());
    await qa('fn', 'hold', '60');
    await sleep(800);
    const afterTwice = (await coreCmds()).slice(b2);
    row({ row: 'fn fn: hands-free shows and stays, a tap ends it', pass: hfWin !== undefined && afterTwice.includes('talk_start') && afterTwice.includes('talk_end'), saw: `capsule ${JSON.stringify(hfWin)}; core ${afterTwice.join(',')}`, frame: hf.file });

    await qa('fn', 'key', '49');
    await sleep(1200);
    await vm.vnc.type('zebra seven');
    await sleep(600);
    const spot = await frame('fn-space-typed');
    const spotWin = capsule(await wins());
    const frontSpot = await front();
    const inCapsule = spotWin !== undefined && spot.text.some((t) => /zebra/i.test(t.text) && t.y / scale >= spotWin.y - 4 && t.y / scale <= spotWin.y + spotWin.h);
    row({ row: 'fn space: the spotlight takes the typing, TextEdit stays the active app', pass: inCapsule && frontSpot === 'com.apple.TextEdit', saw: `capsule ${JSON.stringify(spotWin)}, front ${frontSpot}, typed text in capsule ${String(inCapsule)}`, frame: spot.file });
    await vm.vnc.keys('Escape');
    await sleep(800);
    const gone = capsule(await wins());
    await vm.vnc.type('back');
    await sleep(500);
    const backF = await frame('esc-then-type');
    row({ row: 'esc: the spotlight goes, TextEdit gets the keys again', pass: gone === undefined && has(backF.text, /back/) && (await front()) === 'com.apple.TextEdit', saw: `capsule after esc ${JSON.stringify(gone)}`, frame: backF.file });

    // TextEdit full screen: the panel and a card over it, TextEdit keeps the keys
    await vm.vnc.keys('Control+Meta+f');
    await sleep(3000);
    await qa('fn', 'key', '49');
    await sleep(1200);
    const fs = await frame('full-screen-spotlight');
    row({ row: 'full screen: the spotlight draws over a full-screen app', pass: capsule(await wins()) !== undefined && has(fs.text, /zebra|waiting|ask|search|bise/i), saw: `capsule ${JSON.stringify(capsule(await wins()))}`, frame: fs.file });
    await vm.vnc.keys('Escape');
    await sleep(800);
    const hub = readFileSync(path.join(FIXTURES, 'hub_ev.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as { ev: string; cards?: { id: number; question: string }[] });
    const cards = hub.find((e) => e.ev === 'cards');
    const first = cards?.cards?.[0];
    if (cards && first) {
      const push = JSON.stringify({ ...cards, cards: [...(cards.cards ?? []), { ...first, id: 98, question: 'ship the fix tonight?' }] });
      await sh(`${Q}/node -e 'const c=require("net").createConnection("${Q}/core.sock",()=>c.end(process.argv[1]+"\\n"))' '${push.replace(/'/g, "'\\''")}'`);
      await sleep(1500);
      // b3 (8eebf588): a new card never pops the capsule; it waits in the spotlight
      const quiet = capsule(await wins());
      const fq = await front();
      await qa('fn', 'key', '49');
      await sleep(1200);
      const card = await frame('full-screen-card-in-spotlight');
      const fc = await front();
      row({
        row: 'full screen: a card waits in the spotlight over a full-screen app, TextEdit keeps the keys',
        pass: quiet === undefined && fq === 'com.apple.TextEdit' && capsule(await wins()) !== undefined && has(card.text, /ship the fix/i) && fc === 'com.apple.TextEdit',
        saw: `before fn space: capsule ${JSON.stringify(quiet)}, front ${fq}; after: capsule ${JSON.stringify(capsule(await wins()))}, front ${fc}`,
        frame: card.file,
      });
      await vm.vnc.keys('Escape');
      await sleep(800);
    }
    await vm.vnc.keys('Control+Meta+f');
    await sleep(2500);

    // fn fn with bise's window in front: voice mode on the agent in view, never the capsule (dba197c7)
    await sh('open -a /Applications/bise.app', true);
    await sleep(2000);
    const fb = await front();
    const b3 = (await coreCmds()).length;
    await qa('fn', 'twice');
    await sleep(1500);
    const vf = await frame('fn-fn-window');
    const afterVoice = (await coreCmds()).slice(b3);
    const capVoice = capsule(await wins());
    row({
      row: "fn fn with bise's window in front: voice mode on the agent in view, no capsule talk",
      pass: fb === 'dev.bise.desktop' && afterVoice.includes('voice_mode') && !afterVoice.includes('talk_start') && capVoice === undefined,
      saw: `front ${fb}; core ${afterVoice.join(',')}; capsule ${JSON.stringify(capVoice)}`,
      frame: vf.file,
    });
    await qa('fn', 'twice');
    await sleep(800);
    await sh('open -a TextEdit', true);
    await sleep(1500);

    // the glass: the same capsule over black, then white: what's behind shows through
    const glass: number[] = [];
    for (const bg of ['black', 'white']) {
      await sh(`open -a Preview ${Q}/${bg}.png`, true);
      await sleep(2000);
      await vm.vnc.keys('Control+Meta+f');
      await sleep(2500);
      await qa('fn', 'key', '49');
      await sleep(1200);
      const f = await frame(`glass-over-${bg}`);
      const w = capsule(await wins());
      if (w) {
        const png = PNG.sync.read(readFileSync(path.join(out, f.file)));
        // a strip inside the glass, left of the field: no text, only glass
        const px = Math.round((w.x + 12) * scale), py = Math.round((w.y + w.h / 2) * scale);
        const i = (py * png.width + px) * 4;
        glass.push(((png.data[i] ?? 0) + (png.data[i + 1] ?? 0) + (png.data[i + 2] ?? 0)) / 3);
      }
      await vm.vnc.keys('Escape');
      await sleep(500);
      await vm.vnc.keys('Control+Meta+f');
      await sleep(2000);
      await vm.vnc.keys('Meta+q');
      await sleep(800);
    }
    // the control (lead m_17666): does this guest draw vibrancy at all? macOS's own Spotlight over the
    // same black then white; no difference there = the VM's GPU, not bise
    const ctl: number[] = [];
    for (const bg of ['black', 'white']) {
      await sh(`open -a Preview ${Q}/${bg}.png`, true);
      await sleep(2000);
      await vm.vnc.keys('Control+Meta+f');
      await sleep(2500);
      await vm.vnc.keys('Meta+space');
      await sleep(1500);
      const f = await frame(`spotlight-over-${bg}`);
      const sw = (JSON.parse((await qa('windows', 'Spotlight')).trim() || '[]') as Win[]).filter((w) => w.onscreen && w.h > 30).sort((x, y) => y.w * y.h - x.w * x.h)[0];
      if (sw) {
        const png = PNG.sync.read(readFileSync(path.join(out, f.file)));
        const px = Math.round((sw.x + sw.w - 24) * scale), py = Math.round((sw.y + sw.h / 2) * scale);
        const i = (py * png.width + px) * 4;
        ctl.push(((png.data[i] ?? 0) + (png.data[i + 1] ?? 0) + (png.data[i + 2] ?? 0)) / 3);
      }
      await vm.vnc.keys('Escape');
      await sleep(500);
      await vm.vnc.keys('Control+Meta+f');
      await sleep(2000);
      await vm.vnc.keys('Meta+q');
      await sleep(800);
    }
    const guestDraws = ctl.length === 2 && Math.abs((ctl[1] ?? 0) - (ctl[0] ?? 0)) > 20;
    tally.push({ row: "control: the guest draws macOS's own vibrancy (Spotlight over black vs white)", pass: guestDraws, saw: `Spotlight's level over black ${String(ctl[0])}, over white ${String(ctl[1])}${ctl.length < 2 ? ' (Spotlight window not found)' : ''}` });
    const asked = (await sh(`grep 'glass: capsule' ${Q}/main.err | tail -1`)).trim();
    tally.push({ row: 'control: main asked macOS for the capsule vibrancy', pass: /vibrancy=popover state=active/.test(asked), saw: asked || 'no glass line in main.err' });
    row({ row: 'glass: what is behind the capsule shows through (vibrancy)', pass: glass.length === 2 && Math.abs((glass[1] ?? 0) - (glass[0] ?? 0)) > 20, saw: `mean glass level over black ${String(glass[0])}, over white ${String(glass[1])}` });

    // ⌘Q for real: bise and its helper end
    await sh('open -a /Applications/bise.app', true);
    await sleep(1500);
    await vm.vnc.keys('Meta+q');
    await sleep(3000);
    const left = (await sh('pgrep -x bise; pgrep -x bise-mac-helper')).trim();
    row({ row: 'keys: ⌘Q quits bise and its helper', pass: left === '', saw: left === '' ? 'both gone' : `still running: ${left}` });
  } finally {
    writeFileSync(path.join(out, 'tally.json'), JSON.stringify(tally, null, 2));
    await sh(`cat ${Q}/main.err 2>/dev/null | tail -60`).then((e) => { writeFileSync(path.join(out, 'main.err.txt'), e); }).catch(() => undefined);
    await vm.down();
  }
});
