# Slides check

`deck.check()` in a script, or `bise office check file.pptx`, returns a
list of problems: `{ code, severity, at?, message }`. `at` is a slide or
shape anchor: `deck.at(at)` gives you the thing to fix. The message names
the slide and the shape (`slide 3: "Title 1" (shape 2)`).

`error` and `warning`: fix it, or say in your reply why it stays.
`info`: nothing to fix.

| code | severity | what it means | what to do |
|---|---|---|---|
| `overflow` | error (warning with PowerPoint's shrink-on-overflow) | the text needs more height than its box, or a line that does not wrap is wider than the box | cut words first; then split the slide (`recipes.md`); then make the box taller if there is room. Do not drop body text under 18 pt to make it fit |
| `off_slide` | error (warning when under 10% is out) | a shape is outside the slide, or partly | `move` it inside the 48 pt margin; check `deck.size` |
| `empty_placeholder` | warning | a placeholder with no text: PowerPoint shows "Click to add text" there | fill it, or `remove()` it (a subtitle you do not need) |
| `overlap` | warning | two shapes with text cover each other | move one, or resize; if it is meant (a label on a picture), say so |
| `small_text` | warning | text under 10 pt | 12 pt for sources and footnotes, 18 pt and more for body text |
| `empty_slide` | warning | a slide with nothing on it | remove it, or fill it |
| `broken_image` | error | a picture whose image is missing | `replaceImage(bytes)` or remove the picture |
| `broken_rel` | error | a part points at a part that is not in the file | if you used `core`, undo it; if the deck came that way, tell the user |
| `bad_xml` | error | a part does not parse | the file came damaged; tell the user, do not save over his copy |

`overflow` is an estimate from average letter widths of a sans font: a
narrow or wide font can be off by a line. When it says a box is a few
points short, give it room anyway; the user's PowerPoint may not have
your font.

## The checks it does not do

`check()` sees boxes and text, not sense. Before you say done, look
yourself (`bise office inspect`):

- the titles in order tell the story (read only `text` of each title);
- a slide with more than 5 bullets, or more than one visual;
- numbers that disagree between slides, or with his brief;
- a chart whose categories and values do not match the table it comes
  from;
- a placeholder you filled with a text box on top of it instead of
  `setText` (the empty placeholder shows as `empty_placeholder`, the
  text box sits on it as `overlap`).

## After the save

`bise office check <file>` on the written file must give the same list as
`deck.check()` before the write. If it shows something new, inspect and
look.
