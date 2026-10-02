# bise pages: feedback into work

Read this for bug reports or feedback from Slack, Linear or mail that agents can fix
("Benjamin's bug reports on Slack: handle them").

- A `review` with `data-verb="start"`, one item per report, its id the ticket's (`ENG-412`) or
  the message's (`s-101`): a first `<p>` `who · where · when`, what they said in a
  `<blockquote>` (linked in the sources), then what you think it is in one or two sentences.
- The kit gives each item `start an agent`, `answer Benjamin` (the reporter's first name) and
  `skip`. "start an agent" is a note to main, who starts the agent with the item as its brief.
- Then the item carries the agent's name: `<li data-id="s-101" data-agent="fix-install-path">`
  (review and checklist items). The kit shows its line live: `∿ fix install path working ·
  reading the installer`, `? … needs you`, `✓ … done`.
- When the agent is done, republish the item with its answer (`fixed in 0.4.2`, the PR) and its
  reply right under it: move the item into its own `review` under an `h2` (`fixed`), followed by
  a `message` block whose `data-to` says the place (`Slack · reply to Benjamin in
  #bise-feedback`); the open items stay in another `review` (`still open`). The message leaves
  only on the user's word: `data-verb="send"` when you can post it yourself (the buttons say
  `send` / `skip`), else `data-open` with the thread's link (`copy` and `open in Slack`).
  `answer Benjamin` on an item: draft that reply now, the same way.
- See `examples/feedback-bridge.html`.
