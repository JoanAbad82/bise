// ESLint plugin `bise-testid` (guarantee 4: stable test ids). Checks read the app only through
// `data-testid`, so every element a person can act on has one, named `<area>.<thing>[.<id>]`.
//
//   bise-testid/name      a literal id (data-testid="…", testId="…", or the static start of a
//                         template `composer.chip.${id}`) is lowercase kebab parts joined by dots,
//                         at least <area>.<thing>, and its area is one of AREAS
//   bise-testid/present   an element a person can act on carries an id: a native button, input,
//                         textarea, select, a link, anything with a click/key/change handler, an
//                         interactive role or contentEditable needs data-testid; a component given
//                         such a handler needs testId (or data-testid). A spread ({...p}) may carry
//                         it, so it counts as present.
//
// Wire it in eslint.config.mjs: `import testid from './tests/harness/lint/testid.mts'` then
// { files: ['src/**/*.tsx'], plugins: { 'bise-testid': testid }, rules: { 'bise-testid/name': 'error', 'bise-testid/present': 'error' } }.
// The list of ids in use: `node --experimental-strip-types tests/harness/lint/testids.mts`.

// The JSX nodes the rules read (ESLint's own types stop at ESTree, JSX is the parser's)
type Literal = { type: 'Literal'; value: unknown };
type Template = { type: 'TemplateLiteral'; quasis: { value: { cooked?: string | null } }[]; expressions: unknown[] };
type Expression = Literal | Template | { type: 'Other' };
type AttrValue = Literal | { type: 'JSXExpressionContainer'; expression: Expression } | null;
type JSXAttribute = { type: 'JSXAttribute'; name: { type: string; name?: string }; value: AttrValue };
type JSXAttr = JSXAttribute | { type: 'JSXSpreadAttribute' };
type JSXOpeningElement = { type: 'JSXOpeningElement'; name: { type: string; name?: string }; attributes: JSXAttr[] };
type ImportDeclaration = { type: 'ImportDeclaration'; source: { value: unknown }; specifiers: { local: { name: string } }[] };
/** What a rule's create() uses of ESLint's context. */
type Context = { report(d: { node: object; message: string }): void };

/** The first part of every id: the screen or chunk it belongs to (the src/ folders, plus shared parts). */
export const AREAS = [
  'app', 'composer', 'spotlight', 'pearl', 'thread', 'inbox', 'agents', 'review', 'setup', 'settings',
  'ds', 'sidebar', 'panel', 'menu', 'find', 'keys', 'capsule', 'card', 'fixture', 'lab',
];

// the area: lowercase kebab-case; the parts after it may also hold '_' (a pref key, an id from data)
const AREA = '[a-z0-9]+(?:-[a-z0-9]+)*';
const PART = '[a-z0-9_]+(?:-[a-z0-9_]+)*';
export const ID_RE = new RegExp(`^${AREA}(?:\\.${PART})*$`);
const PREFIX_RE = new RegExp(`^${AREA}(?:\\.${PART})*\\.?$`);

/**
 * Why a literal id is wrong, or null when it's fine (pure; self/lint.spec.ts). A known area alone
 * names a surface's root (testId="composer": its parts become composer.<x> through sub()).
 */
export function badId(id: string, { prefix = false } = {}): string | null {
  const ok = prefix ? PREFIX_RE.test(id) : ID_RE.test(id);
  if (!ok) return `'${id}' is not <area>.<thing>[.<id>] (lowercase parts, dots between, '-' or '_' inside a part after the area)`;
  const area = id.split('.')[0] ?? '';
  if (!AREAS.includes(area)) return `'${id}': unknown area '${area}' (one of ${AREAS.join(', ')}; ask amb-tools to add one)`;
  return null;
}

const INTERACTIVE_TAGS = new Set(['button', 'input', 'textarea', 'select', 'a', 'summary']);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'tab', 'checkbox', 'radio', 'switch', 'textbox', 'combobox', 'slider']);
const HANDLERS = new Set(['onClick', 'onMouseDown', 'onPointerDown', 'onKeyDown', 'onChange', 'onInput', 'onDoubleClick', 'onDrop']);
const ID_ATTRS = new Set(['data-testid', 'testId']);

const attrName = (a: JSXAttr): string | null => (a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' ? a.name.name ?? null : null);
const literalOf = (a: JSXAttribute): { text: string; prefix: boolean } | null => {
  const v = a.value;
  if (!v) return null;
  if (v.type === 'Literal' && typeof v.value === 'string') return { text: v.value, prefix: false };
  if (v.type === 'JSXExpressionContainer') {
    const e = v.expression;
    if (e.type === 'Literal' && typeof e.value === 'string') return { text: e.value, prefix: false };
    if (e.type === 'TemplateLiteral' && e.quasis.length > 0) {
      const head = e.quasis[0]?.value.cooked ?? '';
      return e.expressions.length === 0 ? { text: head, prefix: false } : { text: head, prefix: true };
    }
  }
  return null;
};

const nameRule = {
  meta: { type: 'problem' as const, docs: { description: 'data-testid / testId values are <area>.<thing>[.<id>]' }, schema: [] },
  create(context: Context) {
    return {
      JSXAttribute(node: JSXAttribute) {
        if (!ID_ATTRS.has(attrName(node) ?? '')) return;
        const lit = literalOf(node);
        if (!lit || (lit.prefix && lit.text === '')) return;
        const why = badId(lit.text, { prefix: lit.prefix });
        if (why) context.report({ node, message: why });
      },
    };
  },
};

const presentRule = {
  meta: { type: 'problem' as const, docs: { description: 'what a person can act on carries a test id' }, schema: [] },
  create(context: Context) {
    // components imported from a package (Lexical, a virtual list...) can't take testId: the
    // element our code wraps around them carries it
    const foreign = new Set<string>();
    return {
      ImportDeclaration(node: ImportDeclaration) {
        const from = String(node.source.value);
        if (from.startsWith('.') || from.startsWith('@/')) return;
        for (const s of node.specifiers) foreign.add(s.local.name);
      },
      JSXOpeningElement(node: JSXOpeningElement) {
        if (node.name.type !== 'JSXIdentifier' && node.name.type !== 'JSXMemberExpression') return;
        const tag = node.name.type === 'JSXIdentifier' ? node.name.name ?? '' : '';
        if (node.name.type === 'JSXMemberExpression' || foreign.has(tag)) return;
        const native = /^[a-z]/.test(tag);
        const attrs = node.attributes;
        if (attrs.some((a) => a.type === 'JSXSpreadAttribute')) return;
        const names = new Set(attrs.map(attrName).filter(Boolean));
        if ([...ID_ATTRS].some((n) => names.has(n))) return;
        const roleAttr = attrs.find((a): a is JSXAttribute => attrName(a) === 'role');
        const role = roleAttr ? literalOf(roleAttr)?.text : undefined;
        const acts = [...HANDLERS].some((h) => names.has(h))
          || (native && INTERACTIVE_TAGS.has(tag))
          || (role !== undefined && INTERACTIVE_ROLES.has(role))
          || names.has('contentEditable');
        if (!acts) return;
        context.report({ node, message: native ? `<${tag}> can be acted on: give it data-testid="<area>.<thing>"` : `<${tag}> gets a handler: give it testId="<area>.<thing>"` });
      },
    };
  },
};

export default { meta: { name: 'bise-testid' }, rules: { name: nameRule, present: presentRule } };
