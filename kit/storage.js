// bise kit · Web Storage for a site artifact in its sandbox (art-viewer; architect m_25527). The
// page server puts this one script first in each html page it serves under /a/<id>/<v>/ (plain
// and framed, site.rs `tagged`); the kept copy never changes.
//
// The site runs in an opaque origin (ARTIFACT_CSP: `sandbox allow-scripts`, no same-origin), where
// reading window.localStorage or sessionStorage throws a SecurityError. A page that reads one at
// its top level (`localStorage.getItem(...)` to restore a pick) then stops before it draws: the
// panel showed half a page. Here, only when that access throws, each one becomes a Storage in
// memory, for this load only: nothing is kept, nothing leaves the page, a working Storage is
// never replaced.
//
// Not covered, still throwing in the sandbox: indexedDB, document.cookie, caches, and anything
// else tied to an origin. A page that needs those still stops where it reads them, as it would
// in any sandboxed frame; a page that wants its picks kept across loads does not get that.
(function () {
  "use strict";
  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      if (window[name]) continue;
    } catch (_) {
      // the sandbox forbids it: the in-memory one below
    }
    const m = new Map();
    const s = {
      getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
      setItem: (k, v) => {
        m.set(String(k), String(v));
      },
      removeItem: (k) => {
        m.delete(String(k));
      },
      clear: () => {
        m.clear();
      },
      key: (i) => [...m.keys()][i] ?? null,
      get length() {
        return m.size;
      },
    };
    try {
      Object.defineProperty(window, name, { value: s, configurable: true, enumerable: true });
    } catch (_) {
      // the browser keeps it unforgeable: the page meets the sandbox's error, as before
    }
  }
})();
