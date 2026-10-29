//! sb-core's state from a photo (issue 36 chunk 4): the boot and a
//! revival restore sb-core's photo, then replay only the journal events
//! after it. Which photo fits the journal is crate::photo's call; this
//! side sends it. Out of core.rs (its line limit), with the revival it
//! serves (BISE-292).

use super::*;

/// The photo that fits a journal's events: (k, its state), or none.
pub type PhotoOf = Box<dyn FnMut(&[Value]) -> Option<(usize, Value)>>;

/// What the hub needs to restart a dead sb-core (BISE-292): the journal
/// (the durable state, replayed into the new one) and hub.log; and, when
/// the daemon has one, the photo that fits that journal (issue 36).
pub struct Revive {
    pub journal: Box<dyn FnMut() -> Vec<Value>>,
    pub log: Box<dyn Fn(&str)>,
    /// The photo that fits these events: (k, its state).
    pub photo: Option<PhotoOf>,
    /// When the last restarts happened (ms): a crash loop gives up.
    times: Vec<u64>,
}

impl Revive {
    pub fn new(journal: Box<dyn FnMut() -> Vec<Value>>, log: Box<dyn Fn(&str)>) -> Revive {
        Revive { journal, log, photo: None, times: Vec::new() }
    }

    pub fn with_photo(mut self, photo: PhotoOf) -> Revive {
        self.photo = Some(photo);
        self
    }
}

/// How a boot rebuilt the state.
#[derive(Debug)]
pub struct Rebuilt {
    /// the events sb-core did not apply (a kind it does not know)
    pub skipped: Vec<Value>,
    /// Ok(k): from the photo of the first k events; Err(why): a full
    /// replay, the photo refused by sb-core (`why`, for hub.log) or none
    pub photo: Result<usize, String>,
}

impl Hub {
    /// sb-core's durable state (the `photo` step); none while a step of
    /// its waits on the hub (a need) or on a decode failure.
    pub fn photo(&mut self) -> Option<Value> {
        let out = self.call(&Link::Photo(cl::Photo {}).to_value())?;
        out.get("st").cloned().filter(Value::is_object)
    }

    /// `replay_with`, from a photo when one fits: sb-core restores it
    /// (a fresh sb-core only, law restore_only_fresh), then replays
    /// events[k..]. The hub's own PR lines are read from every event,
    /// the photo's too (sb-core never holds them). A photo sb-core
    /// refuses: the full replay, as without one.
    pub fn rebuild(&mut self, events: &[Value], from: Option<(usize, Value)>, progress: &mut dyn FnMut(usize, usize)) -> Rebuilt {
        let Some((k, st)) = from else {
            return Rebuilt { skipped: self.replay_with(events, progress), photo: Err("no photo".into()) };
        };
        let out = self.raw(&Link::RestorePhoto(cl::RestorePhoto { st }).to_value());
        if let Some(e) = out.get("error") {
            let why = format!("sb-core refused the photo: {}", one_line(&e.to_string()));
            return Rebuilt { skipped: self.replay_with(events, progress), photo: Err(why) };
        }
        let k = k.min(events.len());
        for ev in events[..k].iter().filter(|ev| crate::forge::is_pr_line(ev)) {
            crate::forge::read_line(&mut self.pr_known, ev);
            self.pr_news.read_journal(ev);
        }
        Rebuilt { skipped: self.replay_with(&events[k..], progress), photo: Ok(k) }
    }

    /// A new sb-core with the durable state of the journal and the REPL
    /// states of the old one (the REPLs themselves never stopped).
    pub(super) fn restart_core(&mut self, why: &str) {
        let Some(r) = self.revive.as_mut() else {
            panic!("sb-core: {}", why);
        };
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as u64);
        r.times.retain(|t| now.saturating_sub(*t) < REVIVE_WINDOW_MS);
        if r.times.len() >= REVIVE_LIMIT {
            (r.log)(&format!("sb-core stopped ({}): {} restarts in {} s, the hub stops", why, REVIVE_LIMIT, REVIVE_WINDOW_MS / 1000));
            panic!("sb-core: {} ({} restarts in {} s)", why, REVIVE_LIMIT, REVIVE_WINDOW_MS / 1000);
        }
        r.times.push(now);
        (r.log)(&format!("sb-core stopped ({}): restarting it on the journal", why));
        let events = (r.journal)();
        let from = r.photo.as_mut().and_then(|p| p(&events));
        self.link = CoreLink::start(&self.core_bin).unwrap_or_else(|e| panic!("sb-core: {} (and it cannot restart: {})", why, e));
        let runs: Vec<(String, Run)> = self
            .st
            .agents
            .values()
            .filter(|a| a.run != Run::Down)
            .map(|a| (a.name.clone(), a.run))
            .collect();
        self.raw(&Link::Init(cl::Init { workspace: self.workspace.clone() }).to_value());
        let rebuilt = self.rebuild(&events, from, &mut |_, _| {});
        for (agent, run) in runs {
            self.raw(&force_run_input(&agent, run));
        }
        let out = self.raw(&Link::ViewAll(cl::ViewAll {}).to_value());
        self.load_answer_view(&out);
        if let Some(r) = self.revive.as_ref() {
            let how = match &rebuilt.photo {
                Ok(k) => format!("from the photo of {} events, {} replayed", k, events.len() - k),
                Err(why) => format!("{} journal events replayed ({})", events.len(), why),
            };
            (r.log)(&format!("sb-core restarted: {} ({} skipped)", how, rebuilt.skipped.len()));
        }
        self.revived.push(format!(
            "sb-core, the hub's state machine, stopped ({}): restarted, its state rebuilt from the journal. the agents kept running",
            why
        ));
    }
}
