//! The debug area's UI words (see [`super`]: the rules, how to read them):
//! the charts of the desktop's /debug completion (apps/desktop/src/log/
//! Charts.tsx, designer debug-viz v5): a part's role and kind
//! (`bise_proto::log::CompRole`, `CompKind`, one key each), the charts'
//! titles, tips and the list's filter line. Number formats stay TS fns.

crate::words! { debug:
    // ---- a part's role (the first level)
    /// the system prompt, the tool definitions, the params
    role_system = "system";
    /// his words and what bise adds as a user message
    role_user = "user";
    /// the model's text and thinking
    role_assistant = "assistant";
    /// a call the model made
    role_tool_call = "tool call";
    /// what a call gave back
    role_tool_result = "tool result";

    // ---- a part's kind (the second level; a tool is its own name)
    /// the system prompt at the top
    kind_prompt = "system prompt";
    /// the tools' definitions in the request
    kind_tools = "tool definitions";
    /// the model, max_tokens and the other keys
    kind_params = "request params";
    /// a system or developer message among the messages
    kind_mid = "system message";
    /// his own messages
    kind_words = "your words";
    /// another agent's message
    kind_agent_message = "agent message";
    /// the live state bise adds before each call
    kind_bise_state = "bise state";
    /// the agent's role preamble
    kind_preamble = "role preamble";
    /// the compaction's summary and its note
    kind_summary = "compaction summary";
    /// a `[bise]` line
    kind_note = "bise note";
    /// another tagged text (its tag next level)
    kind_tagged = "tagged text";
    /// the model's text, or a user text with no envelope
    kind_text = "text";
    /// the model's thinking
    kind_thinking = "thinking";
    /// an image
    kind_image = "image";
    /// what the classifier does not know; also the rest of a level past its top 7
    kind_other = "other";

    // ---- the charts
    /// the bars' title
    where_title = "where the tokens go";
    /// the bars' total, right of the title
    total_est(total) = "{total} tokens · est.";
    /// the tip of 'est.'
    tip_est = "estimated: bytes / 4, like the list";
    /// the breadcrumb's first level
    crumb_all = "all";
    /// under the bars, while a level below is left
    hint_bars = "a click filters the list and opens the level below";
    /// under the bars, at the last level
    hint_leaf = "a click filters the list · esc up one level";
    /// a bar's tip
    tip_bar(name, tokens, share) = "{name} · {tokens} tokens · {share} of the request";
    /// the histogram's title: what it counts
    sizes_title(what) = "sizes · {what}";
    /// the histogram's axis
    sizes_axis = "tokens, 0 to p99";
    /// under the histogram
    sizes_foot(n, median, over) = one "{n} part · median {median} · {over} over p99 not drawn" | "{n} parts · median {median} · {over} over p99 not drawn";
    /// a bin's tip
    tip_bin(from, to, n) = one "{from}–{to} · {n} part" | "{from}–{to} · {n} parts";
    /// the series' title
    series_title = "per message since the compaction";
    /// before the next peaks under the series' axis
    series_next = "next:";
    /// under the series
    hint_series = "a click on a bar opens its message in the list";
    /// a bar of the series' tip
    tip_message(pos, what, tokens) = "#{pos} · {what} · {tokens} tokens";
    /// the charts' tabs in a narrow window
    tab_tokens = "tokens";
    /// the histogram, in a narrow window
    tab_sizes = "sizes";
    /// the per-message series, in a narrow window
    tab_series = "per message";
    /// a request with no parts (an older hub)
    no_parts = "no chart for this request: its hub is older";

    // ---- the list's filter line
    /// the filter's count
    filtered(shown, total, tokens) = "{shown} of {total} messages · {tokens} tokens";
    /// a size filter's chip
    chip_size(from, to) = "size {from}–{to}";
    /// the tip of a chip's ×
    tip_clear = "clear this filter";
    /// the foot's key words
    key_clear = "clear filter";
    /// v in the foot
    key_charts = "hide the charts";

    // ---- a body the hub cut (debug-more: 'show more' reads it whole)
    /// under a body cut at the page's cap
    cut_at = "cut at 4 KB";
    /// the button that reads a cut body whole
    show_more = "show more";
    /// the button that folds a whole body back to its cut
    show_less = "show less";
    /// while the whole body is read
    reading_whole = "reading the whole text…";
    /// a whole body still cut at the hub's 1 MB cap
    whole_cut(shown, total) = "{shown} of {total} shown";
}
