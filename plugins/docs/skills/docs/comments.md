# Comments and tracked changes

Word's own review tools, in the file: what the user sees in Word's
margin and in the viewer. They are not bise's notes (those come to you
as `<artifact-notes>`, see `SKILL.md`).

## Comments

```ts
const c = doc.at(anchor).comment("Source? The finance export says 978.");     // on the anchor's quote
doc.at(anchor).comment("Too long", { quote: "in order to" });                 // on given words
doc.comments.add(anchor, "Check with Lea");                                   // the same as at(anchor).comment
doc.comments.list();       // [{ id, author, date, text, para, quote, replyTo?, done }]
doc.comments.reply(c.id, "Fixed in v3.");
doc.comments.resolve(c.id);          // marks it done; resolve(id, false) opens it again
doc.comments.remove(c.id);           // the comment and its replies' marks
```

- A comment sits on words (`quote`) or a whole paragraph. Put it on the
  fewest words that carry the point.
- `author` is the doc's `author` (`docs.open(bytes, { author })`).
- A reply has `replyTo`; `list()` gives replies after their parent.

## Tracked changes

```ts
doc.tracking = true;                         // every edit after this is tracked
doc.at(a).replace("30 days", "45 days");     // a deletion and an insertion
doc.at(b).remove({ track: true });           // or per edit
doc.changes.list();       // [{ id, kind: "insert" | "delete" | ..., author, date, text, para }]
doc.changes.accept();     // all; returns how many
doc.changes.accept(["4", "5"]);
doc.changes.reject("6");
```

- With tracking on, `text` and `find` read the text with the changes in
  (what it says once accepted).
- Accept or reject only what the user asked you to: changes by someone
  else are his to settle. Your own, in a document you were asked to
  finish clean: accept them before the last save, so `check()` has no
  `open_changes`.

## Reviewing a document he sends

He asks "review this contract" or "comment on the draft": he wants your
remarks in the file, his text untouched.

1. `cp` the file into `$TMPDIR`, `bise office inspect` it, read
   `doc.text()` whole before writing any comment.
2. One comment per point, on the words it is about. Say what is wrong
   and what you would write instead, in one or two sentences. No praise
   comments, no "consider revising".
3. A fix that is only words (a typo, a wrong number you are sure of): a
   tracked change rather than a comment, so he accepts it in one click.
4. Save as a new artifact (`{ artifact: true }`) and reply with the count
   and the three that matter most: `12 comments, 4 tracked fixes. The
   ones that matter: the notice period (section 2), the missing cap on
   damages (5.3), the date in the signature block.`

## Answering comments others left

`doc.comments.list()` shows them, with `done`. For each one you act on:
make the edit (tracked if the doc is someone else's), then
`reply(id, "Done: …")` and, if the user asked you to close them,
`resolve(id)`. One you will not act on: reply why, leave it open.
