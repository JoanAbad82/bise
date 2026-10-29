// generated from hook.ts by scripts/ts_emit.ts: never hand-edited (edit the .ts, then run it)
'use strict';
/* global process */
// The harness's coverage hook (fast-try p2; architect m_29198, review-gates m_29412 #3 #4): loaded
// in the app's main process by `-r` (launch.ts), only when BISE_HARNESS_COVERAGE_OUT names a
// folder: the nightly's map run (covmap.mts). Never in a land, a try or a release.
//
// V8's own precise coverage (Profiler.startPreciseCoverage, block counts) on every JS target of
// the app: each webContents (the window, the capsule, any other) is attached as it is created,
// before its first navigation, so the profiler counts from the first script on; its children
// (an out-of-process frame, a worker) are auto-attached paused, profiled, then resumed. A
// navigation takes what ran before the page goes; launch.ts's close() calls
// globalThis.__biseCoverageTake() before it closes the app. Each take is one file in the folder:
//   <n>-<target>.json  {why, url, type, result: Profiler.ScriptCoverage[] (file: scripts only)}
// and hook.json: {errors, takes, targets}. covmap.mts reads them; a target it was told of but
// never took (closed under it) is in hook.json's errors, and the check's map entry is incomplete.
const out = process.env.BISE_HARNESS_COVERAGE_OUT;
if (out) {
    // a CommonJS script Electron loads with -r: require is its import, typed by its annotation
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const { app } = require('electron');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const path = require('node:path');
    fs.mkdirSync(out, { recursive: true });
    const errors = [];
    /** live targets: {wc, session (undefined: the webContents' own page), name} */
    const targets = new Map();
    let takes = 0;
    let seen = 0;
    const START = { callCount: true, detailed: true };
    const key = (wc, session) => `${wc.id}:${session ?? 'page'}`;
    const take = async (t, why) => {
        try {
            const r = await t.wc.debugger.sendCommand('Profiler.takePreciseCoverage', {}, t.session);
            const result = r.result.filter((s) => s.url.startsWith('file:'));
            takes += 1;
            fs.writeFileSync(path.join(out, `${takes}-${t.name}.json`), JSON.stringify({ why, url: t.wc.isDestroyed() ? '' : t.wc.getURL(), type: t.type, result }));
        }
        catch (e) {
            errors.push(`take ${t.name} (${why}): ${e instanceof Error ? e.message : String(e)}`);
        }
    };
    const profile = async (wc, session, type) => {
        const name = `${wc.id}-${session ?? 'page'}`;
        await wc.debugger.sendCommand('Profiler.enable', {}, session);
        await wc.debugger.sendCommand('Profiler.startPreciseCoverage', START, session);
        targets.set(key(wc, session), { wc, session, type, name });
        seen += 1;
    };
    app.on('web-contents-created', (_e, wc) => {
        try {
            wc.debugger.attach('1.3');
        }
        catch (e) {
            errors.push(`attach ${wc.id}: ${e instanceof Error ? e.message : String(e)}`);
            return;
        }
        // children (an out-of-process frame, a worker): paused at their start until profiled
        wc.debugger.on('message', (_ev, method, params) => {
            if (method === 'Target.attachedToTarget') {
                const s = params.sessionId;
                void profile(wc, s, params.targetInfo.type)
                    .catch((e) => errors.push(`child ${params.targetInfo.type} ${params.targetInfo.url}: ${e instanceof Error ? e.message : String(e)}`))
                    .then(() => wc.debugger.sendCommand('Runtime.runIfWaitingForDebugger', {}, s))
                    .then(() => wc.debugger.sendCommand('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, s))
                    .catch(() => undefined);
            }
            else if (method === 'Target.detachedFromTarget') {
                const k = key(wc, params.sessionId);
                if (targets.has(k))
                    errors.push(`child ${k} detached before its coverage was taken`);
                targets.delete(k);
            }
        });
        void profile(wc, undefined, wc.getType())
            .then(() => wc.debugger.sendCommand('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }))
            .catch((e) => errors.push(`profile ${wc.id}: ${e instanceof Error ? e.message : String(e)}`));
        // a new document drops the old one's scripts: take what ran before it goes
        wc.on('did-start-navigation', (ev) => {
            // Electron's navigation event (an object with isMainFrame), or the old (event, url, ...) form
            const d = ev && typeof ev === 'object' && 'isMainFrame' in ev ? ev : { isMainFrame: true, isSameDocument: false };
            const t = targets.get(key(wc, undefined));
            if (t && d.isMainFrame && !d.isSameDocument && wc.getURL() !== '')
                void take(t, 'navigation');
        });
        wc.once('destroyed', () => {
            for (const [k, t] of targets)
                if (t.wc === wc) {
                    errors.push(`target ${k} closed before its coverage was taken`);
                    targets.delete(k);
                }
        });
    });
    /** Every live target's coverage, then hook.json. launch.ts calls it before closing the app. */
    globalThis.__biseCoverageTake = async () => {
        await Promise.all([...targets.values()].map((t) => take(t, 'close')));
        targets.clear();
        fs.writeFileSync(path.join(out, 'hook.json'), JSON.stringify({ errors, takes, targets: seen }));
        return takes;
    };
}
