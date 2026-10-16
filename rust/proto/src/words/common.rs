//! The words two areas read, and only those (see [`super`]: the commit that
//! puts one here names the two areas).

crate::words! { common:
    /// stop an agent's alarm: /scheduled's key bar (scheduled) and the
    /// desktop right bar's alarm detail (panel)
    stop_watching = "stop watching";
    /// a sign-in under way in his browser: settings · models and the thread
    /// of an agent its expiry stopped (settings, thread)
    signing_wait(label) = "waiting for you to sign in to {label} in your browser…";
    /// a count of what waits: the TUI header's agents (panel), the
    /// desktop block's and strip's items and the TUI box's border (inbox)
    count_waiting(n) = "{n} waiting";
    /// a count of what waits on him: the desktop sidebar's pink count's
    /// tip (panel), the TUI box's border (inbox)
    waiting_for_you(n) = "{n} waiting for you";
}
