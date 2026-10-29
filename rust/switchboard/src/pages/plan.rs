//! A plan an agent proposes (plan-ok, Gabriel's pick A from Benjamin's
//! feedback): one `plan` block (its name, a one or two sentence gist,
//! its parts in order, `data-agent` who runs it, `data-do` its verb) and
//! the other ways to do it, a `compare` with `data-for="<plan>"`, each
//! item with its own `data-do`. One pick starts it; a change is typed to
//! the agent, who publishes the next version. Never approve or skip per
//! part.
//!
//! Pure here: the plan of a fragment, its notification's words and
//! options, and what his words on that notification do. The hub opens
//! the card (daemon/page_plan.rs) and sb-core decides who asks it.

use super::checklist::attr;
use super::questions::text_of;

/// The notification's last option: the page, never a message.
pub const OPEN: &str = "open the plan and its alternatives";
/// The same with no alternative on the page.
pub const OPEN_ALONE: &str = "open the plan";
/// At most this many alternatives are options on the notification (4
/// rows with the start and the page, designer m_26765); a 3rd lives on
/// the page, reached by 'open the plan and its alternatives'.
pub const MAX_ALTS: usize = 2;

/// One other way to do it: an item of the plan's compare.
#[derive(Clone, Debug, PartialEq)]
pub struct Alt {
    pub item: String,
    /// its verb, the option's words ('start it, but keep win32')
    pub todo: String,
    pub name: String,
    /// `data-started` on it: the time it was started ('11:42')
    pub started: Option<String>,
}

/// The plan of a page.
#[derive(Clone, Debug, PartialEq)]
pub struct Plan {
    pub block: String,
    /// who runs it (`data-agent`)
    pub agent: String,
    /// its verb (`data-do`, 'start the plan')
    pub todo: String,
    pub name: String,
    /// the gain and the parts, one or two whole sentences (its first <p>)
    pub gist: String,
    /// the parts in order: (item id, title)
    pub parts: Vec<(String, String)>,
    /// `data-started` on the block: the time it was started
    pub started: Option<String>,
    pub alts: Vec<Alt>,
    /// the compare block of its other ways
    pub ways: Option<String>,
}

impl Plan {
    /// Started from either door: the plan or one of its other ways.
    pub fn is_started(&self) -> bool {
        self.started.is_some() || self.alts.iter().any(|a| a.started.is_some())
    }

    /// The notification's options, in order: its verb, each other way
    /// (2 at most), then the page.
    pub fn choices(&self) -> Vec<String> {
        let mut out = vec![self.todo.clone()];
        out.extend(self.alts.iter().take(MAX_ALTS).map(|a| a.todo.clone()));
        out.push(if self.alts.is_empty() { OPEN_ALONE } else { OPEN }.to_string());
        out
    }

    /// The notification (notif-words, designer's spec for pick A): the
    /// question naming the page and the agent, the gist whole (never a
    /// cut list), then the options numbered. The head ('<agent> proposes
    /// a plan') and the hint ('or type what to change: <agent> reads
    /// it') are the clients', from the card's kind and agent.
    pub fn card_text(&self, title: &str) -> String {
        let q = format!("{} the plan {} recommends?", self.todo.split_whitespace().next().unwrap_or("start"), self.agent);
        let q = match title.trim() {
            "" => q,
            t => format!("{t}: {q}"),
        };
        let opts: Vec<String> = self.choices().iter().enumerate().map(|(i, c)| format!("{}. {c}", i + 1)).collect();
        // a blank line before the options: a gist that starts with a
        // number ('3 PRs, …') is never read as one of them
        format!("{q}\n{}\n\n{}", self.gist, opts.join("\n"))
    }

    /// What a start note on `block` (and `item`) starts: the plan, its
    /// other way n, or nothing of it.
    pub fn start_of(&self, block: &str, item: Option<&str>) -> Option<PlanAnswer<'static>> {
        if block == self.block {
            return Some(PlanAnswer::Start);
        }
        if self.ways.as_deref() != Some(block) {
            return None;
        }
        self.alts.iter().position(|a| Some(a.item.as_str()) == item).map(PlanAnswer::Alt)
    }

    /// The message to the agent that runs it: he started it (or its other
    /// way `alt`) at `at`, from the notification or the page; start now,
    /// then publish the plan again with data-started.
    pub fn start_message(&self, title: &str, page: &str, version: u64, url: &str, alt: Option<usize>, at: &str) -> String {
        let (what, mark) = match alt.and_then(|i| self.alts.get(i)) {
            Some(a) => (
                format!("the other way \"{}\" ({}) of your plan \"{}\"", a.name, a.todo, self.name),
                format!("data-started=\"{at}\" on its item {} in the compare {}", a.item, self.ways.as_deref().unwrap_or("")),
            ),
            None => (format!("your plan \"{}\"", self.name), format!("data-started=\"{at}\" on the plan block {}", self.block)),
        };
        format!(
            "the user started {what} at {at}, on the page \"{title}\" ({page} v{version}, {url}). start it now, part by part; \
then publish the page again with {mark}, and data-done=\"<HH:MM>\" on each part as it lands: the page shows '∿ <you> is on 2 · started {at}', then '✓ done' with the last part's time."
        )
    }

    /// The card's key in steps.json: one card per plan, replaced by a
    /// newer version not yet started.
    pub fn key(&self) -> String {
        format!("plan:{}", self.block)
    }
}

/// The plan of fragment `html`, with its other ways; None: no plan
/// block. The lint ran: at most one plan, its attributes there.
pub fn of_fragment(html: &str) -> Option<Plan> {
    let (head, body) = sections(html).into_iter().find(|(h, _)| attr(h, "data-kit").as_deref() == Some("plan"))?;
    let block = attr(head, "data-id")?;
    let name = first(body, "h3").map(text_of).unwrap_or_default();
    let gist = first(body, "p").map(text_of).unwrap_or_default();
    // the parts are its <ol>; a <ul> before it holds the gains
    let parts = items(first(body, "ol").unwrap_or("")).into_iter().map(|(h, b)| (attr(h, "data-id").unwrap_or_default(), title_of(b))).collect();
    let of_plan = |h: &&str| attr(h, "data-kit").as_deref() == Some("compare") && attr(h, "data-for").as_deref() == Some(block.as_str());
    let ways = sections(html).into_iter().find(|(h, _)| of_plan(h)).and_then(|(h, _)| attr(h, "data-id"));
    let alts = sections(html)
        .into_iter()
        .filter(|(h, _)| of_plan(h))
        .flat_map(|(_, b)| items(b))
        .filter_map(|(h, b)| {
            Some(Alt { item: attr(h, "data-id")?, todo: attr(h, "data-do")?, name: title_of(b), started: attr(h, "data-started").filter(|s| !s.is_empty()) })
        })
        .collect();
    Some(Plan {
        block,
        agent: attr(head, "data-agent").unwrap_or_default(),
        todo: attr(head, "data-do").filter(|d| !d.trim().is_empty()).unwrap_or_else(|| "start the plan".into()),
        name,
        gist,
        parts,
        started: attr(head, "data-started").filter(|s| !s.is_empty()),
        alts,
        ways,
    })
}

/// What his words on a plan's notification do.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlanAnswer<'a> {
    /// start the plan
    Start,
    /// start its other way n (from 0)
    Alt(usize),
    /// open the page: the card stays
    Open,
    /// words that are no option: to the plan's agent
    Words(&'a str),
    Empty,
}

/// His words on the notification of `plan`, sorted, never swallowed:
/// an option's number or its words; a bare go ('yes', 'ok', 'go') starts
/// the plan; anything else is what to change, for the agent.
pub fn answer<'a>(reply: &'a str, plan: &Plan) -> PlanAnswer<'a> {
    let words = reply.trim();
    let w = words.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
    // '2. start it, but keep win32', as the clients send an option
    let n = w.split(['.', ')', ' ']).next().and_then(|n| n.parse::<usize>().ok());
    let rest = w.split_once(['.', ')']).map(|(_, r)| r.trim().to_string());
    let choices = plan.choices();
    let at = |i: usize| -> PlanAnswer<'a> {
        match i {
            0 => PlanAnswer::Start,
            i if i == choices.len() - 1 => PlanAnswer::Open,
            i => PlanAnswer::Alt(i - 1),
        }
    };
    if words.is_empty() {
        return PlanAnswer::Empty;
    }
    if let Some(i) = n.filter(|n| (1..=choices.len()).contains(n)) {
        // '2 but keep it short' is words, not option 2
        if w == i.to_string() || rest.as_deref().is_some_and(|r| r.is_empty() || r == choices[i - 1].to_lowercase()) {
            return at(i - 1);
        }
    }
    if let Some(i) = choices.iter().position(|c| c.to_lowercase() == w) {
        return at(i);
    }
    match w.as_str() {
        "yes" | "oui" | "go" | "ok" | "vas-y" | "vas y" | "start" | "start it" | "lance" | "lance-le" => PlanAnswer::Start,
        "open" | "open the plan" | "open the page" | "ouvrir" | "voir" => PlanAnswer::Open,
        _ => PlanAnswer::Words(words),
    }
}

/// The sections of a fragment: (open tag, inner html).
fn sections(html: &str) -> Vec<(&str, &str)> {
    let mut out = Vec::new();
    let mut rest = html;
    while let Some(i) = rest.find("<section") {
        let sec = &rest[i..];
        let end = sec.find("</section>").unwrap_or(sec.len());
        let head_end = sec.find('>').unwrap_or(0);
        out.push((&sec[..head_end], &sec[(head_end + 1).min(end)..end]));
        rest = &sec[end..];
        if end == sec.len() {
            break;
        }
    }
    out
}

/// The inner html of the first `<tag>` of `body`.
fn first<'a>(body: &'a str, tag: &str) -> Option<&'a str> {
    let open = format!("<{tag}");
    let mut at = 0;
    while let Some(i) = body[at..].find(&open) {
        let s = &body[at + i..];
        // '<p' must not match '<pre'
        if s[open.len()..].starts_with(['>', ' ']) {
            let g = s.find('>')?;
            let close = format!("</{tag}>");
            let inner = &s[g + 1..];
            return Some(&inner[..inner.find(&close).unwrap_or(inner.len())]);
        }
        at += i + open.len();
    }
    None
}

/// The `<li>` of `body`'s list: (open tag, inner html).
fn items(body: &str) -> Vec<(&str, &str)> {
    body.split("<li")
        .skip(1)
        .filter(|li| li.starts_with([' ', '>']))
        .filter_map(|li| {
            let g = li.find('>')?;
            let inner = &li[g + 1..];
            Some((&li[..g], &inner[..inner.find("</li>").unwrap_or(inner.len())]))
        })
        .collect()
}

/// An item's title: its `<h3>` or `<strong>`, else its text.
fn title_of(li: &str) -> String {
    first(li, "h3").or_else(|| first(li, "strong")).map(text_of).unwrap_or_else(|| text_of(li))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// lean-install's plan of Benjamin's feedback, as pick A writes it.
    pub(crate) const LEAN: &str = r#"<section data-kit="heading" data-id="title"><h1>lean installs</h1></section>
<section data-kit="plan" data-id="plan" data-agent="lean-install" data-do="start the plan">
<h3>make installs lean by default</h3>
<p>3 PRs, about −2.6 GB and −2 min 40 for each new worktree: pnpm installs lean by default, AGENTS.md says which install to run, and win32 leaves the platform binaries (that one goes through CI).</p>
<ul><li>−2.6 GB a worktree</li><li>−2 min 40 a new worktree</li></ul>
<ol><li data-id="p1"><strong>pnpm installs lean by default</strong> scripts/ts-install.sh skips le-chat-mobile.</li>
<li data-id="p2"><strong>AGENTS.md says which install to run</strong> lands with 1.</li>
<li data-id="p3" data-optional><strong>win32 leaves the platform binaries</strong> goes through CI first.</li></ol>
</section>
<section data-kit="compare" data-id="others" data-for="plan"><ol>
<li data-id="keep-win32" data-do="start it, but keep win32"><h3>1 and 2 only</h3><p>the same gain for new worktrees; no CI run.</p></li>
<li data-id="arm64" data-do="start all 3 and linux/arm64"><h3>all 3, and linux/arm64 to the CI images</h3><p>needs the owner of #13518 first.</p></li>
</ol></section>"#;

    /// Law (pick A, designer's words): the notification asks to start
    /// the plan the agent recommends, says it in its whole gist, offers
    /// the plan, each other way by its verb, and the page last.
    #[test]
    fn a_plans_notification_reads_as_pick_a() {
        let p = of_fragment(LEAN).unwrap();
        assert_eq!((p.block.as_str(), p.agent.as_str(), p.name.as_str()), ("plan", "lean-install", "make installs lean by default"));
        assert_eq!(p.parts.iter().map(|(i, _)| i.as_str()).collect::<Vec<_>>(), vec!["p1", "p2", "p3"]);
        assert_eq!(p.parts[0].1, "pnpm installs lean by default");
        assert_eq!(p.alts.iter().map(|a| a.item.as_str()).collect::<Vec<_>>(), vec!["keep-win32", "arm64"]);
        assert_eq!(
            p.card_text("lean installs"),
            "lean installs: start the plan lean-install recommends?\n\
3 PRs, about −2.6 GB and −2 min 40 for each new worktree: pnpm installs lean by default, AGENTS.md says which install to run, and win32 leaves the platform binaries (that one goes through CI).\n\n\
1. start the plan\n2. start it, but keep win32\n3. start all 3 and linux/arm64\n4. open the plan and its alternatives"
        );
        assert!(!p.is_started());
        // no other way: 'open the plan'
        let alone = of_fragment(LEAN.split("<section data-kit=\"compare\"").next().unwrap()).unwrap();
        assert_eq!(alone.choices(), vec!["start the plan", "open the plan"]);
    }

    /// Law: at most 2 other ways are options (4 rows); the rest live on
    /// the page, which stays last.
    #[test]
    fn at_most_two_other_ways() {
        let alt = |i: usize| format!(r#"<li data-id="a{i}" data-do="way {i}"><h3>way {i}</h3></li>"#);
        let html = format!(r#"<section data-kit="plan" data-id="pl" data-agent="x" data-do="start the plan"><h3>n</h3><p>g</p><ol><li data-id="p1">a</li></ol></section><section data-kit="compare" data-id="o" data-for="pl"><ol>{}</ol></section>"#, (1..=4).map(alt).collect::<String>());
        let p = of_fragment(&html).unwrap();
        assert_eq!(p.choices(), vec!["start the plan", "way 1", "way 2", OPEN]);
        // a compare for another block is not its other ways
        assert!(of_fragment(&html.replace("data-for=\"pl\"", "data-for=\"other\"")).unwrap().alts.is_empty());
    }

    /// Law: his words on it are never swallowed: an option's number or
    /// words, a bare go starts the plan, anything else goes to the agent.
    #[test]
    fn his_words_on_a_plan() {
        let p = of_fragment(LEAN).unwrap();
        assert_eq!(answer("1", &p), PlanAnswer::Start);
        assert_eq!(answer("1. start the plan", &p), PlanAnswer::Start);
        assert_eq!(answer("yes", &p), PlanAnswer::Start);
        assert_eq!(answer("2", &p), PlanAnswer::Alt(0));
        assert_eq!(answer("2. start it, but keep win32", &p), PlanAnswer::Alt(0));
        assert_eq!(answer("Start all 3 and linux/arm64", &p), PlanAnswer::Alt(1));
        assert_eq!(answer("4", &p), PlanAnswer::Open);
        assert_eq!(answer("5", &p), PlanAnswer::Words("5"));
        assert_eq!(answer("ok, but keep win32: we need it", &p), PlanAnswer::Words("ok, but keep win32: we need it"));
        assert_eq!(answer("2 but shorter", &p), PlanAnswer::Words("2 but shorter"));
        assert_eq!(answer("  ", &p), PlanAnswer::Empty);
    }

    /// Law: a start note names the plan or one of its other ways; the
    /// agent hears which, and how to mark it started.
    #[test]
    fn a_start_names_the_plan_or_its_other_way() {
        let p = of_fragment(LEAN).unwrap();
        assert_eq!(p.ways.as_deref(), Some("others"));
        assert_eq!(p.start_of("plan", None), Some(PlanAnswer::Start));
        assert_eq!(p.start_of("others", Some("arm64")), Some(PlanAnswer::Alt(1)));
        assert_eq!((p.start_of("others", Some("nope")), p.start_of("title", None)), (None, None));
        let m = p.start_message("lean installs", "lean", 4, "http://x/p/lean", Some(0), "11:42");
        assert!(m.starts_with("the user started the other way \"1 and 2 only\" (start it, but keep win32) of your plan \"make installs lean by default\" at 11:42"), "{m}");
        assert!(m.contains("data-started=\"11:42\" on its item keep-win32 in the compare others"), "{m}");
        assert!(p.start_message("t", "lean", 4, "u", None, "9:05").contains("data-started=\"9:05\" on the plan block plan"));
    }

    /// Law: started from either door, the plan is started (no card).
    #[test]
    fn started_from_either_door() {
        let p = of_fragment(&LEAN.replace("data-do=\"start the plan\">", "data-do=\"start the plan\" data-started=\"11:42\">")).unwrap();
        assert_eq!(p.started.as_deref(), Some("11:42"));
        assert!(p.is_started());
        let a = of_fragment(&LEAN.replace("data-id=\"arm64\"", "data-id=\"arm64\" data-started=\"11:50\"")).unwrap();
        assert!(a.started.is_none() && a.is_started());
        assert!(of_fragment("<section data-kit=\"prose\" data-id=\"x\"><p>a</p></section>").is_none());
    }
}
