//! The hub's side of the pages (docs/ambient-pages.md §2.2-§2.6; the store
//! and the server: crate::pages): `sb page …` and `sb taste`/`sb people`,
//! the page server's notes, the data-agent and watch pushes, page
//! questions and step cards and their answers, the first run's start-here
//! page. Moved out of daemon.rs unchanged (desktop plan S0b).

use super::*;

/// The pages' part of the Shell (architect's review 6, m_9155): the
/// server and what the hub keeps about pages, one field of the Shell
/// (`Shell::pg`) instead of ten.
#[derive(Default)]
pub(super) struct PageState {
    /// The pages and their server (docs/ambient-pages.md); None: the
    /// server could not start (said in the hub log).
    pub(super) pages: Option<std::sync::Arc<crate::pages::Pages>>,
    /// Agents a page's notes were sent to: the pages they update, and
    /// whether a turn of theirs has the notes yet (started or steered
    /// since). Its end without a publish puts the pages back to ready.
    pub(super) page_turns: BTreeMap<String, (Vec<String>, bool)>,
    /// Page messages sent to an agent that has not taken them yet (no
    /// turn started or steered since): agent -> (first sent at, [(page,
    /// text)]). Not taken in PAGE_WAIT_MS: they go to main; main's not
    /// taken: a warn in its feed. Never silently lost (pm's D fail 37).
    pub(super) page_waits: BTreeMap<String, (u64, Vec<(String, String)>)>,
    /// the agents each page's latest version names (`data-agent`):
    /// page id -> names (None: not read from the store yet)
    pub(super) page_agents: Option<BTreeMap<String, Vec<String>>>,
    /// the last `agent` frame pushed on each page, per agent
    pub(super) page_agent_sent: BTreeMap<(String, String), Value>,
    /// each agent's last tool intent (an `agent` frame's note when it
    /// declared none)
    pub(super) last_intent: BTreeMap<String, String>,
    /// each watched page's last `watch` (meta.watch)
    pub(super) page_watch_sent: BTreeMap<String, Value>,
    /// The open cards of the pages' question blocks (§4.2): card →
    /// (page, block); None until read from the store.
    pub(super) page_cards: Option<BTreeMap<u64, (String, String)>>,
    /// The answers given to those cards, until the hub closes them.
    pub(super) page_replies: BTreeMap<u64, String>,
    /// `sb card --page`: an agent's card → its page link (card_link.rs),
    /// shown on the card while it is open; its answer goes to the agent
    /// as usual (unlike `page_cards`, whose answers take the page's path)
    pub(super) card_links: BTreeMap<u64, Value>,
}

impl PageState {
    /// At the hub's start: the cards survive a restart, so do their links
    /// (lead m_6039); the server starts with [`Shell::start_pages`].
    pub(super) fn load(state: &Path) -> PageState {
        PageState { card_links: crate::card_link::load(&crate::card_link::file(state)), ..Default::default() }
    }
}

impl Shell {
    /// The page server (docs/ambient-pages.md §2.4): 127.0.0.1, a stable
    /// port per workspace; its notes come back to the loop.
    pub(super) fn start_pages(&mut self, paths: &Paths, tx: &Sender<Msg>) {
        match crate::pages::start(&paths.state, &crate::paths::workspace_id(&paths.workspace), self.opts.app_root.join("kit"), self.holds.clone()) {
            Ok(p) => {
                let tx = std::sync::Mutex::new(tx.clone());
                p.connect_hub(Box::new(move |m| {
                    if let Ok(t) = tx.lock() {
                        let _ = t.send(Msg::Page(m));
                    }
                }));
                log_line(paths, &format!("pages at {}", p.base()));
                self.pg.pages = Some(p);
            }
            Err(e) => log_line(paths, &format!("no page server: {}", e)),
        }
    }

    // ---- pages (docs/ambient-pages.md §2.2-§2.6; the store and the server: pages/) ----

    /// An agent that is gone for its page's notes: dropped, archived,
    /// stopped or failed (main gets them then).
    pub(super) fn page_agent_gone(&self, name: &str) -> bool {
        match self.hub.st.agents.get(name) {
            Some(a) => matches!(a.status().as_str(), "archived" | "stopped" | "failed"),
            None => true,
        }
    }

    /// `sb page publish|list|notes`: the answer for the CLI.
    /// `sb taste` and `sb people` (ambient-lead m_5630): the two files of
    /// the home workspace bise keeps about the user, one `- ` line each;
    /// after a change the `about-you` page, when there is one, is redrawn
    /// from them and republished by its own agent (no model turn).
    pub(super) fn keeps_op(&mut self, cmd: &str, v: &Value) -> Value {
        use crate::keeps;
        let s = |k: &str| v.get(k).and_then(|x| x.as_str()).unwrap_or("").to_string();
        let name = if cmd == "taste" { keeps::TASTE } else { keeps::PEOPLE };
        let path = match keeps::file(name) {
            Ok(p) => p,
            Err(e) => return json!({"ok": false, "error": e}),
        };
        let text = std::fs::read_to_string(&path).unwrap_or_default();
        let (what, noun) = if cmd == "taste" { ("rule", "rules") } else { ("person", "people") };
        let count = |t: &str| {
            let n = keeps::items(t).len();
            format!("{n} {}", if n == 1 { what } else { noun })
        };
        let step = s("step");
        let changed = match (cmd, step.as_str()) {
            (_, "list") => {
                let items = keeps::items(&text);
                let body = if items.is_empty() {
                    format!("nothing kept yet ({}): sb {cmd} {}", path.display(), if cmd == "taste" { "add \"<rule>\"" } else { "set <name> \"<who>\"" })
                } else {
                    let lines: Vec<String> = items.iter().enumerate().map(|(k, i)| format!("{}. {i}", k + 1)).collect();
                    format!("{} ({}):\n{}", count(&text), path.display(), lines.join("\n"))
                };
                return json!({"ok": true, "text": body, "items": items});
            }
            ("taste", "add") => keeps::taste_add(&text, &s("rule"), Some(s("source")).filter(|f| !f.trim().is_empty()).as_deref()).map(|t| {
                let line = format!("kept: {}", s("rule").split_whitespace().collect::<Vec<_>>().join(" "));
                (t, line)
            }),
            ("taste", "remove") => keeps::taste_remove(&text, &s("which")).map(|(t, gone)| (t, format!("removed: {gone}"))),
            ("people", "set") => keeps::people_set(&text, &s("name"), &s("who")).map(|t| (t, format!("kept: {}", s("name").trim()))),
            ("people", "remove") => keeps::people_remove(&text, &s("name")).map(|t| (t, format!("removed: {}", s("name").trim()))),
            _ => Err(format!("sb {cmd}: unknown step {step:?}")),
        };
        let (new, line) = match changed {
            Ok(x) => x,
            Err(e) => return json!({"ok": false, "error": e}),
        };
        if let Err(e) = keeps::write(&path, &new) {
            return json!({"ok": false, "error": e});
        }
        let mut out = format!("{line} ({} in {})", count(&new), path.display());
        if let Some(v) = self.about_you_redraw() {
            out.push_str(&format!("; about-you is v{v} now"));
        }
        json!({"ok": true, "text": out})
    }

    /// The home workspace's first run: amb-kit's `start here` page,
    /// published once as main (first_run.rs); the marker keeps it from
    /// ever coming back.
    pub(super) fn start_here(&mut self, paths: &crate::paths::Paths) {
        use crate::first_run;
        let Some(pages) = self.pg.pages.clone() else { return };
        let Some(html) = first_run::due(&paths.state, &paths.workspace, &crate::paths::home_workspace(), &self.opts.app_root) else {
            return;
        };
        let p = crate::pages::store::Publish {
            agent: "main".into(),
            id: Some(first_run::PAGE_ID.into()),
            title: Some(first_run::TITLE.into()),
            html,
            ..Default::default()
        };
        match pages.publish(&p, now_ms(), &|_| false) {
            Ok((meta, _)) => {
                let _ = first_run::mark(&paths.state, meta.version());
                log_line(paths, &format!("first run: {} v{} published", meta.id, meta.version()));
            }
            Err(lines) => log_line(paths, &format!("first run: start-here did not pass: {}", lines.join("; "))),
        }
    }

    /// Republish the `about-you` page from the kept files, as its agent;
    /// None when there is no such page (or it did not pass).
    pub(super) fn about_you_redraw(&mut self) -> Option<u64> {
        use crate::keeps;
        let pages = self.pg.pages.clone()?;
        let meta = pages.store.meta("about-you")?;
        let read = |n: &str| keeps::file(n).ok().and_then(|p| std::fs::read_to_string(p).ok()).unwrap_or_default();
        let p = crate::pages::store::Publish {
            agent: meta.agent.clone(),
            id: Some("about-you".into()),
            html: keeps::about_you(&read(keeps::TASTE), &read(keeps::PEOPLE)),
            ..Default::default()
        };
        let gone: Vec<String> = self.hub.st.agents.keys().filter(|n| self.page_agent_gone(n)).cloned().collect();
        let is_gone = |n: &str| gone.iter().any(|g| g == n) || !self.hub.st.agents.contains_key(n);
        match pages.publish(&p, now_ms(), &is_gone) {
            Ok((meta, _)) => {
                self.broadcast(&pages.page_ev(&meta));
                let snap = self.snapshot();
                self.broadcast(&snap);
                Some(meta.version())
            }
            Err(lines) => {
                eprintln!("about-you: the redraw did not pass: {}", lines.join("; "));
                None
            }
        }
    }

    pub(super) fn page_op(&mut self, cmd: &str, from: &str, v: &Value) -> Value {
        let Some(pages) = self.pg.pages.clone() else {
            return json!({"ok": false, "error": "the page server is not running (see the hub log)"});
        };
        let s = |k: &str| v.get(k).and_then(|x| x.as_str()).map(String::from);
        match cmd {
            "page_list" => json!({"ok": true, "pages": pages.list_json()}),
            "page_notes" => {
                let id = s("id").unwrap_or_default();
                match pages.store.meta(&id) {
                    Some(_) => json!({"ok": true, "id": id, "notes": pages.store.notes(&id)}),
                    None => json!({"ok": false, "error": format!("no page {id}")}),
                }
            }
            "page_waiting" => {
                let items = pages.waiting();
                json!({"ok": true, "waiting": items, "lines": items.iter().map(|w| w.line()).collect::<Vec<_>>()})
            }
            "page_tick" => {
                // a step of his he says is done (by voice, through main):
                // the same path as its card's answer (roadmap D)
                let (id, item) = (s("id").unwrap_or_default(), s("item").unwrap_or_default());
                let words = s("text").filter(|t| !t.trim().is_empty()).unwrap_or_else(|| "done".into());
                if pages.store.meta(&id).is_none() {
                    return json!({"ok": false, "error": format!("no page {id}")});
                }
                if self.page_tick(&id, &item, &words) {
                    json!({"ok": true, "id": id, "item": item, "ticked": crate::pages::checklist::is_done_word(&words)})
                } else {
                    json!({"ok": false, "error": format!("{id} has no checklist row {item}")})
                }
            }
            "page_start" => {
                // the page shows within seconds of the ask; the first
                // publish is v1 (ambient-lead m_5000)
                let id = s("id").unwrap_or_default();
                let agent = s("agent").filter(|a| !a.is_empty()).unwrap_or_else(|| from.to_string());
                if agent != from && !self.hub.st.agents.contains_key(&agent) {
                    return json!({"ok": false, "error": format!("no agent {agent}")});
                }
                let gone: Vec<String> = self.hub.st.agents.keys().filter(|n| self.page_agent_gone(n)).cloned().collect();
                let is_gone = |n: &str| gone.iter().any(|g| g == n) || !self.hub.st.agents.contains_key(n);
                match pages.start(&id, s("title").as_deref(), s("ask").as_deref(), &agent, now_ms(), &is_gone) {
                    Ok(meta) => {
                        // its writer's turn: the caller's runs now; another
                        // agent's is the next one (its end without a
                        // publish puts the page back to ready)
                        let e = self.pg.page_turns.entry(agent.clone()).or_insert_with(|| (Vec::new(), false));
                        if !e.0.contains(&meta.id) {
                            e.0.push(meta.id.clone());
                        }
                        if agent == from {
                            e.1 = true;
                        }
                        self.broadcast(&pages.page_ev(&meta));
                        let snap = self.snapshot();
                        self.broadcast(&snap);
                        json!({"ok": true, "id": meta.id, "version": 0, "url": pages.url(&meta.id), "state": "writing", "agent": agent})
                    }
                    Err(e) => json!({"ok": false, "error": e}),
                }
            }
            _ => {
                let list = |k: &str| -> Vec<String> {
                    v.get(k).and_then(|x| x.as_array()).map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect()).unwrap_or_default()
                };
                let answers: Vec<(String, String)> = v
                    .get("answers")
                    .and_then(|x| x.as_object())
                    .map(|o| o.iter().map(|(k, a)| (k.clone(), a.as_str().unwrap_or("").to_string())).collect())
                    .unwrap_or_default();
                // --went (docs/ambient-roadmap.md A): the CLI read them
                let mut went = Vec::new();
                for w in v.get("went").and_then(|x| x.as_array()).into_iter().flatten() {
                    match serde_json::from_value::<crate::pages::store::Went>(w.clone()) {
                        Ok(w) => went.push(w),
                        Err(e) => return json!({"ok": false, "error": format!("--went: {e}")}),
                    }
                }
                // --taste: the rules of ~/bise/taste.md now (the frame says
                // 'following your taste · N rules'); no file: nothing
                let taste = v.get("taste").and_then(|x| x.as_bool()).unwrap_or(false).then(|| {
                    std::fs::read_to_string(crate::paths::home_workspace().join("taste.md")).ok().map(|t| crate::pages::store::taste_rules(&t))
                });
                if taste == Some(None) {
                    return json!({"ok": false, "error": format!("--taste: no {} (read it, or publish without --taste)", crate::paths::home_workspace().join("taste.md").display())});
                }
                let p = crate::pages::store::Publish {
                    taste: taste.flatten(),
                    agent: from.to_string(),
                    id: s("id").filter(|x| !x.is_empty()),
                    title: s("title").filter(|x| !x.is_empty()),
                    html: s("html").unwrap_or_default(),
                    done: list("done"),
                    answers,
                    went,
                    // --public / --private (pages-ui): the static export and the user's mirror
                    public: v.get("public").and_then(Value::as_bool),
                };
                let gone: Vec<String> = self.hub.st.agents.keys().filter(|n| self.page_agent_gone(n)).cloned().collect();
                let is_gone = |n: &str| gone.iter().any(|g| g == n) || !self.hub.st.agents.contains_key(n);
                let was_public = p.id.as_deref().and_then(|i| pages.store.meta(i)).is_some_and(|m| m.public);
                match pages.publish(&p, now_ms(), &is_gone) {
                    Ok((meta, unknown)) => {
                        // a public page changed (or was taken back): the static export, then the
                        // user's mirror if he set one (pages/mirror.rs); nothing else ever leaves
                        if meta.public || was_public {
                            crate::pages::mirror::spawn(pages.clone(), meta.id.clone(), bise_home::Home::from_env().config_file());
                        }
                        // the notes it was updating for are answered
                        if let Some((ids, _)) = self.pg.page_turns.get_mut(from) {
                            ids.retain(|i| *i != meta.id);
                            if ids.is_empty() {
                                self.pg.page_turns.remove(from);
                            }
                        }
                        self.broadcast(&pages.page_ev(&meta));
                        if !p.went.is_empty() {
                            pages.push(&meta.id, "went", &json!({"went": meta.went}));
                        }
                        pages.push(&meta.id, "taste", &json!(meta.taste));
                        // its items' agents: their status from now on
                        let names = crate::pages::store::data_agents_of(&p.html);
                        self.page_agents_now().insert(meta.id.clone(), names);
                        self.page_agent_push();
                        self.page_watch_push();
                        // its question blocks: one card each (§4.2)
                        self.page_questions(&meta.id, &meta.agent, &p.html);
                        // its checklists: the step of his whose turn came
                        self.page_steps(&meta.id);
                        let snap = self.snapshot();
                        self.broadcast(&snap);
                        let url = pages.url(&meta.id);
                        json!({"ok": true, "id": meta.id, "version": meta.version(), "url": url, "unknown_notes": unknown})
                    }
                    Err(lines) => json!({"ok": false, "error": lines.join("\n"), "lint": lines}),
                }
            }
        }
    }

    /// The page server's news.
    pub(super) fn page_msg(&mut self, m: crate::pages::PageMsg) {
        let Some(pages) = self.pg.pages.clone() else { return };
        match m {
            crate::pages::PageMsg::Notes { id } => {
                // a tick on the page (a draft too) closes its step's card
                self.page_steps(&id);
                let snap = self.snapshot();
                self.broadcast(&snap);
            }
            crate::pages::PageMsg::Opened { .. } => {
                let snap = self.snapshot();
                self.broadcast(&snap);
            }
            crate::pages::PageMsg::Mirror { id, error } => {
                // the last good public copy stays up; main hears it once (designer m_7509)
                self.feed(MAIN, &format!("sb warn : {}", wire_escape(&format!("▲ couldn't publish {id} to the public mirror: {error}"))));
            }
            crate::pages::PageMsg::Sent { id, agent, text } => {
                // start notes (an item the user wants an agent on): main's,
                // never the page's agent's (ambient-lead m_5006)
                // a stop note (the frame's 'stop' of a watched page): the hub
                // ends the page's timers itself, no model turn
                let stops = pages.locked(|s| s.take_stops(&id)).unwrap_or_default();
                if !stops.is_empty() {
                    let ids: Vec<u64> = self.hub.timers().of_page(&id).iter().map(|t| t.id).collect();
                    for t in ids {
                        self.step(Input::EveryStop { id: t, why: format!(" with the stop on the page {id}") });
                    }
                    pages.push(&id, "notes", &json!({"notes": pages.store.notes(&id)}));
                    self.page_watch_push();
                }
                let starts = pages.locked(|s| s.route_starts(&id)).unwrap_or_default();
                if let (false, Some(meta)) = (starts.is_empty(), pages.store.meta(&id)) {
                    let msg = crate::pages::store::start_message(&meta, &pages.url(&id), &starts);
                    let msg = Self::page_hint(MAIN, msg);
                    self.step(Input::ClientInput { client: 0, focus: MAIN.to_string(), text: msg, queued: false });
                    pages.push(&id, "notes", &json!({"notes": pages.store.notes(&id)}));
                }
                // the other notes: the page's agent, main when it is gone
                // (none: only start notes were sent)
                if !text.is_empty() {
                    let to = if self.page_agent_gone(&agent) { MAIN.to_string() } else { agent };
                    self.pg.page_turns.entry(to.clone()).or_insert_with(|| (Vec::new(), false)).0.push(id.clone());
                    if let Some(meta) = pages.set_state(&id, "updating") {
                        self.broadcast(&pages.page_ev(&meta));
                    }
                    // as from the user (client 0: no view of its own);
                    // watched until a turn of `to` takes it
                    let w = self.pg.page_waits.entry(to.clone()).or_insert_with(|| (now_ms(), Vec::new()));
                    w.1.push((id.clone(), text.clone()));
                    let text = Self::page_hint(&to, text);
                    self.step(Input::ClientInput { client: 0, focus: to, text, queued: false });
                }
                let snap = self.snapshot();
                self.broadcast(&snap);
            }
            crate::pages::PageMsg::Answer { id, block, reply } => {
                // the same path as the capsule's and the TUI's answer
                if let Some(card) = self.page_card(&id, &block) {
                    self.page_question_answer(&id, &block, card, &reply);
                } else {
                    // no open card for it (it never opened, or the store
                    // was written another way): the loop still closes,
                    // the answer to the page's agent as from the user
                    self.page_answer_without_card(&id, &block, &reply);
                }
                self.page_answers();
            }
        }
    }

    /// The agents each page's latest version names, read from the store
    /// the first time.
    pub(super) fn page_agents_now(&mut self) -> &mut BTreeMap<String, Vec<String>> {
        if self.pg.page_agents.is_none() {
            let m: BTreeMap<String, Vec<String>> = match &self.pg.pages {
                Some(p) => p.store.list().into_iter().map(|m| (m.id.clone(), p.store.data_agents(&m.id))).filter(|(_, n)| !n.is_empty()).collect(),
                None => BTreeMap::new(),
            };
            self.pg.page_agents = Some(m);
        }
        self.pg.page_agents.get_or_insert_with(BTreeMap::new)
    }

    /// An agent's live status on a page item (kit's `agent` frame, amb-kit
    /// m_5189): working|idle|done|blocked|failed, its status note else its
    /// last tool intent.
    pub(super) fn page_agent_frame(&self, name: &str) -> Value {
        use crate::model::Status;
        let a = self.hub.st.resolve(name).and_then(|n| self.hub.st.agents.get(&n));
        let Some(a) = a else { return json!({"name": name, "status": "done"}) };
        let status = match a.status() {
            Status::Starting | Status::Working | Status::Waiting => "working",
            Status::Idle => "idle",
            Status::Done | Status::Stopped | Status::Archived => "done",
            Status::Blocked => "blocked",
            Status::Failed => "failed",
        };
        let note = a
            .declared
            .as_ref()
            .map(|(_, n)| n.trim().to_string())
            .filter(|n| !n.is_empty())
            .or_else(|| self.pg.last_intent.get(&a.name).cloned());
        let mut f = json!({"name": name, "status": status});
        if let Some(n) = note {
            f["note"] = json!(n);
        }
        f
    }

    /// Push the `agent` frames that changed, on every page naming them;
    /// each page keeps its last frames for a new stream.
    pub(super) fn page_agent_push(&mut self) {
        let Some(pages) = self.pg.pages.clone() else { return };
        let list: Vec<(String, Vec<String>)> = self.page_agents_now().iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        // the agents at work on page items: their drafts wait; when one
        // is done, its page's drafts are judged again (ambient-lead m_6168)
        let busy: std::collections::BTreeSet<String> = list
            .iter()
            .flat_map(|(_, names)| names.iter())
            .filter(|n| matches!(self.page_agent_frame(n)["status"].as_str(), Some("working" | "idle" | "blocked")))
            .cloned()
            .collect();
        if let Some(left) = pages.set_busy(busy) {
            // done now: its replies stay held until the page is published
            // again, after the fix (ambient-lead m_6187)
            for (id, names) in &list {
                let v = pages.store.meta(id).map_or(0, |m| m.version());
                for a in names.iter().filter(|a| left.contains(a)) {
                    pages.mark_done(id, a, v);
                }
            }
            for (id, _) in &list {
                self.page_steps(id);
            }
        }
        for (id, names) in list {
            let mut changed = false;
            for name in names {
                let f = self.page_agent_frame(&name);
                let key = (id.clone(), name.clone());
                if self.pg.page_agent_sent.get(&key) == Some(&f) {
                    continue;
                }
                pages.push(&id, "agent", &f);
                self.pg.page_agent_sent.insert(key, f);
                changed = true;
            }
            if changed {
                let frames: serde_json::Map<String, Value> =
                    self.pg.page_agent_sent.iter().filter(|((p, _), _)| *p == id).map(|((_, n), f)| (n.clone(), f.clone())).collect();
                let _ = pages.locked(|s| s.save_agent_frames(&id, &frames));
            }
        }
    }

    /// The page of `name` waiting for the user's review, by title: its
    /// latest version has a review block or an unanswered question, and
    /// no word of his on it since (an approve, a send, "put it in my
    /// drafts"). The approvals gate makes a draft call a card then.
    pub(crate) fn pending_review_of(&self, name: &str) -> Option<String> {
        self.pg.pages.as_ref()?.store.pending_review(name)
    }

    /// meta.watch of each page a timer watches (`sb every --page`), and
    /// SSE `watch` when it changes (null when its last timer ends):
    /// {timer, every, checked_ms, until_ms} (amb-kit m_5454).
    pub(super) fn page_watch_push(&mut self) {
        let Some(pages) = self.pg.pages.clone() else { return };
        let mut now: BTreeMap<String, Value> = BTreeMap::new();
        for t in self.hub.timers().map.values() {
            let Some(page) = &t.page else { continue };
            if now.contains_key(page) {
                continue;
            }
            let Some(m) = pages.store.meta(page) else { continue };
            let checked = m.versions.last().map_or(0, |v| v.at_ms).max(t.last_ms);
            now.insert(page.clone(), json!({"timer": t.id, "every": t.sched.label(), "checked_ms": checked, "until_ms": t.until_ms}));
        }
        let before = std::mem::take(&mut self.pg.page_watch_sent);
        for (id, w) in &now {
            if before.get(id) != Some(w) {
                let _ = pages.locked(|s| s.set_watch(id, Some(w.clone())));
                pages.push(id, "watch", w);
            }
        }
        for id in before.keys().filter(|k| !now.contains_key(*k)) {
            let _ = pages.locked(|s| s.set_watch(id, None));
            pages.push(id, "watch", &Value::Null);
        }
        self.pg.page_watch_sent = now;
    }

    /// A tool intent of an agent some page names: its item's note.
    pub(super) fn page_agent_line(&mut self, name: &str, line: &str) {
        if !self.page_agents_now().values().any(|ns| ns.iter().any(|n| n == name)) {
            return;
        }
        if let crate::wire::Wire::Intent(text) = crate::wire::parse(line) {
            self.pg.last_intent.insert(name.to_string(), crate::util::one_line(&text));
            self.page_agent_push();
        }
    }

    /// Page messages an agent has not taken (no turn started or steered)
    /// for PAGE_WAIT_MS: a task's go to main, which acts on the page;
    /// main's own are a warn in its feed. Never silently lost (pm's D
    /// fail 37: five answers on a task's page woke no one).
    pub(super) fn page_waits_check(&mut self) {
        use crate::pages::{untaken, Untaken};
        let now = now_ms();
        let late: Vec<(String, Untaken)> = self
            .pg
            .page_waits
            .iter()
            .map(|(a, (at, _))| (a.clone(), untaken(a, now.saturating_sub(*at))))
            .filter(|(_, u)| *u != Untaken::Wait)
            .collect();
        for (agent, u) in late {
            let Some((_, items)) = self.pg.page_waits.remove(&agent) else { continue };
            let pages: Vec<String> = items.iter().map(|(p, _)| p.clone()).collect();
            match u {
                Untaken::ToMain => {
                    let body: Vec<String> = items.into_iter().map(|(_, t)| t).collect();
                    let text = format!(
                        "@{agent} did not take this in {} s (no turn of its own): the page {} is yours to act on now.\n\n{}",
                        crate::pages::PAGE_WAIT_MS / 1000,
                        pages.join(", "),
                        body.join("\n\n")
                    );
                    log_line(&self.opts.paths, &format!("pages {}: @{agent} took no turn on the notes: to main", pages.join(", ")));
                    let w = self.pg.page_waits.entry(MAIN.to_string()).or_insert_with(|| (now, Vec::new()));
                    w.1.extend(pages.iter().map(|p| (p.clone(), String::new())));
                    let text = Self::page_hint(MAIN, text);
                    self.step(Input::ClientInput { client: 0, focus: MAIN.to_string(), text, queued: false });
                }
                Untaken::Warn => {
                    let text = format!("his notes on the page {} reached no one: main took no turn on them", pages.join(", "));
                    log_line(&self.opts.paths, &text);
                    self.feed(MAIN, &format!("sb warn : {}", crate::util::wire_escape(&text)));
                }
                Untaken::Wait => {}
            }
        }
    }

    /// The turns of an agent updating pages: one that has the notes and
    /// ends without a publish puts its pages back to ready (the notes
    /// stay sent).
    pub(super) fn page_turn(&mut self, name: &str, line: &str) {
        let Some((ids, seen)) = self.pg.page_turns.get_mut(name) else { return };
        // what its writer does now, on the pages it writes or updates
        // (the model's one-line intent of each bash/run_typescript call)
        if let crate::wire::Wire::Intent(text) = crate::wire::parse(line) {
            if let Some(p) = &self.pg.pages {
                for id in ids.iter() {
                    p.push(id, "progress", &json!({"text": text}));
                }
            }
            return;
        }
        let o = line.strip_prefix("  obs: ").unwrap_or("");
        if o == "turn_started" || o.starts_with("steering_received: ") || o.starts_with("steered: ") {
            *seen = true;
            return;
        }
        if !(o.starts_with("turn_done: ") && *seen) {
            return;
        }
        let how = o.trim_start_matches("turn_done: ").trim().to_string();
        let ids = std::mem::take(ids);
        self.pg.page_turns.remove(name);
        let Some(pages) = self.pg.pages.clone() else { return };
        for id in ids {
            // the page says why nothing came (amb-kit m_5105)
            let writing = pages.store.meta(&id).is_some_and(|m| m.state == "writing");
            let reason = match (how.as_str(), writing) {
                ("completed", true) => "the turn ended without a page".to_string(),
                ("completed", false) => "the turn ended without a new version".to_string(),
                (h, _) => format!("the turn stopped: {h}"),
            };
            if let Some(meta) = pages.set_state_why(&id, "ready", &reason) {
                self.broadcast(&pages.page_ev(&meta));
            }
        }
        let snap = self.snapshot();
        self.broadcast(&snap);
    }

    /// `card_links` to the hub's state (card_link.rs), after each change.
    pub(super) fn save_card_links(&self) {
        if let Err(e) = crate::card_link::save(&crate::card_link::file(&self.opts.paths.state), &self.pg.card_links) {
            log_line(&self.opts.paths, &format!("card links not saved: {e}"));
        }
    }

    /// The open cards of the pages' questions: card → (page, block),
    /// read from the store once.
    pub(super) fn page_cards(&mut self) -> &mut BTreeMap<u64, (String, String)> {
        let pages = self.pg.pages.clone();
        self.pg.page_cards.get_or_insert_with(|| {
            let mut m = BTreeMap::new();
            if let Some(p) = pages {
                for meta in p.store.list() {
                    for q in p.store.questions(&meta.id) {
                        if q.card != 0 && q.reply.is_none() {
                            m.insert(q.card, (meta.id.clone(), q.block.clone()));
                        }
                    }
                    // the open steps' cards too: after a hub restart a
                    // step's card lost its page link and its page path
                    // (pm's D fail 31: card #2 with page null)
                    for s in p.store.steps(&meta.id) {
                        if s.card != 0 && s.reply.is_none() {
                            m.insert(s.card, (meta.id.clone(), Self::step_key(&s.block, &s.item)));
                        }
                    }
                }
            }
            m
        })
    }

    /// §4.2: after a publish of page `id`, one open card per question
    /// block, `agent` asking: a changed question gets a new card (the
    /// old one closes `replaced`), a question gone closes its card
    /// (`withdrawn`), an answered one stays answered.
    pub(super) fn page_questions(&mut self, id: &str, agent: &str, html: &str) {
        let Some(pages) = self.pg.pages.clone() else { return };
        let old = pages.store.questions(id);
        let new = crate::pages::questions::of_fragment(html);
        if old.is_empty() && new.is_empty() {
            return;
        }
        let open: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        let plan = crate::pages::questions::plan(&old, new, &|c| open.contains(&c));
        for (card, res) in &plan.close {
            self.page_cards().remove(card);
            self.step(Input::ConfirmClose { card: *card, res: res.to_string() });
        }
        let mut qs = plan.questions;
        // a page-only question (data-card="none") never opens one; a
        // dismissed one not again until its words change (m_6091)
        for q in qs.iter_mut().filter(|q| q.card == 0 && q.reply.is_none() && !q.page_only && !q.dismissed) {
            let before: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
            // sb-core opens cards for main only (a task's request is
            // refused: pm's 25), so main asks; the hub answers it itself
            // (page_card_answer: the pick goes to the page's agent `agent`).
            // No client waits for the reply (token 0: never a connection's)
            let _ = agent;
            self.step(Input::Agent {
                token: 0,
                from: MAIN.to_string(),
                req: crate::core::AgentReq::Card { text: q.card_text(), for_msg: None },
            });
            let card = self.hub.st.open_cards().filter(|c| !before.contains(&c.id) && c.kind == "question").map(|c| c.id).max();
            match card {
                Some(card) => {
                    q.card = card;
                    self.page_cards().insert(card, (id.to_string(), q.block.clone()));
                }
                None => log_line(&self.opts.paths, &format!("page {id}: no card opened for question {}", q.block)),
            }
        }
        if let Err(e) = pages.locked(|s| s.save_questions(id, &qs)) {
            log_line(&self.opts.paths, &format!("page {id}: questions not saved: {e}"));
        }
        pages.push("", "pages", &json!({"pages": pages.list_json()}));
    }

    /// A page question answered with no open card (amb-kit m_5336,
    /// ambient-lead m_5343): the answer is kept, the page hears
    /// `answered`, and the pick is a `pick` note on that block, sent to
    /// the page's agent (main when it is gone) like any notes.
    pub(super) fn page_answer_without_card(&mut self, id: &str, block: &str, reply: &str) {
        let Some(pages) = self.pg.pages.clone() else { return };
        let Some(meta) = pages.store.meta(id) else { return };
        let mut qs = pages.store.questions(id);
        let Some(q) = qs.iter_mut().find(|q| q.block == block && q.reply.is_none()) else { return };
        q.reply = Some(reply.to_string());
        if let Err(e) = pages.locked(|s| s.save_questions(id, &qs)) {
            log_line(&self.opts.paths, &format!("page {id}: questions not saved: {e}"));
        }
        pages.push(id, "answered", &json!({"block": block, "reply": reply}));
        let note = match pages.locked(|s| s.add_pick(id, block, reply, meta.version(), now_ms())) {
            Ok(n) => n,
            Err(e) => return log_line(&self.opts.paths, &format!("page {id}: the pick not saved: {e}")),
        };
        pages.push(id, "notes", &json!({"notes": pages.store.notes(id)}));
        let text = crate::pages::store::notes_message(&meta, &pages.url(id), &[note]);
        self.page_msg(crate::pages::PageMsg::Sent { id: id.to_string(), agent: meta.agent.clone(), text });
        // a drafted step that waited for this answer gets its card now
        self.page_steps(id);
    }

    // ---- checklists that tick themselves (docs/ambient-roadmap.md §2 D) ----

    /// The key of a step's card in `page_cards` (a question's is its block).
    pub(super) fn step_key(block: &str, item: &str) -> String {
        format!("row:{block}/{item}")
    }

    /// Page `id`'s steps of the user's after any change (a publish, a
    /// tick, a note): the step whose turn came gets its card (one per
    /// checklist block), a step done or ticked closes its card.
    pub(super) fn page_steps(&mut self, id: &str) {
        // one mechanism (ambient-lead m_6005): only a checklist marked
        // data-plan makes step cards (the filter on `due` below). A
        // promises page or a meeting page has none, so its rows of his
        // show in sb page waiting and the state's overdue count only.
        let Some(pages) = self.pg.pages.clone() else { return };
        let Some(meta) = pages.store.meta(id) else { return };
        let html = pages.store.html(id, meta.version()).unwrap_or_default();
        let rows = crate::pages::checklist::judged(&html, &pages.store.questions(id));
        let mut steps = pages.store.steps(id);
        let notes = pages.store.notes(id);
        // drafts batch on any page but a promises or meeting page (never a
        // card there): a feedback page's replies have no plan (pm's C fail
        // 42: 3 Slack replies and no card)
        let drafts = match crate::pages::drafts::carded(id) {
            // (a draft whose item's agent is still at work waits: m_6168)
            true => crate::pages::drafts::ready(&html, crate::pages::drafts::pending(&html, &notes, &pages.store.questions(id)), &|a| pages.held(id, a, meta.version())),
            false => Vec::new(),
        };
        if steps.is_empty() && !rows.iter().any(|r| r.his() && r.plan) && drafts.len() < 2 {
            return;
        }
        let closed = |r: &crate::pages::checklist::Row| crate::pages::checklist::closed_by(r, &notes);
        // cards only for a plan he works through with bise (data-plan):
        // a meeting's or a promise's rows of his reach him by sb page
        // waiting and the count (ambient-lead m_5988)
        let mut due: Vec<crate::pages::checklist::Row> =
            crate::pages::checklist::due(&rows, &closed).into_iter().filter(|r| r.plan).cloned().collect();
        let open: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        let mut changed = false;
        // two or more drafts waiting at once are ONE card (ambient-lead
        // m_5977): its drafted steps get no card of their own
        let batch_open = steps.iter().any(|s| s.block == crate::pages::checklist::BATCH && s.reply.is_none());
        if drafts.len() >= 2 || (batch_open && !drafts.is_empty()) {
            due.retain(|r| !r.drafted);
            let mut kept: Vec<crate::pages::checklist::Step> = Vec::new();
            for s in std::mem::take(&mut steps) {
                if s.drafted && s.reply.is_none() {
                    // a drafted step's own card: the batch card asks it now
                    self.page_cards().remove(&s.card);
                    if open.contains(&s.card) {
                        self.step(Input::ConfirmClose { card: s.card, res: "replaced".into() });
                    }
                    changed = true;
                    continue;
                }
                kept.push(s);
            }
            steps = kept;
        }
        changed |= self.page_batch(id, &meta.title, &mut steps, &drafts, &open);
        for s in steps.iter_mut().filter(|s| s.reply.is_none() && s.block != crate::pages::checklist::BATCH) {
            let still = due.iter().any(|r| r.block == s.block && r.item == s.item);
            if still && open.contains(&s.card) {
                continue;
            }
            // done (republished, ticked on the page) or closed another way
            s.reply = Some(if still { String::new() } else { "done".into() });
            self.page_cards().remove(&s.card);
            if open.contains(&s.card) {
                self.step(Input::ConfirmClose { card: s.card, res: "ticked".into() });
            }
            changed = true;
        }
        // a drafted step's card waits while the page asks him anything:
        // its draft may need that answer (legal's address), and two cards
        // at once read as one muddle (pm's D fail 31, m_5870)
        let asking = pages.store.questions(id).iter().any(|q| q.reply.is_none());
        for r in &due {
            if steps.iter().any(|s| s.block == r.block && s.item == r.item) {
                continue;
            }
            if r.drafted && asking {
                continue;
            }
            // nor while its draft cannot leave (no recipient yet): his
            // send would do nothing (pm's D fail 37)
            if r.drafted && r.draft.as_deref().is_some_and(|d| !crate::pages::checklist::draft_sendable(&html, d)) {
                continue;
            }
            let mut s = crate::pages::checklist::Step {
                block: r.block.clone(),
                item: r.item.clone(),
                text: r.text.clone(),
                card: 0,
                reply: None,
                drafted: r.drafted,
                ..Default::default()
            };
            let before: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
            // main asks (sb-core's cards are main's, pm's 25); its answer
            // is the hub's own path (page_card_answer → page_tick)
            self.step(Input::Agent {
                token: 0,
                from: MAIN.to_string(),
                req: crate::core::AgentReq::Card { text: s.card_text(), for_msg: None },
            });
            match self.hub.st.open_cards().filter(|c| !before.contains(&c.id) && c.kind == "question").map(|c| c.id).max() {
                Some(card) => {
                    s.card = card;
                    self.page_cards().insert(card, (id.to_string(), Self::step_key(&r.block, &r.item)));
                }
                None => {
                    log_line(&self.opts.paths, &format!("page {id}: no card opened for step {}", r.item));
                    s.reply = Some(String::new());
                }
            }
            steps.push(s);
            changed = true;
        }
        if changed {
            if let Err(e) = pages.locked(|st| st.save_steps(id, &steps)) {
                log_line(&self.opts.paths, &format!("page {id}: steps not saved: {e}"));
            }
            pages.push("", "pages", &json!({"pages": pages.list_json()}));
        }
    }

    /// Main asks a page's card (sb-core's cards are main's, pm's 25);
    /// `key` maps it back to the page's own answer path. None: no card.
    pub(super) fn open_page_card(&mut self, id: &str, text: String, key: String) -> Option<u64> {
        let before: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        self.step(Input::Agent { token: 0, from: MAIN.to_string(), req: crate::core::AgentReq::Card { text, for_msg: None } });
        let card = self.hub.st.open_cards().filter(|c| !before.contains(&c.id) && c.kind == "question").map(|c| c.id).max()?;
        self.page_cards().insert(card, (id.to_string(), key));
        Some(card)
    }

    /// Page `id`'s batch card (ambient-lead m_5977): open while two or
    /// more drafts wait (and until its last one is sent or skipped); a
    /// draft it lacks replaces it with one for them all. True: `steps`
    /// changed.
    pub(super) fn page_batch(&mut self, id: &str, title: &str, steps: &mut Vec<crate::pages::checklist::Step>, drafts: &[crate::pages::drafts::Draft], open: &[u64]) -> bool {
        use crate::pages::checklist::{Step, BATCH};
        let keys: Vec<String> = drafts.iter().map(|d| d.key()).collect();
        let mut changed = false;
        let mut have = false;
        let mut replaced = false;
        for s in steps.iter_mut().filter(|s| s.block == BATCH && s.reply.is_none()) {
            let covers = keys.iter().all(|k| s.batch.contains(k));
            let (res, reply) = match (drafts.is_empty(), covers, open.contains(&s.card)) {
                // all sent or skipped
                (true, _, _) => ("done", "done"),
                // a draft it lacks: one card for them all
                (false, false, _) => ("replaced", ""),
                (false, true, true) => {
                    have = true;
                    continue;
                }
                // closed another way (dismissed): not asked again for
                // the same drafts
                (false, true, false) => ("", ""),
            };
            replaced |= res == "replaced";
            s.reply = Some(reply.into());
            self.page_cards().remove(&s.card);
            if open.contains(&s.card) {
                self.step(Input::ConfirmClose { card: s.card, res: res.into() });
            }
            changed = true;
        }
        let dismissed = steps
            .iter()
            .any(|s| s.block == BATCH && s.reply.as_deref() == Some("") && keys.iter().all(|k| s.batch.contains(k)));
        let new = drafts.len() >= 2 || (replaced && !drafts.is_empty());
        if have || !new || dismissed {
            return changed;
        }
        // one batch card per page, ever (pm's C fail 43): any other open
        // one of this page closes as replaced before the new one opens
        let stale: Vec<u64> = self
            .page_cards()
            .iter()
            .filter(|(c, (p, k))| p == id && k.starts_with("drafts:") && open.contains(c))
            .map(|(c, _)| *c)
            .collect();
        for c in stale {
            self.page_cards().remove(&c);
            self.step(Input::ConfirmClose { card: c, res: "replaced".into() });
            for s in steps.iter_mut().filter(|s| s.card == c && s.reply.is_none()) {
                s.reply = Some(String::new());
            }
        }
        let first = &drafts[0];
        let mut s = Step {
            block: BATCH.into(),
            item: "drafts".into(),
            text: crate::pages::drafts::batch_text(drafts, title),
            batch: keys,
            info: crate::pages::drafts::info(drafts, title),
            ..Step::default()
        };
        match self.open_page_card(id, s.card_text(), format!("drafts:{}:{}", first.block, first.anchor())) {
            Some(card) => s.card = card,
            None => {
                log_line(&self.opts.paths, &format!("page {id}: no card opened for its {} drafts", drafts.len()));
                s.reply = Some(String::new());
            }
        }
        steps.push(s);
        true
    }

    /// His answer on a batch card: send all = an approve note per draft
    /// it holds that still waits, one notes message to the page's agent
    /// (main when it is gone), the card closes. Review (2) or other
    /// words: the card stays (the capsule opens the page at the first).
    pub(super) fn page_drafts_answer(&mut self, id: &str, card: u64, reply: &str) -> bool {
        let Some(pages) = self.pg.pages.clone() else { return false };
        let Some(meta) = pages.store.meta(id) else { return false };
        if !crate::pages::drafts::is_send_all(reply) {
            return true;
        }
        let mut steps = pages.store.steps(id);
        let Some(keys) = steps.iter().find(|s| s.card == card && s.reply.is_none()).map(|s| s.batch.clone()) else { return false };
        let sent = self.page_approve_drafts(id, Some(&keys));
        for s in steps.iter_mut().filter(|s| s.card == card && s.reply.is_none()) {
            s.reply = Some("send all".into());
        }
        if let Err(e) = pages.locked(|st| st.save_steps(id, &steps)) {
            log_line(&self.opts.paths, &format!("page {id}: steps not saved: {e}"));
        }
        self.page_cards().remove(&card);
        if self.hub.st.open_cards().any(|c| c.id == card) {
            self.step(Input::ConfirmClose { card, res: "answered".into() });
        }
        self.page_send_approves(id, &meta, &sent);
        self.page_steps(id);
        true
    }

    /// An approve note for each draft of page `id` that waits now (only
    /// those in `keys` when given); the notes it wrote.
    pub(super) fn page_approve_drafts(&mut self, id: &str, keys: Option<&[String]>) -> Vec<crate::pages::store::Note> {
        let Some(pages) = self.pg.pages.clone() else { return Vec::new() };
        let Some(meta) = pages.store.meta(id) else { return Vec::new() };
        let html = pages.store.html(id, meta.version()).unwrap_or_default();
        let drafts = crate::pages::drafts::ready(&html, crate::pages::drafts::pending(&html, &pages.store.notes(id), &pages.store.questions(id)), &|a| pages.held(id, a, meta.version()));
        let mut sent = Vec::new();
        for d in drafts.iter().filter(|d| keys.is_none_or(|k| k.contains(&d.key()))) {
            match pages.locked(|s| s.add_sent(id, &d.block, d.item.as_deref(), "approve", "send", meta.version(), now_ms())) {
                Ok(n) => sent.push(n),
                Err(e) => log_line(&self.opts.paths, &format!("page {id}: an approve not saved: {e}")),
            }
        }
        sent
    }

    /// The approves written: the page hears them, its agent (main when
    /// gone) gets one notes message.
    pub(super) fn page_send_approves(&mut self, id: &str, meta: &crate::pages::store::Meta, sent: &[crate::pages::store::Note]) {
        let Some(pages) = self.pg.pages.clone() else { return };
        if sent.is_empty() {
            return;
        }
        pages.push(id, "notes", &json!({"notes": pages.store.notes(id)}));
        let msg = crate::pages::store::notes_message(meta, &pages.url(id), sent);
        self.page_msg(crate::pages::PageMsg::Sent { id: id.to_string(), agent: meta.agent.clone(), text: msg });
    }

    /// An answer on a batch card that was replaced or closed (pm's C fail
    /// 43: his 'send all 6' on a replaced card did nothing): send all acts
    /// on the page's current drafts (its open batch card, else the drafts
    /// that wait); other words say in one line what the card is now. Never
    /// silently nothing. False: no batch card of a page.
    pub(super) fn page_old_batch_answer(&mut self, client: ClientId, card: u64, reply: &str) -> bool {
        use crate::pages::checklist::BATCH;
        let Some(pages) = self.pg.pages.clone() else { return false };
        let Some(id) = pages.store.list().into_iter().map(|m| m.id).find(|id| pages.store.steps(id).iter().any(|s| s.block == BATCH && s.card == card)) else {
            return false;
        };
        let Some(meta) = pages.store.meta(&id) else { return false };
        let open: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        let now = pages.store.steps(&id).into_iter().find(|s| s.block == BATCH && s.reply.is_none() && open.contains(&s.card));
        let say = match (now, crate::pages::drafts::is_send_all(reply)) {
            (Some(s), true) => {
                self.page_drafts_answer(&id, s.card, reply);
                None
            }
            (None, true) => {
                let sent = self.page_approve_drafts(&id, None);
                if sent.is_empty() {
                    Some(format!("that card is closed: nothing waits on {} now.", meta.title))
                } else {
                    self.page_send_approves(&id, &meta, &sent);
                    self.page_steps(&id);
                    None
                }
            }
            (Some(s), false) => Some(format!("that card changed: {}", s.text.replace('\n', " · "))),
            (None, false) => Some(format!("that card is closed: nothing waits on {} now.", meta.title)),
        };
        log_line(&self.opts.paths, &format!("page {id}: an answer on old batch card #{card}: {reply:?} → {}", say.as_deref().unwrap_or("sent the current drafts")));
        if let (Some(text), Some(c)) = (say, self.clients.get_mut(&client)) {
            write_json(c, &json!({"ev": "notice", "text": text}));
        }
        true
    }

    /// A step ticked from its card or by voice (`sb page tick`): a sent
    /// tick note on its row, the page hears `ticked`, the page's agent
    /// gets the notes message (main when it is gone), its card closes and
    /// the next step's turn comes. `text`: the user's words when they are
    /// not a plain "done". False: no such row.
    pub(super) fn page_tick(&mut self, id: &str, item: &str, text: &str) -> bool {
        let Some(pages) = self.pg.pages.clone() else { return false };
        let Some(meta) = pages.store.meta(id) else { return false };
        let rows = pages.store.html(id, meta.version()).map(|h| crate::pages::checklist::rows_of(&h)).unwrap_or_default();
        let Some(row) = rows.iter().find(|r| r.item == item) else { return false };
        let go = crate::pages::checklist::is_done_word(text) || text.trim().eq_ignore_ascii_case("send");
        let (kind, words) = match (go, row.drafted) {
            // a drafted step's "send": an approve of its draft, so the
            // page's agent sends it (pm's D fail 30)
            (true, true) => ("approve", "send"),
            (true, false) => ("tick", "done"),
            (false, _) => ("note", text.trim()),
        };
        let (block, on) = match (kind, row.draft.as_deref()) {
            ("approve", Some(d)) => (d.to_string(), None),
            _ => (row.block.clone(), Some(item)),
        };
        let note = match pages.locked(|s| s.add_sent(id, &block, on, kind, words, meta.version(), now_ms())) {
            Ok(n) => n,
            Err(e) => {
                log_line(&self.opts.paths, &format!("page {id}: the tick not saved: {e}"));
                return false;
            }
        };
        if kind == "tick" {
            pages.push(id, "ticked", &json!({"block": row.block, "item": item}));
        }
        pages.push(id, "notes", &json!({"notes": pages.store.notes(id)}));
        // its card: closed by this answer, never reopened for words
        let mut steps = pages.store.steps(id);
        let open: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        for s in steps.iter_mut().filter(|s| s.item == item && s.block == row.block && s.reply.is_none()) {
            s.reply = Some(words.to_string());
            self.page_cards().remove(&s.card);
            if open.contains(&s.card) {
                self.step(Input::ConfirmClose { card: s.card, res: "answered".into() });
            }
        }
        if let Err(e) = pages.locked(|st| st.save_steps(id, &steps)) {
            log_line(&self.opts.paths, &format!("page {id}: steps not saved: {e}"));
        }
        let msg = crate::pages::store::notes_message(&meta, &pages.url(id), &[note]);
        self.page_msg(crate::pages::PageMsg::Sent { id: id.to_string(), agent: meta.agent.clone(), text: msg });
        self.page_steps(id);
        true
    }

    /// `/answer N reply` on a step's card: the step ticked (or the words
    /// as a note on its row), never the hub's question path. False: not
    /// a step's card.
    pub(super) fn page_step_answer(&mut self, client: ClientId, text: &str) -> bool {
        let Some(rest) = text.trim().strip_prefix("/answer ") else { return false };
        let Some((n, reply)) = rest.trim().split_once(' ') else { return false };
        let Ok(card) = n.trim_start_matches('#').parse::<u64>() else { return false };
        let Some((id, key)) = self.page_cards().get(&card).cloned() else { return self.page_old_batch_answer(client, card, reply) };
        if key.starts_with("drafts:") {
            return self.page_drafts_answer(&id, card, reply);
        }
        match key.strip_prefix("row:").and_then(|k| k.split_once('/')).map(|(_, i)| i.to_string()) {
            Some(item) => self.page_tick(&id, &item, reply),
            None => self.page_question_answer(&id, &key, card, reply),
        }
    }

    /// A page question's card answered (from the TUI, the capsule or the
    /// page): the card closes, and the answer takes the page's path: the
    /// page hears `answered`, the page's agent gets it as a pick note
    /// (main when it is gone). sb-core's question path would send it to
    /// main, the card's asker (pm's 25: a task's page).
    pub(super) fn page_question_answer(&mut self, id: &str, block: &str, card: u64, reply: &str) -> bool {
        let Some(pages) = self.pg.pages.clone() else { return false };
        let reply = reply.trim();
        let words = match reply.parse::<usize>() {
            Ok(k) => pages.store.questions(id).iter().find(|q| q.block == block).and_then(|q| q.option(k).map(String::from)),
            Err(_) => None,
        }
        .unwrap_or_else(|| reply.to_string());
        if words.is_empty() {
            return false;
        }
        self.page_cards().remove(&card);
        if self.hub.st.open_cards().any(|c| c.id == card) {
            self.step(Input::ConfirmClose { card, res: "answered".into() });
        }
        self.page_answer_without_card(id, block, &words);
        true
    }

    /// The card of question `block` on page `id`, when it is still open.
    pub(super) fn page_card(&mut self, id: &str, block: &str) -> Option<u64> {
        let card = self.page_cards().iter().find(|(_, (p, b))| p == id && b == block).map(|(c, _)| *c)?;
        self.hub.st.open_cards().any(|c| c.id == card).then_some(card)
    }

    /// `/answer N reply` on a page question's card (from the TUI, the
    /// capsule or the page): an option's number becomes its words (the
    /// agent reads words), kept until the card closes.
    pub(super) fn page_reply_text(&mut self, text: &str) -> Option<String> {
        let rest = text.trim().strip_prefix("/answer ")?;
        let (n, reply) = rest.trim().split_once(' ')?;
        let card: u64 = n.trim_start_matches('#').parse().ok()?;
        let (id, block) = self.page_cards().get(&card).cloned()?;
        let pages = self.pg.pages.clone()?;
        let reply = reply.trim().to_string();
        let words = match reply.parse::<usize>() {
            Ok(k) => pages.store.questions(&id).iter().find(|q| q.block == block).and_then(|q| q.option(k).map(String::from)),
            Err(_) => None,
        }
        .unwrap_or(reply);
        self.pg.page_replies.insert(card, words.clone());
        Some(format!("/answer {card} {words}"))
    }

    /// The page questions whose cards closed: the answer goes on the page
    /// (`answered {block, reply}` on its SSE; "" when the card closed
    /// without one: withdrawn by main, closed by the user).
    pub(super) fn page_answers(&mut self) {
        let Some(pages) = self.pg.pages.clone() else { return };
        let open: Vec<u64> = self.hub.st.open_cards().map(|c| c.id).collect();
        let closed: Vec<(u64, String, String)> = self
            .page_cards()
            .iter()
            .filter(|(c, _)| !open.contains(c))
            .map(|(c, (p, b))| (*c, p.clone(), b.clone()))
            .collect();
        if closed.is_empty() {
            return;
        }
        for (card, id, block) in closed {
            self.page_cards().remove(&card);
            if block.starts_with("row:") {
                // a step's card closed another way (the user closed it):
                // it stays closed; a tick still ticks the row
                let mut steps = pages.store.steps(&id);
                for s in steps.iter_mut().filter(|s| s.card == card && s.reply.is_none()) {
                    s.reply = Some(String::new());
                }
                if let Err(e) = pages.locked(|s| s.save_steps(&id, &steps)) {
                    log_line(&self.opts.paths, &format!("page {id}: steps not saved: {e}"));
                }
                continue;
            }
            let reply = self.pg.page_replies.remove(&card);
            let mut qs = pages.store.questions(&id);
            if let Some(q) = qs.iter_mut().find(|q| q.card == card) {
                match &reply {
                    Some(r) => q.reply = Some(r.clone()),
                    // closed with no answer (withdrawn, closed by the user,
                    // a card this hub never had: a copied page, pm's 409):
                    // the question stays open on the page, a pick there
                    // still goes (as a pick note); a republish opens no
                    // card until its words or options change (m_6091)
                    None => {
                        q.card = 0;
                        q.dismissed = true;
                    }
                }
            }
            if let Err(e) = pages.locked(|s| s.save_questions(&id, &qs)) {
                log_line(&self.opts.paths, &format!("page {id}: questions not saved: {e}"));
            }
            if let Some(r) = reply {
                pages.push(&id, "answered", &json!({"block": block, "reply": r}));
            }
        }
        pages.push("", "pages", &json!({"pages": pages.list_json()}));
    }

    /// What reaches main from a page (notes, starts, picks, ticks) carries
    /// this line: main answers on the page, and the capsule never shows
    /// that turn's words (ambient-lead m_5724, pm's 27; ambient-core
    /// reads the same marker).
    pub(super) fn page_hint(to: &str, text: String) -> String {
        if to != MAIN {
            return text;
        }
        format!("{text}

{PAGE_HINT}")
    }
}
