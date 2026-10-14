// bend-jsrt's script mode, before the office bundle and the script
// (script.rs): console and the run.read/run.write host. No timers
// (architect m_23800): a library that needs setTimeout fails loudly in a
// test (tests/script.rs), never quietly at his file.
(() => {
  const g = globalThis;
  const line = (a) => a.map((x) => (typeof x === 'string' ? x : (() => {
    try { return JSON.stringify(x); } catch (e) { return String(x); }
  })())).join(' ');
  g.console = {
    log: (...a) => __office_log(line(a)),
    info: (...a) => __office_log(line(a)),
    warn: (...a) => __office_log(line(a)),
    error: (...a) => __office_log(line(a)),
    debug: () => {},
  };

  g.__biseOfficeHost = {
    read: async (path) => __office_read(String(path)),
    write: async (path, bytes, opts) => {
      if (!(bytes instanceof Uint8Array)) throw new TypeError('run.write(path, bytes): bytes must be a Uint8Array');
      return __office_write(String(path), bytes, !!(opts && opts.artifact));
    },
  };
})();
