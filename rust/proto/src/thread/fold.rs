//! The fold: an agent's transcript lines, read by [`super::lines`], as
//! entries (consecutive tool calls are one `tools` entry at the first
//! call's pos; a message on several lines is one entry).

use super::lines::{self, Hub, Obs, Rec};
use super::words::{one_line, summary};
use super::{Ctx, Entry, EntryCard, EntryKind, Line, PageRef, ReportRef, ToolItem, ToolKind, Tools};
use crate::context::FnContext;
use crate::rows::question;

struct Fold<'a> {
    out: Vec<Entry>,
    /// the entry a raw line continues (a message on several lines)
    cont: Option<usize>,
    /// tool id -> (entry, item)
    tools: Vec<(u32, usize, usize)>,
    /// the 'you' entry the previous line pushed: the only one a context
    /// line may attach to
    you: Option<usize>,
    ctx: &'a Ctx<'a>,
}

impl Fold<'_> {
    fn push(&mut self, e: Entry) -> usize {
        self.out.push(e);
        self.out.len() - 1
    }

    fn tool(&mut self, pos: u64, ms: u64, id: u32, name: &str, args: &str) {
        let args = lines::unescape(args);
        if name == "bash" {
            if let Some((kind, text)) = lines::report_in(&args) {
                let mut e = Entry::new(pos, ms, EntryKind::Report, text);
                e.report = Some(ReportRef { kind });
                self.push(e);
                return;
            }
            if let Some(id) = lines::publish_in(&args) {
                let page = (self.ctx.page)(&id).unwrap_or(PageRef { id: id.clone(), title: id.replace('-', " "), v: None, url: String::new() });
                let v = page.v.map(|v| format!(" v{v}")).unwrap_or_default();
                let mut e = Entry::new(pos, ms, EntryKind::Page, format!("{}{v}", page.title));
                e.page = Some(page);
                self.push(e);
                return;
            }
        }
        let e = match self.out.last() {
            Some(e) if e.kind == EntryKind::Tools => self.out.len() - 1,
            _ => {
                let mut e = Entry::new(pos, ms, EntryKind::Tools, String::new());
                e.tools = Some(Tools { count: 0, summary: String::new(), items: Vec::new() });
                self.push(e)
            }
        };
        let item = ToolItem {
            pos,
            at_ms: ms,
            text: format!("{name}: {}", one_line(&args.replace("\\N", "\n"), 100)),
            kind: ToolKind::of(name),
            land: name == "bash" && args.contains("sb land"),
        };
        let items = &mut self.out[e].tools.as_mut().expect("a tools entry").items;
        items.push(item);
        let i = items.len() - 1;
        self.tools.push((id, e, i));
        self.sum(e);
    }

    fn intent(&mut self, id: u32, text: &str) {
        let Some(&(_, e, i)) = self.tools.iter().rev().find(|(t, _, _)| *t == id) else { return };
        if let Some(t) = self.out[e].tools.as_mut() {
            t.items[i].text = one_line(&lines::unescape(text), 120);
        }
        self.sum(e);
    }

    fn sum(&mut self, e: usize) {
        let entry = &mut self.out[e];
        let Some(t) = entry.tools.as_mut() else { return };
        t.count = t.items.len() as u32;
        t.summary = summary(&t.items);
        entry.text = t.summary.clone();
    }

    fn line(&mut self, pos: u64, ms: u64, line: &str) {
        let line = line.strip_prefix("history ").unwrap_or(line);
        let you = self.you.take();
        let rec = lines::read(line);
        match rec {
            Rec::Empty | Rec::Idle | Rec::Fact => return,
            Rec::Raw(_) => {}
            _ => self.cont = None,
        }
        match rec {
            Rec::Obs(Obs::Assistant(t)) => {
                let vis = lines::split_thinking(&t).map(|(_, v)| v).unwrap_or(t);
                let text = lines::unescape(&vis).trim().to_string();
                if !text.is_empty() {
                    self.push(Entry::new(pos, ms, EntryKind::Agent, text));
                }
            }
            Rec::Tool { id, name, args } => self.tool(pos, ms, id, &name, &args),
            Rec::ToolIntent { id, text } => self.intent(id, &text),
            Rec::Hub(h) => self.hub(pos, ms, h, you),
            // a message's next line
            Rec::Raw(line) => self.more(&line),
            _ => {}
        }
    }

    fn hub(&mut self, pos: u64, ms: u64, h: Hub, you: Option<usize>) {
        match h {
            Hub::You(text) => {
                let i = self.push(Entry::new(pos, ms, EntryKind::You, text));
                (self.cont, self.you) = (Some(i), Some(i));
            }
            // his fn context: on the 'you' line right before it, else
            // dropped (a stray one never lands on another entry)
            Hub::Context(raw) => {
                if let (Some(i), Ok(c)) = (you, serde_json::from_str::<FnContext>(&raw)) {
                    self.out[i].context = Some(c);
                }
            }
            Hub::MsgIn { from, body, .. } => {
                let mut e = Entry::new(pos, ms, EntryKind::FromAgent, body);
                e.from = Some(from.trim_start_matches('@').to_string());
                self.cont = Some(self.push(e));
            }
            // what this task sent (sb-core's `sent` line)
            Hub::Sent { to, id, ask, body } => {
                let mut e = Entry::new(pos, ms, EntryKind::ToAgent, body);
                e.to = Some(to).filter(|t| !t.is_empty());
                e.asks = ask;
                e.msg = id.strip_prefix("m_").and_then(|n| n.parse().ok());
                self.cont = Some(self.push(e));
            }
            // an interrupt (sb-core writes it in the interrupt's step)
            Hub::Stopped(text) => {
                self.push(Entry::new(pos, ms, EntryKind::Stopped, text));
            }
            Hub::MsgYou { body, .. } => {
                self.cont = Some(self.push(Entry::new(pos, ms, EntryKind::Agent, body)));
            }
            // `#3 question @docs : text`; a gate's confirm is the tool row's
            Hub::Card { id: Some(id), kind, body, .. } if kind != "confirm" => {
                let (q, options) = question(&body);
                let card = EntryCard { id, question: q.clone(), options, answered: !self.ctx.open_cards.contains(&id) };
                let mut e = Entry::new(pos, ms, EntryKind::Card, q);
                e.card = Some(card);
                self.cont = Some(self.push(e));
            }
            _ => {}
        }
    }

    fn more(&mut self, line: &str) {
        let Some(i) = self.cont else { return };
        let e = &mut self.out[i];
        e.text = format!("{}\n{line}", e.text);
        if let Some(c) = e.card.as_mut() {
            let (q, options) = question(&format!("{}\n{line}", c.question));
            c.question = q.clone();
            c.options.extend(options);
            e.text = q;
        }
    }
}

/// An agent's transcript lines as entries, oldest first.
pub fn fold(lines: &[Line], ctx: &Ctx) -> Vec<Entry> {
    let mut f = Fold { out: Vec::new(), cont: None, tools: Vec::new(), you: None, ctx };
    for (pos, ms, l) in lines {
        f.line(*pos, *ms, l);
    }
    f.out
}

#[cfg(test)]
#[path = "fold_tests.rs"]
mod tests;
