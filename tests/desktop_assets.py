#!/usr/bin/env python3
"""Where a changed desktop file the coverage map can't see goes (fast-try p2, pick-assets; plan
signed by review-gates m_34815). tests/test_map.py desktop-pick is its one caller: for a path
under apps/desktop/src/ that the map doesn't list (V8 never sees CSS, a type-only module, a module
only the vitest tests import, the hero build), this says which harness checks it can reach, from
the NEW tree's static import graph, or None: ALL. Pure: the caller reads the tree and the map.

The kinds, each with its guards (anything else, or a guard that fails, is ALL):
  - a .css: up its importers (through CSS @import chains) to the JS modules that import it; every
    one must be a module the map lists in the renderer, and the map must have "loads" from every
    night of its union. Its checks: the checks that LOADED the bundle holding an importer (CSS is
    global once its chunk loads: a rule can restyle a class any other file renders). No importer,
    an HTML importer, a harness, shared or unknown importer: ALL;
  - a type-only .ts (its transpile, with the app's tsconfig, emits no JS): no check (no bundle
    byte changes). The caller says which emit nothing ("emits"); unknown: ALL;
  - a .ts only the vitest tests reach: every importer, up the graph, is a vitest file or another
    unlisted module only vitest files reach; no importer at all, a listed one, a harness file, an
    HTML entry or any non-literal import() / import.meta.glob in the tree: ALL;
  - the hero build (apps/desktop/hero.vite.config.ts, src/hero/**): the checks that name it; ALL
    when a mapped file is under src/hero/, a file outside src/hero/ imports one in it, or the
    harness or electron.vite.config.ts names the hero build.

  python3 tests/desktop_assets.py --self-test
"""
import os
import posixpath
import re

APP = "apps/desktop/"
SRC = APP + "src/"
HERO = SRC + "hero/"
HERO_CONFIG = APP + "hero.vite.config.ts"
TESTS = APP + "tests/"
VITEST = re.compile(r"^apps/desktop/src/(.*\.test\.tsx?|test-setup\.ts)$")
EXTS = (".ts", ".tsx", ".mts", ".js", ".mjs", ".jsx")
CODE = EXTS + (".css", ".html")
# the words that name the hero build (a check or the harness that runs it)
HERO_WORDS = ("hero.vite.config", "build:hero", "site/desktop/hero", "src/hero/", "@/hero/")

# ---- the import graph
_JS_FROM = re.compile(r"""(?:^|[;\s}])(?:import|export)\b[^'"`;]*?\bfrom\s*(['"])([^'"]+)\1""", re.M)
_JS_BARE = re.compile(r"""(?:^|[;\s])import\s*(['"])([^'"]+)\1""", re.M)
_JS_DYN = re.compile(r"""\b(?:import|require)\s*\(\s*(['"])([^'"]+)\1\s*\)""")
_JS_URL = re.compile(r"""new\s+URL\(\s*(['"])([^'"]+)\1\s*,\s*import\.meta\.url""")
_JS_DYN_ANY = re.compile(r"""\b(?:import|require)\s*\(\s*(?!['"\s])|\bimport\.meta\.glob""")
_JS_TYPE = re.compile(r"""(?:^|[;\s])(?:import|export)\s+type\b""")
_CSS_IMPORT = re.compile(r"""@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1""")
_HTML_REF = re.compile(r"""<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*(['"])([^'"]+)\1""", re.I)
_COMMENT = re.compile(r"/\*.*?\*/|(?<![:'\"\\])//[^\n]*", re.S)


def specifiers(path, text):
    """The specifiers a file imports (JS, CSS @import, HTML script/link), in order."""
    if path.endswith(".css"):
        return [m.group(2) for m in _CSS_IMPORT.finditer(re.sub(r"/\*.*?\*/", "", text, flags=re.S))]
    if path.endswith(".html"):
        return [m.group(2) for m in _HTML_REF.finditer(text)]
    t = _COMMENT.sub(" ", text)
    out = []
    for rx in (_JS_FROM, _JS_BARE, _JS_DYN, _JS_URL):
        out += [m.group(2) for m in rx.finditer(t)]
    return out


def dynamic(path, text):
    """Whether a JS file has an import() / require() / import.meta.glob the graph can't follow."""
    return path.endswith(EXTS) and bool(_JS_DYN_ANY.search(_COMMENT.sub(" ", text)))


def resolve(importer, spec, exists):
    """The repo path a specifier names, None for a package (or a URL)."""
    s = spec.split("?", 1)[0].split("#", 1)[0]
    if s.startswith("@/"):
        base = SRC + s[2:]
    elif s.startswith("./") or s.startswith("../"):
        base = posixpath.normpath(posixpath.join(posixpath.dirname(importer), s))
    elif s.startswith("/") and importer.endswith(".html"):
        base = posixpath.normpath(posixpath.dirname(importer) + s)
    else:
        return None
    for c in (base,) + tuple(base + e for e in EXTS) + tuple(base + "/index" + e for e in EXTS):
        if exists(c):
            return c
    # .js written for a .ts source (TS's ESM style)
    if base.endswith(".js") and exists(base[:-3] + ".ts"):
        return base[:-3] + ".ts"
    return base  # unresolved: still an edge to that path (a deleted or missing file)


def graph(texts):
    """texts: {repo path: text} of the tree's code files. (importers: {path: set of paths that import
    it}, fwd: {path: set of paths it imports}, dyn: sorted files with an import the graph can't follow)."""
    imp, fwd, dyn = {}, {}, []
    exists = texts.__contains__
    for p, t in texts.items():
        if not p.endswith(CODE):
            continue
        for s in specifiers(p, t):
            r = resolve(p, s, exists)
            if r and r != p:
                imp.setdefault(r, set()).add(p)
                fwd.setdefault(p, set()).add(r)
        if dynamic(p, t) and not VITEST.match(p):
            dyn.append(p)
    return imp, fwd, sorted(dyn)


def hero_guard(known, importers, texts):
    """Why the hero build can't be placed (ALL), or None."""
    on = [f for f in known if f.startswith(HERO)]
    if on:
        return "the app's bundles hold a hero file (%s)" % on[0]
    for f, by in sorted(importers.items()):
        if not f.startswith(HERO) and f != HERO_CONFIG:
            continue
        out = sorted(i for i in by if not i.startswith(HERO) and not VITEST.match(i))
        if out:
            return "%s imports the hero's %s" % (out[0], f)
    for p, t in sorted(texts.items()):
        if (p.startswith(TESTS + "harness/") or p == APP + "electron.vite.config.ts") and any(w in t for w in HERO_WORDS):
            return "%s names the hero build" % p
    return None


# the app's entries (electron.vite.config.ts): the renderer's html, the main process, the preload
ENTRIES = (SRC + "main/index.ts", SRC + "main/preload.ts")


def unreached(fwd, texts, mapped):
    """The mapped files the static graph doesn't reach from the app's entries, sorted: a missed
    edge would hide a bundled importer, so any of them makes every placement ALL (review-gates
    m_34909: the graph proves it sees what V8 saw)."""
    todo = [p for p in texts if p.startswith(SRC + "renderer/") and p.endswith(".html")]
    todo += [p for p in ENTRIES if p in texts]
    seen = set()
    while todo:
        f = todo.pop()
        if f in seen:
            continue
        seen.add(f)
        todo.extend(fwd.get(f, ()))
    return sorted(f for f in mapped if f.startswith(SRC) and f not in seen)


class Tree:
    """The new tree's facts desktop-pick needs: its graph, the hero's guard and checks, which of the
    changed .ts emit no JS. texts: {repo path: text}; emits: {path: True|False} (absent: unknown);
    specs: the checks' spec paths; known, shared: the map's files and shared files."""

    def __init__(self, texts, emits, specs, known, shared=()):
        self.texts = texts
        self.importers, fwd, self.dyn = graph(texts)
        self.unreached = unreached(fwd, texts, set(known) | set(shared))
        self.emits = emits
        self.hero_why = hero_guard(known, self.importers, texts)
        self.hero_checks = {s for s in specs if any(w in texts.get(s, "") for w in HERO_WORDS)}


def loaders(cov):
    """{file: set of checks (apps/desktop/tests/...) that loaded its bundle}, or None when the map
    lacks "loads" from any of its nights (review-gates m_34815 #1)."""
    if cov.get("loads") is not True:
        return None
    files, out = cov["files"], {}
    for c, e in cov["checks"].items():
        for i in e.get("loads") or ():
            out.setdefault(files[i], set()).add(APP + "tests/" + c)
    return out


def place(p, tree, cov, shared):
    """(checks, why) for a changed path the map doesn't list, or (None, why): ALL."""
    if tree is None:
        return None, "%s: the map doesn't know it (new, renamed, type-only or an asset V8 can't see)" % p
    known = set(cov["files"])
    if tree.unreached:
        return None, "%s: the import graph misses %d files V8 saw (%s)" % (p, len(tree.unreached), tree.unreached[0])
    if p == HERO_CONFIG or p.startswith(HERO):
        if tree.hero_why:
            return None, "%s: the hero build, but %s" % (p, tree.hero_why)
        return set(tree.hero_checks), "%s: the hero build, %d checks name it" % (p, len(tree.hero_checks))
    if p not in tree.texts:
        return None, "%s: the map doesn't know it and it's gone from the tree" % p
    if p.endswith(".css"):
        return place_css(p, tree, cov, known, shared)
    if p.endswith(EXTS):
        if tree.emits.get(p) is False:
            return set(), "%s: type-only (its transpile emits no JS)" % p
        return place_vitest_only(p, tree, known, shared)
    return None, "%s: the map doesn't know it (an asset V8 can't see)" % p


def place_css(p, tree, cov, known, shared):
    load = loaders(cov)
    if load is None:
        return None, "%s: a css, but the map has no loads from every night" % p
    picked, mods, todo, seen = set(), [], [p], set()
    while todo:
        c = todo.pop()
        if c in seen:
            continue
        seen.add(c)
        by = sorted(i for i in tree.importers.get(c, ()) if not VITEST.match(i))
        if not by:
            return None, "%s: a css no module imports (%s)" % (p, c)
        for i in by:
            if i.endswith(".css"):
                todo.append(i)
            elif i.startswith(HERO):
                if tree.hero_why:
                    return None, "%s: imported by the hero's %s, but %s" % (p, i, tree.hero_why)
                picked |= tree.hero_checks
                mods.append(i)
            elif i in shared:
                return None, "%s: imported by shared code (%s)" % (p, i)
            elif i in known and i.startswith(SRC) and i.endswith(EXTS):
                picked |= load.get(i, set())
                mods.append(i)
            else:
                return None, "%s: imported by %s, which the map doesn't place" % (p, i)
    return picked, "%s: a css, %d checks loaded its %d importers" % (p, len(picked), len(mods))


def place_vitest_only(p, tree, known, shared):
    if tree.dyn:
        return None, "%s: the map doesn't know it, and %s has an import the graph can't follow" % (p, tree.dyn[0])
    todo, seen, tests = [p], set(), 0
    while todo:
        f = todo.pop()
        if f in seen:
            continue
        seen.add(f)
        by = sorted(tree.importers.get(f, ()))
        if not by:
            return None, "%s: the map doesn't know it and no vitest file reaches it (%s has no importer)" % (p, f)
        for i in by:
            if VITEST.match(i):
                tests += 1
            elif i in known or i in shared:
                return None, "%s: the map doesn't know it, yet %s (in the app's bundles) imports %s" % (p, i, f)
            elif i.startswith(SRC) and i.endswith(EXTS) and not i.startswith(HERO):
                todo.append(i)
            else:
                return None, "%s: the map doesn't know it, and %s imports %s" % (p, i, f)
    return set(), "%s: only vitest files reach it (%d imports)" % (p, tests)


# ---- the tree (the CLI's): its code files, from a commit or the working tree
def tree_paths(paths):
    return [p for p in paths if p.startswith(APP) and p.endswith(CODE) and "/node_modules/" not in p
            and not p.startswith(APP + "out/")]


def emits_js(root, sources):
    """{path: whether its transpile emits JS} for sources {path: text}, with the app's tsconfig.web
    options (verbatimModuleSyntax: a kept import is JS); {} when node or typescript can't say."""
    import json
    import subprocess
    if not sources:
        return {}
    script = r"""
const ts = require(require.resolve('typescript', { paths: [process.argv[1]] }));
const cfg = ts.readConfigFile(process.argv[1] + '/tsconfig.web.json', ts.sys.readFile);
const opts = ts.parseJsonConfigFileContent(cfg.config, ts.sys, process.argv[1]).options;
const src = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const out = {};
for (const [p, text] of Object.entries(src)) {
  const js = ts.transpileModule(text, { compilerOptions: { ...opts, sourceMap: false, declaration: false, composite: false }, fileName: p }).outputText;
  out[p] = js.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '').replace(/export\s*\{\s*\}\s*;?/g, '').trim() !== '';
}
console.log(JSON.stringify(out));
"""
    try:
        r = subprocess.run(["node", "-e", script, os.path.join(root, "apps", "desktop")], input=json.dumps(sources),
                           capture_output=True, text=True, timeout=60)
        got = json.loads(r.stdout) if r.returncode == 0 else {}
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return {}
    return {p: v for p, v in got.items() if isinstance(v, bool)}


# ---- self-test: a fake tree (review-gates m_34815: each mutation red-then-green)
def self_test():
    files = [SRC + "app/A.tsx", SRC + "app/B.tsx", SRC + "main/index.ts", SRC + "bims/Office.tsx"]
    X, Y, Z = TESTS + "checks/x.spec.ts", TESTS + "checks/y.spec.ts", TESTS + "checks/z.spec.ts"

    def cov(loads=True, **kw):
        c = {"files": files, "shared": [SRC + "main/index.ts"], "loads": loads,
             "checks": {"checks/x.spec.ts": {"covered": [0], "imports": [], "loads": [0]},
                        "checks/y.spec.ts": {"covered": [1], "imports": [], "loads": [1, 3]},
                        "checks/z.spec.ts": {"covered": [], "imports": [], "loads": [3]}}}
        c.update(kw)
        return c
    base = {
        SRC + "renderer/index.html": '<script type="module" src="./main.tsx"></script>',
        SRC + "renderer/main.tsx": "import '../app/A';\nimport '../app/B';\nimport '@/bims/Office';\n",
        SRC + "bims/Office.tsx": "export const O = 1;\n",
        SRC + "app/A.tsx": "import './a.css';\nimport { T } from '@/app/types';\nexport const A = 1;\n",
        SRC + "app/a.css": "@import './b.css';\n.a { color: red }\n",
        SRC + "app/b.css": ".b { color: blue }\n",
        SRC + "app/B.tsx": "import type { T } from './types';\nexport const B = 2;\n",
        SRC + "app/types.ts": "export interface T { a: number }\n",
        SRC + "bims/coplanar.ts": "import { Box3 } from 'three';\nexport const clash = () => new Box3();\n",
        SRC + "bims/coplanar.test.ts": "import { clash } from './coplanar';\n",
        SRC + "main/index.ts": "import './main.css';\n",
        SRC + "main/main.css": "body {}\n",
        SRC + "hero/entry.ts": "import './hero.css';\nimport { A } from '../app/A';\n",
        SRC + "hero/hero.css": ".h {}\n",
        SRC + "hero/index.html": '<link rel="stylesheet" href="./hero.css"><script type="module" src="./entry.ts"></script>',
        TESTS + "harness/launch.ts": "export const go = 1;\n",
        X: "import { go } from '../harness/launch';\n", Y: "", Z: "",
        SRC + "renderer/lone.css": ".l {}\n",
        SRC + "renderer/linked.css": ".k {}\n",
        SRC + "renderer/page.html": '<link rel="stylesheet" href="./linked.css">',
    }
    emits = {SRC + "app/types.ts": False, SRC + "bims/coplanar.ts": True}

    def pick(p, texts=None, c=None, em=None):
        cv = c or cov()
        t = Tree(base if texts is None else texts, emits if em is None else em, [X, Y, Z], set(cv["files"]), cv["shared"])
        return place(p, t, cv, set(cv["shared"]))

    def mut(**kw):
        t = dict(base)
        for k, v in kw.items():
            t[k] = v
        return t
    # graph basics
    assert resolve(SRC + "app/A.tsx", "@/app/types", base.__contains__) == SRC + "app/types.ts"
    assert resolve(SRC + "app/A.tsx", "./a.css?inline", base.__contains__) == SRC + "app/a.css"
    assert resolve(SRC + "app/A.tsx", "react", base.__contains__) is None
    assert specifiers("x.ts", "// import './no'\nimport x from \"./y\"; export * from './z'; await import('./w');") == ["./y", "./z", "./w"]
    assert specifiers("x.css", "/* @import './no'; */ @import url(./c.css); @import \"d.css\";") == ["./c.css", "d.css"]
    # the graph reaches every mapped file; a missed edge (an import hidden behind a stray '/*' in a
    # string) leaves one unreached: every placement ALL (review-gates m_34909)
    assert Tree(base, emits, [], set(files), [SRC + "main/index.ts"]).unreached == []
    hidden = mut(**{SRC + "renderer/main.tsx": "const g = '/*';\nimport '../app/A';\nconst e = '*/';\nimport '../app/B';\nimport '@/bims/Office';\n"})
    assert Tree(hidden, emits, [], set(files), [SRC + "main/index.ts"]).unreached == [SRC + "app/A.tsx"]
    assert pick(SRC + "bims/coplanar.ts", hidden)[0] is None and "misses 1" in pick(SRC + "bims/coplanar.ts", hidden)[1]
    assert pick(SRC + "app/types.ts", hidden)[0] is None and pick(HERO_CONFIG, hidden)[0] is None
    # a css: the checks that loaded its importer, through an @import chain too
    assert pick(SRC + "app/a.css") == ({X}, pick(SRC + "app/a.css")[1]), pick(SRC + "app/a.css")
    assert pick(SRC + "app/b.css")[0] == {X}
    # mutation: the import edge removed: ALL (a.css and, through it, b.css)
    cut = mut(**{SRC + "app/A.tsx": "export const A = 1;\n"})
    assert pick(SRC + "app/a.css", cut)[0] is None and "no module imports" in pick(SRC + "app/a.css", cut)[1]
    assert pick(SRC + "app/b.css", cut)[0] is None
    # the import moved to a module the map doesn't list: ALL
    moved = mut(**{SRC + "app/A.tsx": "export const A = 1;\n", SRC + "app/New.tsx": "import './a.css';\n"})
    assert pick(SRC + "app/a.css", moved)[0] is None and "doesn't place" in pick(SRC + "app/a.css", moved)[1]
    # the map lacks loads from one of its nights: ALL
    assert pick(SRC + "app/a.css", c=cov(loads=False))[0] is None
    # an HTML importer, shared code, a css nobody imports: ALL
    assert pick(SRC + "renderer/linked.css")[0] is None
    assert pick(SRC + "main/main.css")[0] is None and "shared" in pick(SRC + "main/main.css")[1]
    assert pick(SRC + "renderer/lone.css")[0] is None
    # a check that loaded the bundle without running the importer is picked (CSS is global)
    office = mut(**{SRC + "bims/Office.tsx": "import './office.css';\n", SRC + "bims/office.css": ".o {}\n"})
    assert pick(SRC + "bims/office.css", office)[0] == {Y, Z}
    # a type-only module: no check; its emit unknown or not empty: not type-only
    assert pick(SRC + "app/types.ts") == (set(), pick(SRC + "app/types.ts")[1])
    assert pick(SRC + "app/types.ts", em={})[0] is None
    # vitest-only: no check; mutation: a bundled module imports it -> ALL; a harness file -> ALL
    assert pick(SRC + "bims/coplanar.ts")[0] == set()
    reach = mut(**{SRC + "app/B.tsx": "import { clash } from '../bims/coplanar';\n"})
    assert pick(SRC + "bims/coplanar.ts", reach)[0] is None
    harn = mut(**{TESTS + "harness/launch.ts": "import { clash } from '../../src/bims/coplanar';\n"})
    assert pick(SRC + "bims/coplanar.ts", harn)[0] is None
    # through an unlisted module only a test reaches: still vitest-only; that module bundled: ALL
    mid = mut(**{SRC + "bims/coplanar.test.ts": "import './mid';\n", SRC + "bims/mid.ts": "import './coplanar';\nexport const m = 1;\n"})
    assert pick(SRC + "bims/coplanar.ts", mid)[0] == set()
    # a non-literal import() anywhere: ALL; nothing imports it: ALL
    dyn = mut(**{SRC + "app/B.tsx": "const m = 'x'; import(m);\n"})
    assert pick(SRC + "bims/coplanar.ts", dyn)[0] is None and "can't follow" in pick(SRC + "bims/coplanar.ts", dyn)[1]
    orphan = mut(**{SRC + "bims/coplanar.test.ts": ""})
    assert pick(SRC + "bims/coplanar.ts", orphan)[0] is None
    # the hero build: its checks (none name it); its css too
    assert pick(HERO_CONFIG)[0] == set() and pick(SRC + "hero/hero.css")[0] == set()
    assert pick(SRC + "hero/entry.ts")[0] == set()
    # a check that names the hero build is picked
    named = mut(**{Z: "// runs `pnpm build:hero`\n"})
    assert pick(HERO_CONFIG, named)[0] == {Z}
    # the guards: an app file imports the hero, the harness names it, a mapped hero file: ALL
    for t in (mut(**{SRC + "app/B.tsx": "import '@/hero/entry';\n"}),
              mut(**{TESTS + "harness/launch.ts": "spawn('pnpm', ['build:hero'])\n"}),
              mut(**{APP + "electron.vite.config.ts": "input: 'src/hero/index.html'\n"})):
        assert pick(HERO_CONFIG, t)[0] is None, pick(HERO_CONFIG, t)
    assert pick(HERO_CONFIG, c=cov(files=files + [SRC + "hero/entry.ts"]))[0] is None
    # a file gone, an asset, no tree: ALL
    assert pick(SRC + "app/gone.css")[0] is None
    assert pick(SRC + "app/pic.svg", mut(**{SRC + "app/pic.svg": "<svg/>"}))[0] is None
    assert place(SRC + "app/a.css", None, cov(), set())[0] is None
    print("desktop_assets self-test: ok")


if __name__ == "__main__":
    import sys
    if sys.argv[1:] == ["--self-test"]:
        self_test()
    else:
        print(__doc__)
        sys.exit(2)
