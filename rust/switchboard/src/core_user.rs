//! The user's commands (the TUI's typed line, the window's typed
//! commands): `user_input` parses a line (router::parse) for the agent in
//! view, `user_cmd` runs a parsed command. The window's typed `new`,
//! `rename`, `model` and `effort` (bise-proto HubCmd, bar A.1 and A.5)
//! come as `Input::UserCmd` straight to `user_cmd` with their fields, so
//! nothing is rebuilt as text and parsed again (architect m_10331): the
//! TUI and the window run the same handlers.

use super::*;

impl Hub {
    #[allow(clippy::too_many_arguments)]
    pub(super) fn user_input(
        &mut self,
        fx: &mut Fx,
        env: &mut dyn Env,
        client: ClientId,
        focus: &str,
        text: &str,
        queued: bool,
        parts: &str,
    ) {
        let focus = self.focus_of(client, focus);
        // only words wait for the turn's end: a command runs now
        let cmd = router::parse(text, &focus);
        if queued && !matches!(cmd, UserCmd::Say(_) | UserCmd::To { .. }) {
            fx.push(notice(client, "commands run now, not queued"));
        }
        self.user_cmd(fx, env, client, focus, cmd, queued, parts);
    }

    /// The agent `focus` names (main when none), now `client`'s focus.
    pub(super) fn focus_of(&mut self, client: ClientId, focus: &str) -> String {
        let focus = self.st.resolve(focus).unwrap_or_else(|| MAIN.to_string());
        if let Some(v) = self.clients.get_mut(&client) {
            if v.focus != focus {
                v.focus = focus.clone();
            }
        }
        focus
    }

    /// One command of `client`, for the agent `focus` (resolved).
    /// `parts`: the parts' JSON of his words (msg-parts, "" none): on a
    /// say or a route, sb-core keeps them on the message.
    #[allow(clippy::too_many_arguments)]
    pub(super) fn user_cmd(&mut self, fx: &mut Fx, env: &mut dyn Env, client: ClientId, focus: String, cmd: UserCmd, queued: bool, parts: &str) {
        let c = Some(client);
        match cmd {
            UserCmd::Say(t) => {
                if !t.is_empty() {
                    self.core(fx, env, c, In::Say(ci::Say { focus, text: t, queued, parts: parts.into() }));
                }
            }
            UserCmd::To { target, text } => {
                self.core(fx, env, c, In::Route(ci::Route { target, text, focus, queued, parts: parts.into() }))
            }
            UserCmd::New {
                name,
                brief,
                worktree,
                with_changes,
            } => {
                // the TUI's router refuses it early too; the typed `new` has
                // only this check
                if with_changes && !worktree {
                    return fx.push(notice(client, "--with-changes only works with -w"));
                }
                let b = Brief {
                    objective: brief,
                    ..Brief::default()
                };
                match new_task(name.as_deref(), &b, "", worktree, with_changes) {
                    Ok(new) => self.core(fx, env, c, In::New(new)),
                    Err(e) => fx.push(notice(client, &e)),
                }
            }
            UserCmd::Drop { name, force } => match name {
                None => fx.push(notice(
                    client,
                    "usage: /archive <agent> (or /archive from the agent's view)",
                )),
                Some(name) => self.core(fx, env, c, In::Drop(ci::Drop { name, force })),
            },
            UserCmd::Restore { name } => self.core(fx, env, c, In::Restore(ci::Restore { name })),
            UserCmd::Isolate { name } => self.core(fx, env, c, In::Isolate(ci::Isolate { name })),
            UserCmd::Rename { name, new_name } => {
                let valid = router::valid_name(&new_name);
                self.core(fx, env, c, In::Rename(ci::Rename { name, new_name, valid }))
            }
            UserCmd::Answer { card, text, parts } => self.core(fx, env, c, In::Answer(ci::Answer { card, text, parts })),
            UserCmd::Close { card } => self.core(fx, env, c, In::Close(ci::Close { card })),
            UserCmd::Tasks => fx.push(notice(client, &board::user_board(&self.st, env.now()))),
            UserCmd::Prs => {
                // `prs`: the typed rows (bise-proto rows::Pr), the TUI
                // draws them like the PR lines; `text` for a client that
                // does not know them (sb's CLI prints it)
                let places = crate::place::places(&self.st, &self.prs);
                let rows = crate::forge::news::pr_rows(&places);
                let text = crate::forge::news::prs_list(&rows);
                if rows.is_empty() {
                    fx.push(notice(client, &text));
                } else {
                    let head = crate::forge::news::prs_head(&rows);
                    fx.push(Effect::ToClient { client, body: json!({"ev": "prs", "head": head, "rows": rows, "text": text}) })
                }
            }
            UserCmd::Interrupt => {
                self.interrupt_by = Some("user".into());
                self.core(fx, env, c, In::Interrupt(ci::Interrupt { agent: focus }));
                self.interrupt_by = None;
            }
            UserCmd::Pause => self.core(fx, env, c, In::Pause(ci::Pause {})),
            UserCmd::Resume => self.core(fx, env, c, In::Resume(ci::Resume {})),
            UserCmd::Passthrough(l) => {
                let first = l.split_whitespace().next().unwrap_or("");
                if first != "/compact" {
                    fx.push(notice(
                        client,
                        &format!("unknown command: {} (see /help)", first),
                    ));
                    return;
                }
                self.core(fx, env, c, In::Passthrough(ci::Passthrough { focus, line: l }))
            }
            UserCmd::Model { model, default } => fx.push(Effect::Choose {
                client,
                agent: focus,
                model,
                effort: None,
                default,
            }),
            UserCmd::Reasoning { effort } => fx.push(Effect::Choose {
                client,
                agent: focus,
                model: None,
                effort,
                default: false,
            }),
            UserCmd::Flow { set } => fx.push(Effect::Flow { client: Some(client), token: None, set }),
            UserCmd::Help => fx.push(notice(client, HELP)),
            UserCmd::Invalid(e) => fx.push(notice(client, &e)),
            // the daemon runs these (proto_view::slash routes them before
            // the core; the TUI runs its own arms): a line that still
            // reaches the core gets today's words
            UserCmd::Stop { .. } => fx.push(notice(client, "unknown command: /stop (see /help)")),
            UserCmd::Approvals { .. } => fx.push(notice(client, "unknown command: /approvals (see /help)")),
            UserCmd::Version(v) => {
                let first = match v {
                    bise_proto::slash::Version::Restart(_) => "/restart",
                    bise_proto::slash::Version::Update => "/update",
                    _ => "/version",
                };
                fx.push(notice(client, &format!("unknown command: {} (see /help)", first)));
            }
        }
    }
}
