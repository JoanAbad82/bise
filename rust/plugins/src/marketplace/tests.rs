//! Marketplaces on temp dirs and local git repos (no network).

use super::*;
use crate::add::{install, stage, Ctx};
use std::fs;

fn tmp(tag: &str) -> PathBuf {
    let d = std::env::temp_dir().join(format!("bp-market-{tag}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&d);
    fs::create_dir_all(&d).unwrap();
    d.canonicalize().unwrap()
}

fn write(p: &Path, text: &str) {
    fs::create_dir_all(p.parent().unwrap()).unwrap();
    fs::write(p, text).unwrap();
}

fn fixture(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/add").join(name)
}

fn copy(src: &Path, dst: &Path) {
    fs::create_dir_all(dst).unwrap();
    for e in fs::read_dir(src).unwrap().flatten() {
        let to = dst.join(e.file_name());
        if e.path().is_dir() {
            copy(&e.path(), &to);
        } else {
            fs::copy(e.path(), to).unwrap();
        }
    }
}

/// A repo shaped like openai/plugins: Codex's marketplace.json and its
/// `.codex-plugin` plugins.
fn openai_like(d: &Path) -> PathBuf {
    let repo = d.join("openai-plugins");
    copy(&fixture("codex-linear/in"), &repo.join("plugins/linear"));
    write(
        &repo.join(".agents/plugins/marketplace.json"),
        &json!({
            "name": "openai-curated",
            "interface": {"displayName": "Codex official"},
            "plugins": [
                {"name": "linear", "source": {"source": "local", "path": "./plugins/linear"}, "policy": {"installation": "AVAILABLE"}, "category": "Productivity"},
                {"name": "gone", "source": {"source": "local", "path": "./plugins/gone"}, "policy": {"installation": "NOT_AVAILABLE"}},
                {"name": "npm-one", "source": {"source": "npm", "package": "x"}},
                {"name": "Bad Name", "source": "./plugins/x"},
                {"name": "escape", "source": "../../etc"}
            ]
        })
        .to_string(),
    );
    crate::add::tests::git_repo(&repo);
    repo
}

#[test]
fn his_list_has_one_writer_and_keeps_other_keys() {
    let d = tmp("list");
    let f = d.join("marketplaces.json");
    assert!(list(&f).is_empty());
    assert_eq!(add(&f, "openai/plugins").unwrap(), (true, "https://github.com/openai/plugins.git".into()));
    assert!(!add(&f, "https://github.com/openai/plugins.git").unwrap().0, "there already");
    add(&f, "git@example.com:me/mine.git").unwrap();
    assert_eq!(list(&f), ["https://github.com/openai/plugins.git", "git@example.com:me/mine.git"]);
    let mut v: Value = serde_json::from_str(&fs::read_to_string(&f).unwrap()).unwrap();
    v["later"] = json!(1);
    fs::write(&f, v.to_string()).unwrap();
    assert!(remove(&f, "openai/plugins").unwrap());
    assert!(!remove(&f, "openai/plugins").unwrap());
    assert_eq!(list(&f), ["git@example.com:me/mine.git"]);
    assert_eq!(serde_json::from_str::<Value>(&fs::read_to_string(&f).unwrap()).unwrap()["later"], 1);
    assert!(matches!(add(&f, "-x"), Err(AddError::BadSource { .. })));
    let _ = fs::remove_dir_all(&d);
}

#[test]
fn an_openai_like_marketplace_reads_into_browse_rows_and_installs_through_the_preview() {
    let d = tmp("openai");
    let repo = openai_like(&d);
    let url = repo.display().to_string();
    let cache = d.join("cache");
    let m = read(&cache, &url, false).unwrap();
    assert_eq!(m.title, "Codex official");
    assert_eq!(m.items.len(), 1, "{:?}", m.items);
    let i = &m.items[0];
    assert_eq!((i.name.as_str(), i.title.as_deref(), i.category.as_deref()), ("linear", Some("Linear"), Some("Productivity")));
    assert_eq!(i.description.as_deref(), Some("Plan and build products"));
    assert!(cache_of(&cache, &url).join(".agents/plugins/marketplace.json").is_file(), "cloned once into the cache");
    let r = rows(&m);
    assert_eq!(r.len(), 1);
    assert_eq!((r[0].id.as_str(), r[0].state, r[0].on, r[0].kind), ("linear", PluginState::Available, false, PluginKind::Plugin));
    assert_eq!(r[0].title, "Linear");
    // install: the git path with its folder, previewed first
    let req = request(&m, i);
    assert_eq!(req, add::Request::Git { url: url.clone(), subdir: Some("plugins/linear".into()) });
    let ctx = Ctx { home: d.clone(), ..Ctx::under(&d) };
    let s = stage(&req, &ctx).unwrap();
    assert_eq!(s.preview.runs[0].host.as_deref(), Some("mcp.linear.app"));
    assert!(!d.join("plugins/linear").exists());
    install(s, &ctx).unwrap();
    assert!(d.join("plugins/linear/plugin.json").is_file());
    // a refresh that fails keeps the last clone
    fs::remove_dir_all(&repo).unwrap();
    assert_eq!(read(&cache, &url, true).unwrap().items.len(), 1);
    let _ = fs::remove_dir_all(&d);
}

#[test]
fn a_claude_marketplace_takes_its_sources_and_plugin_root() {
    let d = tmp("claude");
    write(
        &d.join(".claude-plugin/marketplace.json"),
        &json!({
            "name": "team",
            "metadata": {"pluginRoot": "./plugins"},
            "plugins": [
                {"name": "notes", "source": "notes", "description": "notes, kept"},
                {"name": "deep", "source": "./tools/deep"},
                {"name": "gh", "source": {"source": "github", "repo": "acme/gh-plugin"}},
                {"name": "url", "source": {"source": "url", "url": "https://git.test/x.git", "path": "./sub"}}
            ]
        })
        .to_string(),
    );
    let m = parse(&d, "https://git.test/team.git").unwrap();
    assert_eq!(m.title, "team");
    let got: Vec<(&str, &Source)> = m.items.iter().map(|i| (i.name.as_str(), &i.source)).collect();
    assert_eq!(
        got,
        [
            ("notes", &Source::Here { subdir: "plugins/notes".into() }),
            ("deep", &Source::Here { subdir: "tools/deep".into() }),
            ("gh", &Source::Git { url: "https://github.com/acme/gh-plugin.git".into(), subdir: None }),
            ("url", &Source::Git { url: "https://git.test/x.git".into(), subdir: Some("sub".into()) }),
        ]
    );
    assert_eq!(m.items[0].description.as_deref(), Some("notes, kept"));
    assert_eq!(request(&m, &m.items[2]), add::Request::Git { url: "https://github.com/acme/gh-plugin.git".into(), subdir: None });
    let none = tmp("none");
    assert!(matches!(parse(&none, "x/y"), Err(AddError::BadSource { .. })));
    let _ = fs::remove_dir_all(&d);
    let _ = fs::remove_dir_all(&none);
}
