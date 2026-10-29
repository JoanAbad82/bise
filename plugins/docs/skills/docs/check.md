# Docs check

`doc.check()` in a script, or `bise office check file.docx`, returns a
list of problems: `{ code, severity, at?, message }`. `at`, when there, is
a paragraph anchor (with the quote for a placeholder): `doc.at(at)` gives
you the paragraph to fix.

`error` and `warning`: fix it, or say in your reply why it stays.
`info`: nothing to fix.

| code | severity | what it means | what to do |
|---|---|---|---|
| `placeholder` | warning | the text still says TODO, TBD, lorem ipsum or `[insert …]` | write the real text; if you do not know it, ask in your reply and leave a comment on it instead of the placeholder |
| `heading_skip` | warning | a heading jumps a level (Heading3 after Heading1) | `style("Heading2")` on it, or add the missing level |
| `empty_heading` | warning | a heading with no text | remove it or write it |
| `open_changes` | warning | tracked changes are not accepted or rejected | on his document, often on purpose (he reviews them): say so. On a document you finish: `doc.changes.accept()` your own |
| `table_shape` | warning | a table row with fewer or more cells than the others | `setCell` / `addRow` to even it, or rebuild the table |
| `missing_style` | warning | a paragraph uses a style the file does not define: Word shows it as Normal | `style()` it with one of the SDK's (Title, Heading1-6, ListParagraph, Quote) or the doc's own |
| `missing_list` | warning | a list item points at a list the file does not define: no bullet shows | add it again as `{ kind: "bullet" }` and remove the old one |
| `dangling_comment` | error | the text marks a comment that is not in the comments part: Word may refuse the file | `doc.comments.remove(id)`; if the file came this way, tell the user |
| `orphan_comment` | warning | a comment on no text: Word does not show it | `doc.comments.remove(id)`, or add it again on the right words |
| `empty` | warning | the document has no text | |
| `para_id_renamed` | info | two paragraphs had the same id; one got a new one. A note on the old id still finds its paragraph by its quote | nothing |
| `broken_rel` | error | a part points at a part that is not in the file | if you used `core`, undo it; if the file came that way, tell the user |
| `bad_xml` | error | a part does not parse | the file came damaged; tell the user, do not save over his copy |

## The checks it does not do

`check()` sees structure, not sense. Before you say done, read
`doc.text()` (or the outline) yourself:

- the title and first paragraph say the point;
- the same number is the same everywhere (the summary, the table, the
  text);
- the words in `style.md`'s "no filler" list are not there;
- on his document: only what he asked changed (`doc.changes.list()` shows
  every change you made).

## After the save

`bise office check <file>` on the written file must give the same list as
`doc.check()` before the write. If it shows something new, inspect and
look.
