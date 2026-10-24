//! Removing a plugin on temp dirs (no network, no real server).

use super::*;
use crate::model::StateV2;
use crate::resolve::{MCP_SCHEMA, PLUGIN_SCHEMA};
use serde_json::json;
use std::fs;

const SECRET: &str = "sk_live_REMOVE_ME_42";

struct Tmp(PathBuf);
impl Drop for Tmp {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn tmp(tag: &str) -> (Tmp, Ctx) {
    let d = std::env::temp_dir().join(format!("bp-remove-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).unwrap();
    let d = d.canonicalize().unwrap();
    let ctx = Ctx { builtin: Some(d.join("builtin")), ..Ctx::under(&d) };
    (Tmp(d), ctx)
}

fn write(p: &Path, text: &str) {
    fs::create_dir_all(p.parent().unwrap()).unwrap();
    fs::write(p, text).unwrap();
}

/// A plugin `name` in `root` with one remote server at `url`.
fn plugin(root: &Path, name: &str, url: &str) {
    write(&root.join(name).join("plugin.json"), &json!({ "$schema": PLUGIN_SCHEMA, "name": name, "version": "1.0.0" }).to_string());
    let mcp = json!({ "$schema": MCP_SCHEMA, "mcpServers": { name: { "url": url, "headers": { "X-Key": "${KEY}" } } } });
    write(&root.join(name).join("mcp.json"), &mcp.to_string());
}

fn login(ctx: &Ctx, url: &str) -> String {
    let resource = oauth::resource_of(&crate::http::Url::parse(url).unwrap());
    let saved = oauth::Saved {
        resource: resource.clone(),
        issuer: "https://login.test".into(),
        token_endpoint: "https://login.test/token".into(),
        client_id: "c".into(),
        client_secret: None,
        redirect_port: None,
        access_token: Some("at".into()),
        refresh_token: Some("rt".into()),
        expires_at: None,
        scope: None,
        wanted_scope: None,
        revocation_endpoint: None,
    };
    oauth::save(&ctx.oauth_dir, &saved).unwrap();
    resource
}

/// Every file's text under `dir` (to look for a secret).
fn all_text(dir: &Path) -> String {
    let mut out = String::new();
    for e in fs::read_dir(dir).into_iter().flatten().flatten() {
        let p = e.path();
        if p.is_dir() {
            out.push_str(&all_text(&p));
        } else if let Ok(t) = fs::read_to_string(&p) {
            out.push_str(&t);
        }
    }
    out
}

#[test]
fn a_user_plugin_goes_with_its_secrets_logins_statuses_and_ids() {
    let (t, ctx) = tmp("all");
    plugin(&ctx.user_root, "pay", "https://mcp.pay.test/mcp");
    plugin(&ctx.user_root, "keep", "https://mcp.keep.test/mcp");
    let (pay, keep) = (PluginId::plugin("pay"), PluginId::plugin("keep"));
    secrets::write(&ctx.secrets_dir, &pay, &[("KEY".into(), SECRET.into())]).unwrap();
    secrets::write(&ctx.secrets_dir, &keep, &[("KEY".into(), "kept".into())]).unwrap();
    let (pay_login, keep_login) = (login(&ctx, "https://mcp.pay.test/mcp"), login(&ctx, "https://mcp.keep.test/mcp"));
    status::write(&ctx.status_dir, "pay", "pay", &status::Status::now("http", "mcp.pay.test", Ok(2)));
    status::write(&ctx.status_dir, "keep", "keep", &status::Status::now("http", "mcp.keep.test", Ok(1)));
    state::set(&ctx.state, &PluginId::parse("pay#mcp:pay").unwrap(), false).unwrap();
    state::set(&ctx.state, &pay, false).unwrap();
    state::set(&ctx.state, &keep, false).unwrap();

    remove(&ctx, None, &pay).unwrap();

    assert!(!ctx.user_root.join("pay").exists());
    assert!(!secrets::path(&ctx.secrets_dir, &pay).exists());
    assert!(oauth::load(&ctx.oauth_dir, &pay_login).is_none_or(|s| s.access_token.is_none() && s.refresh_token.is_none()));
    assert!(status::read(&ctx.status_dir, "pay", "pay").is_none());
    assert_eq!(state::read(&ctx.state), StateV2 { disabled: vec!["keep".into()], ..StateV2::default() });
    // the other plugin untouched
    assert!(ctx.user_root.join("keep/plugin.json").is_file());
    assert_eq!(secrets::read(&ctx.secrets_dir, &keep).unwrap()["KEY"], "kept");
    assert!(oauth::load(&ctx.oauth_dir, &keep_login).unwrap().access_token.is_some());
    assert!(status::read(&ctx.status_dir, "keep", "keep").is_some());
    // no temp folder left, and the planted value in no file of the test home
    let staging = add::staging_dir(&ctx.user_root);
    assert!(fs::read_dir(&staging).map(|mut r| r.next().is_none()).unwrap_or(true));
    assert!(!all_text(&t.0).contains(SECRET));
    assert_eq!(remove(&ctx, None, &pay), Err(RemoveError::NotFound { name: "pay".into() }));
}

#[test]
fn a_login_another_plugin_shares_is_kept() {
    let (_t, ctx) = tmp("shared");
    plugin(&ctx.user_root, "a", "https://mcp.same.test/mcp");
    plugin(&ctx.user_root, "b", "https://mcp.same.test/mcp");
    let r = login(&ctx, "https://mcp.same.test/mcp");
    remove(&ctx, None, &PluginId::plugin("a")).unwrap();
    assert!(oauth::load(&ctx.oauth_dir, &r).unwrap().access_token.is_some());
}

#[test]
fn what_is_not_his_is_refused_by_kind_and_left_alone() {
    let (_t, ctx) = tmp("refused");
    let ws = ctx.home.join("repo");
    plugin(ctx.builtin.as_ref().unwrap(), "computer", "https://x.test/mcp");
    plugin(&ws.join(".agents/plugins"), "repo-tools", "https://y.test/mcp");
    let kind = |id: &str| match remove(&ctx, Some(&ws), &PluginId::parse(id).unwrap()) {
        Err(RemoveError::Refused { why, .. }) => Some(why),
        _ => None,
    };
    assert_eq!(kind("computer"), Some(Refused::BuiltIn));
    assert_eq!(kind("repo-tools"), Some(Refused::Workspace));
    assert_eq!(kind("mistral:gmail"), Some(Refused::Connector));
    assert_eq!(kind("skills:personal"), Some(Refused::Skills));
    assert_eq!(kind("pay#mcp:pay"), Some(Refused::Part));
    assert!(ctx.builtin.as_ref().unwrap().join("computer/plugin.json").is_file());
    assert!(ws.join(".agents/plugins/repo-tools/plugin.json").is_file());
    assert_eq!(remove(&ctx, Some(&ws), &PluginId::plugin("nope")), Err(RemoveError::NotFound { name: "nope".into() }));
}

#[test]
fn secrets_that_cant_go_put_the_plugin_back_whole() {
    let (_t, ctx) = tmp("back");
    plugin(&ctx.user_root, "pay", "https://mcp.pay.test/mcp");
    let pay = PluginId::plugin("pay");
    state::set(&ctx.state, &pay, false).unwrap();
    // a folder where the secrets file is: its remove fails
    fs::create_dir_all(secrets::path(&ctx.secrets_dir, &pay).join("x")).unwrap();
    assert!(matches!(remove(&ctx, None, &pay), Err(RemoveError::Secrets { .. })));
    assert!(ctx.user_root.join("pay/plugin.json").is_file() && ctx.user_root.join("pay/mcp.json").is_file());
    assert_eq!(state::read(&ctx.state).disabled, ["pay"], "its state kept");
    let staging = add::staging_dir(&ctx.user_root);
    assert!(fs::read_dir(&staging).map(|mut r| r.next().is_none()).unwrap_or(true));
}

#[test]
fn a_broken_plugin_of_his_is_removable() {
    let (_t, ctx) = tmp("broken");
    write(&ctx.user_root.join("bad/plugin.json"), "{not json");
    remove(&ctx, None, &PluginId::plugin("bad")).unwrap();
    assert!(!ctx.user_root.join("bad").exists());
}
