//! The feed's tool rows: the `▸ n commands` fold (BISE-223) and the
//! edits fold (BISE-304), which runs of done calls fold and how a fold
//! toggles. Moved whole out of feed.rs (rule 5: feed.rs past its count),
//! no change; feed.rs re-exports what the rest of the TUI reads.

use super::*;

/// What a fold of calls gathers: bash / TypeScript calls (`▸ 6
/// commands`, BISE-223) or file edits (`▸ edited 4 files`, BISE-304).
/// The two never mix: a command ends a run of edits and the reverse.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum FoldKind {
    Commands,
    Edits,
}

/// A file edit: Vibe's edit and write_file, OpenAI's apply_patch.
pub(crate) fn is_edit(td: &ToolData) -> bool {
    matches!(td.name.as_deref(), Some("apply_patch" | "edit" | "write_file"))
}

pub(super) fn call_kind(td: &ToolData) -> Option<FoldKind> {
    if crate::toolbox::is_boxed(td) {
        Some(FoldKind::Commands)
    } else if is_edit(td) {
        Some(FoldKind::Edits)
    } else {
        None
    }
}

/// The work a fold of `kind` holds: its calls, their sub-calls (the
/// commands'), the thinking between them.
pub(super) fn in_run(ev: &Ev, kind: FoldKind) -> bool {
    match ev {
        Ev::Tool(td) => call_kind(td) == Some(kind),
        Ev::Sub { .. } => kind == FoldKind::Commands,
        Ev::Thinking { .. } => true,
        _ => false,
    }
}

/// The kinds of fold `ev` can sit in: a call its own, the thinking
/// between calls either.
pub(super) fn kinds_of(ev: &Ev) -> &'static [FoldKind] {
    match ev {
        Ev::Tool(td) => match call_kind(td) {
            Some(FoldKind::Commands) => &[FoldKind::Commands],
            Some(FoldKind::Edits) => &[FoldKind::Edits],
            None => &[],
        },
        Ev::Sub { .. } => &[FoldKind::Commands],
        Ev::Thinking { .. } => &[FoldKind::Commands, FoldKind::Edits],
        _ => &[],
    }
}

pub(super) fn is_work(ev: &Ev) -> bool {
    !kinds_of(ev).is_empty()
}

/// The first and last event of the run of `kind` that holds `i` (the
/// visible events only; the hidden ones are skipped).
pub(super) fn work_run(events: &[Ev], i: usize, debug: bool, kind: FoldKind) -> (usize, usize) {
    let (mut a, mut b) = (i, i);
    for j in (0..i).rev() {
        let e = &events[j];
        if !ev_visible(e, debug) {
            continue;
        }
        if !in_run(e, kind) {
            break;
        }
        a = j;
    }
    for (j, e) in events.iter().enumerate().skip(i + 1) {
        if !ev_visible(e, debug) {
            continue;
        }
        if !in_run(e, kind) {
            break;
        }
        b = j;
    }
    (a, b)
}

/// A fold of done calls: its first call (which draws the fold row), its
/// last one, its calls, their total time, open or not.
pub(crate) struct ToolFold {
    pub(crate) carrier: usize,
    pub(crate) last: usize,
    pub(crate) n: usize,
    /// the done calls it folds, in order
    pub(crate) calls: Vec<usize>,
    pub(crate) total: std::time::Duration,
    pub(crate) open: bool,
}

/// A done call of `kind`: ok, and for an edit, its patch known (the
/// fold counts its files and lines).
pub(super) fn done_call(ev: &Ev, kind: FoldKind) -> Option<&ToolData> {
    match ev {
        Ev::Tool(td) if call_kind(td) == Some(kind) && matches!(td.state, ToolState::Ok) => {
            (kind == FoldKind::Commands || td.code.is_some()).then_some(td)
        }
        _ => None,
    }
}

/// How many done calls a run needs to fold.
pub(super) fn fold_at(kind: FoldKind) -> usize {
    match kind {
        FoldKind::Commands => crate::toolrow::FOLD_TOOLS,
        FoldKind::Edits => crate::toolrow::FOLD_EDITS,
    }
}

pub(super) fn fold_of(events: &[Ev], i: usize, debug: bool, kind: FoldKind) -> Option<ToolFold> {
    let (a, b) = work_run(events, i, debug, kind);
    let calls: Vec<usize> =
        (a..=b).filter(|&j| ev_visible(&events[j], debug) && done_call(&events[j], kind).is_some()).collect();
    if calls.len() < fold_at(kind) {
        return None;
    }
    let total = calls.iter().filter_map(|&j| done_call(&events[j], kind).and_then(|td| td.took)).sum();
    let carrier = calls[0];
    let open = done_call(&events[carrier], kind).is_some_and(|td| td.fold_open);
    Some(ToolFold { carrier, last: *calls.last()?, n: calls.len(), calls, total, open })
}

/// The fold of the run that holds `i`, in any view, when it has
/// [`fold_at`] done calls or more. Failed and running calls keep their
/// own rows; nothing moves. A thinking between calls: the fold it sits
/// inside, if any.
pub(crate) fn tool_fold(events: &[Ev], i: usize, debug: bool) -> Option<ToolFold> {
    let kinds = kinds_of(events.get(i)?);
    if let [kind] = kinds {
        return fold_of(events, i, debug, *kind);
    }
    kinds
        .iter()
        .filter_map(|&k| fold_of(events, i, debug, k))
        .find(|f| (f.carrier..=f.last).contains(&i))
}

/// The patches of a fold's edits, decoded, in order.
pub(super) fn fold_patches(events: &[Ev], f: &ToolFold) -> Vec<String> {
    f.calls
        .iter()
        .filter_map(|&j| match &events[j] {
            Ev::Tool(td) => td.code.as_deref().map(|raw| crate::code::tool_source(crate::code::CodeLang::Patch, wire_decode(raw))),
            _ => None,
        })
        .collect()
}

/// Hidden by a closed fold: a done call after its first, or the
/// thinking between its calls.
pub(super) fn folded_away(events: &[Ev], i: usize, debug: bool) -> bool {
    let ev = &events[i];
    let done = kinds_of(ev).iter().any(|&k| done_call(ev, k).is_some());
    if !done && !matches!(ev, Ev::Thinking { .. }) {
        return false;
    }
    tool_fold(events, i, debug).is_some_and(|f| !f.open && i > f.carrier && i <= f.last)
}

/// Open or close the fold whose first call is `i`.
pub(super) fn toggle_tool_fold(events: &mut [Ev], cache: &mut [Option<EventRows>], i: usize) -> bool {
    if let Some(Ev::Tool(td)) = events.get_mut(i) {
        td.fold_open = !td.fold_open;
    }
    forget_work_run(events, cache, i);
    true
}

/// The rows of a run of work depend on each other (the fold): a change
/// to one call rebuilds them all.
pub(super) fn forget_work_run(events: &[Ev], cache: &mut [Option<EventRows>], i: usize) {
    for &kind in kinds_of(&events[i]) {
        let (a, b) = work_run(events, i, false, kind);
        forget(cache, a..=b);
    }
}
