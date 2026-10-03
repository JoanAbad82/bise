# bise ambient v2: the dogfood day

Gabriel uses ambient for his real work for a day, on his real accounts, by his own choice (his
yes via main, m_6212), on the try build at 87151ebf (the home workspace `~/bise`).

**What is logged, and only that** (ambient-lead m_6218): from his ambient hub, read-only, his own
asks (his words, typed or heard) and their times; pages (ids, versions and their times, which
version he opened, notes by kind); cards (id, kind, page, opened, how they closed); sends counted.
Never a page body, a mail, a message, a card's text or main's answers. Nothing is ever sent,
answered, published or started on his hub by QA. The moments he went back to the terminal or the
browser are what he tells main.

## The day

Morning on the home hub (`bise-ee0313fb`, build 87151ebf). From 08:28, after main switched his
ambient to this repo's hub (build de8a9c20), the log reads that hub. There, his asks to main also
include his terminal work of the day (subscriptions), which was not done through ambient. The log
does not say whether an ask was typed or spoken.

| time | his ask | main's line | page first / v1 | notes | cards (how closed) | sends |
|---|---|---|---|---|---|---|
| 08:11 | (start-here, opened by the app) | - | start-here v1 08:11:08, 2 versions, he opened v1 | 1 note | - | 0 |
| 08:12:42 | his note on start-here asks for a weekly update | - | weekly-update +24 s / v1 +37 s, 3 versions, he opened v2 | 1 note | #1 (main) answered, #2 (main) answered | 0 |
| 08:22:17 | a spoken line that came out as a misheard fragment, with his screen | - | none | - | #3 (main) left open | 0 |
| 08:22:22 | "Tu m'entends ou pas ?" with his screen | - | none | - | - | 0 |
| 22:21 | - | - | - | - | #387 (main) answered | 0 |
| 22:26:41 | his verdict, typed with a screenshot (see below) | - | none | - | - | 0 |

## Where he went back to the terminal or the browser

| time | what for | why ambient didn't do it |
|---|---|---|
| 08:22 | asking main if it hears him | two spoken asks gave no page and no clear line back; he checked the hearing by hand |
| 15:02-16:54 | the subscriptions work (ChatGPT/Claude plans) with main | code work in this repo: the terminal is its place, so not an ambient miss |
| 22:26 | his verdict to main, typed in the terminal with a screenshot | the capsule's buttons took no click, so he couldn't answer there; holding fn with the capsule closed did nothing, so he couldn't speak |

## What he hit (main m_6474, 22:26)

His words, in short: the ambient UI is broken, the layout is wrong. The pearl must always show
with no background, next to any interface; in a square with a background it isn't pretty. The
capsule's buttons can't be clicked (a bug). Holding fn to speak while the ambient UI was closed
didn't bring up the pearl. Direction: Spotlight-like, lots of keyboard shortcuts, as polished as
Apple's Siri. From main's read of his screenshot: the card's options showed twice (in the
question's text as one paragraph, and as buttons), and the buttons were big blocks with labels
wrapped onto several lines.

## What it says

The checks for each of these are in [ambient-qa.md](ambient-qa.md) ("What he hit on the dogfood
day"). They gate his next try.

1. **The capsule's buttons take no real click.** amb-mac (the panel's mouse events, first click)
   and amb-web (hit areas). Our QA answered cards through the QA socket, so it never saw this: QA
   now clicks through the window server.
2. **fn from rest does nothing.** amb-mac: holding fn must bring up the pearl and listen from
   anywhere, with any app frontmost, the capsule closed.
3. **Card layout.** amb-web (compact one-line option rows) and amb-core (the options leave the
   question's text).
4. **The pearl in a box.** amb-web and amb-mac: a transparent window, the pearl next to the
   interface, never inside it.
5. **The direction.** ambient's round 9 (Spotlight-like, keyboard first with the shortcuts shown,
   Siri-level polish), then his yes, then the build through ambient-lead.
