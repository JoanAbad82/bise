//! `/log`'s keys: the screen takes them all while open (and the
//! mouse wheel). Split out of logview.rs; the state they move is
//! [`View`]'s.

use super::*;

/// Keys while the screen is open: it takes them all.
pub(crate) fn on_key(app: &mut App, k: &KeyEvent) -> bool {
    let Some(v) = app.logview.as_mut() else { return false };
    if k.kind != KeyEventKind::Press {
        return true;
    }
    let ctrl = k.modifiers.contains(KeyModifiers::CONTROL);
    let width = app.area_w.saturating_sub(2).clamp(20, MEASURE);
    // the search field takes the keys while typed in
    // the wrap note lasts until the next key
    v.wrapped = "";
    if let Some(s) = v.search.as_mut().filter(|s| s.typing) {
        match k.code {
            KeyCode::Esc => v.search_cancel(),
            KeyCode::Enter => v.search_done(),
            KeyCode::Backspace => {
                s.text.pop();
                v.incsearch();
            }
            KeyCode::Char(c) if !ctrl => {
                s.text.push(c);
                v.incsearch();
            }
            _ => {}
        }
        return true;
    }
    if let Some(p) = v.picker.as_mut() {
        match k.code {
            KeyCode::Esc | KeyCode::Enter | KeyCode::Char('f') | KeyCode::Char('q') => v.picker = None,
            KeyCode::Up | KeyCode::Char('k') => p.sel = p.sel.saturating_sub(1),
            KeyCode::Down | KeyCode::Char('j') => p.sel = (p.sel + 1).min(p.rows.len().saturating_sub(1)),
            KeyCode::Char(' ') => {
                if let Some(r) = p.rows.get(p.sel).cloned() {
                    if !v.off.remove(&r) {
                        v.off.insert(r);
                    }
                    v.refilter();
                }
            }
            KeyCode::Char('a') => {
                v.off.clear();
                v.refilter();
            }
            _ => {}
        }
        return true;
    }
    let n = v.vis.len();
    let page = v.page.max(3);
    match k.code {
        KeyCode::Esc | KeyCode::Char('q') => {
            if v.search.is_some() {
                v.search = None;
                v.hits.clear();
            } else {
                app.logview = None;
            }
            return true;
        }
        KeyCode::Char('c') | KeyCode::Char('g') if ctrl => {
            app.logview = None;
            return true;
        }
        KeyCode::Char('o') if ctrl => v.toggle_all(),
        KeyCode::Char('d') if ctrl => v.scroll(page as isize / 2, width),
        KeyCode::Char('u') if ctrl => v.scroll(-(page as isize / 2), width),
        KeyCode::Tab | KeyCode::BackTab => {
            let m = if v.mode == Mode::History { Mode::Model } else { Mode::History };
            // from the history, the model view opens on the cursor's request
            if m == Mode::Model {
                if let Some(&i) = v.vis.get(v.sel) {
                    let idx = v.history[i].idx;
                    if let Some(r) = v.requests.iter().position(|r| r.idx >= idx) {
                        v.req = r;
                    }
                }
            }
            v.set_mode(m);
        }
        KeyCode::Char('[') => v.step_request(-1),
        KeyCode::Char(']') => v.step_request(1),
        KeyCode::Up | KeyCode::Char('k') => v.sel = v.sel.saturating_sub(1),
        KeyCode::Down | KeyCode::Char('j') => v.sel = (v.sel + 1).min(n.saturating_sub(1)),
        KeyCode::PageDown => v.scroll(page as isize, width),
        KeyCode::PageUp => v.scroll(-(page as isize), width),
        KeyCode::Home | KeyCode::Char('g') => (v.sel, v.top) = (0, (0, 0)),
        KeyCode::End | KeyCode::Char('G') => v.bottom(),
        KeyCode::Char(' ') | KeyCode::Enter => {
            if let Some(&i) = v.vis.get(v.sel) {
                v.toggle(i);
            }
        }
        KeyCode::Char('/') => v.start_search(),
        KeyCode::Char('n') => v.jump(true),
        KeyCode::Char('N') => v.jump(false),
        KeyCode::Char('f') => {
            let mut rows: Vec<String> = model::ROLE_KEYS.iter().map(|s| s.to_string()).collect();
            rows.extend(v.tools().into_iter().map(|t| format!("tool:{t}")));
            v.picker = Some(Picker { rows, sel: 0 });
        }
        KeyCode::Char('r') => {
            // read the log again (it grew)
            let agent = v.agent.clone();
            match session_dir(&agent).and_then(|d| View::load(agent, &d)) {
                Ok(mut fresh) => {
                    fresh.off = std::mem::take(&mut v.off);
                    fresh.search = v.search.take();
                    fresh.refilter();
                    fresh.bottom();
                    *v = fresh;
                }
                Err(e) => v.note = e,
            }
        }
        _ => {}
    }
    true
}

/// The mouse while open: the wheel scrolls, the rest is swallowed.
pub(crate) fn mouse(app: &mut App, m: &crossterm::event::MouseEvent) -> bool {
    use crossterm::event::MouseEventKind;
    let width = app.area_w.saturating_sub(2).clamp(20, MEASURE);
    let Some(v) = app.logview.as_mut() else { return false };
    match m.kind {
        MouseEventKind::ScrollUp => v.scroll(-3, width),
        MouseEventKind::ScrollDown => v.scroll(3, width),
        _ => {}
    }
    true
}
