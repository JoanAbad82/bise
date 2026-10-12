//! The hub's mirror of sb-core's state (issue 21, hot-view): each view
//! sb-core answers (a step's, `view_all`'s) read as a typed
//! `bise_proto::core::View` and stored in `Hub.st`. sb-core is the only
//! source of truth; the mirror adds only the runtime facts the hub owns
//! (an agent's activity, its place, the approvals gate's `on_you`).
//!
//! A step's view carries only what the step changed (`all_agents` false:
//! the agents it changed; the order, cards, notes, timers and watches only
//! when an event changed them): the rest of the mirror stays. A view that
//! doesn't decode is logged and the mirror kept; the step's effects still
//! run (core_link.rs `apply_step`).

use super::*;

impl Hub {
    /// Store the state sb-core sent, read as a `View`. A view that doesn't
    /// decode (a bug of sb-core's encoder) is logged and the mirror kept.
    pub(super) fn load_view(&mut self, v: &Value) {
        match View::decode(v) {
            Ok(view) => self.load(view),
            Err(e) => eprintln!("sb-core: {} (skipped, the mirror kept): {}", e, v),
        }
    }

    fn load(&mut self, v: View) {
        let mut agents = BTreeMap::new();
        for a in v.agents {
            let name = a.name;
            let declared = parse::<ViewDecl>(&a.declared).map(|d| (d.status, d.note));
            let mut agent = Agent {
                name: name.clone(),
                dir: a.dir,
                is_main: a.is_main,
                parent: a.parent,
                brief: parse(&a.brief).unwrap_or_default(),
                created_ms: a.created_ms,
                ws: parse(&a.ws).unwrap_or_else(|| panic!("sb-core: bad ws {}", a.ws)),
                lifecycle: parse_str(&a.lifecycle).unwrap_or(Lifecycle::Active),
                failure: a.failure,
                declared,
                last_report: parse(&a.last_report),
                aliases: a.aliases,
                files: a.files.into_iter().collect(),
                snapshot_ref: a.snapshot_ref,
                follow: a.follow,
                run: run_of(&a.run),
                waiting: a.waiting,
                waiting_on: a.waiting_on,
                turn_started_ms: a.turn_ms,
                turns_ended: a.turns,
                activity: self.activity.get(&name).cloned(),
                place: None,
                place_branch: None,
            };
            agent.place = self.place_of(&agent);
            agent.place_branch = self.place_branch_of(&agent);
            if self.on_you.contains(&agent.name) {
                agent.waiting = true;
                agent.waiting_on = Some("you".into());
            }
            agents.insert(name, agent);
        }
        // idle-cpu: the order, the cards and the notes change only by an
        // event: a step with none leaves them out (view.bend `order_when`)
        if let Some(order) = v.order {
            self.st.order = order;
        }
        // hub-lag, idle-cpu: a step's view leaves out the agents it did
        // not change (view.bend `changed`; an idle tick sends none): keep
        // them as they are, minus the ones gone from the order (a rename)
        if !v.all_agents {
            let order: BTreeSet<&String> = self.st.order.iter().collect();
            for (name, a) in std::mem::take(&mut self.st.agents) {
                if order.contains(&name) && !agents.contains_key(&name) {
                    agents.insert(name, a);
                }
            }
        }
        self.st.agents = agents;
        if v.all_msgs {
            self.st.clear_msgs();
        }
        for r in v.msgs {
            let Some(m) = parse::<Msg>(&r.msg) else { continue };
            self.st.put_msg(m, parse(&r.state), r.settled, Hot { queued: r.queued, owes: r.owes });
        }
        if let Some(cards) = v.cards {
            self.st.cards = cards.iter().filter_map(|c| parse(c).map(|c: Card| (c.id, c))).collect();
        }
        if let Some(notes) = v.notes {
            self.st.main_notes = notes;
        }
        // sb every's timers: only in a view whose step changed them
        if let Some(t) = v.timers {
            self.st.timers.load_live(&t);
        }
        if let Some(t) = v.timers_ended {
            self.st.timers.load_ended(&t);
        }
        // sb wake's watches: likewise
        if let Some(w) = v.wakes {
            self.st.wakes.load_live(&w);
        }
        if let Some(w) = v.wakes_ended {
            self.st.wakes.load_ended(&w);
        }
        self.st.next_msg = v.next_msg;
        self.st.next_card = v.next_card;
        self.st.paused = v.paused;
    }
}

/// A string field of the view as one of the model's enums (`lifecycle`).
fn parse_str<T: serde::de::DeserializeOwned>(s: &str) -> Option<T> {
    use serde::de::IntoDeserializer;
    T::deserialize(IntoDeserializer::<serde::de::value::Error>::into_deserializer(s)).ok()
}

/// A view row's `declared` (`sb status`): null when none.
#[derive(serde::Deserialize)]
struct ViewDecl {
    status: Declared,
    #[serde(default)]
    note: String,
}

fn run_of(s: &str) -> Run {
    match s {
        "starting" => Run::Starting,
        "idle" => Run::Idle,
        "busy" => Run::Busy,
        _ => Run::Down,
    }
}
