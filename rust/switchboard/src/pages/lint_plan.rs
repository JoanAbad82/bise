//! The lint of a plan an agent proposes (plan-ok, pages/plan.rs): one
//! `plan` block a page, with its verb (`data-do`) and who runs it
//! (`data-agent`); its other ways a `compare` with `data-for` naming it,
//! each item with its own `data-do`. Out of lint.rs (its line limit).

use super::Linter;

impl Linter<'_> {
    /// A block's plan attributes: a plan's verb and agent, `data-started`
    /// on a plan only, `data-for` on a compare only. The compare's plan
    /// (checked at the end, [`Linter::plan_end`]), when it names one.
    pub(super) fn plan_block(&mut self, at: &str, kit: Option<&str>, what: Option<String>, agent: Option<String>, started: Option<String>, plan_for: Option<String>) -> Option<String> {
        if kit == Some("plan") {
            match &what {
                None => self.err(at, "a plan block needs data-do: its verb, the notification's first choice (data-do=\"start the plan\")".into()),
                Some(d) if d.trim().is_empty() || d.chars().count() > 40 => self.err(at, format!("data-do=\"{d}\" says the start in a few words, 40 characters at most (start the plan)")),
                _ => {}
            }
        }
        match (kit, agent) {
            (Some("plan"), None) => self.err(at, "a plan block needs data-agent: the agent that runs it (you: data-agent=\"<your name>\")".into()),
            (Some("plan"), Some(a)) if a.is_empty() || a.len() > 40 || !a.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') => {
                self.err(at, format!("data-agent=\"{a}\" is not an agent name: lowercase letters, digits and -"))
            }
            (Some("plan"), Some(_)) => self.plans.push(at.to_string()),
            (_, Some(_)) => self.err(at, "data-agent is not a kit attribute here: only a plan block, or an item, takes it".into()),
            _ => {}
        }
        if started.is_some() && kit != Some("plan") {
            self.err(at, "data-started is not a kit attribute here: only a plan block, or one of its other ways, takes it".into());
        }
        match (kit, &plan_for) {
            (Some("compare"), Some(p)) => self.plan_for.push((at.to_string(), p.clone())),
            (_, Some(_)) => self.err(at, "data-for is not a kit attribute here: only a compare of a plan's other ways takes it".into()),
            _ => {}
        }
        plan_for
    }

    /// An other way of a plan says its verb, the notification's choice.
    pub(super) fn plan_way(&mut self, at: &str, todo: Option<String>) {
        match todo {
            None => self.err(at, "an other way of a plan needs data-do: its verb, the notification's choice (data-do=\"start it, but keep win32\")".into()),
            Some(d) if d.trim().is_empty() || d.chars().count() > 40 => self.err(at, format!("data-do=\"{d}\" says the choice in a few words, 40 characters at most (start it, but keep win32)")),
            _ => {}
        }
    }

    /// One plan a page; each compare of other ways names it.
    pub(super) fn plan_end(&mut self) {
        let extra: Vec<String> = self.plans.iter().skip(1).cloned().collect();
        for at in extra {
            self.err(&at, "a second plan block: a page proposes one plan; the other ways go in a compare with data-for=\"<the plan's id>\"".into());
        }
        for (at, plan) in std::mem::take(&mut self.plan_for) {
            if !self.plans.contains(&plan) {
                self.err(&at, format!("data-for=\"{plan}\" names no plan block: the data-id of the plan these are the other ways of"));
            }
        }
    }
}
