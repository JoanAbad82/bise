// bise kit · the office viewer's theme (md-artifact): the theme the viewer was opened with
// (?theme=light|dark: the desktop's side panel passes his pref, apps/desktop Open.tsx themedUrl)
// on <html data-theme>, which tokens.css follows over the system's; none: the system's. kit.js's
// rule (BiseKit.themeOf), for the viewer's shell (pages/artifact/view.rs), which loads no kit.js.
// A classic script, first in <head>: set before the first paint, so no light flash in a dark panel.
(function () {
  var m = /(?:^\?|&)theme=(light|dark)(?:&|$)/.exec(String(location.search || ""));
  if (m) document.documentElement.setAttribute("data-theme", m[1]);
})();
