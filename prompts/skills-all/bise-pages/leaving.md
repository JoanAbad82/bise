# bise pages: when the page leaves

Read this when the user says "send it", "post it", "put it in my drafts", "make it a doc".

Acting on the page is a separate step the user asks for, through the usual approvals, never
before their word, never during the first versions:
- take the text from your last published version, in the page's order, with the user's edits
  (they came to you as notes), without the kit's chrome (no frame, no buttons, no "sources" label);
- a `message` block goes as is to its `data-to` channel (Slack markup: `*bold*`, `_italic_`,
  `• ` items, `<url|text>` links); an `email` block through the mail tool, its fields as the
  mail's to, cc, subject;
- a whole page as a doc: headings as headings, tables as tables, each `<sup>n</sup>` as a link to
  its source (or the sources as a list at the end).

## Put it in my drafts

A draft doesn't leave, so it needs no card, but it waits for the user's word like anything else
(their "put it in my drafts", or their `put it in my drafts` / `send` on the block). Then make
the draft in the user's tool, only for the blocks they approved, and record where it went on the
block it came from:

```
sb page publish $TMPDIR/p.html --id <id> --went gmail-draft:<draft id>@e1=<its https link>
```

Kinds: `gmail-draft`, `outlook-draft`, `kit-draft`, `slack`, `copy`. The page then says
`in your Gmail drafts · open` under that block. A later version updates the same draft (read it
back first, the user may have edited it there), never a second one.

- **A mail he finishes in his tool** (a Gmail reply he sends himself): an `email` block with
  `data-verb="draft"`, so its button says `put it in my drafts`, never `send`.
- **A newsletter** (Kit): an `email` block with `data-verb="draft"`,
  `data-to="Kit · newsletter to 1,204 subscribers"`, `to` = `all subscribers · 1,204`, the
  `subject`, a `preview` field, then the body (`<p>`, `<ul>`, links). Keep the subscriber count
  in that kicker, not in the page's heading. On his word: Kit's create-draft with the subject,
  the body as HTML and the preview, then `--went kit-draft:<broadcast id>@nl=<its link in Kit>`:
  the page says `in your Kit drafts · open`. There is no send for Kit: he sends it there. See
  `examples/newsletter.html`.
- **Slack has no drafts**: the user copies (the `message` block's `copy`, with `data-open` for
  the channel's link); a post you made after their approval is `--went slack:<ts>@m1=<its link>`.
- **A tool that fails** (Gmail didn't take the draft): one line in your reply and a `risk`
  callout on the page (`Gmail didn't take it: copy it from here`), never a file path.

Then say where it went in one line (`posted in #team.`) and, when it makes sense, publish a last
version that says so (a `good` callout: `posted in #team, 14:02`).
