//! An agent's turn edges, read from its hub row (issue 22): pure, so the
//! state reader (sb/feed_entries.rs `agent_row`) draws one start and one
//! end per turn whatever the timing of the rows. The edges clear the
//! feed's wait for a turn, its interrupt ask, and drive voice mode. They
//! release nothing: the hub sends his queued messages at the turn's end
//! (issue 23, sb-core's pump); moved out of queue.rs, which only draws.

/// The turn edges between an agent's row before (`was`: its turn runs,
/// its ended turns) and its row now. Both halves come from one source,
/// sb-core's runtime state in one view (issue 22: `rows::Agent::turn_running`
/// and `turns`), so a turn's end is the count moving with the run no
/// longer busy, never two rows apart. One end per ended turn, a start
/// before it when the row didn't say running (a turn that started and
/// ended between two rows, no entry of it seen, is a start then an end),
/// then a start when it runs now; a flip alone is that edge. A lower
/// count is sb-core restarted (its count is back to 0): a new baseline,
/// nothing drawn. True: a start, false: an end, in order (proto-lead
/// m_14731).
pub(crate) fn turn_edges(was: (bool, u64), now: (bool, u64)) -> Vec<bool> {
    let mut out = Vec::new();
    if now.1 < was.1 {
        return out;
    }
    let mut running = was.0;
    for _ in 0..now.1 - was.1 {
        if !running {
            out.push(true);
        }
        out.push(false);
        running = false;
    }
    match (running, now.0) {
        (false, true) => out.push(true),
        (true, false) => out.push(false),
        _ => {}
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The agent's rows in order from its first, through
    /// [`turn_edges`]: every edge drawn.
    fn edges(rows: &[(bool, u64)]) -> Vec<bool> {
        rows.windows(2).flat_map(|w| turn_edges(w[0], w[1])).collect()
    }

    /// Law (proto-lead m_14731): a turn is never missed. A flip alone is
    /// its edge; two quick turns between two rows (no entry of them seen)
    /// are two start/end pairs; an end and a start together come end first.
    #[test]
    fn every_turn_gets_its_edges() {
        assert_eq!(turn_edges((false, 0), (true, 0)), [true]);
        assert_eq!(turn_edges((true, 0), (false, 1)), [false]);
        assert_eq!(turn_edges((false, 3), (false, 5)), [true, false, true, false], "two quick turns");
        assert_eq!(turn_edges((true, 3), (true, 3)), Vec::<bool>::new());
        assert_eq!(edges(&[(false, 3), (true, 3), (true, 4), (true, 5), (false, 5)]), [true, false, true, false, true, false], "two turns ended, each the next one started in its step, then the last flipped");
        assert_eq!(edges(&[(false, 2), (false, 3), (false, 4)]), [true, false, true, false], "a turn with no entry and no working row: a pair each");
    }

    /// Law (issue 22): the row's two halves come from one view, so one
    /// turn's end is one row: running with n, then not running with n+1,
    /// one end; a turn that ends and the next that starts in the same
    /// sb-core step (the idle's pump sends the queued message) is the
    /// count moving while the row stays running: an end, then a start.
    #[test]
    fn a_turns_end_is_one_row() {
        assert_eq!(edges(&[(true, 1), (false, 2)]), [false]);
        assert_eq!(edges(&[(true, 1), (true, 2)]), [false, true], "ended and the next one started in one step");
        assert_eq!(edges(&[(true, 1), (false, 2), (true, 2), (false, 3)]), [false, true, false]);
    }

    /// Law (architect m_16521): sb-core restarted, its counts are back to
    /// 0: a lower count is a new baseline, nothing drawn, and the next
    /// ended turn draws its one end (no start/end burst).
    #[test]
    fn a_lower_count_is_a_new_baseline() {
        assert_eq!(edges(&[(true, 5), (true, 0), (false, 1)]), [false]);
        assert_eq!(turn_edges((false, 5), (false, 0)), Vec::<bool>::new());
        assert_eq!(turn_edges((true, 5), (false, 0)), Vec::<bool>::new());
    }
}
