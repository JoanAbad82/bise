//! The ds area's UI words (see [`super`]: the rules, how to read them):
//! the words of the desktop's shared components (apps/desktop/src/ds), read
//! only there; every page reaches them through those components (architect
//! m_42068, bise fait mac's nm-ds). A word the TUI comes to say too moves
//! to `common` then.

crate::words! { ds:
    /// the '…' button at a row's end and in a bar (ds/more.tsx MoreButton):
    /// its VoiceOver name and its hover tip
    more_actions = "more actions";
    /// a page's search field in the bar (ds/filters.tsx BarSearch): its
    /// placeholder and its VoiceOver name
    search = "search";
    /// the same field's hover tip, with its key
    search_tip(key) = "search · {key}";
    /// the same field's × once it has words: its VoiceOver name
    search_clear = "clear the search";
}
